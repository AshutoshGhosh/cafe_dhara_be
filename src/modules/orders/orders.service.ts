import { Types, type FilterQuery } from 'mongoose';
import { Order, MenuItem, Session } from '../../models';
import type { IOrder, IMenuItem } from '../../models';
import { OrderStatus, Role } from '../../models/enums';
import { AppError } from '../../common/AppError';
import { emitOrderNew, emitOrderUpdated } from '../../sockets';
import type { PlaceOrderInput, ListOrdersInput } from './orders.validation';

/**
 * Allowed status transitions. CANCELLED is reachable from any non-terminal
 * state; COMPLETED and CANCELLED are terminal.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.SERVED, OrderStatus.CANCELLED],
  [OrderStatus.SERVED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

/** Statuses the KITCHEN role is permitted to set. */
const KITCHEN_ALLOWED: OrderStatus[] = [OrderStatus.PREPARING, OrderStatus.READY];

/** Maps a target status to the timestamp field to stamp. */
const STATUS_TIMESTAMP: Partial<Record<OrderStatus, keyof IOrder>> = {
  [OrderStatus.ACCEPTED]: 'acceptedAt',
  [OrderStatus.PREPARING]: 'preparingAt',
  [OrderStatus.READY]: 'readyAt',
  [OrderStatus.SERVED]: 'servedAt',
  [OrderStatus.COMPLETED]: 'completedAt',
  [OrderStatus.CANCELLED]: 'cancelledAt',
};

/** Next sequential order number (single-cafe; best-effort monotonic). */
async function nextOrderNumber(): Promise<number> {
  const last = await Order.findOne().sort({ orderNumber: -1 }).select('orderNumber').lean();
  return (last?.orderNumber ?? 0) + 1;
}

function serialize(order: IOrder): Record<string, unknown> {
  return order.toObject({ versionKey: false });
}

/** Populate the table ref so clients receive `{ number, name }` instead of an id. */
const TABLE_FIELDS = 'number name';

/**
 * Close the customer session once every non-cancelled order on it is paid, so a
 * settled table can't keep ordering on the same session.
 */
async function closeSessionIfFullyPaid(sessionId: Types.ObjectId): Promise<void> {
  const outstanding = await Order.countDocuments({
    session: sessionId,
    status: { $ne: OrderStatus.CANCELLED },
    isPaid: false,
  });
  if (outstanding === 0) {
    await Session.updateOne({ _id: sessionId, isActive: true }, { $set: { isActive: false } });
  }
}

export const orderService = {
  /**
   * Place a customer order. Validates the session directly, snapshots menu-item
   * prices SERVER-SIDE (client prices are never trusted), and computes totals.
   */
  async placeOrder(input: PlaceOrderInput): Promise<Record<string, unknown>> {
    // 1) Validate the session (active + not expired) by reading the model directly.
    const session = await Session.findById(input.sessionId);
    if (!session) {
      throw AppError.notFound('Session not found', 'SESSION_NOT_FOUND');
    }
    if (!session.isActive || session.expiresAt.getTime() <= Date.now()) {
      throw AppError.badRequest('Session is not active', 'SESSION_INACTIVE');
    }

    // 2) Load all referenced menu items in one query.
    const menuItemIds = [...new Set(input.items.map((i) => i.menuItemId))];
    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      deletedAt: null,
    });
    const byId = new Map<string, IMenuItem>(menuItems.map((m) => [String(m._id), m]));

    // 3) Build snapshotted order items with server-computed prices.
    const items = input.items.map((line) => {
      const menuItem = byId.get(line.menuItemId);
      if (!menuItem) {
        throw AppError.badRequest(`Menu item ${line.menuItemId} is unavailable`, 'ITEM_UNAVAILABLE');
      }
      if (!menuItem.isAvailable) {
        throw AppError.badRequest(`"${menuItem.name}" is currently unavailable`, 'ITEM_UNAVAILABLE');
      }

      const basePrice = menuItem.discountPrice ?? menuItem.price;

      // Variant (optional).
      let variantId: Types.ObjectId | undefined;
      let variantName: string | undefined;
      let variantAdjustment = 0;
      if (line.variantId) {
        const variant = menuItem.variants.id(line.variantId);
        if (!variant || !variant.isAvailable) {
          throw AppError.badRequest(`Selected variant is unavailable`, 'VARIANT_UNAVAILABLE');
        }
        variantId = variant._id;
        variantName = variant.name;
        variantAdjustment = variant.priceAdjustment;
      }

      // Add-ons (optional).
      const addOns = (line.addOnIds ?? []).map((addOnId) => {
        const addOn = menuItem.addOns.id(addOnId);
        if (!addOn || !addOn.isAvailable) {
          throw AppError.badRequest(`Selected add-on is unavailable`, 'ADDON_UNAVAILABLE');
        }
        return { addOn: addOn._id, name: addOn.name, price: addOn.price };
      });

      const addOnTotal = addOns.reduce((sum, a) => sum + a.price, 0);
      const unitPrice = basePrice + variantAdjustment;
      const totalPrice = (unitPrice + addOnTotal) * line.quantity;

      return {
        menuItem: menuItem._id,
        variant: variantId,
        name: menuItem.name,
        variantName,
        quantity: line.quantity,
        unitPrice,
        totalPrice,
        notes: line.notes,
        addOns,
      };
    });

    // 4) Compute order totals (no tax/discount configured for this cafe).
    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const tax = 0;
    const discount = 0;
    const total = subtotal + tax - discount;

    const order = await Order.create({
      table: session.table,
      session: session._id,
      orderNumber: await nextOrderNumber(),
      status: OrderStatus.PLACED,
      items,
      subtotal,
      tax,
      discount,
      total,
      notes: input.notes,
      placedAt: new Date(),
    });

    await order.populate('table', TABLE_FIELDS);
    const dto = serialize(order);
    emitOrderNew(dto);
    return dto;
  },

  /** Staff listing with optional status + createdAt range filters. */
  async list(filters: ListOrdersInput): Promise<Record<string, unknown>[]> {
    const query: FilterQuery<IOrder> = {};
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) (query.createdAt as Record<string, Date>).$gte = filters.from;
      if (filters.to) (query.createdAt as Record<string, Date>).$lte = filters.to;
    }
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('table', TABLE_FIELDS);
    return orders.map(serialize);
  },

  /**
   * Fetch one order. Staff see any order; a customer must supply a `sessionId`
   * that matches the order's session.
   */
  async getById(
    id: string,
    opts: { isStaff: boolean; sessionId?: string },
  ): Promise<Record<string, unknown>> {
    const order = await Order.findById(id).populate('table', TABLE_FIELDS);
    if (!order) {
      throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }
    if (!opts.isStaff) {
      if (!opts.sessionId || String(order.session ?? '') !== opts.sessionId) {
        throw AppError.forbidden('Not allowed to view this order', 'ORDER_FORBIDDEN');
      }
    }
    return serialize(order);
  },

  /** Transition an order's status, enforcing the state machine + role rules. */
  async updateStatus(
    id: string,
    target: OrderStatus,
    role: Role,
    cancelReason?: string,
  ): Promise<Record<string, unknown>> {
    const order = await Order.findById(id);
    if (!order) {
      throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    // KITCHEN is restricted to PREPARING / READY.
    if (role === Role.KITCHEN && !KITCHEN_ALLOWED.includes(target)) {
      throw AppError.forbidden('Kitchen may only set PREPARING or READY', 'ROLE_TRANSITION_DENIED');
    }

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(target)) {
      throw AppError.badRequest(
        `Cannot change status from ${order.status} to ${target}`,
        'ILLEGAL_TRANSITION',
      );
    }

    order.status = target;
    const tsField = STATUS_TIMESTAMP[target];
    if (tsField) {
      (order as unknown as Record<string, unknown>)[tsField] = new Date();
    }
    if (target === OrderStatus.CANCELLED && cancelReason) {
      order.cancelReason = cancelReason;
    }
    await order.save();

    await order.populate('table', TABLE_FIELDS);
    const dto = serialize(order);
    emitOrderUpdated(dto, order.session ? String(order.session) : null);
    return dto;
  },

  /** Mark an order paid (CASHIER / OWNER / MANAGER). */
  async markPaid(id: string): Promise<Record<string, unknown>> {
    const order = await Order.findById(id);
    if (!order) {
      throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }
    if (order.isPaid) {
      throw AppError.badRequest('Order is already paid', 'ALREADY_PAID');
    }
    order.isPaid = true;
    order.paidAt = new Date();
    await order.save();

    // Auto-close the table session once nothing is left unpaid.
    if (order.session) {
      await closeSessionIfFullyPaid(order.session);
    }

    await order.populate('table', TABLE_FIELDS);
    const dto = serialize(order);
    emitOrderUpdated(dto, order.session ? String(order.session) : null);
    return dto;
  },
};

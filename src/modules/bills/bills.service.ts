import { Types, type FilterQuery } from 'mongoose';
import { Order, Session, Table, Invoice, CafeSettings } from '../../models';
import type { IInvoice, IOrder } from '../../models';
import { OrderStatus, PaymentMode } from '../../models/enums';
import { AppError } from '../../common/AppError';
import { emitOrderUpdated } from '../../sockets';
import type { GenerateBillInput, ListBillsInput } from './bills.validation';

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

async function resolveTableNumber(orders: IOrder[]): Promise<number> {
  const tableId = orders[0]?.table;
  if (!tableId) return 0;
  const table = await Table.findById(tableId).select('number').lean();
  return table?.number ?? 0;
}

export const billsService = {
  /**
   * Generate a final bill for a table. Aggregates the non-cancelled orders
   * (by session or explicit ids), snapshots line items + cafe/GST details,
   * assigns a sequential invoice number, marks the orders paid, and closes the
   * session. GST (when enabled) is split evenly into CGST + SGST.
   */
  async generate(input: GenerateBillInput, createdBy?: string): Promise<IInvoice> {
    // 1) Resolve billable (non-cancelled) orders.
    const query: FilterQuery<IOrder> = { status: { $ne: OrderStatus.CANCELLED } };
    if (input.sessionId) {
      query.session = new Types.ObjectId(input.sessionId);
    } else {
      query._id = { $in: (input.orderIds ?? []).map((id) => new Types.ObjectId(id)) };
    }

    const orders = await Order.find(query).sort({ createdAt: 1 });
    if (orders.length === 0) {
      throw AppError.badRequest('No billable orders found for this table', 'NO_ORDERS');
    }

    // 2) Snapshot line items (effective per-unit price keeps unit*qty === lineTotal).
    const items = orders.flatMap((order) =>
      order.items.map((it) => {
        const lineTotal = round2(it.totalPrice);
        return {
          name: it.name,
          variantName: it.variantName,
          quantity: it.quantity,
          unitPrice: round2(lineTotal / it.quantity),
          lineTotal,
        };
      }),
    );
    const subtotal = round2(items.reduce((sum, i) => sum + i.lineTotal, 0));

    // 3) GST from cafe settings.
    const settings = (await CafeSettings.findOne()) ?? (await CafeSettings.create({}));
    const gstEnabled = settings.gstEnabled;
    const gstRate = gstEnabled ? settings.gstRate : 0;
    const taxAmount = gstEnabled ? round2((subtotal * gstRate) / 100) : 0;
    const cgst = round2(taxAmount / 2);
    const sgst = round2(taxAmount - cgst);
    const total = round2(subtotal + taxAmount);

    // 4) Sequential invoice number (atomic counter on the settings doc).
    const counterDoc = await CafeSettings.findByIdAndUpdate(
      settings._id,
      { $inc: { invoiceCounter: 1 } },
      { new: true },
    );
    const counter = counterDoc?.invoiceCounter ?? 1;
    const invoiceNumber = `${settings.invoicePrefix}${String(counter).padStart(4, '0')}`;

    // 5) Cafe snapshot (address flattened from the parts that are set).
    const address = [
      settings.addressLine1,
      settings.addressLine2,
      [settings.city, settings.state].filter(Boolean).join(', '),
      settings.pincode,
    ]
      .filter((p) => p && p.length)
      .join(', ');

    const invoice = await Invoice.create({
      invoiceNumber,
      session: input.sessionId ? new Types.ObjectId(input.sessionId) : undefined,
      table: await resolveTableNumber(orders),
      orders: orders.map((o) => o._id),
      items,
      subtotal,
      gstEnabled,
      gstRate,
      cgst,
      sgst,
      taxAmount,
      total,
      cafe: {
        name: settings.cafeName,
        legalName: settings.legalName,
        address: address || undefined,
        gstin: settings.gstin,
        phone: settings.phone,
        email: settings.email,
      },
      paymentMode: (input.paymentMode as PaymentMode) ?? PaymentMode.CASH,
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
    });

    // 6) Mark orders paid + notify the dashboard.
    const now = new Date();
    for (const order of orders) {
      if (!order.isPaid) {
        order.isPaid = true;
        order.paidAt = now;
        await order.save();
        emitOrderUpdated(
          order.toObject({ versionKey: false }),
          order.session ? String(order.session) : null,
        );
      }
    }

    // 7) Close the billed session (a settled table stops ordering).
    if (input.sessionId) {
      await Session.updateOne(
        { _id: input.sessionId, isActive: true },
        { $set: { isActive: false } },
      );
    }

    return invoice;
  },

  async getById(id: string): Promise<IInvoice> {
    const invoice = await Invoice.findById(id);
    if (!invoice) throw AppError.notFound('Invoice not found', 'INVOICE_NOT_FOUND');
    return invoice;
  },

  async list(filter: ListBillsInput): Promise<IInvoice[]> {
    const query: FilterQuery<IInvoice> = {};
    if (filter.from || filter.to) {
      const createdAt: Record<string, Date> = {};
      if (filter.from) createdAt.$gte = filter.from;
      if (filter.to) createdAt.$lte = filter.to;
      query.createdAt = createdAt;
    }
    return Invoice.find(query).sort({ createdAt: -1 }).limit(200);
  },
};

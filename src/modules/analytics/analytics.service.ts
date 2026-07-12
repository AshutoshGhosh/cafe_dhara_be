import { Order } from '../../models';
import { OrderStatus, ORDER_STATUS_VALUES } from '../../models/enums';

/**
 * Analytics over the Order collection (READ-ONLY, via aggregation).
 *
 * "Revenue-generating" orders are defined as orders that are both COMPLETED and
 * paid (`status === COMPLETED && isPaid === true`) — the definitive successful,
 * settled set. Revenue metrics (summary, revenue-by-day, top-items) use this
 * filter. Volume metrics (orders-by-status, peak-hours) count ALL orders in the
 * range so cancellations/in-flight orders remain visible.
 *
 * All date ranges are applied to `createdAt` and interpreted in UTC ($hour /
 * $dateToString use UTC).
 */

export interface DateRange {
  from?: Date;
  to?: Date;
}

type Match = Record<string, unknown>;

/** Build a `createdAt` range clause, or `{}` when no bounds are given. */
function dateClause(range: DateRange): Match {
  const createdAt: Record<string, Date> = {};
  if (range.from) createdAt.$gte = range.from;
  if (range.to) createdAt.$lte = range.to;
  return Object.keys(createdAt).length ? { createdAt } : {};
}

/** Match for revenue-generating (completed + paid) orders within the range. */
function revenueMatch(range: DateRange): Match {
  return { status: OrderStatus.COMPLETED, isPaid: true, ...dateClause(range) };
}

export interface SummaryResult {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface RevenueByDayRow {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopItemRow {
  menuItem: string | null;
  name: string;
  quantity: number;
  revenue: number;
}

export interface StatusCountRow {
  status: string;
  count: number;
}

export interface PeakHourRow {
  hour: number;
  count: number;
}

export const analyticsService = {
  /** Total revenue, order count, and average order value for completed+paid orders. */
  async summary(range: DateRange): Promise<SummaryResult> {
    const rows = await Order.aggregate<{ totalRevenue: number; orderCount: number }>([
      { $match: revenueMatch(range) },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, orderCount: { $sum: 1 } } },
    ]);

    const agg = rows[0] ?? { totalRevenue: 0, orderCount: 0 };
    const averageOrderValue = agg.orderCount > 0 ? agg.totalRevenue / agg.orderCount : 0;
    return {
      totalRevenue: agg.totalRevenue,
      orderCount: agg.orderCount,
      averageOrderValue,
    };
  },

  /** Daily revenue + order count time series (ascending by date, UTC days). */
  async revenueByDay(range: DateRange): Promise<RevenueByDayRow[]> {
    return Order.aggregate<RevenueByDayRow>([
      { $match: revenueMatch(range) },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1, orders: 1 } },
    ]);
  },

  /** Best-selling embedded order items by quantity (then revenue). */
  async topItems(range: DateRange, limit: number): Promise<TopItemRow[]> {
    return Order.aggregate<TopItemRow>([
      { $match: revenueMatch(range) },
      { $unwind: '$items' },
      {
        $group: {
          _id: { menuItem: '$items.menuItem', name: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' },
        },
      },
      { $sort: { quantity: -1, revenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          menuItem: '$_id.menuItem',
          name: '$_id.name',
          quantity: 1,
          revenue: 1,
        },
      },
    ]);
  },

  /** Order counts per status (ALL orders in range); every status is present. */
  async ordersByStatus(range: DateRange): Promise<StatusCountRow[]> {
    const rows = await Order.aggregate<{ status: string; count: number }>([
      { $match: dateClause(range) },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]);

    const counts = new Map(rows.map((r) => [r.status, r.count]));
    return ORDER_STATUS_VALUES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
  },

  /** Order volume bucketed by hour of day 0..23 (ALL orders in range, UTC). */
  async peakHours(range: DateRange): Promise<PeakHourRow[]> {
    const rows = await Order.aggregate<{ hour: number; count: number }>([
      { $match: dateClause(range) },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $project: { _id: 0, hour: '$_id', count: 1 } },
    ]);

    const counts = new Map(rows.map((r) => [r.hour, r.count]));
    return Array.from({ length: 24 }, (_, hour) => ({ hour, count: counts.get(hour) ?? 0 }));
  },
};

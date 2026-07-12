import { Types } from 'mongoose';
import { AuditLog } from '../../models';
import type { IAuditLog } from '../../models';

export type AuditData = Record<string, unknown>;

/**
 * Reusable audit writer. Records a privileged action to the AuditLog collection.
 * `actorId` may be null for system actions. `before`/`after` snapshot the
 * entity state around the change. Import and call from other modules, e.g.:
 *
 *   import { logAudit } from '../audit/audit.service';
 *   await logAudit(req.user.id, 'UPDATE', 'MenuItem', item.id, before, after);
 *
 * (Not yet wired into other modules.)
 */
export async function logAudit(
  actorId: string | Types.ObjectId | null,
  action: string,
  entity: string,
  entityId?: string,
  before?: AuditData,
  after?: AuditData,
): Promise<IAuditLog> {
  return AuditLog.create({
    user: actorId ?? null,
    action,
    entity,
    entityId,
    oldData: before,
    newData: after,
  });
}

export interface AuditListFilters {
  actor?: string;
  action?: string;
  entity?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export interface AuditListResult {
  items: unknown[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const auditService = {
  /** Paginated, filterable audit-log listing (newest first). */
  async list(filters: AuditListFilters): Promise<AuditListResult> {
    const match: Record<string, unknown> = {};
    if (filters.actor) match.user = new Types.ObjectId(filters.actor);
    if (filters.action) match.action = filters.action;
    if (filters.entity) match.entity = filters.entity;
    if (filters.from || filters.to) {
      const createdAt: Record<string, Date> = {};
      if (filters.from) createdAt.$gte = filters.from;
      if (filters.to) createdAt.$lte = filters.to;
      match.createdAt = createdAt;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await Promise.all([
      AuditLog.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .populate('user', 'email firstName lastName role')
        .lean(),
      AuditLog.countDocuments(match),
    ]);

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      pages: Math.max(1, Math.ceil(total / filters.limit)),
    };
  },
};

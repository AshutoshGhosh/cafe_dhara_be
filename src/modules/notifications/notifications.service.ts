import { Types } from 'mongoose';
import { Notification } from '../../models';
import type { INotification } from '../../models';
import { AppError } from '../../common/AppError';
import type { ListNotificationsInput } from './notifications.validation';

export interface CreateNotificationPayload {
  /** Target staff/owner user id. Omit/null for a cafe-wide broadcast. */
  user?: string | Types.ObjectId | null;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
}

/**
 * Persist a notification. Reusable across modules for future internal use
 * (e.g. new-order alerts) — intentionally NOT wired into other modules yet.
 */
export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<INotification> {
  return Notification.create({
    user: payload.user ?? null,
    title: payload.title,
    body: payload.body,
    type: payload.type,
    data: payload.data,
  });
}

/** A notification is visible to a user if it targets them or is a broadcast (user=null). */
function visibilityFilter(userId: string): Record<string, unknown> {
  return { $or: [{ user: userId }, { user: null }] };
}

export const notificationsService = {
  async listForUser(userId: string, filter: ListNotificationsInput): Promise<INotification[]> {
    const query: Record<string, unknown> = visibilityFilter(userId);
    if (filter.isRead !== undefined) {
      query.isRead = filter.isRead;
    }
    return Notification.find(query).sort({ createdAt: -1 });
  },

  async markRead(userId: string, id: string): Promise<INotification> {
    const notification = await Notification.findOne({
      _id: id,
      ...visibilityFilter(userId),
    });
    if (!notification) {
      throw AppError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
    }
    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }
    return notification;
  },

  async markAllRead(userId: string): Promise<{ modified: number }> {
    const result = await Notification.updateMany(
      { ...visibilityFilter(userId), isRead: false },
      { $set: { isRead: true } },
    );
    return { modified: result.modifiedCount };
  },
};

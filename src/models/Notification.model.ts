import { Schema, model, Types, type Document, type Model } from 'mongoose';

/**
 * A notification. `user` is optional — when null the notification is cafe-wide
 * (e.g. a new order for the whole staff). The Prisma `restaurantId` scoping is
 * dropped in the single-cafe model.
 */
export interface INotification extends Document {
  user?: Types.ObjectId | null;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Notification: Model<INotification> = model<INotification>(
  'Notification',
  notificationSchema,
);

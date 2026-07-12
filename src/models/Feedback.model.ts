import { Schema, model, Types, type Document, type Model } from 'mongoose';

/**
 * Customer feedback tied to a single order (one feedback per order).
 */
export interface IFeedback extends Document {
  order: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    comment: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Feedback: Model<IFeedback> = model<IFeedback>('Feedback', feedbackSchema);

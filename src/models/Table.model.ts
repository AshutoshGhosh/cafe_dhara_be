import { Schema, model, type Document, type Model } from 'mongoose';

/**
 * A physical table in the cafe. `number` is unique within the single cafe
 * (the Prisma composite unique [restaurantId, number] collapses to just `number`).
 */
export interface ITable extends Document {
  number: number;
  name?: string;
  capacity: number;
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITable>(
  {
    number: { type: Number, required: true, unique: true, index: true },
    name: { type: String, trim: true },
    capacity: { type: Number, default: 4 },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

export const Table: Model<ITable> = model<ITable>('Table', tableSchema);

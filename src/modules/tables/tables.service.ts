import { Table } from '../../models';
import type { ITable } from '../../models';
import { AppError } from '../../common/AppError';
import type { CreateTableInput, UpdateTableInput } from './tables.validation';

export interface PublicTable {
  id: string;
  number: number;
  name?: string;
  capacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicTable(t: ITable): PublicTable {
  return {
    id: String(t._id),
    number: t.number,
    name: t.name,
    capacity: t.capacity,
    isActive: t.isActive,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

/** True for a MongoDB duplicate-key error (unique `number` collision). */
function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

export const tablesService = {
  async list(includeInactive = false): Promise<PublicTable[]> {
    const filter: Record<string, unknown> = { deletedAt: null };
    if (!includeInactive) filter.isActive = true;
    const tables = await Table.find(filter).sort({ number: 1 });
    return tables.map(toPublicTable);
  },

  async getById(id: string): Promise<PublicTable> {
    const table = await Table.findOne({ _id: id, deletedAt: null });
    if (!table) throw AppError.notFound('Table not found', 'TABLE_NOT_FOUND');
    return toPublicTable(table);
  },

  async create(input: CreateTableInput): Promise<PublicTable> {
    try {
      const table = await Table.create({
        number: input.number,
        name: input.name,
        capacity: input.capacity ?? 4,
        isActive: input.isActive ?? true,
      });
      return toPublicTable(table);
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw AppError.conflict('A table with this number already exists', 'TABLE_NUMBER_TAKEN');
      }
      throw err;
    }
  },

  async update(id: string, input: UpdateTableInput): Promise<PublicTable> {
    const table = await Table.findOne({ _id: id, deletedAt: null });
    if (!table) throw AppError.notFound('Table not found', 'TABLE_NOT_FOUND');

    if (input.number !== undefined) table.number = input.number;
    if (input.name !== undefined) table.name = input.name;
    if (input.capacity !== undefined) table.capacity = input.capacity;
    if (input.isActive !== undefined) table.isActive = input.isActive;

    try {
      await table.save();
      return toPublicTable(table);
    } catch (err) {
      if (isDuplicateKey(err)) {
        throw AppError.conflict('A table with this number already exists', 'TABLE_NUMBER_TAKEN');
      }
      throw err;
    }
  },

  /** Soft-delete: flag deletedAt + deactivate. */
  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const table = await Table.findOne({ _id: id, deletedAt: null });
    if (!table) throw AppError.notFound('Table not found', 'TABLE_NOT_FOUND');
    table.deletedAt = new Date();
    table.isActive = false;
    await table.save();
    return { id: String(table._id), deleted: true };
  },
};

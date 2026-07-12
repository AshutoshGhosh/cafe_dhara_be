import type { FilterQuery } from 'mongoose';
import { User } from '../../models';
import type { IUser } from '../../models';
import { Role } from '../../models/enums';
import { AppError } from '../../common/AppError';
import { hashPassword } from '../../utils/password';
import type {
  CreateUserInput,
  UpdateUserInput,
  ListUsersInput,
} from './users.validation';

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: Role;
  isActive: boolean;
  phone?: string;
  avatar?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe projection — never exposes passwordHash or other sensitive fields. */
function toPublicUser(u: IUser): PublicUser {
  return {
    id: String(u._id),
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    isActive: u.isActive,
    phone: u.phone,
    avatar: u.avatar,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

/** Load a non-deleted user or throw 404. */
async function findActiveOrThrow(id: string): Promise<IUser> {
  const user = await User.findOne({ _id: id, deletedAt: null });
  if (!user) {
    throw AppError.notFound('User not found', 'USER_NOT_FOUND');
  }
  return user;
}

/** Count active (non-deleted, isActive) OWNERs. */
async function countActiveOwners(): Promise<number> {
  return User.countDocuments({ role: Role.OWNER, isActive: true, deletedAt: null });
}

export const usersService = {
  async create(input: CreateUserInput): Promise<PublicUser> {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw AppError.conflict('A user with this email already exists', 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await User.create({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      passwordHash,
    });

    return toPublicUser(user);
  },

  async list(filter: ListUsersInput): Promise<PublicUser[]> {
    const query: FilterQuery<IUser> = { deletedAt: null };
    if (filter.role !== undefined) query.role = filter.role;
    if (filter.isActive !== undefined) query.isActive = filter.isActive;

    const users = await User.find(query).sort({ createdAt: -1 });
    return users.map(toPublicUser);
  },

  async getById(id: string): Promise<PublicUser> {
    const user = await findActiveOrThrow(id);
    return toPublicUser(user);
  },

  async update(
    id: string,
    input: UpdateUserInput,
    actingUserId: string,
  ): Promise<PublicUser> {
    const user = await findActiveOrThrow(id);

    // A user cannot deactivate themselves.
    if (input.isActive === false && String(user._id) === actingUserId) {
      throw AppError.forbidden('You cannot deactivate your own account', 'SELF_DEACTIVATE');
    }

    // Protect the last remaining active OWNER from demotion or deactivation.
    const isCurrentlyActiveOwner = user.role === Role.OWNER && user.isActive;
    const willLoseOwner = input.role !== undefined && input.role !== Role.OWNER;
    const willDeactivate = input.isActive === false;
    if (isCurrentlyActiveOwner && (willLoseOwner || willDeactivate)) {
      const activeOwners = await countActiveOwners();
      if (activeOwners <= 1) {
        throw AppError.badRequest(
          'Cannot demote or deactivate the last active owner',
          'LAST_OWNER',
        );
      }
    }

    if (input.firstName !== undefined) user.firstName = input.firstName;
    if (input.lastName !== undefined) user.lastName = input.lastName;
    if (input.role !== undefined) user.role = input.role;
    if (input.isActive !== undefined) user.isActive = input.isActive;

    await user.save();
    return toPublicUser(user);
  },

  async resetPassword(id: string, password: string): Promise<PublicUser> {
    const user = await findActiveOrThrow(id);
    user.passwordHash = await hashPassword(password);
    await user.save();
    return toPublicUser(user);
  },

  async softDelete(id: string, actingUserId: string): Promise<PublicUser> {
    const user = await findActiveOrThrow(id);

    // A user cannot delete themselves.
    if (String(user._id) === actingUserId) {
      throw AppError.forbidden('You cannot delete your own account', 'SELF_DELETE');
    }

    // Protect the last remaining active OWNER from deletion.
    if (user.role === Role.OWNER && user.isActive) {
      const activeOwners = await countActiveOwners();
      if (activeOwners <= 1) {
        throw AppError.badRequest('Cannot delete the last active owner', 'LAST_OWNER');
      }
    }

    user.deletedAt = new Date();
    user.isActive = false;
    await user.save();
    return toPublicUser(user);
  },
};

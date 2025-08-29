import prisma from '../config/db';
import * as bcrypt from 'bcryptjs';
import { encrypt } from '../utils/crypto';

export interface User {
  id?: number;
  email: string;
  passwordHash?: string;
  fullName?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const createUser = async (
  email: string, 
  password: string, 
  fullName?: string, 
  phone?: string, 
  role: string = 'user'
): Promise<Omit<User, 'passwordHash'>> => {
  try {
    const hash = await bcrypt.hash(password, 10);
    const enc = encrypt(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        passwordEncCipher: enc.cipher,
        passwordEncIv: enc.iv,
        passwordEncTag: enc.tag,
        fullName,
        phone,
        role
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (
  id: number, 
  fields: Partial<{ email: string; password: string; fullName: string; phone: string; role: string; isActive: boolean }>
): Promise<Omit<User, 'passwordHash'> | null> => {
  try {
    const updateData: any = {};
    
    if (fields.email) updateData.email = fields.email;
    if (fields.fullName) updateData.fullName = fields.fullName;
    if (fields.phone) updateData.phone = fields.phone;
    if (fields.role) updateData.role = fields.role;
    if (typeof fields.isActive === 'boolean') updateData.isActive = fields.isActive;
    if (fields.password) updateData.passwordHash = await bcrypt.hash(fields.password, 10);

    if (Object.keys(updateData).length === 0) return await getUserById(id);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (id: number): Promise<Omit<User, 'passwordHash'> | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return user;
  } catch (error) {
    throw error;
  }
};

export const getUserByEmailWithHash = async (email: string): Promise<User | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    return user;
  } catch (error) {
    throw error;
  }
};

export const listUsers = async (): Promise<Omit<User, 'passwordHash'>[]> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { id: 'asc' }
    });
    return users;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<Omit<User, 'passwordHash'> | null> => {
  try {
    const user = await prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    return user;
  } catch (error) {
    throw error;
  }
};



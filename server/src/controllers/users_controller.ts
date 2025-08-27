import pool from '../config/db';
import * as bcrypt from 'bcryptjs';
import { encrypt } from '../utils/crypto';

export interface User {
  id?: number;
  email: string;
  password_hash?: string;
  full_name?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const createUser = async (
  email: string, 
  password: string, 
  fullName?: string, 
  phone?: string, 
  role: string = 'user'
): Promise<Omit<User, 'password_hash'>> => {
  try {
    const hash = await bcrypt.hash(password, 10);
    const enc = encrypt(password);
    const result = await pool.query<User>(
      'INSERT INTO users (email, password_hash, password_enc_cipher, password_enc_iv, password_enc_tag, full_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, full_name, phone, role, is_active, created_at, updated_at',
      [email, hash, enc.cipher, enc.iv, enc.tag, fullName, phone, role]
    );
    
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (
  id: number, 
  fields: Partial<{ email: string; password: string; full_name: string; phone: string; role: string; is_active: boolean }>
): Promise<Omit<User, 'password_hash'> | null> => {
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (fields.email) { updates.push(`email = $${idx++}`); values.push(fields.email); }
    if (fields.full_name) { updates.push(`full_name = $${idx++}`); values.push(fields.full_name); }
    if (fields.phone) { updates.push(`phone = $${idx++}`); values.push(fields.phone); }
    if (fields.role) { updates.push(`role = $${idx++}`); values.push(fields.role); }
    if (typeof fields.is_active === 'boolean') { updates.push(`is_active = $${idx++}`); values.push(fields.is_active); }
    if (fields.password) { updates.push(`password_hash = $${idx++}`); values.push(await bcrypt.hash(fields.password, 10)); }

    if (updates.length === 0) return await getUserById(id);

    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id, email, full_name, phone, role, is_active, created_at, updated_at`;
    values.push(id);

    const result = await pool.query<User>(query, values);
    
    return result.rows[0] ?? null;
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (id: number): Promise<Omit<User, 'password_hash'> | null> => {
  const result = await pool.query<User>('SELECT id, email, full_name, phone, role, is_active, created_at, updated_at FROM users WHERE id=$1', [id]);
  return result.rows[0] ?? null;
};

export const getUserByEmailWithHash = async (email: string): Promise<User | null> => {
  const result = await pool.query<User>('SELECT * FROM users WHERE email=$1', [email]);
  return result.rows[0] ?? null;
};

export const listUsers = async (): Promise<Omit<User, 'password_hash'>[]> => {
  const result = await pool.query<User>('SELECT id, email, full_name, phone, role, is_active, created_at, updated_at FROM users ORDER BY id ASC');
  return result.rows;
};

export const deleteUser = async (id: number): Promise<Omit<User, 'password_hash'> | null> => {
  const result = await pool.query<User>('DELETE FROM users WHERE id=$1 RETURNING id, email, full_name, phone, role, is_active, created_at, updated_at', [id]);
  return result.rows[0] ?? null;
};



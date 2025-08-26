import { supabase } from '../config/supabaseClient';
import { Role, User } from '../models/user.model';
import * as bcrypt from 'bcryptjs';

export const findUserByUsername = async (username: string): Promise<User | undefined> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, password_hash, role, instrument, secret_key')
    .eq('username', username)
    .single();

  if (error && error.code !== 'PGRST116') {
    return undefined;
  }
  return data as User | undefined;
};

export const createUser = async (user: Omit<User, 'id' | 'role' | 'secret_key'> & { password?: string, secret_key?: string }, role: Role): Promise<User> => {
  const passwordHash = user.password ? await bcrypt.hash(user.password, 10) : '';
  
  const defaultInstrument = user.instrument || 'Other';

  const { data, error } = await supabase
    .from('users')
    .insert({
      username: user.username,
      password_hash: passwordHash,
      role: role,
      instrument: defaultInstrument,
      secret_key: user.secret_key || null
    })
    .select('id, username, role, instrument, secret_key')
    .single();

  if (error) {
    
    throw new Error(error.message);
  }
  return data as User;
};

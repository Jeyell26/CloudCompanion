// Authentication API — login, register, profile.
// Used by: components/Login.tsx

import type { User } from '../types';
import { request } from './client';

export async function loginUser(email: string, pass: string): Promise<{ token: string; user: User }> {
  try {
    return await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });
  } catch {
    console.warn('Backend unavailable. Simulating login...');
    if (email === 'demo@example.com' && pass === 'password') {
      const mockToken = 'mock_jwt_token_jeyell';
      const mockUser = { id: 'usr-1', username: 'Jeyell', email: 'demo@example.com' };
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      return { token: mockToken, user: mockUser };
    }
    throw new Error('Invalid email or password. Use demo@example.com / password for simulator.');
  }
}

export async function registerUser(
  username: string,
  email: string,
  pass: string
): Promise<{ token: string; user: User }> {
  try {
    return await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password: pass })
    });
  } catch {
    console.warn('Backend unavailable. Simulating registration...');
    const mockToken = 'mock_jwt_token_' + Math.random().toString(36).substr(2, 9);
    const mockUser = { id: 'usr-' + Math.random().toString(36).substr(2, 4), username, email };
    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    return { token: mockToken, user: mockUser };
  }
}

export async function getProfile(): Promise<User> {
  try {
    return await request<User>('/auth/me');
  } catch {
    const cachedUser = localStorage.getItem('auth_user');
    if (cachedUser) return JSON.parse(cachedUser);
    throw new Error('No user profile found');
  }
}

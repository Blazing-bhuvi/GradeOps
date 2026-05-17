/**
 * api/users.js — User management operations.
 */

import { getAuthHeaders } from './auth.js';

// If running on Vercel or production, use relative paths. For dev (port 3000), use localhost:8000
const API_BASE = (window.location.port === '3000' || window.location.hostname === 'localhost') 
  ? 'http://localhost:8000' 
  : '';

export async function getUsers() {
  const res = await fetch(`${API_BASE}/auth/users`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    if (res.status === 401) {
      const { logout } = await import('./auth.js');
      logout();
      window.location.reload(); // Force redirect to login
    }
    let msg = 'Failed to fetch users';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch (e) {}
    throw new Error(msg);
  }
  
  const users = await res.json();
  
  // Add UI properties for the avatar (color, initials)
  return users.map(u => ({
    ...u,
    avatar: (u.name || '??').substring(0, 2).toUpperCase(),
    color: u.role === 'instructor' ? '#E1F5EE' : '#E6F1FB',
    tc: u.role === 'instructor' ? '#0F6E56' : '#185FA5'
  }));
}

export async function inviteUser({ email, role }) {
  // Placeholder for user invitation logic
  console.log('Inviting user:', email, role);
  return { email, role };
}

export async function toggleUserRole(id) {
  const res = await fetch(`${API_BASE}/auth/users/${id}/toggle-role`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  
  if (!res.ok) {
    let msg = 'Failed to update user role';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch (e) {}
    throw new Error(msg);
  }
  
  return res.json();
}

export async function removeUser(id) {
  const res = await fetch(`${API_BASE}/auth/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!res.ok) {
    let msg = 'Failed to remove user';
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch (e) {}
    throw new Error(msg);
  }
  
  return res.json();
}

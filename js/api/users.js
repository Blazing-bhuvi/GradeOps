/**
 * api/users.js — User management operations.
 */

import { getAuthHeaders } from './auth.js';

const API_BASE = window.location.port === '3000' ? 'http://localhost:8000' : '';

export async function getUsers() {
  const res = await fetch(`${API_BASE}/auth/users`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  const users = await res.json();
  
  // Add UI properties for the avatar (color, initials)
  return users.map(u => ({
    ...u,
    avatar: u.name.substring(0, 2).toUpperCase(),
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
  // Placeholder for toggling role on backend
  console.log('Toggle role for:', id);
}

export async function removeUser(id) {
  // Placeholder for removing user on backend
  console.log('Remove user:', id);
}

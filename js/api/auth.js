/**
 * api/auth.js — Authentication operations.
 */

import { store } from '../state.js';

const API_BASE = window.location.port === '3000' ? 'http://localhost:8000' : '';

export async function login(email, password) {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }

  const data = await res.json();
  store.token = data.access_token;
  localStorage.setItem('token', data.access_token);
  
  // Fetch user info
  const user = await getMe();
  store.user = user;
  store.role = user.role;
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('role', user.role);

  return { user, token: data.access_token };
}

export async function register({ email, name, password, role }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password, role }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Registration failed');
  }

  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${store.token}` },
  });

  if (!res.ok) {
    logout();
    throw new Error('Session expired');
  }

  return res.json();
}

export function logout() {
  store.token = null;
  store.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
}

export function isAuthenticated() {
  return !!store.token;
}

export function getAuthHeaders(headers = {}) {
  const authHeaders = { ...headers };
  if (store.token) {
    authHeaders['Authorization'] = `Bearer ${store.token}`;
  }
  return authHeaders;
}

/**
 * api/courses.js — Course management operations.
 */

import { getAuthHeaders } from './auth.js';

// If running on Vercel or production, use relative paths. For dev (port 3000), use localhost:8000
const API_BASE = (window.location.port === '3000' || window.location.hostname === 'localhost') 
  ? 'http://localhost:8000' 
  : '';

export async function getCourses() {
  const res = await fetch(`${API_BASE}/metadata/courses`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

export async function createCourse({ name, code }) {
  const res = await fetch(`${API_BASE}/metadata/courses`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name, code }),
  });
  if (!res.ok) throw new Error('Failed to create course');
  return res.json();
}

export async function deleteCourse(courseId) {
  const res = await fetch(`${API_BASE}/metadata/courses/id/${courseId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete course');
  return res.json();
}

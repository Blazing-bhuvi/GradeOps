/**
 * api/exams.js — Exam CRUD operations with backend persistence.
 */

import { store } from '../state.js';
import { getAuthHeaders } from './auth.js';

// If running on Vercel or production, use relative paths. For dev (port 3000), use localhost:8000
const API_BASE = (window.location.port === '3000' || window.location.hostname === 'localhost') 
  ? 'http://localhost:8000' 
  : '';

export async function getExams() {
  const res = await fetch(`${API_BASE}/metadata/exams`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch exams');
  const exams = await res.json();

  // The backend now provides real-time status and progress for all exams in one go.
  // We no longer need to call getPipelineState in a loop (which caused major lag).
  return exams;
}

export async function createExam(exam) {
  const res = await fetch(`${API_BASE}/metadata/exams`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(exam),
  });
  if (!res.ok) throw new Error('Failed to create exam metadata');
  return res.json();
}

export async function updateExamOnBackend(exam) {
  await fetch(`${API_BASE}/metadata/exams`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(exam),
  });
}

export async function deleteExam(id) {
  await fetch(`${API_BASE}/metadata/exams/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
}

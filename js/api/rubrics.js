/**
 * api/rubrics.js — Rubric CRUD operations.
 */

import { getAuthHeaders } from './auth.js';

// Use the current origin as the API base if we're not on the default dev port (3000)
const API_BASE = window.location.port === '3000' ? 'http://localhost:8000' : '';

export async function getRubrics() {
  const res = await fetch(`${API_BASE}/metadata/rubrics`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch rubrics');
  return res.json();
}

export async function getRubricContent(id) {
  const res = await fetch(`${API_BASE}/metadata/rubrics/${id}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch rubric content');
  return res.json();
}

export async function saveRubric({ name, jsonText, course_id = null }) {
  let rubricJson;
  try {
    rubricJson = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
  } catch (err) {
    throw new Error('Invalid JSON definition');
  }

  const questions = rubricJson.questions?.length ?? 0;
  const totalMarks = rubricJson.questions?.reduce((sum, q) => sum + (q.marks ?? 0), 0) ?? 0;

  const meta = {
    name: name.endsWith('.json') ? name : `${name}.json`,
    questions,
    total_marks: totalMarks,
    created_at: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    course_id
  };

  const res = await fetch(`${API_BASE}/metadata/rubrics`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ rubric_meta: meta, rubric_json: rubricJson }),
  });

  if (!res.ok) throw new Error('Failed to save rubric to backend');
  return res.json();
}

export async function deleteRubric(id) {
  const res = await fetch(`${API_BASE}/metadata/rubrics/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete rubric');
  return res.json();
}

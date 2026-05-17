/**
 * api/exams.js — Exam CRUD operations with backend persistence.
 */

import { store } from '../state.js';
import { getPipelineState } from './pipeline.js';
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

  // Sync processing/awaiting exams in parallel (don't use serial for loop)
  const syncTasks = exams.map(async (exam) => {
    if (exam.status === 'processing' || exam.status === 'awaiting_review') {
      try {
        const state = await getPipelineState(exam.id);
        if (state.progress) {
          exam.students = state.progress.total;
          exam.reviewed = state.progress.reviewed;
        }
        if (state.status && state.status !== exam.status) {
          exam.status = state.status === 'complete' ? 'graded' : state.status;
          // Return the updated exam so we can persist it if needed
          return exam;
        }
      } catch (err) {
        console.warn(`Failed to sync exam ${exam.id}:`, err);
      }
    }
    return null;
  });

  const updatedExams = await Promise.all(syncTasks);
  
  // Persist any status changes (like processing -> graded) back to backend
  for (const updated of updatedExams) {
    if (updated && updated.status === 'graded') {
      await updateExamOnBackend(updated);
    }
  }

  return exams;
}

export async function createExam(examData) {
  const existingExams = await getExams();
  const existing = existingExams.find(e => e.id === examData.id);

  const exam = {
    id:       examData.id || `exam_${Math.random().toString(36).substr(2, 9)}`,
    name:     examData.name,
    course:   examData.course,
    courseId: examData.courseId,
    uploaded: existing ? existing.uploaded : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status:   existing ? existing.status : 'processing',
    rubric:   examData.rubricName || (existing ? existing.rubric : null),
    students: examData.students || (existing ? existing.students : 0),
    reviewed: existing ? existing.reviewed : 0,
  };

  await updateExamOnBackend(exam);
  return exam;
}

async function updateExamOnBackend(exam) {
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

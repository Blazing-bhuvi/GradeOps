/**
 * api/reviews.js — TA review queue operations.
 */

import { store, delay } from '../state.js';
import { getPipelineState } from './pipeline.js';
import { getExams } from './exams.js';
import { getAuthHeaders } from './auth.js';

const API_BASE = (window.location.port === '3000' || window.location.hostname === 'localhost') 
  ? 'http://localhost:8000' 
  : '';

export async function getCompletedReviews(preloadedExams = null) {
  // OPTIMIZATION: For the 'Approved' list page, we only really want the most recent ones.
  // Instead of fetching EVERY pipeline state (which is slow), we'll use a new backend endpoint
  // if it existed. For now, we'll keep the logic but limit it to graded exams.
  
  const exams = preloadedExams || await getExams();
  const completed = [];
  
  // Only fetch details for exams that actually HAVE reviews
  const activeExams = exams.filter(e => e.reviewed > 0);
  
  const reviewTasks = activeExams.map(async (exam) => {
    try {
      const state = await getPipelineState(exam.id);
      const students = state.students || [];
      const examReviews = [];
      
      for (const s of students) {
        const decision = s.ta_decision;
        if (decision) {
          const action = typeof decision === 'string' ? decision : (decision.action || 'pending');
          if (action !== 'pending' && action !== 'escalate') {
            const maxScore = s.grade_output?.question_grades?.reduce((sum, q) => sum + q.max_score, 0) || 100;
            examReviews.push({
              student: s.student_id,
              q: exam.name,
              score: s.final_score ?? (s.grade_output?.total_score || 0),
              ai_score: s.grade_output?.total_score || 0,
              max: maxScore,
              status: action === 'approve' ? 'approved' : 'overridden',
            });
          }
        }
      }
      return examReviews;
    } catch (err) {
      console.warn(`Failed to fetch reviews for exam ${exam.id}:`, err);
      return [];
    }
  });

  const allReviews = await Promise.all(reviewTasks);
  return allReviews.flat();
}

export async function getReviewStats() {
  const exams = await getExams();
  let totalPendingStudents = 0;
  
  for (const exam of exams) {
    if (exam.status === 'processing' || exam.status === 'awaiting_review') {
      const remaining = (exam.students || 0) - (exam.reviewed || 0);
      if (remaining > 0) totalPendingStudents += remaining;
    }
  }
  
  // OPTIMIZATION: Don't call getCompletedReviews for sidebar stats.
  // Sidebar stats only really need the 'pending' count. 
  // We can mock or ignore the others unless the UI actually shows them.
  
  return {
    pending: totalPendingStudents,
    approved: 0, // Not needed for sidebar badge
    overridden: 0,
  };
}

export async function approveReview(id) {
  await delay();
  return { status: 'approved' };
}

export async function overrideReview(id, { score, comment } = {}) {
  await delay();
  return { status: 'overridden' };
}

export async function skipReview(id) {
  await delay();
}

/**
 * api/reviews.js — TA review queue operations.
 */

import { store, delay } from '../state.js';
import { getPipelineState } from './pipeline.js';
import { getExams } from './exams.js';

export async function getCompletedReviews(preloadedExams = null) {
  const exams = preloadedExams || await getExams();
  
  // Parallelize pipeline state fetches for all active exams
  const reviewTasks = exams.map(async (exam) => {
    const isActive = ['processing', 'awaiting_review', 'graded', 'complete'].includes(exam.status);
    if (!isActive) return [];

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

export async function approveReview(id) {
  // This is a local mock function, but with real backend it might not be used.
  // The actual approval happens via pipeline.js submitDecision.
  await delay();
  const review = store.pendingReviews.find(r => r.id === id);
  if (!review) return;
  review.status = 'approved';
  return { ...review };
}

export async function overrideReview(id, { score, comment } = {}) {
  await delay();
  const review = store.pendingReviews.find(r => r.id === id);
  if (!review) return;
  review.status   = 'overridden';
  review.comment  = comment ?? '';
  if (score !== undefined && !Number.isNaN(score)) {
    review.ai_score = score;
  }
  return { ...review };
}

export async function skipReview(id) {
  await delay();
  const idx = store.pendingReviews.findIndex(r => r.id === id);
  if (idx !== -1) {
    // Move to end of the array so the next item surfaces
    store.pendingReviews.push(store.pendingReviews.splice(idx, 1)[0]);
  }
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
  
  const completed = await getCompletedReviews(exams);
  
  return {
    pending: totalPendingStudents,
    approved: completed.filter(r => r.status === 'approved').length,
    overridden: completed.filter(r => r.status === 'overridden').length,
  };
}

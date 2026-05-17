/**
 * main.js — Application entry point.
 *
 * Responsibilities:
 *  - Boot the app on DOMContentLoaded
 *  - Handle role switching (updates store + re-renders header + re-navigates)
 *  - Read initial page from URL query param
 */

import { store } from './state.js';
import { navigate, renderNav } from './router.js';
import { getCourses } from './api/courses.js';
import { isAuthenticated, logout, verifySession } from './api/auth.js';

async function boot() {
  // 1. Verify if current session is actually valid
  if (isAuthenticated()) {
    const isValid = await verifySession();
    if (!isValid) {
      console.warn('[auth] Session invalid or expired. Logging out.');
      logout();
    }
  }

  // 2. Read initial page from URL (supports deep-linking)
  const params  = new URL(window.location).searchParams;
  let initPage = params.get('page') ?? 'dashboard';

  if (!isAuthenticated()) {
    initPage = 'login';
  }

  await navigate(initPage);
  await updateDynamicHeader();
  bindGlobalEvents();
}

async function updateDynamicHeader() {
  const headerRight = document.querySelector('.header-right');
  const courseLabel = document.getElementById('course-label');
  
  if (!isAuthenticated()) {
    if (headerRight) headerRight.style.display = 'none';
    if (courseLabel) courseLabel.textContent = 'GradeOps';
    return;
  }

  if (headerRight) headerRight.style.display = 'flex';

  const user = store.user;
  const avatarEl = document.getElementById('user-avatar');
  if (avatarEl && user) {
    avatarEl.textContent        = user.name.substring(0, 2).toUpperCase();
    avatarEl.style.background   = '#E1F5EE';
    avatarEl.style.color        = '#0F6E56';
    avatarEl.title = `Logged in as ${user.name} (${user.role})`;
  }

  if (courseLabel) {
    try {
      const courses = await getCourses();
      const activeCourse = courses.find(c => c.id === store.selectedCourseId) || courses[0];
      if (activeCourse) {
        if (!store.selectedCourseId) store.selectedCourseId = activeCourse.id;
        const suffix = store.role === 'ta' ? ' | TA View' : '';
        courseLabel.textContent = `${activeCourse.code} — ${activeCourse.name}${suffix}`;
      } else {
        courseLabel.textContent = 'GradeOps';
      }
    } catch (err) {
      courseLabel.textContent = 'GradeOps';
    }
  }

  // Set active role button
  document.getElementById('btn-instructor')?.classList.toggle('active', store.role === 'instructor');
  document.getElementById('btn-ta')?.classList.toggle('active',         store.role === 'ta');
}

function bindGlobalEvents() {
  document.getElementById('btn-instructor')?.addEventListener('click', () => switchRole('instructor'));
  document.getElementById('btn-ta')?.addEventListener('click',         () => switchRole('ta'));
  
  // Make avatar clickable to logout
  document.getElementById('user-avatar')?.addEventListener('click', () => {
    if (confirm('Do you want to logout?')) {
      logout();
      window.location.reload();
    }
  });
}

async function switchRole(role) {
  if (store.role === role) return; // No change needed

  // Security check: Only allow switching if the user's actual role allows it
  // (In a production app, we would verify this against the backend token)
  if (store.user && store.user.role !== 'instructor' && role === 'instructor') {
    showToast('Unauthorized: Only instructors can access this view', 'error');
    return;
  }

  store.role = role;
  localStorage.setItem('role', role);

  // Instant UI feedback for role buttons
  document.getElementById('btn-instructor')?.classList.toggle('active', role === 'instructor');
  document.getElementById('btn-ta')?.classList.toggle('active',         role === 'ta');

  // Trigger non-blocking header and nav updates
  updateDynamicHeader();

  // Instant navigation to the role's landing page
  const defaultPage = role === 'instructor' ? 'dashboard' : 'ta-dashboard';
  navigate(defaultPage);
}

document.addEventListener('DOMContentLoaded', boot);

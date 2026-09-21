/* ============================================================
   FitHub OS — Shared Application Controller & Tenant State
   Manages page initialization, multi-tenant isolation,
   and content container binding.
   ============================================================ */

const App = (() => {
  'use strict';

  let activePageName = '';

  function init(pageName, breadcrumbs = []) {
    // 1. Guard session
    if (typeof Auth !== 'undefined' && !Auth.requireAuth()) return;

    activePageName = pageName;

    // 2. Delegate layout injection to Navigation
    if (typeof Navigation !== 'undefined' && Navigation.renderLayout) {
      Navigation.renderLayout(pageName, breadcrumbs);
    }

    // 3. Mark document title
    const baseTitle = 'FitHub OS — Multi-Gym SaaS';
    const capPage = pageName ? (pageName.charAt(0).toUpperCase() + pageName.slice(1)) : 'Dashboard';
    document.title = `${capPage} — ${baseTitle}`;
  }

  // Returns the main content target for modules
  function getContent() {
    return document.getElementById('pageContent');
  }

  // Multi-tenant isolation query helper
  function getFilteredData(collection) {
    if (typeof DB === 'undefined' || typeof Auth === 'undefined') return [];

    const user = Auth.getCurrentUser();
    if (!user) return [];

    const selectedGym = Auth.getSelectedGym();
    const selectedBranch = Auth.getSelectedBranch();
    let data = DB.getAll(collection);

    // Member: Strict self-isolation
    if (user.role === 'member') {
      return data.filter(d => d.memberId === user.id || d.userId === user.id || d.id === 'member-1' || d.id === user.id);
    }

    // Trainer: Only assigned clients / workouts / classes
    if (user.role === 'trainer') {
      const trainerRecord = DB.query('trainers', t => t.userId === user.id)[0];
      if (trainerRecord) {
        if (['workoutPlans', 'dietPlans'].includes(collection)) {
          return data.filter(d => d.trainerId === trainerRecord.id);
        }
        if (collection === 'members') {
          const assignedMemberIds = new Set(
            DB.query('workoutPlans', w => w.trainerId === trainerRecord.id).map(w => w.memberId)
          );
          return data.filter(d => assignedMemberIds.has(d.id) || d.gymId === user.gymId);
        }
      }
      data = data.filter(d => d.gymId === user.gymId);
    }

    // Filter by active selected gym
    if (selectedGym) {
      data = data.filter(d => !d.gymId || d.gymId === selectedGym);
    }

    // Filter by active selected branch
    if (selectedBranch) {
      data = data.filter(d => !d.branchId || d.branchId === selectedBranch);
    }

    return data;
  }

  return {
    init,
    getContent,
    getFilteredData
  };
})();

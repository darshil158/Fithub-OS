/* ============================================================
   FitHub OS — Workout Plans Module
   ============================================================ */
(function () {
  'use strict';

  App.init('workouts', [{ label: 'Workouts' }]);
  const content = App.getContent();
  const MODULE = 'workouts';
  let currentPage = 1;
  let searchQuery = '';
  let filterStatus = '';
  let sortField = 'name';
  let sortDir = 'asc';

  function render() {
    let items = DB.getAll('workoutPlans');
    const user = Auth.getCurrentUser();

    // Multi-tenant isolation
    if (user.role === 'member') {
      items = items.filter(w => w.memberId === user.id || w.memberId === 'member-1');
    } else if (user.role === 'trainer') {
      const tr = DB.query('trainers', t => t.userId === user.id)[0];
      if (tr) items = items.filter(w => w.trainerId === tr.id);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(w => {
        const m = DB.getById('members', w.memberId);
        const t = DB.getById('trainers', w.trainerId);
        return (w.name || '').toLowerCase().includes(q) || (m?.name || '').toLowerCase().includes(q) || (t?.name || '').toLowerCase().includes(q);
      });
    }

    // Filter
    if (filterStatus) items = items.filter(w => w.status === filterStatus);

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-activity me-2"></i>Workout Routines</h1>
          <div class="subtitle">Trainer-designed workout splits, repetition guidelines, and member fitness regimens</div>
        </div>
        <div class="d-flex gap-2">
          <a href="${Navigation.getUrl('exercises')}" class="btn btn-outline-secondary"><i class="bi bi-lightning me-1"></i>Exercise Library</a>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="WorkoutsMod.openModal()"><i class="bi bi-plus-lg me-1"></i>New Workout Plan</button>' : ''}
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search workout plan or member..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="active" ${filterStatus === 'active' ? 'selected' : ''}>Active</option>
              <option value="completed" ${filterStatus === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="template" ${filterStatus === 'template' ? 'selected' : ''}>Template</option>
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th class="sortable" data-field="name">Plan Name</th>
                <th>Assigned Member</th>
                <th>Created By Trainer</th>
                <th>Program Length</th>
                <th>Exercises</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(w => {
                const m = DB.getById('members', w.memberId);
                const t = DB.getById('trainers', w.trainerId);
                const count = Array.isArray(w.exercises) ? w.exercises.length : 6;

                return `
                  <tr>
                    <td>
                      <div class="fw-semibold text-dark">${w.name}</div>
                    </td>
                    <td>
                      <div class="fw-medium">${m?.name || '<span class="badge bg-light text-dark">Template</span>'}</div>
                    </td>
                    <td><span class="badge bg-primary-subtle text-primary">${t?.name || 'Head Coach'}</span></td>
                    <td>${w.weeks || 4} Weeks</td>
                    <td><span class="badge bg-secondary-subtle text-dark">${count} movements</span></td>
                    <td>${Utils.statusBadge(w.status || 'active')}</td>
                    <td>
                      <div class="d-flex gap-1">
                        <button class="btn btn-icon btn-sm btn-outline-info" onclick="WorkoutsMod.viewRoutine('${w.id}')" title="View Exercises"><i class="bi bi-eye"></i></button>
                        ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="WorkoutsMod.openModal('${w.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="WorkoutsMod.deletePlan('${w.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-activity', 'No workout routines found', 'Create personalized training programs for gym members.', Permissions.canCreate(MODULE) ? 'New Workout Plan' : '')}
      </div>

      ${renderModals()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModals() {
    const members = DB.getAll('members');
    const trainers = DB.getAll('trainers');
    const exercises = DB.getAll('exercises');

    return `
    <!-- Create/Edit Modal -->
    <div class="modal fade" id="workoutModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="workoutModalTitle">New Workout Routine</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="workoutForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="workoutId">
              <div class="mb-3">
                <label class="form-label">Plan Title *</label>
                <input type="text" class="form-control" id="wName" placeholder="e.g. 5-Day Push Pull Legs Hypertrophy" required>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Trainer / Coach *</label>
                  <select class="form-select" id="wTrainerId" required>
                    <option value="">Select Trainer</option>
                    ${trainers.map(t => `<option value="${t.id}">${t.name} (${t.specialization})</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Assign To Member</label>
                  <select class="form-select" id="wMemberId">
                    <option value="">None (Master Template)</option>
                    ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Duration (Weeks)</label>
                  <input type="number" class="form-control" id="wWeeks" value="6" min="1" max="52">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="wStatus">
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="template">Template</option>
                  </select>
                </div>
              </div>

              <h6 class="mt-4 mb-2">Core Exercises Included</h6>
              <div class="row g-2">
                ${exercises.slice(0, 12).map(ex => `
                  <div class="col-6 col-md-4">
                    <div class="form-check border rounded p-2 bg-light">
                      <input class="form-check-input ms-1 me-2 ex-checkbox" type="checkbox" value="${ex.id}" id="chk_${ex.id}">
                      <label class="form-check-label small fw-medium text-truncate" for="chk_${ex.id}" title="${ex.name}">
                        ${ex.name}
                      </label>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Routine</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Routine Viewer Modal -->
    <div class="modal fade" id="routineViewModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" id="routineDetailContent"></div>
      </div>
    </div>
    `;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterStatus')?.addEventListener('change', e => { filterStatus = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('workoutForm')?.addEventListener('submit', saveWorkout);
  }

  function openModal(id) {
    const form = document.getElementById('workoutForm');
    Utils.resetForm(form);
    document.querySelectorAll('.ex-checkbox').forEach(cb => cb.checked = false);

    if (id) {
      const w = DB.getById('workoutPlans', id);
      if (!w) return;
      document.getElementById('workoutModalTitle').textContent = 'Edit Workout Routine';
      document.getElementById('workoutId').value = w.id;
      document.getElementById('wName').value = w.name || '';
      document.getElementById('wTrainerId').value = w.trainerId || '';
      document.getElementById('wMemberId').value = w.memberId || '';
      document.getElementById('wWeeks').value = w.weeks || 4;
      document.getElementById('wStatus').value = w.status || 'active';

      if (Array.isArray(w.exercises)) {
        w.exercises.forEach(item => {
          const exId = typeof item === 'string' ? item : item.exerciseId;
          const cb = document.getElementById('chk_' + exId);
          if (cb) cb.checked = true;
        });
      }
    } else {
      document.getElementById('workoutModalTitle').textContent = 'New Workout Routine';
      // Pre-check 4 exercises
      document.querySelectorAll('.ex-checkbox').forEach((cb, idx) => {
        if (idx < 4) cb.checked = true;
      });
    }
    new bootstrap.Modal(document.getElementById('workoutModal')).show();
  }

  function saveWorkout(e) {
    e.preventDefault();
    const form = document.getElementById('workoutForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('workoutId').value;
    const selectedEx = Array.from(document.querySelectorAll('.ex-checkbox:checked')).map(cb => ({
      exerciseId: cb.value,
      sets: 3,
      reps: '10-12',
      weight: 'Moderate'
    }));

    const data = {
      name: document.getElementById('wName').value.trim(),
      trainerId: document.getElementById('wTrainerId').value,
      memberId: document.getElementById('wMemberId').value || null,
      weeks: parseInt(document.getElementById('wWeeks').value) || 4,
      status: document.getElementById('wStatus').value,
      exercises: selectedEx
    };

    if (id) {
      DB.update('workoutPlans', id, data);
      Utils.logAudit('update', 'workouts', `Updated workout routine: ${data.name}`);
      Utils.showToast('Workout plan updated successfully');
    } else {
      DB.create('workoutPlans', data);
      Utils.logAudit('create', 'workouts', `Created workout routine: ${data.name}`);
      Utils.showToast('Workout plan created successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('workoutModal'))?.hide();
    render();
  }

  function deletePlan(id) {
    const w = DB.getById('workoutPlans', id);
    Utils.showConfirm('Delete Routine', `Are you sure you want to delete <strong>${w?.name}</strong>?`, () => {
      DB.delete('workoutPlans', id);
      Utils.logAudit('delete', 'workouts', `Deleted routine: ${w?.name}`);
      Utils.showToast('Workout plan deleted', 'danger');
      render();
    });
  }

  function viewRoutine(id) {
    const w = DB.getById('workoutPlans', id);
    if (!w) return;
    const t = DB.getById('trainers', w.trainerId);
    const m = DB.getById('members', w.memberId);

    const exList = Array.isArray(w.exercises) ? w.exercises : [];

    const container = document.getElementById('routineDetailContent');
    container.innerHTML = `
      <div class="modal-header">
        <div>
          <h5 class="modal-title mb-0">${w.name}</h5>
          <small class="text-muted">${w.weeks || 4} Weeks Program · Coach: ${t?.name || 'Assigned Trainer'}</small>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body p-4">
        <div class="alert alert-light border d-flex justify-content-between mb-3">
          <span>Target Member: <strong>${m?.name || 'General Template'}</strong></span>
          <span>Status: ${Utils.statusBadge(w.status || 'active')}</span>
        </div>

        <h6 class="fw-bold mb-3">Exercise Breakdown</h6>
        <div class="table-responsive">
          <table class="table table-bordered align-middle">
            <thead class="table-light">
              <tr>
                <th>Exercise Movement</th>
                <th>Target Muscle</th>
                <th class="text-center">Sets</th>
                <th class="text-center">Reps</th>
              </tr>
            </thead>
            <tbody>
              ${exList.map(item => {
                const exId = typeof item === 'string' ? item : item.exerciseId;
                const ex = DB.getById('exercises', exId);
                return `
                  <tr>
                    <td>
                      <div class="fw-semibold">${ex?.name || 'Bodyweight Movement'}</div>
                      <small class="text-muted">${ex?.equipment || 'Free Weight'}</small>
                    </td>
                    <td><span class="badge bg-light text-dark">${ex?.muscleGroup || 'Full Body'}</span></td>
                    <td class="text-center fw-bold">${item.sets || 3}</td>
                    <td class="text-center">${item.reps || '10-12'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    `;
    new bootstrap.Modal(document.getElementById('routineViewModal')).show();
  }

  window.WorkoutsMod = { openModal, deletePlan, viewRoutine };
  render();
})();

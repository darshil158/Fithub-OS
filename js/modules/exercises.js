/* ============================================================
   FitHub OS — Exercise Library Module
   ============================================================ */
(function () {
  'use strict';

  App.init('exercises', [{ label: 'Exercise Library' }]);
  const content = App.getContent();
  const MODULE = 'exercises';
  let currentPage = 1;
  let searchQuery = '';
  let filterCategory = '';
  let filterMuscle = '';
  let sortField = 'name';
  let sortDir = 'asc';

  function render() {
    let items = DB.getAll('exercises');

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['name', 'category', 'muscleGroup', 'equipment']);
    // Filters
    if (filterCategory) items = items.filter(e => e.category === filterCategory);
    if (filterMuscle) items = items.filter(e => e.muscleGroup === filterMuscle);

    const categories = Array.from(new Set(DB.getAll('exercises').map(e => e.category).filter(Boolean)));
    const muscles = Array.from(new Set(DB.getAll('exercises').map(e => e.muscleGroup).filter(Boolean)));

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 12);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-lightning me-2"></i>Exercise Library</h1>
          <div class="subtitle">Curated movement database, muscle anatomy tags, and equipment instructions</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="ExercisesMod.exportData()"><i class="bi bi-download me-1"></i>Export</button>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="ExercisesMod.openModal()"><i class="bi bi-plus-lg me-1"></i>Add Exercise</button>' : ''}
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search exercise or muscle..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterCategory">
              <option value="">All Categories</option>
              ${categories.map(c => `<option value="${c}" ${filterCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
            <select class="form-select" id="filterMuscle">
              <option value="">All Muscle Groups</option>
              ${muscles.map(m => `<option value="${m}" ${filterMuscle === m ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th class="sortable" data-field="name">Exercise</th>
                <th class="sortable" data-field="category">Category</th>
                <th class="sortable" data-field="muscleGroup">Target Muscle</th>
                <th>Equipment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(e => `
                <tr>
                  <td>
                    <div class="fw-semibold text-dark"><i class="bi bi-activity text-primary me-2"></i>${e.name}</div>
                  </td>
                  <td><span class="badge bg-primary-subtle text-primary">${e.category || 'Strength'}</span></td>
                  <td><span class="badge bg-light text-dark">${e.muscleGroup || 'Full Body'}</span></td>
                  <td><small class="text-muted"><i class="bi bi-wrench-adjustable me-1"></i>${e.equipment || 'None'}</small></td>
                  <td>
                    <div class="d-flex gap-1">
                      ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="ExercisesMod.openModal('${e.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                      ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="ExercisesMod.deleteExercise('${e.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-lightning', 'No exercises found', 'Add movements to your workout builder library.', Permissions.canCreate(MODULE) ? 'Add Exercise' : '')}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModal() {
    return `
    <div class="modal fade" id="exerciseModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exerciseModalTitle">Add Exercise</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="exerciseForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="exerciseId">
              <div class="mb-3">
                <label class="form-label">Exercise Name *</label>
                <input type="text" class="form-control" id="exName" placeholder="e.g. Incline Dumbbell Press" required>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Category *</label>
                  <select class="form-select" id="exCategory" required>
                    <option value="Strength">Strength</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Core">Core</option>
                    <option value="Bodyweight">Bodyweight</option>
                    <option value="Plyometric">Plyometric</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Target Muscle *</label>
                  <select class="form-select" id="exMuscle" required>
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Legs">Legs</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Arms">Arms</option>
                    <option value="Core">Core</option>
                    <option value="Full Body">Full Body</option>
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Required Equipment</label>
                <input type="text" class="form-control" id="exEquip" placeholder="e.g. Dumbbell, Barbell, Cable, Bodyweight">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Exercise</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterCategory')?.addEventListener('change', e => { filterCategory = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterMuscle')?.addEventListener('change', e => { filterMuscle = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('exerciseForm')?.addEventListener('submit', saveExercise);
  }

  function openModal(id) {
    const form = document.getElementById('exerciseForm');
    Utils.resetForm(form);

    if (id) {
      const e = DB.getById('exercises', id);
      if (!e) return;
      document.getElementById('exerciseModalTitle').textContent = 'Edit Exercise';
      document.getElementById('exerciseId').value = e.id;
      document.getElementById('exName').value = e.name || '';
      document.getElementById('exCategory').value = e.category || 'Strength';
      document.getElementById('exMuscle').value = e.muscleGroup || 'Chest';
      document.getElementById('exEquip').value = e.equipment || '';
    } else {
      document.getElementById('exerciseModalTitle').textContent = 'Add Exercise';
    }
    new bootstrap.Modal(document.getElementById('exerciseModal')).show();
  }

  function saveExercise(e) {
    e.preventDefault();
    const form = document.getElementById('exerciseForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('exerciseId').value;
    const data = {
      name: document.getElementById('exName').value.trim(),
      category: document.getElementById('exCategory').value,
      muscleGroup: document.getElementById('exMuscle').value,
      equipment: document.getElementById('exEquip').value.trim() || 'Bodyweight'
    };

    if (id) {
      DB.update('exercises', id, data);
      Utils.showToast('Exercise updated successfully');
    } else {
      DB.create('exercises', data);
      Utils.showToast('Exercise added successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('exerciseModal'))?.hide();
    render();
  }

  function deleteExercise(id) {
    const e = DB.getById('exercises', id);
    Utils.showConfirm('Delete Exercise', `Are you sure you want to delete <strong>${e?.name}</strong>?`, () => {
      DB.delete('exercises', id);
      Utils.showToast('Exercise deleted', 'danger');
      render();
    });
  }

  function exportData() {
    const items = DB.getAll('exercises');
    Utils.exportToCSV(items, 'exercises.csv');
    Utils.showToast('Exercises exported to CSV');
  }

  window.ExercisesMod = { openModal, deleteExercise, exportData };
  render();
})();

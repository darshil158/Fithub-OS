/* ============================================================
   FitHub OS — Trainers Management Module
   ============================================================ */
(function () {
  'use strict';

  App.init('trainers', [{ label: 'Trainers' }]);
  const content = App.getContent();
  const MODULE = 'trainers';
  let currentPage = 1;
  let searchQuery = '';
  let filterGym = '';
  let filterBranch = '';
  let filterSpecialization = '';
  let sortField = 'name';
  let sortDir = 'asc';

  function render() {
    let items = App.getFilteredData('trainers');
    const gyms = DB.getAll('gyms');
    const branches = DB.getAll('branches');

    // Collect specializations
    const specializations = Array.from(new Set(items.map(t => t.specialization).filter(Boolean)));

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['name', 'email', 'phone', 'specialization']);
    // Filters
    if (filterGym) items = items.filter(t => t.gymId === filterGym);
    if (filterBranch) items = items.filter(t => t.branchId === filterBranch);
    if (filterSpecialization) items = items.filter(t => t.specialization === filterSpecialization);
    // Sort
    items = Utils.sortItems(items, sortField, sortDir);

    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-person-badge me-2"></i>Trainers</h1>
          <div class="subtitle">Certified fitness instructors, personal trainers, and class leaders</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="TrainersMod.exportData()"><i class="bi bi-download me-1"></i>Export</button>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="TrainersMod.openModal()"><i class="bi bi-plus-lg me-1"></i>Add Trainer</button>' : ''}
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search trainers..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterGym">
              <option value="">All Gyms</option>
              ${gyms.map(g => `<option value="${g.id}" ${filterGym === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}
            </select>
            <select class="form-select" id="filterBranch">
              <option value="">All Branches</option>
              ${branches.filter(b => !filterGym || b.gymId === filterGym).map(b => `<option value="${b.id}" ${filterBranch === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
            </select>
            <select class="form-select" id="filterSpecialization">
              <option value="">All Specialties</option>
              ${specializations.map(s => `<option value="${s}" ${filterSpecialization === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th class="sortable" data-field="name">Trainer</th>
                <th>Specialization</th>
                <th>Branch</th>
                <th>Assigned Members</th>
                <th>Rating</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(t => {
                const branch = DB.getById('branches', t.branchId);
                const assignedCount = DB.count('workoutPlans', w => w.trainerId === t.id);
                return `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="topbar-avatar" style="background:${t.avatar || '#00B894'};width:36px;height:36px;font-size:13px">
                          ${Utils.capitalize(t.name ? t.name.charAt(0) : 'T')}
                        </div>
                        <div>
                          <div class="fw-semibold text-dark">${t.name}</div>
                          <small class="text-muted">${t.email || ''}</small>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge bg-primary-subtle text-primary">${t.specialization || 'General'}</span></td>
                    <td><span class="badge bg-light text-dark">${branch?.name || '—'}</span></td>
                    <td><span class="badge bg-secondary-subtle text-dark">${assignedCount} clients</span></td>
                    <td>
                      <span class="text-warning"><i class="bi bi-star-fill me-1"></i>${t.rating || '4.8'}</span>
                    </td>
                    <td>${Utils.statusBadge(t.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        <button class="btn btn-icon btn-sm btn-outline-info" onclick="TrainersMod.viewTrainer('${t.id}')" title="View"><i class="bi bi-eye"></i></button>
                        ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="TrainersMod.openModal('${t.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="TrainersMod.deleteTrainer('${t.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-person-badge', 'No trainers found', 'Add personal trainers to assign workouts and classes.', Permissions.canCreate(MODULE) ? 'Add Trainer' : '')}
      </div>

      ${renderModals()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModals() {
    const gyms = DB.getAll('gyms');
    const branches = DB.getAll('branches');

    return `
    <div class="modal fade" id="trainerModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="trainerModalTitle">Add Trainer</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="trainerForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="trainerId">
              <div class="mb-3">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-control" id="trainerName" required>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Email Address *</label>
                  <input type="email" class="form-control" id="trainerEmail" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone *</label>
                  <input type="tel" class="form-control" id="trainerPhone" required>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Specialization *</label>
                <input type="text" class="form-control" id="trainerSpec" placeholder="e.g. Strength Training, Yoga, HIIT" required>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Gym *</label>
                  <select class="form-select" id="trainerGymId" required>
                    <option value="">Select Gym</option>
                    ${gyms.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Branch *</label>
                  <select class="form-select" id="trainerBranchId" required>
                    <option value="">Select Branch</option>
                    ${branches.map(b => `<option value="${b.id}" data-gym="${b.gymId}">${b.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="trainerStatus">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Rating</label>
                  <input type="number" step="0.1" min="1" max="5" class="form-control" id="trainerRating" value="4.9">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Trainer</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Trainer View Modal -->
    <div class="modal fade" id="trainerViewModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content" id="trainerDetailContent"></div>
      </div>
    </div>
    `;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterGym')?.addEventListener('change', e => { filterGym = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterBranch')?.addEventListener('change', e => { filterBranch = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterSpecialization')?.addEventListener('change', e => { filterSpecialization = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('trainerForm')?.addEventListener('submit', saveTrainer);

    document.getElementById('trainerGymId')?.addEventListener('change', (e) => {
      const gId = e.target.value;
      const bSel = document.getElementById('trainerBranchId');
      Array.from(bSel.options).forEach(opt => {
        if (!opt.value) return;
        opt.style.display = (!gId || opt.dataset.gym === gId) ? '' : 'none';
      });
    });
  }

  function openModal(id) {
    const form = document.getElementById('trainerForm');
    Utils.resetForm(form);
    const gymId = Auth.getSelectedGym() || '';
    const branchId = Auth.getSelectedBranch() || '';

    if (id) {
      const t = DB.getById('trainers', id);
      if (!t) return;
      document.getElementById('trainerModalTitle').textContent = 'Edit Trainer';
      document.getElementById('trainerId').value = t.id;
      document.getElementById('trainerName').value = t.name || '';
      document.getElementById('trainerEmail').value = t.email || '';
      document.getElementById('trainerPhone').value = t.phone || '';
      document.getElementById('trainerSpec').value = t.specialization || '';
      document.getElementById('trainerGymId').value = t.gymId || gymId;
      document.getElementById('trainerBranchId').value = t.branchId || branchId;
      document.getElementById('trainerStatus').value = t.status || 'active';
      document.getElementById('trainerRating').value = t.rating || 4.8;
    } else {
      document.getElementById('trainerModalTitle').textContent = 'Add Trainer';
      document.getElementById('trainerGymId').value = gymId;
      document.getElementById('trainerBranchId').value = branchId;
    }
    new bootstrap.Modal(document.getElementById('trainerModal')).show();
  }

  function saveTrainer(e) {
    e.preventDefault();
    const form = document.getElementById('trainerForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('trainerId').value;
    const data = {
      name: document.getElementById('trainerName').value.trim(),
      email: document.getElementById('trainerEmail').value.trim(),
      phone: document.getElementById('trainerPhone').value.trim(),
      specialization: document.getElementById('trainerSpec').value.trim(),
      gymId: document.getElementById('trainerGymId').value,
      branchId: document.getElementById('trainerBranchId').value,
      status: document.getElementById('trainerStatus').value,
      rating: parseFloat(document.getElementById('trainerRating').value) || 4.8
    };

    if (id) {
      DB.update('trainers', id, data);
      Utils.logAudit('update', 'trainers', `Updated trainer: ${data.name}`);
      Utils.showToast('Trainer updated successfully');
    } else {
      data.avatar = '#00B894';
      DB.create('trainers', data);
      Utils.logAudit('create', 'trainers', `Added trainer: ${data.name}`);
      Utils.showToast('Trainer added successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('trainerModal'))?.hide();
    render();
  }

  function deleteTrainer(id) {
    const t = DB.getById('trainers', id);
    Utils.showConfirm('Delete Trainer', `Are you sure you want to delete trainer <strong>${t?.name}</strong>?`, () => {
      DB.delete('trainers', id);
      Utils.logAudit('delete', 'trainers', `Deleted trainer: ${t?.name}`);
      Utils.showToast('Trainer deleted', 'danger');
      render();
    });
  }

  function viewTrainer(id) {
    const t = DB.getById('trainers', id);
    if (!t) return;
    const branch = DB.getById('branches', t.branchId);
    const classes = DB.query('classes', c => c.trainerId === t.id);
    const workouts = DB.query('workoutPlans', w => w.trainerId === t.id);

    const container = document.getElementById('trainerDetailContent');
    container.innerHTML = `
      <div class="modal-header">
        <h5 class="modal-title">${t.name}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="topbar-avatar" style="background:${t.avatar || '#00B894'};width:50px;height:50px;font-size:20px">
            ${Utils.capitalize(t.name.charAt(0))}
          </div>
          <div>
            <div class="fw-bold">${t.name}</div>
            <div class="text-muted">${t.specialization} · Rating: ⭐ ${t.rating || '4.9'}</div>
            <div class="text-muted small">${branch?.name || ''}</div>
          </div>
        </div>
        <hr>
        <h6>Assigned Classes (${classes.length})</h6>
        ${classes.length ? classes.map(c => `<div class="p-2 border rounded mb-2 d-flex justify-content-between"><span><strong>${c.name}</strong> (${c.schedule || 'Weekly'})</span><span class="badge bg-info">${c.capacity || 20} capacity</span></div>`).join('') : '<p class="text-muted small">No classes scheduled.</p>'}
        <h6 class="mt-3">Assigned Workout Plans (${workouts.length})</h6>
        ${workouts.length ? workouts.map(w => `<span class="badge bg-primary me-2 mb-2 p-2">${w.name}</span>`).join('') : '<p class="text-muted small">No workout plans assigned.</p>'}
      </div>
    `;
    new bootstrap.Modal(document.getElementById('trainerViewModal')).show();
  }

  function exportData() {
    const items = App.getFilteredData('trainers');
    Utils.exportToCSV(items, 'trainers.csv');
    Utils.showToast('Trainers exported to CSV');
  }

  window.TrainersMod = { openModal, deleteTrainer, viewTrainer, exportData };
  render();
})();

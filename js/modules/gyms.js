/* ============================================================
   FitHub OS — Gyms Module (Full CRUD)
   ============================================================ */
(function () {
  'use strict';

  App.init('gyms', [{ label: 'Gyms' }]);
  const content = App.getContent();
  const MODULE = 'gyms';
  let currentPage = 1;
  let searchQuery = '';
  let filterStatus = '';
  let sortField = 'name';
  let sortDir = 'asc';

  function render() {
    let items = DB.getAll('gyms');

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['name', 'city', 'email']);
    // Filter
    if (filterStatus) items = items.filter(g => g.status === filterStatus);
    // Sort
    items = Utils.sortItems(items, sortField, sortDir);

    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div><h1><i class="bi bi-building me-2"></i>Gyms</h1><div class="subtitle">Manage all registered gym businesses</div></div>
        ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="GymsMod.openModal()"><i class="bi bi-plus-lg me-1"></i>Add Gym</button>' : ''}
      </div>
      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search gyms..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="active" ${filterStatus === 'active' ? 'selected' : ''}>Active</option>
              <option value="suspended" ${filterStatus === 'suspended' ? 'selected' : ''}>Suspended</option>
              <option value="inactive" ${filterStatus === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>
        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table">
            <thead><tr>
              <th class="sortable" data-field="name">Name</th>
              <th class="sortable" data-field="city">City</th>
              <th>Branches</th>
              <th>Members</th>
              <th>Owner</th>
              <th class="sortable" data-field="plan">Plan</th>
              <th class="sortable" data-field="status">Status</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>${pg.data.map(g => {
              const branchCount = DB.count('branches', b => b.gymId === g.id);
              const memberCount = DB.count('members', m => m.gymId === g.id);
              const owner = DB.getById('users', g.ownerId);
              return `<tr>
                <td><div class="fw-semibold">${g.name}</div><small class="text-muted">${g.email || ''}</small></td>
                <td>${g.city || '—'}</td>
                <td><span class="badge bg-light text-dark">${branchCount}</span></td>
                <td><span class="badge bg-light text-dark">${memberCount}</span></td>
                <td>${owner?.name || '—'}</td>
                <td><span class="badge bg-primary">${Utils.titleCase(g.plan || 'starter')}</span></td>
                <td>${Utils.statusBadge(g.status)}</td>
                <td>
                  <div class="d-flex gap-1">
                    ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="GymsMod.openModal('${g.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                    ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="GymsMod.deleteGym('${g.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                  </div>
                </td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-building', 'No gyms found', 'Add your first gym to get started.', Permissions.canCreate(MODULE) ? 'Add Gym' : '')}
      </div>
      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModal() {
    return `
    <div class="modal fade" id="gymModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="gymModalTitle">Add Gym</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="gymForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="gymId">
              <div class="mb-3"><label class="form-label">Gym Name *</label><input type="text" class="form-control" id="gymName" required></div>
              <div class="row g-3">
                <div class="col-md-6 mb-3"><label class="form-label">Email</label><input type="email" class="form-control" id="gymEmail"></div>
                <div class="col-md-6 mb-3"><label class="form-label">Phone</label><input type="tel" class="form-control" id="gymPhone"></div>
              </div>
              <div class="mb-3"><label class="form-label">Address</label><input type="text" class="form-control" id="gymAddress"></div>
              <div class="row g-3">
                <div class="col-md-6 mb-3"><label class="form-label">City</label><input type="text" class="form-control" id="gymCity"></div>
                <div class="col-md-6 mb-3"><label class="form-label">Plan</label>
                  <select class="form-select" id="gymPlan"><option value="starter">Starter</option><option value="professional">Professional</option><option value="enterprise">Enterprise</option></select>
                </div>
              </div>
              <div class="mb-3"><label class="form-label">Status</label>
                <select class="form-select" id="gymStatus"><option value="active">Active</option><option value="suspended">Suspended</option><option value="inactive">Inactive</option></select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="gymSaveBtn">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
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
    document.getElementById('gymForm')?.addEventListener('submit', saveGym);
  }

  function openModal(id) {
    const form = document.getElementById('gymForm');
    Utils.resetForm(form);
    if (id) {
      const g = DB.getById('gyms', id);
      if (!g) return;
      document.getElementById('gymModalTitle').textContent = 'Edit Gym';
      document.getElementById('gymId').value = g.id;
      document.getElementById('gymName').value = g.name;
      document.getElementById('gymEmail').value = g.email || '';
      document.getElementById('gymPhone').value = g.phone || '';
      document.getElementById('gymAddress').value = g.address || '';
      document.getElementById('gymCity').value = g.city || '';
      document.getElementById('gymPlan').value = g.plan || 'starter';
      document.getElementById('gymStatus').value = g.status || 'active';
    } else {
      document.getElementById('gymModalTitle').textContent = 'Add Gym';
    }
    new bootstrap.Modal(document.getElementById('gymModal')).show();
  }

  function saveGym(e) {
    e.preventDefault();
    const form = document.getElementById('gymForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('gymId').value;
    const data = {
      name: document.getElementById('gymName').value.trim(),
      email: document.getElementById('gymEmail').value.trim(),
      phone: document.getElementById('gymPhone').value.trim(),
      address: document.getElementById('gymAddress').value.trim(),
      city: document.getElementById('gymCity').value.trim(),
      plan: document.getElementById('gymPlan').value,
      status: document.getElementById('gymStatus').value,
      ownerId: Auth.getCurrentUser().id
    };

    if (id) {
      DB.update('gyms', id, data);
      Utils.logAudit('update', 'gyms', `Updated gym: ${data.name}`);
      Utils.showToast('Gym updated successfully');
    } else {
      DB.create('gyms', data);
      Utils.logAudit('create', 'gyms', `Created gym: ${data.name}`);
      Utils.showToast('Gym created successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('gymModal'))?.hide();
    render();
  }

  function deleteGym(id) {
    const g = DB.getById('gyms', id);
    Utils.showConfirm('Delete Gym', `Are you sure you want to delete <strong>${g?.name}</strong>? This action cannot be undone.`, () => {
      DB.delete('gyms', id);
      Utils.logAudit('delete', 'gyms', `Deleted gym: ${g?.name}`);
      Utils.showToast('Gym deleted', 'danger');
      render();
    });
  }

  // Expose for inline handlers
  window.GymsMod = { openModal, deleteGym };

  render();
})();

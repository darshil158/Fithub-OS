/* ============================================================
   FitHub OS — Branches Module (Full CRUD)
   ============================================================ */
(function () {
  'use strict';

  App.init('branches', [{ label: 'Branches' }]);
  const content = App.getContent();
  const MODULE = 'branches';
  let currentPage = 1;
  let searchQuery = '';
  let filterGym = '';
  let filterStatus = '';
  let sortField = 'name';
  let sortDir = 'asc';

  function render() {
    let items = App.getFilteredData('branches');
    const gyms = DB.getAll('gyms');

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['name', 'address', 'city', 'phone']);
    // Filter gym
    if (filterGym) items = items.filter(b => b.gymId === filterGym);
    // Filter status
    if (filterStatus) items = items.filter(b => b.status === filterStatus);
    // Sort
    items = Utils.sortItems(items, sortField, sortDir);

    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-geo-alt me-2"></i>Branches</h1>
          <div class="subtitle">Manage physical gym branches, facilities, and branch managers</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="BranchesMod.exportData()"><i class="bi bi-download me-1"></i>Export</button>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="BranchesMod.openModal()"><i class="bi bi-plus-lg me-1"></i>Add Branch</button>' : ''}
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search branches..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterGym">
              <option value="">All Gyms</option>
              ${gyms.map(g => `<option value="${g.id}" ${filterGym === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}
            </select>
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="active" ${filterStatus === 'active' ? 'selected' : ''}>Active</option>
              <option value="inactive" ${filterStatus === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th class="sortable" data-field="name">Branch Name</th>
                <th>Gym</th>
                <th class="sortable" data-field="city">City</th>
                <th>Manager</th>
                <th>Capacity</th>
                <th>Members</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(b => {
                const gym = DB.getById('gyms', b.gymId);
                const manager = DB.getById('users', b.managerId) || DB.getById('staff', b.managerId);
                const memberCount = DB.count('members', m => m.branchId === b.id);
                return `
                  <tr>
                    <td>
                      <div class="fw-semibold">${b.name}</div>
                      <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${b.address || '—'}</small>
                    </td>
                    <td><span class="badge bg-light text-dark">${gym?.name || '—'}</span></td>
                    <td>${b.city || '—'}</td>
                    <td>${manager?.name || '<span class="text-muted">Unassigned</span>'}</td>
                    <td>${b.capacity || 200}</td>
                    <td><span class="badge bg-primary-subtle text-primary">${memberCount}</span></td>
                    <td>${Utils.statusBadge(b.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="BranchesMod.openModal('${b.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="BranchesMod.deleteBranch('${b.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-geo-alt', 'No branches found', 'Get started by creating your first branch.', Permissions.canCreate(MODULE) ? 'Add Branch' : '')}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModal() {
    const gyms = DB.getAll('gyms');
    const managers = DB.query('users', u => ['branch_manager', 'staff'].includes(u.role));

    return `
    <div class="modal fade" id="branchModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="branchModalTitle">Add Branch</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="branchForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="branchId">
              <div class="mb-3">
                <label class="form-label">Parent Gym *</label>
                <select class="form-select" id="branchGymId" required>
                  <option value="">Select Gym</option>
                  ${gyms.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Branch Name *</label>
                <input type="text" class="form-control" id="branchName" placeholder="e.g. Bandra West Club" required>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">City *</label>
                  <input type="text" class="form-control" id="branchCity" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone</label>
                  <input type="tel" class="form-control" id="branchPhone">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Full Address</label>
                <input type="text" class="form-control" id="branchAddress" placeholder="Street, landmark, pincode">
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Branch Manager</label>
                  <select class="form-select" id="branchManagerId">
                    <option value="">Select Manager</option>
                    ${managers.map(m => `<option value="${m.id}">${m.name} (${Utils.titleCase(m.role)})</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Member Capacity</label>
                  <input type="number" class="form-control" id="branchCapacity" value="250" min="10">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Status</label>
                <select class="form-select" id="branchStatus">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Branch</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterGym')?.addEventListener('change', e => { filterGym = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterStatus')?.addEventListener('change', e => { filterStatus = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('branchForm')?.addEventListener('submit', saveBranch);
  }

  function openModal(id) {
    const form = document.getElementById('branchForm');
    Utils.resetForm(form);
    if (id) {
      const b = DB.getById('branches', id);
      if (!b) return;
      document.getElementById('branchModalTitle').textContent = 'Edit Branch';
      document.getElementById('branchId').value = b.id;
      document.getElementById('branchGymId').value = b.gymId || '';
      document.getElementById('branchName').value = b.name || '';
      document.getElementById('branchCity').value = b.city || '';
      document.getElementById('branchPhone').value = b.phone || '';
      document.getElementById('branchAddress').value = b.address || '';
      document.getElementById('branchManagerId').value = b.managerId || '';
      document.getElementById('branchCapacity').value = b.capacity || 200;
      document.getElementById('branchStatus').value = b.status || 'active';
    } else {
      document.getElementById('branchModalTitle').textContent = 'Add Branch';
      const selectedGym = Auth.getSelectedGym();
      if (selectedGym) document.getElementById('branchGymId').value = selectedGym;
    }
    new bootstrap.Modal(document.getElementById('branchModal')).show();
  }

  function saveBranch(e) {
    e.preventDefault();
    const form = document.getElementById('branchForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('branchId').value;
    const data = {
      gymId: document.getElementById('branchGymId').value,
      name: document.getElementById('branchName').value.trim(),
      city: document.getElementById('branchCity').value.trim(),
      phone: document.getElementById('branchPhone').value.trim(),
      address: document.getElementById('branchAddress').value.trim(),
      managerId: document.getElementById('branchManagerId').value || null,
      capacity: parseInt(document.getElementById('branchCapacity').value) || 200,
      status: document.getElementById('branchStatus').value
    };

    if (id) {
      DB.update('branches', id, data);
      Utils.logAudit('update', 'branches', `Updated branch: ${data.name}`);
      Utils.showToast('Branch updated successfully');
    } else {
      DB.create('branches', data);
      Utils.logAudit('create', 'branches', `Created branch: ${data.name}`);
      Utils.showToast('Branch created successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('branchModal'))?.hide();
    render();
  }

  function deleteBranch(id) {
    const b = DB.getById('branches', id);
    Utils.showConfirm('Delete Branch', `Are you sure you want to delete branch <strong>${b?.name}</strong>?`, () => {
      DB.delete('branches', id);
      Utils.logAudit('delete', 'branches', `Deleted branch: ${b?.name}`);
      Utils.showToast('Branch deleted', 'danger');
      render();
    });
  }

  function exportData() {
    const items = App.getFilteredData('branches');
    Utils.exportToCSV(items, 'branches.csv');
    Utils.showToast('Branches exported to CSV');
  }

  window.BranchesMod = { openModal, deleteBranch, exportData };
  render();
})();

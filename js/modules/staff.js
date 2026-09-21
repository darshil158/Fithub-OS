/* ============================================================
   FitHub OS — Staff Management Module
   ============================================================ */
(function () {
  'use strict';

  App.init('staff', [{ label: 'Staff' }]);
  const content = App.getContent();
  const MODULE = 'staff';
  let currentPage = 1;
  let searchQuery = '';
  let filterGym = '';
  let filterBranch = '';
  let filterRole = '';
  let sortField = 'name';
  let sortDir = 'asc';

  function render() {
    let items = App.getFilteredData('staff');
    const gyms = DB.getAll('gyms');
    const branches = DB.getAll('branches');

    // Collect roles
    const roles = Array.from(new Set(items.map(s => s.role).filter(Boolean)));

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['name', 'email', 'phone', 'role']);
    // Filters
    if (filterGym) items = items.filter(s => s.gymId === filterGym);
    if (filterBranch) items = items.filter(s => s.branchId === filterBranch);
    if (filterRole) items = items.filter(s => s.role === filterRole);
    // Sort
    items = Utils.sortItems(items, sortField, sortDir);

    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-person-gear me-2"></i>Staff</h1>
          <div class="subtitle">Manage reception, operations, housekeeping, and facility employees</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="StaffMod.exportData()"><i class="bi bi-download me-1"></i>Export</button>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="StaffMod.openModal()"><i class="bi bi-plus-lg me-1"></i>Add Staff Member</button>' : ''}
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search staff members..." id="searchInput" value="${searchQuery}">
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
            <select class="form-select" id="filterRole">
              <option value="">All Roles</option>
              ${roles.map(r => `<option value="${r}" ${filterRole === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th class="sortable" data-field="name">Employee</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Shift</th>
                <th>Monthly Salary</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(s => {
                const branch = DB.getById('branches', s.branchId);
                return `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="topbar-avatar" style="background:#74B9FF;width:36px;height:36px;font-size:13px">
                          ${Utils.capitalize(s.name ? s.name.charAt(0) : 'S')}
                        </div>
                        <div>
                          <div class="fw-semibold text-dark">${s.name}</div>
                          <small class="text-muted">${Utils.formatPhone(s.phone)}</small>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge bg-secondary-subtle text-dark">${s.role || 'Staff'}</span></td>
                    <td><span class="badge bg-light text-dark">${branch?.name || '—'}</span></td>
                    <td><i class="bi bi-clock me-1 text-muted"></i>${s.shift || 'Morning'}</td>
                    <td>${Utils.formatCurrency(s.salary || 25000)}</td>
                    <td>${Utils.statusBadge(s.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="StaffMod.openModal('${s.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="StaffMod.deleteStaff('${s.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-person-gear', 'No staff found', 'Add facility staff, receptionists, or cleaners.', Permissions.canCreate(MODULE) ? 'Add Staff' : '')}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModal() {
    const gyms = DB.getAll('gyms');
    const branches = DB.getAll('branches');

    return `
    <div class="modal fade" id="staffModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="staffModalTitle">Add Staff Member</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="staffForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="staffId">
              <div class="mb-3">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-control" id="staffName" required>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Email Address *</label>
                  <input type="email" class="form-control" id="staffEmail" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone *</label>
                  <input type="tel" class="form-control" id="staffPhone" required>
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Role Designation *</label>
                  <select class="form-select" id="staffRole" required>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Front Desk Associate">Front Desk Associate</option>
                    <option value="Floor Manager">Floor Manager</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Security Officer">Security Officer</option>
                    <option value="Equipment Tech">Equipment Tech</option>
                    <option value="Nutritionist">Nutritionist</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Shift Timing</label>
                  <select class="form-select" id="staffShift">
                    <option value="Morning (6 AM - 2 PM)">Morning (6 AM - 2 PM)</option>
                    <option value="Evening (2 PM - 10 PM)">Evening (2 PM - 10 PM)</option>
                    <option value="Full Day (9 AM - 6 PM)">Full Day (9 AM - 6 PM)</option>
                    <option value="Night (10 PM - 6 AM)">Night (10 PM - 6 AM)</option>
                  </select>
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Gym *</label>
                  <select class="form-select" id="staffGymId" required>
                    <option value="">Select Gym</option>
                    ${gyms.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Branch *</label>
                  <select class="form-select" id="staffBranchId" required>
                    <option value="">Select Branch</option>
                    ${branches.map(b => `<option value="${b.id}" data-gym="${b.gymId}">${b.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Salary (${Utils.getCurrencySymbol()}/month)</label>
                  <input type="number" class="form-control" id="staffSalary" value="${Math.round(Utils.convertCurrency(25000))}">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="staffStatus">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Employee</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterGym')?.addEventListener('change', e => { filterGym = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterBranch')?.addEventListener('change', e => { filterBranch = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterRole')?.addEventListener('change', e => { filterRole = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('staffForm')?.addEventListener('submit', saveStaff);

    document.getElementById('staffGymId')?.addEventListener('change', (e) => {
      const gId = e.target.value;
      const bSel = document.getElementById('staffBranchId');
      Array.from(bSel.options).forEach(opt => {
        if (!opt.value) return;
        opt.style.display = (!gId || opt.dataset.gym === gId) ? '' : 'none';
      });
    });
  }

  function openModal(id) {
    const form = document.getElementById('staffForm');
    Utils.resetForm(form);
    const gymId = Auth.getSelectedGym() || '';
    const branchId = Auth.getSelectedBranch() || '';

    if (id) {
      const s = DB.getById('staff', id);
      if (!s) return;
      document.getElementById('staffModalTitle').textContent = 'Edit Staff Member';
      document.getElementById('staffId').value = s.id;
      document.getElementById('staffName').value = s.name || '';
      document.getElementById('staffEmail').value = s.email || '';
      document.getElementById('staffPhone').value = s.phone || '';
      document.getElementById('staffRole').value = s.role || 'Receptionist';
      document.getElementById('staffShift').value = s.shift || 'Morning (6 AM - 2 PM)';
      document.getElementById('staffGymId').value = s.gymId || gymId;
      document.getElementById('staffBranchId').value = s.branchId || branchId;
      document.getElementById('staffSalary').value = Math.round(Utils.convertCurrency(s.salary !== undefined ? s.salary : 25000));
      document.getElementById('staffStatus').value = s.status || 'active';
    } else {
      document.getElementById('staffModalTitle').textContent = 'Add Staff Member';
      document.getElementById('staffGymId').value = gymId;
      document.getElementById('staffBranchId').value = branchId;
      document.getElementById('staffSalary').value = Math.round(Utils.convertCurrency(25000));
    }
    new bootstrap.Modal(document.getElementById('staffModal')).show();
  }

  function saveStaff(e) {
    e.preventDefault();
    const form = document.getElementById('staffForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('staffId').value;
    const data = {
      name: document.getElementById('staffName').value.trim(),
      email: document.getElementById('staffEmail').value.trim(),
      phone: document.getElementById('staffPhone').value.trim(),
      role: document.getElementById('staffRole').value,
      shift: document.getElementById('staffShift').value,
      gymId: document.getElementById('staffGymId').value,
      branchId: document.getElementById('staffBranchId').value,
      salary: Utils.toBaseCurrency(parseFloat(document.getElementById('staffSalary').value) || 0),
      status: document.getElementById('staffStatus').value
    };

    if (id) {
      DB.update('staff', id, data);
      Utils.logAudit('update', 'staff', `Updated staff member: ${data.name}`);
      Utils.showToast('Staff member updated successfully');
    } else {
      DB.create('staff', data);
      Utils.logAudit('create', 'staff', `Added staff member: ${data.name}`);
      Utils.showToast('Staff member added successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('staffModal'))?.hide();
    render();
  }

  function deleteStaff(id) {
    const s = DB.getById('staff', id);
    Utils.showConfirm('Delete Staff', `Are you sure you want to delete staff member <strong>${s?.name}</strong>?`, () => {
      DB.delete('staff', id);
      Utils.logAudit('delete', 'staff', `Deleted staff member: ${s?.name}`);
      Utils.showToast('Staff member deleted', 'danger');
      render();
    });
  }

  function exportData() {
    const items = App.getFilteredData('staff');
    Utils.exportToCSV(items, 'staff.csv');
    Utils.showToast('Staff exported to CSV');
  }

  window.StaffMod = { openModal, deleteStaff, exportData };
  render();
})();

/* ============================================================
   FitHub OS — Users & Account Management Module
   ============================================================ */
(function () {
  'use strict';

  App.init('users', [{ label: 'Users' }]);
  const content = App.getContent();
  const MODULE = 'users';
  let currentPage = 1;
  let searchQuery = '';
  let filterRole = '';
  let filterStatus = '';
  let sortField = 'name';
  let sortDir = 'asc';

  function render() {
    let items = DB.getAll('users');

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['name', 'email', 'role']);
    // Filter
    if (filterRole) items = items.filter(u => u.role === filterRole);
    if (filterStatus) items = items.filter(u => u.status === filterStatus);

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-shield-lock me-2"></i>Platform Users & Credentials</h1>
          <div class="subtitle">System login credentials, role assignments, and tenant administrative access</div>
        </div>
        <div class="d-flex gap-2">
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="UsersMod.openModal()"><i class="bi bi-person-plus me-1"></i>Create User</button>' : ''}
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search user name or email..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterRole">
              <option value="">All Roles</option>
              <option value="super_admin" ${filterRole === 'super_admin' ? 'selected' : ''}>Super Admin</option>
              <option value="gym_owner" ${filterRole === 'gym_owner' ? 'selected' : ''}>Gym Owner</option>
              <option value="branch_manager" ${filterRole === 'branch_manager' ? 'selected' : ''}>Branch Manager</option>
              <option value="trainer" ${filterRole === 'trainer' ? 'selected' : ''}>Trainer</option>
              <option value="staff" ${filterRole === 'staff' ? 'selected' : ''}>Staff</option>
              <option value="member" ${filterRole === 'member' ? 'selected' : ''}>Member</option>
            </select>
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="active" ${filterStatus === 'active' ? 'selected' : ''}>Active</option>
              <option value="suspended" ${filterStatus === 'suspended' ? 'selected' : ''}>Suspended</option>
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th class="sortable" data-field="name">User</th>
                <th>Role Designation</th>
                <th>Assigned Gym</th>
                <th>Assigned Branch</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(u => {
                const gym = DB.getById('gyms', u.gymId);
                const branch = DB.getById('branches', u.branchId);
                const currentUser = Auth.getCurrentUser();
                const isSelf = currentUser && currentUser.id === u.id;

                const roleColors = {
                  super_admin: 'danger',
                  gym_owner: 'primary',
                  branch_manager: 'info',
                  trainer: 'success',
                  staff: 'warning',
                  member: 'secondary'
                };
                const color = roleColors[u.role] || 'secondary';

                return `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="topbar-avatar" style="background:${u.avatar || 'var(--primary)'};width:36px;height:36px;font-size:13px">
                          ${Utils.capitalize(u.name ? u.name.charAt(0) : 'U')}
                        </div>
                        <div>
                          <div class="fw-semibold text-dark">
                            ${u.name} ${isSelf ? '<span class="badge bg-light text-dark ms-1">You</span>' : ''}
                          </div>
                          <small class="text-muted">${u.email || ''}</small>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge bg-${color}">${Permissions.getRoleLabel(u.role)}</span></td>
                    <td><span class="badge bg-light text-dark">${gym?.name || 'All Gyms'}</span></td>
                    <td><span class="badge bg-light text-dark">${branch?.name || 'All Branches'}</span></td>
                    <td>${Utils.statusBadge(u.status || 'active')}</td>
                    <td>
                      <div class="d-flex gap-1">
                        ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="UsersMod.openModal('${u.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                        ${Permissions.canDelete(MODULE) && !isSelf ? `
                          <button class="btn btn-icon btn-sm btn-outline-danger" onclick="UsersMod.deleteUser('${u.id}')" title="Delete"><i class="bi bi-trash"></i></button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-shield-lock', 'No users found', 'Create login user accounts.')}
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
    <div class="modal fade" id="userModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="userModalTitle">Add User</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="userForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="userId">
              <div class="mb-3">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-control" id="uName" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Email Address (Username) *</label>
                <input type="email" class="form-control" id="uEmail" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Role Assignment *</label>
                <select class="form-select" id="uRole" required>
                  <option value="super_admin">Super Admin (Platform Owner)</option>
                  <option value="gym_owner">Gym Owner (Business Owner)</option>
                  <option value="branch_manager">Branch Manager</option>
                  <option value="trainer">Fitness Trainer</option>
                  <option value="staff">Staff Associate</option>
                  <option value="member">Gym Member</option>
                </select>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Gym Association</label>
                  <select class="form-select" id="uGymId">
                    <option value="">Global / None</option>
                    ${gyms.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Branch Association</label>
                  <select class="form-select" id="uBranchId">
                    <option value="">All Branches</option>
                    ${branches.map(b => `<option value="${b.id}" data-gym="${b.gymId}">${b.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Status</label>
                <select class="form-select" id="uStatus">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save User</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterRole')?.addEventListener('change', e => { filterRole = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterStatus')?.addEventListener('change', e => { filterStatus = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('userForm')?.addEventListener('submit', saveUser);
  }

  function openModal(id) {
    const form = document.getElementById('userForm');
    Utils.resetForm(form);

    if (id) {
      const u = DB.getById('users', id);
      if (!u) return;
      document.getElementById('userModalTitle').textContent = 'Edit User';
      document.getElementById('userId').value = u.id;
      document.getElementById('uName').value = u.name || '';
      document.getElementById('uEmail').value = u.email || '';
      document.getElementById('uRole').value = u.role || 'member';
      document.getElementById('uGymId').value = u.gymId || '';
      document.getElementById('uBranchId').value = u.branchId || '';
      document.getElementById('uStatus').value = u.status || 'active';
    } else {
      document.getElementById('userModalTitle').textContent = 'Add User';
    }
    new bootstrap.Modal(document.getElementById('userModal')).show();
  }

  function saveUser(e) {
    e.preventDefault();
    const form = document.getElementById('userForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('userId').value;
    const data = {
      name: document.getElementById('uName').value.trim(),
      email: document.getElementById('uEmail').value.trim(),
      role: document.getElementById('uRole').value,
      gymId: document.getElementById('uGymId').value || null,
      branchId: document.getElementById('uBranchId').value || null,
      status: document.getElementById('uStatus').value
    };

    if (id) {
      DB.update('users', id, data);
      Utils.logAudit('update', 'users', `Updated user: ${data.name} (${data.role})`);
      Utils.showToast('User profile updated');
    } else {
      data.avatar = '#6C5CE7';
      DB.create('users', data);
      Utils.logAudit('create', 'users', `Created user: ${data.name} (${data.role})`);
      Utils.showToast('User created successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('userModal'))?.hide();
    render();
  }

  function deleteUser(id) {
    const u = DB.getById('users', id);
    Utils.showConfirm('Delete User', `Are you sure you want to delete user account <strong>${u?.name}</strong>?`, () => {
      DB.delete('users', id);
      Utils.logAudit('delete', 'users', `Deleted user: ${u?.name}`);
      Utils.showToast('User deleted', 'danger');
      render();
    });
  }

  window.UsersMod = { openModal, deleteUser };
  render();
})();

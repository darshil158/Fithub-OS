/* ============================================================
   FitHub OS — Members Management Module (Full CRUD + Profile)
   ============================================================ */
(function () {
  'use strict';

  App.init('members', [{ label: 'Members' }]);
  const content = App.getContent();
  const MODULE = 'members';
  let currentPage = 1;
  let searchQuery = '';
  let filterGym = '';
  let filterBranch = '';
  let filterStatus = '';
  let sortField = 'joinDate';
  let sortDir = 'desc';

  function render() {
    let items = App.getFilteredData('members');
    const gyms = DB.getAll('gyms');
    const branches = DB.getAll('branches');

    // Filter calculations
    const totalCount = items.length;
    const activeCount = items.filter(m => m.status === 'active').length;
    const frozenCount = items.filter(m => ['frozen', 'inactive', 'expired'].includes(m.status)).length;
    const currentMonth = new Date().toISOString().substring(0, 7);
    const newThisMonth = items.filter(m => (m.joinDate || '').startsWith(currentMonth)).length;

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['name', 'email', 'phone', 'memberCode']);
    // Filter gym
    if (filterGym) items = items.filter(m => m.gymId === filterGym);
    // Filter branch
    if (filterBranch) items = items.filter(m => m.branchId === filterBranch);
    // Filter status
    if (filterStatus) items = items.filter(m => m.status === filterStatus);
    // Sort
    items = Utils.sortItems(items, sortField, sortDir);

    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-people me-2"></i>Members</h1>
          <div class="subtitle">Manage member profiles, membership status, and activity records</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="MembersMod.exportData()"><i class="bi bi-download me-1"></i>Export</button>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="MembersMod.openModal()"><i class="bi bi-person-plus me-1"></i>Add Member</button>' : ''}
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon primary"><i class="bi bi-people"></i></div>
            <div class="kpi-label">Total Members</div>
            <div class="kpi-value">${totalCount}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="bi bi-check-circle"></i></div>
            <div class="kpi-label">Active Members</div>
            <div class="kpi-value">${activeCount}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon warning"><i class="bi bi-pause-circle"></i></div>
            <div class="kpi-label">Frozen / Inactive</div>
            <div class="kpi-value">${frozenCount}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon info"><i class="bi bi-person-plus"></i></div>
            <div class="kpi-label">New This Month</div>
            <div class="kpi-value">${newThisMonth}</div>
          </div>
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search by name, email, phone..." id="searchInput" value="${searchQuery}">
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
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="active" ${filterStatus === 'active' ? 'selected' : ''}>Active</option>
              <option value="frozen" ${filterStatus === 'frozen' ? 'selected' : ''}>Frozen</option>
              <option value="inactive" ${filterStatus === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th class="sortable" data-field="name">Member</th>
                <th>Contact</th>
                <th>Branch</th>
                <th>Active Plan</th>
                <th class="sortable" data-field="joinDate">Joined</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(m => {
                const branch = DB.getById('branches', m.branchId);
                const sub = DB.query('subscriptions', s => s.memberId === m.id && s.status === 'active')[0];
                const plan = sub ? DB.getById('membershipPlans', sub.planId) : null;
                return `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="topbar-avatar" style="background:${m.avatar || '#6C5CE7'};width:36px;height:36px;font-size:13px">
                          ${Utils.capitalize(m.name ? m.name.charAt(0) : 'M')}
                        </div>
                        <div>
                          <div class="fw-semibold text-dark">${m.name}</div>
                          <small class="text-muted">${m.gender || '—'}, ${m.age ? m.age + ' yrs' : '—'}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>${m.email || '—'}</div>
                      <small class="text-muted">${Utils.formatPhone(m.phone)}</small>
                    </td>
                    <td><span class="badge bg-light text-dark">${branch?.name || '—'}</span></td>
                    <td>${plan ? `<span class="badge bg-info-subtle text-info">${plan.name}</span>` : '<span class="text-muted">None</span>'}</td>
                    <td><small>${Utils.formatDate(m.joinDate)}</small></td>
                    <td>${Utils.statusBadge(m.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        <button class="btn btn-icon btn-sm btn-outline-info" onclick="MembersMod.viewDetails('${m.id}')" title="View Profile"><i class="bi bi-eye"></i></button>
                        ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="MembersMod.openModal('${m.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="MembersMod.deleteMember('${m.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-people', 'No members found', 'Try adjusting your filters or register a new member.', Permissions.canCreate(MODULE) ? 'Add Member' : '')}
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
    <!-- Add/Edit Modal -->
    <div class="modal fade" id="memberModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="memberModalTitle">Add Member</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="memberForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="memberId">
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Full Name *</label>
                  <input type="text" class="form-control" id="memberName" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email Address *</label>
                  <input type="email" class="form-control" id="memberEmail" required>
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Phone Number *</label>
                  <input type="tel" class="form-control" id="memberPhone" required>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Gender</label>
                  <select class="form-select" id="memberGender">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Age</label>
                  <input type="number" class="form-control" id="memberAge" min="12" max="100" value="28">
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Gym *</label>
                  <select class="form-select" id="memberGymId" required>
                    <option value="">Select Gym</option>
                    ${gyms.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Branch *</label>
                  <select class="form-select" id="memberBranchId" required>
                    <option value="">Select Branch</option>
                    ${branches.map(b => `<option value="${b.id}" data-gym="${b.gymId}">${b.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Emergency Contact Name</label>
                  <input type="text" class="form-control" id="memberEmergName">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Emergency Contact Phone</label>
                  <input type="tel" class="form-control" id="memberEmergPhone">
                </div>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Join Date</label>
                  <input type="date" class="form-control" id="memberJoinDate">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="memberStatus">
                    <option value="active">Active</option>
                    <option value="frozen">Frozen</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Member</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Member Profile View Modal -->
    <div class="modal fade" id="profileViewModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" id="profileModalContent">
          <!-- Populated dynamically -->
        </div>
      </div>
    </div>
    `;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterGym')?.addEventListener('change', e => { filterGym = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterBranch')?.addEventListener('change', e => { filterBranch = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterStatus')?.addEventListener('change', e => { filterStatus = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('memberForm')?.addEventListener('submit', saveMember);

    // Cascading gym -> branch in modal
    document.getElementById('memberGymId')?.addEventListener('change', (e) => {
      const gId = e.target.value;
      const branchSel = document.getElementById('memberBranchId');
      Array.from(branchSel.options).forEach(opt => {
        if (!opt.value) return;
        opt.style.display = (!gId || opt.dataset.gym === gId) ? '' : 'none';
      });
    });
  }

  function openModal(id) {
    const form = document.getElementById('memberForm');
    Utils.resetForm(form);
    const gymId = Auth.getSelectedGym() || '';
    const branchId = Auth.getSelectedBranch() || '';

    if (id) {
      const m = DB.getById('members', id);
      if (!m) return;
      document.getElementById('memberModalTitle').textContent = 'Edit Member';
      document.getElementById('memberId').value = m.id;
      document.getElementById('memberName').value = m.name || '';
      document.getElementById('memberEmail').value = m.email || '';
      document.getElementById('memberPhone').value = m.phone || '';
      document.getElementById('memberGender').value = m.gender || 'Male';
      document.getElementById('memberAge').value = m.age || 25;
      document.getElementById('memberGymId').value = m.gymId || gymId;
      document.getElementById('memberBranchId').value = m.branchId || branchId;
      document.getElementById('memberEmergName').value = m.emergencyContactName || '';
      document.getElementById('memberEmergPhone').value = m.emergencyContactPhone || '';
      document.getElementById('memberJoinDate').value = m.joinDate ? m.joinDate.substring(0, 10) : '';
      document.getElementById('memberStatus').value = m.status || 'active';
    } else {
      document.getElementById('memberModalTitle').textContent = 'Add Member';
      document.getElementById('memberGymId').value = gymId;
      document.getElementById('memberBranchId').value = branchId;
      document.getElementById('memberJoinDate').value = new Date().toISOString().substring(0, 10);
    }
    new bootstrap.Modal(document.getElementById('memberModal')).show();
  }

  function saveMember(e) {
    e.preventDefault();
    const form = document.getElementById('memberForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('memberId').value;
    const data = {
      name: document.getElementById('memberName').value.trim(),
      email: document.getElementById('memberEmail').value.trim(),
      phone: document.getElementById('memberPhone').value.trim(),
      gender: document.getElementById('memberGender').value,
      age: parseInt(document.getElementById('memberAge').value) || 25,
      gymId: document.getElementById('memberGymId').value,
      branchId: document.getElementById('memberBranchId').value,
      emergencyContactName: document.getElementById('memberEmergName').value.trim(),
      emergencyContactPhone: document.getElementById('memberEmergPhone').value.trim(),
      joinDate: document.getElementById('memberJoinDate').value || new Date().toISOString(),
      status: document.getElementById('memberStatus').value
    };

    if (id) {
      DB.update('members', id, data);
      Utils.logAudit('update', 'members', `Updated member: ${data.name}`);
      Utils.showToast('Member profile updated successfully');
    } else {
      data.avatar = '#6C5CE7';
      DB.create('members', data);
      Utils.logAudit('create', 'members', `Registered new member: ${data.name}`);
      Utils.showToast('Member registered successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('memberModal'))?.hide();
    render();
  }

  function deleteMember(id) {
    const m = DB.getById('members', id);
    Utils.showConfirm('Delete Member', `Are you sure you want to delete member <strong>${m?.name}</strong>? All associated records will remain for audit.`, () => {
      DB.delete('members', id);
      Utils.logAudit('delete', 'members', `Deleted member: ${m?.name}`);
      Utils.showToast('Member deleted', 'danger');
      render();
    });
  }

  function viewDetails(id) {
    const m = DB.getById('members', id);
    if (!m) return;
    const gym = DB.getById('gyms', m.gymId);
    const branch = DB.getById('branches', m.branchId);
    const subs = DB.query('subscriptions', s => s.memberId === m.id);
    const payments = DB.query('payments', p => p.memberId === m.id);
    const attendances = DB.query('attendance', a => a.memberId === m.id);
    const workouts = DB.query('workoutPlans', w => w.memberId === m.id);
    const diets = DB.query('dietPlans', d => d.memberId === m.id);

    const container = document.getElementById('profileModalContent');
    container.innerHTML = `
      <div class="modal-header">
        <div class="d-flex align-items-center gap-3">
          <div class="topbar-avatar" style="background:${m.avatar || '#6C5CE7'};width:48px;height:48px;font-size:18px">
            ${Utils.capitalize(m.name.charAt(0))}
          </div>
          <div>
            <h5 class="modal-title mb-0">${m.name}</h5>
            <small class="text-muted">${branch?.name || '—'} · ${gym?.name || '—'}</small>
          </div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body p-4">
        <div class="row g-3 mb-4">
          <div class="col-sm-4">
            <div class="p-3 bg-light rounded text-center">
              <div class="text-muted small">Status</div>
              <div class="mt-1">${Utils.statusBadge(m.status)}</div>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="p-3 bg-light rounded text-center">
              <div class="text-muted small">Total Check-ins</div>
              <div class="fs-5 fw-bold text-primary mt-1">${attendances.length}</div>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="p-3 bg-light rounded text-center">
              <div class="text-muted small">Total Spent</div>
              <div class="fs-5 fw-bold text-success mt-1">
                ${Utils.formatCurrency(payments.reduce((acc, p) => acc + (p.status === 'paid' ? p.amount : 0), 0))}
              </div>
            </div>
          </div>
        </div>

        <ul class="nav nav-tabs mb-3" id="profileTabs">
          <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#tabDetails">Personal Info</a></li>
          <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tabSubs">Subscriptions (${subs.length})</a></li>
          <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tabFitness">Fitness Plans</a></li>
        </ul>

        <div class="tab-content">
          <div class="tab-pane fade show active" id="tabDetails">
            <div class="row g-2">
              <div class="col-6"><small class="text-muted">Email:</small> <div>${m.email || '—'}</div></div>
              <div class="col-6"><small class="text-muted">Phone:</small> <div>${Utils.formatPhone(m.phone)}</div></div>
              <div class="col-6"><small class="text-muted">Age / Gender:</small> <div>${m.age || '—'} yrs / ${m.gender || '—'}</div></div>
              <div class="col-6"><small class="text-muted">Joined:</small> <div>${Utils.formatDate(m.joinDate)}</div></div>
              <div class="col-6"><small class="text-muted">Emergency Contact:</small> <div>${m.emergencyContactName || '—'}</div></div>
              <div class="col-6"><small class="text-muted">Emergency Phone:</small> <div>${m.emergencyContactPhone || '—'}</div></div>
            </div>
          </div>
          <div class="tab-pane fade" id="tabSubs">
            ${subs.length ? `
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead><tr><th>Plan</th><th>Period</th><th>Price</th><th>Status</th></tr></thead>
                  <tbody>
                    ${subs.map(s => {
                      const p = DB.getById('membershipPlans', s.planId);
                      return `<tr>
                        <td><strong>${p?.name || 'Standard'}</strong></td>
                        <td><small>${Utils.formatDate(s.startDate)} → ${Utils.formatDate(s.endDate)}</small></td>
                        <td>${Utils.formatCurrency(s.price || p?.price)}</td>
                        <td>${Utils.statusBadge(s.status)}</td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<p class="text-muted">No subscriptions found for this member.</p>'}
          </div>
          <div class="tab-pane fade" id="tabFitness">
            <h6>Workout Plans</h6>
            ${workouts.length ? workouts.map(w => `<div class="badge bg-primary me-2 mb-2 p-2">${w.name} (${w.weeks || 4} wks)</div>`).join('') : '<p class="text-muted small">No workout plans assigned.</p>'}
            <h6 class="mt-3">Diet Plans</h6>
            ${diets.length ? diets.map(d => `<div class="badge bg-success me-2 mb-2 p-2">${d.name} (${d.calories || 2000} kcal)</div>`).join('') : '<p class="text-muted small">No diet plans assigned.</p>'}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    `;

    new bootstrap.Modal(document.getElementById('profileViewModal')).show();
  }

  function exportData() {
    const items = App.getFilteredData('members');
    Utils.exportToCSV(items, 'members.csv');
    Utils.showToast('Members exported to CSV');
  }

  window.MembersMod = { openModal, deleteMember, viewDetails, exportData };
  render();
})();

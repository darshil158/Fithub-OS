/* ============================================================
   FitHub OS — CRM & Sales Leads Module
   ============================================================ */
(function () {
  'use strict';

  App.init('crm', [{ label: 'CRM Leads' }]);
  const content = App.getContent();
  const MODULE = 'crm';
  let currentPage = 1;
  let searchQuery = '';
  let filterStatus = '';
  let filterSource = '';
  let sortField = 'createdAt';
  let sortDir = 'desc';

  function render() {
    let items = App.getFilteredData('leads');
    const gyms = DB.getAll('gyms');

    // Metrics
    const totalLeads = items.length;
    const convertedCount = items.filter(l => l.status === 'converted').length;
    const conversionRate = totalLeads ? Math.round((convertedCount / totalLeads) * 100) : 0;
    const activePipeline = items.filter(l => ['new', 'contacted', 'trial_booked'].includes(l.status)).length;

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['name', 'phone', 'email', 'notes']);
    // Filter
    if (filterStatus) items = items.filter(l => l.status === filterStatus);
    if (filterSource) items = items.filter(l => l.source === filterSource);

    const sources = Array.from(new Set(DB.getAll('leads').map(l => l.source).filter(Boolean)));

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-funnel me-2"></i>Leads & Sales CRM</h1>
          <div class="subtitle">Capture inquiries, manage sales pipelines, trials, and member conversion</div>
        </div>
        <div class="d-flex gap-2">
          <a href="${Navigation.getUrl('followups')}" class="btn btn-outline-secondary"><i class="bi bi-telephone-outbound me-1"></i>Follow-ups</a>
          <button class="btn btn-outline-secondary" onclick="CrmMod.exportData()"><i class="bi bi-download me-1"></i>Export</button>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="CrmMod.openModal()"><i class="bi bi-plus-lg me-1"></i>New Lead</button>' : ''}
        </div>
      </div>

      <!-- CRM Metrics -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon primary"><i class="bi bi-people"></i></div>
            <div class="kpi-label">Total Inquiries</div>
            <div class="kpi-value">${totalLeads}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon warning"><i class="bi bi-hourglass-split"></i></div>
            <div class="kpi-label">Active Pipeline</div>
            <div class="kpi-value">${activePipeline}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="bi bi-person-check"></i></div>
            <div class="kpi-label">Converted Members</div>
            <div class="kpi-value text-success">${convertedCount}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon info"><i class="bi bi-graph-up-arrow"></i></div>
            <div class="kpi-label">Conversion Rate</div>
            <div class="kpi-value">${conversionRate}%</div>
          </div>
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search lead name or phone..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterStatus">
              <option value="">All Statuses</option>
              <option value="new" ${filterStatus === 'new' ? 'selected' : ''}>New Inquiry</option>
              <option value="contacted" ${filterStatus === 'contacted' ? 'selected' : ''}>Contacted</option>
              <option value="trial_booked" ${filterStatus === 'trial_booked' ? 'selected' : ''}>Trial Booked</option>
              <option value="converted" ${filterStatus === 'converted' ? 'selected' : ''}>Converted</option>
              <option value="lost" ${filterStatus === 'lost' ? 'selected' : ''}>Lost</option>
            </select>
            <select class="form-select" id="filterSource">
              <option value="">All Sources</option>
              ${sources.map(s => `<option value="${s}" ${filterSource === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th class="sortable" data-field="name">Lead Name</th>
                <th>Contact</th>
                <th>Source</th>
                <th>Assigned Staff</th>
                <th class="sortable" data-field="createdAt">Date</th>
                <th class="sortable" data-field="status">Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(l => {
                const staff = DB.getById('staff', l.assignedTo) || DB.getById('users', l.assignedTo);
                return `
                  <tr>
                    <td>
                      <div class="fw-semibold text-dark">${l.name}</div>
                      <small class="text-muted text-truncate d-inline-block" style="max-width:200px">${l.notes || 'Inquired about gym membership'}</small>
                    </td>
                    <td>
                      <div>${Utils.formatPhone(l.phone)}</div>
                      <small class="text-muted">${l.email || ''}</small>
                    </td>
                    <td><span class="badge bg-light text-dark"><i class="bi bi-tag me-1"></i>${l.source || 'Walk-in'}</span></td>
                    <td>${staff?.name || '<span class="text-muted">Unassigned</span>'}</td>
                    <td><small>${Utils.formatDate(l.createdAt)}</small></td>
                    <td>${Utils.statusBadge(l.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        ${l.status !== 'converted' ? `
                          <button class="btn btn-sm btn-outline-success" onclick="CrmMod.convertToMember('${l.id}')" title="Convert to Member"><i class="bi bi-person-check me-1"></i>Convert</button>
                        ` : ''}
                        ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="CrmMod.openModal('${l.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="CrmMod.deleteLead('${l.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-funnel', 'No leads found', 'Record walk-in inquiries and prospective members.', Permissions.canCreate(MODULE) ? 'New Lead' : '')}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModal() {
    const gyms = DB.getAll('gyms');
    const staffMembers = DB.getAll('staff');

    return `
    <div class="modal fade" id="leadModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="leadModalTitle">New Lead</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="leadForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="leadId">
              <div class="mb-3">
                <label class="form-label">Full Name *</label>
                <input type="text" class="form-control" id="leadName" required>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Phone Number *</label>
                  <input type="tel" class="form-control" id="leadPhone" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Email Address</label>
                  <input type="email" class="form-control" id="leadEmail">
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Lead Source</label>
                  <select class="form-select" id="leadSource">
                    <option value="Walk-in">Walk-in</option>
                    <option value="Website">Website</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Referral">Friend Referral</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Pipeline Stage</label>
                  <select class="form-select" id="leadStatus">
                    <option value="new">New Inquiry</option>
                    <option value="contacted">Contacted</option>
                    <option value="trial_booked">Trial Booked</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Gym *</label>
                  <select class="form-select" id="leadGymId" required>
                    ${gyms.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Assign Representative</label>
                  <select class="form-select" id="leadAssignedTo">
                    <option value="">Select Staff</option>
                    ${staffMembers.map(s => `<option value="${s.id}">${s.name} (${s.role})</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Inquiry Notes / Fitness Goals</label>
                <textarea class="form-control" id="leadNotes" rows="3" placeholder="Interested in weight loss, inquired about 6-month membership"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Lead</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterStatus')?.addEventListener('change', e => { filterStatus = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterSource')?.addEventListener('change', e => { filterSource = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('leadForm')?.addEventListener('submit', saveLead);
  }

  function openModal(id) {
    const form = document.getElementById('leadForm');
    Utils.resetForm(form);
    const gymId = Auth.getSelectedGym() || '';

    if (id) {
      const l = DB.getById('leads', id);
      if (!l) return;
      document.getElementById('leadModalTitle').textContent = 'Edit Lead';
      document.getElementById('leadId').value = l.id;
      document.getElementById('leadName').value = l.name || '';
      document.getElementById('leadPhone').value = l.phone || '';
      document.getElementById('leadEmail').value = l.email || '';
      document.getElementById('leadSource').value = l.source || 'Walk-in';
      document.getElementById('leadStatus').value = l.status || 'new';
      document.getElementById('leadGymId').value = l.gymId || gymId;
      document.getElementById('leadAssignedTo').value = l.assignedTo || '';
      document.getElementById('leadNotes').value = l.notes || '';
    } else {
      document.getElementById('leadModalTitle').textContent = 'New Lead';
      document.getElementById('leadGymId').value = gymId;
    }
    new bootstrap.Modal(document.getElementById('leadModal')).show();
  }

  function saveLead(e) {
    e.preventDefault();
    const form = document.getElementById('leadForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('leadId').value;
    const data = {
      name: document.getElementById('leadName').value.trim(),
      phone: document.getElementById('leadPhone').value.trim(),
      email: document.getElementById('leadEmail').value.trim(),
      source: document.getElementById('leadSource').value,
      status: document.getElementById('leadStatus').value,
      gymId: document.getElementById('leadGymId').value,
      assignedTo: document.getElementById('leadAssignedTo').value || null,
      notes: document.getElementById('leadNotes').value.trim()
    };

    if (id) {
      DB.update('leads', id, data);
      Utils.logAudit('update', 'crm', `Updated lead: ${data.name}`);
      Utils.showToast('Lead updated successfully');
    } else {
      data.createdAt = new Date().toISOString();
      DB.create('leads', data);
      Utils.logAudit('create', 'crm', `Created lead: ${data.name}`);
      Utils.showToast('Lead created successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('leadModal'))?.hide();
    render();
  }

  function convertToMember(id) {
    const l = DB.getById('leads', id);
    if (!l) return;

    Utils.showConfirm('Convert to Member', `Convert prospect <strong>${l.name}</strong> to a registered gym member?`, () => {
      // Create member
      const branches = DB.query('branches', b => b.gymId === l.gymId);
      const branchId = branches[0]?.id || 'branch-1';

      DB.create('members', {
        name: l.name,
        email: l.email || `${l.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        phone: l.phone,
        gymId: l.gymId,
        branchId: branchId,
        gender: 'Other',
        age: 26,
        joinDate: new Date().toISOString().substring(0, 10),
        status: 'active'
      });

      DB.update('leads', id, { status: 'converted' });
      Utils.logAudit('convert', 'crm', `Converted lead ${l.name} into an active member`);
      Utils.showToast(`${l.name} successfully converted to member!`, 'success');
      render();
    }, 'Confirm Conversion', 'btn-success');
  }

  function deleteLead(id) {
    const l = DB.getById('leads', id);
    Utils.showConfirm('Delete Lead', `Are you sure you want to delete lead <strong>${l?.name}</strong>?`, () => {
      DB.delete('leads', id);
      Utils.logAudit('delete', 'crm', `Deleted lead: ${l?.name}`);
      Utils.showToast('Lead deleted', 'danger');
      render();
    });
  }

  function exportData() {
    const items = App.getFilteredData('leads');
    Utils.exportToCSV(items, 'leads.csv');
    Utils.showToast('Leads exported to CSV');
  }

  window.CrmMod = { openModal, convertToMember, deleteLead, exportData };
  render();
})();

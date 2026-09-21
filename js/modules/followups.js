/* ============================================================
   FitHub OS — Sales Follow-ups Module
   ============================================================ */
(function () {
  'use strict';

  App.init('followups', [{ label: 'CRM', href: Navigation.getUrl('crm') }, { label: 'Follow-ups' }]);
  const content = App.getContent();
  const MODULE = 'followups';
  let currentPage = 1;
  let searchQuery = '';
  let filterStatus = '';
  let sortField = 'nextDate';
  let sortDir = 'asc';

  function render() {
    let items = DB.getAll('followUps');

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(f => {
        const l = DB.getById('leads', f.leadId);
        return (l?.name || '').toLowerCase().includes(q) || (f.notes || '').toLowerCase().includes(q);
      });
    }

    // Filter
    if (filterStatus) items = items.filter(f => f.status === filterStatus);

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    const pendingCount = DB.count('followUps', f => f.status === 'pending');
    const todayStr = new Date().toISOString().substring(0, 10);
    const dueToday = DB.count('followUps', f => f.status === 'pending' && (f.nextDate || '').startsWith(todayStr));

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-telephone-outbound me-2"></i>Sales Follow-ups</h1>
          <div class="subtitle">Scheduled calls, WhatsApp follow-ups, and prospect touchpoint reminders</div>
        </div>
        <div class="d-flex gap-2">
          <a href="${Navigation.getUrl('crm')}" class="btn btn-outline-secondary"><i class="bi bi-funnel me-1"></i>All Leads</a>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="FollowupsMod.openModal()"><i class="bi bi-plus-lg me-1"></i>Schedule Follow-up</button>' : ''}
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-sm-6">
          <div class="kpi-card">
            <div class="kpi-icon warning"><i class="bi bi-clock-history"></i></div>
            <div class="kpi-label">Pending Follow-ups</div>
            <div class="kpi-value">${pendingCount}</div>
          </div>
        </div>
        <div class="col-sm-6">
          <div class="kpi-card">
            <div class="kpi-icon primary"><i class="bi bi-calendar-event"></i></div>
            <div class="kpi-label">Due Today</div>
            <div class="kpi-value text-primary">${dueToday}</div>
          </div>
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search lead or notes..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="pending" ${filterStatus === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="completed" ${filterStatus === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="missed" ${filterStatus === 'missed' ? 'selected' : ''}>Missed</option>
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Lead / Prospect</th>
                <th>Contact</th>
                <th>Follow-up Notes</th>
                <th class="sortable" data-field="nextDate">Scheduled Date</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(f => {
                const l = DB.getById('leads', f.leadId);
                const isOverdue = f.status === 'pending' && f.nextDate && f.nextDate < todayStr;

                return `
                  <tr>
                    <td>
                      <div class="fw-semibold text-dark">${l?.name || 'Prospect'}</div>
                    </td>
                    <td>
                      <div>${Utils.formatPhone(l?.phone)}</div>
                    </td>
                    <td>
                      <div class="text-secondary small" style="max-width:300px">${f.notes || 'Routine follow-up call regarding membership pricing.'}</div>
                    </td>
                    <td>
                      <span class="${isOverdue ? 'text-danger fw-bold' : ''}">
                        ${Utils.formatDate(f.nextDate)}
                        ${isOverdue ? '<span class="badge bg-danger-subtle text-danger ms-1">Overdue</span>' : ''}
                      </span>
                    </td>
                    <td>${Utils.statusBadge(f.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        ${f.status === 'pending' && Permissions.canEdit(MODULE) ? `
                          <button class="btn btn-sm btn-outline-success" onclick="FollowupsMod.markCompleted('${f.id}')" title="Mark Done"><i class="bi bi-check2"></i></button>
                        ` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="FollowupsMod.deleteFollowup('${f.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-telephone-outbound', 'No follow-ups found', 'Schedule lead outreach to stay on top of prospective members.', Permissions.canCreate(MODULE) ? 'Schedule Follow-up' : '')}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModal() {
    const leads = DB.getAll('leads');

    return `
    <div class="modal fade" id="followupModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Schedule Follow-up</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="followupForm" novalidate>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Lead / Prospect *</label>
                <select class="form-select" id="fuLeadId" required>
                  <option value="">Select Lead</option>
                  ${leads.map(l => `<option value="${l.id}">${l.name} (${l.phone || ''})</option>`).join('')}
                </select>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Next Date *</label>
                  <input type="date" class="form-control" id="fuNextDate" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="fuStatus">
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Call / Communication Notes *</label>
                <textarea class="form-control" id="fuNotes" rows="3" placeholder="Discuss 3-month seasonal discount and offer 1-day free trial" required></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Schedule</button>
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
    document.getElementById('followupForm')?.addEventListener('submit', saveFollowup);
  }

  function openModal() {
    const form = document.getElementById('followupForm');
    Utils.resetForm(form);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('fuNextDate').value = tomorrow.toISOString().substring(0, 10);
    new bootstrap.Modal(document.getElementById('followupModal')).show();
  }

  function saveFollowup(e) {
    e.preventDefault();
    const form = document.getElementById('followupForm');
    if (!Utils.validateForm(form)) return;

    const data = {
      leadId: document.getElementById('fuLeadId').value,
      nextDate: document.getElementById('fuNextDate').value,
      status: document.getElementById('fuStatus').value,
      notes: document.getElementById('fuNotes').value.trim(),
      date: new Date().toISOString()
    };

    DB.create('followUps', data);
    Utils.logAudit('create', 'followups', `Scheduled follow-up`);
    Utils.showToast('Follow-up scheduled successfully');

    bootstrap.Modal.getInstance(document.getElementById('followupModal'))?.hide();
    render();
  }

  function markCompleted(id) {
    DB.update('followUps', id, { status: 'completed' });
    Utils.showToast('Follow-up marked as completed!');
    render();
  }

  function deleteFollowup(id) {
    Utils.showConfirm('Delete Follow-up', 'Are you sure you want to remove this follow-up reminder?', () => {
      DB.delete('followUps', id);
      Utils.showToast('Follow-up deleted', 'danger');
      render();
    });
  }

  window.FollowupsMod = { openModal, markCompleted, deleteFollowup };
  render();
})();

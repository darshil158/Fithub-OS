/* ============================================================
   FitHub OS — Attendance & Check-in Module
   ============================================================ */
(function () {
  'use strict';

  App.init('attendance', [{ label: 'Attendance' }]);
  const content = App.getContent();
  const MODULE = 'attendance';
  let currentPage = 1;
  let searchQuery = '';
  let filterDate = new Date().toISOString().substring(0, 10);
  let filterBranch = '';
  let sortField = 'checkIn';
  let sortDir = 'desc';

  function render() {
    let items = DB.getAll('attendance');
    const branches = DB.getAll('branches');
    const user = Auth.getCurrentUser();

    // Multi-tenant filtering
    if (user.role === 'member') {
      items = items.filter(a => a.memberId === user.id || a.memberId === 'member-1');
    } else {
      const selectedGym = Auth.getSelectedGym();
      if (selectedGym) {
        const gymBranches = new Set(DB.query('branches', b => b.gymId === selectedGym).map(b => b.id));
        items = items.filter(a => gymBranches.has(a.branchId));
      }
    }

    // Today's metrics
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayCheckIns = items.filter(a => (a.date || a.checkIn || '').startsWith(todayStr)).length;
    const activeInGym = items.filter(a => (a.date || a.checkIn || '').startsWith(todayStr) && !a.checkOut).length;

    // Search by member
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(a => {
        const m = DB.getById('members', a.memberId);
        return (m?.name || '').toLowerCase().includes(q) || (m?.phone || '').includes(q);
      });
    }

    // Date filter
    if (filterDate) {
      items = items.filter(a => (a.date || a.checkIn || '').startsWith(filterDate));
    }

    // Branch filter
    if (filterBranch) {
      items = items.filter(a => a.branchId === filterBranch);
    }

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-calendar-check me-2"></i>Attendance</h1>
          <div class="subtitle">Real-time check-ins, barcode turnstile logs, and dwell time tracking</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="AttendanceMod.exportData()"><i class="bi bi-download me-1"></i>Export</button>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="AttendanceMod.openModal()"><i class="bi bi-qr-code-scan me-1"></i>Member Check-In</button>' : ''}
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-4">
          <div class="kpi-card">
            <div class="kpi-icon primary"><i class="bi bi-person-check"></i></div>
            <div class="kpi-label">Today's Check-ins</div>
            <div class="kpi-value">${todayCheckIns}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-4">
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="bi bi-person-badge"></i></div>
            <div class="kpi-label">Currently in Gym</div>
            <div class="kpi-value text-success">${activeInGym}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-4">
          <div class="kpi-card">
            <div class="kpi-icon info"><i class="bi bi-clock-history"></i></div>
            <div class="kpi-label">Avg Session Time</div>
            <div class="kpi-value">68 min</div>
          </div>
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search member name or phone..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <input type="date" class="form-control" id="filterDate" value="${filterDate}" title="Filter Date">
            <select class="form-select" id="filterBranch">
              <option value="">All Branches</option>
              ${branches.map(b => `<option value="${b.id}" ${filterBranch === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
            </select>
            <button class="btn btn-sm btn-outline-secondary" onclick="AttendanceMod.clearDate()" title="Show All Dates">All Time</button>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Member</th>
                <th>Branch</th>
                <th class="sortable" data-field="date">Date</th>
                <th class="sortable" data-field="checkIn">Check-In</th>
                <th>Check-Out</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(a => {
                const m = DB.getById('members', a.memberId);
                const b = DB.getById('branches', a.branchId);

                let duration = '—';
                if (a.checkIn && a.checkOut) {
                  const diff = Math.round((new Date(a.checkOut) - new Date(a.checkIn)) / 60000);
                  duration = diff > 0 ? `${diff} mins` : '—';
                } else if (a.checkIn) {
                  duration = '<span class="badge bg-success-subtle text-success">In Gym</span>';
                }

                return `
                  <tr>
                    <td>
                      <div class="fw-semibold text-dark">${m?.name || '—'}</div>
                      <small class="text-muted">${m?.phone || ''}</small>
                    </td>
                    <td><span class="badge bg-light text-dark">${b?.name || '—'}</span></td>
                    <td><small>${Utils.formatDate(a.date || a.checkIn)}</small></td>
                    <td><span class="text-success fw-medium">${Utils.formatTime(a.checkIn)}</span></td>
                    <td><span class="text-muted">${a.checkOut ? Utils.formatTime(a.checkOut) : '—'}</span></td>
                    <td>${duration}</td>
                    <td>${Utils.statusBadge(a.status || 'present')}</td>
                    <td>
                      <div class="d-flex gap-1">
                        ${!a.checkOut && Permissions.canEdit(MODULE) ? `
                          <button class="btn btn-sm btn-outline-warning" onclick="AttendanceMod.checkOut('${a.id}')" title="Check Out"><i class="bi bi-box-arrow-right me-1"></i>Check Out</button>
                        ` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="AttendanceMod.deleteEntry('${a.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-calendar-check', 'No attendance records', 'No check-ins found for the selected date or search filter.', Permissions.canCreate(MODULE) ? 'Member Check-In' : '')}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModal() {
    const members = DB.getAll('members');
    const branches = DB.getAll('branches');

    return `
    <div class="modal fade" id="checkinModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Record Member Check-In</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="checkinForm" novalidate>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Select Member *</label>
                <select class="form-select" id="attMemberId" required>
                  <option value="">Search & Select Member</option>
                  ${members.map(m => `<option value="${m.id}" data-branch="${m.branchId}">${m.name} (${m.phone || 'No phone'})</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Branch *</label>
                <select class="form-select" id="attBranchId" required>
                  <option value="">Select Branch</option>
                  ${branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                </select>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Check-In Time</label>
                  <input type="datetime-local" class="form-control" id="attCheckIn" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="attStatus">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary"><i class="bi bi-check2-circle me-1"></i>Confirm Check-In</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterDate')?.addEventListener('change', e => { filterDate = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterBranch')?.addEventListener('change', e => { filterBranch = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('checkinForm')?.addEventListener('submit', saveCheckIn);

    document.getElementById('attMemberId')?.addEventListener('change', (e) => {
      const selected = e.target.options[e.target.selectedIndex];
      const bId = selected.dataset.branch;
      if (bId) document.getElementById('attBranchId').value = bId;
    });
  }

  function clearDate() {
    filterDate = '';
    const dateInput = document.getElementById('filterDate');
    if (dateInput) dateInput.value = '';
    render();
  }

  function openModal() {
    const form = document.getElementById('checkinForm');
    Utils.resetForm(form);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('attCheckIn').value = now.toISOString().slice(0, 16);
    const branchId = Auth.getSelectedBranch();
    if (branchId) document.getElementById('attBranchId').value = branchId;
    new bootstrap.Modal(document.getElementById('checkinModal')).show();
  }

  function saveCheckIn(e) {
    e.preventDefault();
    const form = document.getElementById('checkinForm');
    if (!Utils.validateForm(form)) return;

    const checkInTime = document.getElementById('attCheckIn').value
      ? new Date(document.getElementById('attCheckIn').value).toISOString()
      : new Date().toISOString();

    const data = {
      memberId: document.getElementById('attMemberId').value,
      branchId: document.getElementById('attBranchId').value,
      date: checkInTime.substring(0, 10),
      checkIn: checkInTime,
      checkOut: null,
      status: document.getElementById('attStatus').value
    };

    const member = DB.getById('members', data.memberId);
    DB.create('attendance', data);
    Utils.logAudit('create', 'attendance', `Check-in recorded for ${member?.name}`);
    Utils.showToast(`${member?.name} checked in successfully`);

    bootstrap.Modal.getInstance(document.getElementById('checkinModal'))?.hide();
    render();
  }

  function checkOut(id) {
    const a = DB.getById('attendance', id);
    const m = DB.getById('members', a?.memberId);
    const now = new Date().toISOString();
    DB.update('attendance', id, { checkOut: now });
    Utils.logAudit('update', 'attendance', `Check-out recorded for ${m?.name}`);
    Utils.showToast(`${m?.name} checked out`);
    render();
  }

  function deleteEntry(id) {
    Utils.showConfirm('Delete Record', 'Are you sure you want to delete this attendance record?', () => {
      DB.delete('attendance', id);
      Utils.showToast('Attendance record deleted', 'danger');
      render();
    });
  }

  function exportData() {
    const items = DB.getAll('attendance');
    Utils.exportToCSV(items, 'attendance.csv');
    Utils.showToast('Attendance exported to CSV');
  }

  window.AttendanceMod = { openModal, clearDate, checkOut, deleteEntry, exportData };
  render();
})();

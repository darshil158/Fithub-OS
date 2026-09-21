/* ============================================================
   FitHub OS — Bookings Management Module
   ============================================================ */
(function () {
  'use strict';

  App.init('bookings', [{ label: 'Bookings' }]);
  const content = App.getContent();
  const MODULE = 'bookings';
  let currentPage = 1;
  let searchQuery = '';
  let filterClass = '';
  let filterStatus = '';
  let sortField = 'date';
  let sortDir = 'desc';

  function render() {
    let items = DB.getAll('classBookings');
    const classes = DB.getAll('classes');
    const user = Auth.getCurrentUser();

    // Multi-tenant check
    if (user.role === 'member') {
      items = items.filter(b => b.memberId === user.id || b.memberId === 'member-1');
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(b => {
        const m = DB.getById('members', b.memberId);
        const c = DB.getById('classes', b.classId);
        return (m?.name || '').toLowerCase().includes(q) || (c?.name || '').toLowerCase().includes(q);
      });
    }

    // Filters
    if (filterClass) items = items.filter(b => b.classId === filterClass);
    if (filterStatus) items = items.filter(b => b.status === filterStatus);

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-bookmark-check me-2"></i>Class Bookings</h1>
          <div class="subtitle">Member class registrations, attendance marks, and seat allocation</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="BookingsMod.exportData()"><i class="bi bi-download me-1"></i>Export</button>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="BookingsMod.openModal()"><i class="bi bi-plus-lg me-1"></i>New Booking</button>' : ''}
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search member or class..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterClass">
              <option value="">All Classes</option>
              ${classes.map(c => `<option value="${c.id}" ${filterClass === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="confirmed" ${filterStatus === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="attended" ${filterStatus === 'attended' ? 'selected' : ''}>Attended</option>
              <option value="cancelled" ${filterStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Member</th>
                <th>Class</th>
                <th>Trainer</th>
                <th class="sortable" data-field="date">Session Date</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(b => {
                const m = DB.getById('members', b.memberId);
                const c = DB.getById('classes', b.classId);
                const t = c ? DB.getById('trainers', c.trainerId) : null;

                return `
                  <tr>
                    <td><span class="font-monospace text-muted small">${b.id.substring(0, 8)}</span></td>
                    <td>
                      <div class="fw-semibold text-dark">${m?.name || '—'}</div>
                      <small class="text-muted">${m?.phone || ''}</small>
                    </td>
                    <td><span class="badge bg-primary-subtle text-primary">${c?.name || 'Session'}</span></td>
                    <td>${t?.name || 'Instructor'}</td>
                    <td><small>${Utils.formatDate(b.date)}</small></td>
                    <td>${Utils.statusBadge(b.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        ${b.status === 'confirmed' && Permissions.canEdit(MODULE) ? `
                          <button class="btn btn-sm btn-outline-success" onclick="BookingsMod.markAttended('${b.id}')" title="Mark Attended"><i class="bi bi-check2"></i></button>
                          <button class="btn btn-sm btn-outline-warning" onclick="BookingsMod.cancel('${b.id}')" title="Cancel Booking"><i class="bi bi-x-lg"></i></button>
                        ` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="BookingsMod.deleteBooking('${b.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-bookmark-check', 'No bookings found', 'Reserve class slots for members.', Permissions.canCreate(MODULE) ? 'New Booking' : '')}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModal() {
    const classes = DB.getAll('classes');
    const members = DB.getAll('members');

    return `
    <div class="modal fade" id="bookingModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create Class Booking</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="bookingForm" novalidate>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Member *</label>
                <select class="form-select" id="bookMember" required>
                  <option value="">Select Member</option>
                  ${members.map(m => `<option value="${m.id}">${m.name} (${m.phone || ''})</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Class *</label>
                <select class="form-select" id="bookClass" required>
                  <option value="">Select Class</option>
                  ${classes.map(c => `<option value="${c.id}">${c.name} (${c.schedule})</option>`).join('')}
                </select>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Date *</label>
                  <input type="date" class="form-control" id="bookSessionDate" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="bookStatus">
                    <option value="confirmed">Confirmed</option>
                    <option value="attended">Attended</option>
                    <option value="waitlist">Waitlist</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Booking</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterClass')?.addEventListener('change', e => { filterClass = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterStatus')?.addEventListener('change', e => { filterStatus = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('bookingForm')?.addEventListener('submit', saveBooking);
  }

  function openModal() {
    const form = document.getElementById('bookingForm');
    Utils.resetForm(form);
    document.getElementById('bookSessionDate').value = new Date().toISOString().substring(0, 10);
    new bootstrap.Modal(document.getElementById('bookingModal')).show();
  }

  function saveBooking(e) {
    e.preventDefault();
    const form = document.getElementById('bookingForm');
    if (!Utils.validateForm(form)) return;

    const data = {
      memberId: document.getElementById('bookMember').value,
      classId: document.getElementById('bookClass').value,
      date: document.getElementById('bookSessionDate').value,
      status: document.getElementById('bookStatus').value
    };

    const member = DB.getById('members', data.memberId);
    const c = DB.getById('classes', data.classId);

    DB.create('classBookings', data);
    Utils.logAudit('create', 'bookings', `Booked ${member?.name} for ${c?.name}`);
    Utils.showToast('Booking created successfully');

    bootstrap.Modal.getInstance(document.getElementById('bookingModal'))?.hide();
    render();
  }

  function markAttended(id) {
    DB.update('classBookings', id, { status: 'attended' });
    Utils.showToast('Marked as attended');
    render();
  }

  function cancel(id) {
    DB.update('classBookings', id, { status: 'cancelled' });
    Utils.showToast('Booking cancelled', 'warning');
    render();
  }

  function deleteBooking(id) {
    Utils.showConfirm('Delete Booking', 'Are you sure you want to remove this booking?', () => {
      DB.delete('classBookings', id);
      Utils.showToast('Booking deleted', 'danger');
      render();
    });
  }

  function exportData() {
    const items = DB.getAll('classBookings');
    Utils.exportToCSV(items, 'bookings.csv');
    Utils.showToast('Bookings exported to CSV');
  }

  window.BookingsMod = { openModal, markAttended, cancel, deleteBooking, exportData };
  render();
})();

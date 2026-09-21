/* ============================================================
   FitHub OS — Group Fitness Classes Module
   ============================================================ */
(function () {
  'use strict';

  App.init('classes', [{ label: 'Classes' }]);
  const content = App.getContent();
  const MODULE = 'classes';
  let currentPage = 1;
  let searchQuery = '';
  let filterTrainer = '';
  let filterBranch = '';
  let sortField = 'name';
  let sortDir = 'asc';

  function render() {
    let items = App.getFilteredData('classes');
    const trainers = DB.getAll('trainers');
    const branches = DB.getAll('branches');

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['name', 'schedule', 'room']);
    // Filter
    if (filterTrainer) items = items.filter(c => c.trainerId === filterTrainer);
    if (filterBranch) items = items.filter(c => c.branchId === filterBranch);

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 9);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-easel me-2"></i>Group Fitness Classes</h1>
          <div class="subtitle">Studio sessions, yoga, spinning, HIIT workshops, and instructor timetables</div>
        </div>
        <div class="d-flex gap-2">
          <a href="${Navigation.getUrl('bookings')}" class="btn btn-outline-secondary"><i class="bi bi-bookmark-check me-1"></i>View All Bookings</a>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="ClassesMod.openModal()"><i class="bi bi-plus-lg me-1"></i>Add Class</button>' : ''}
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search class name or schedule..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterTrainer">
              <option value="">All Trainers</option>
              ${trainers.map(t => `<option value="${t.id}" ${filterTrainer === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select>
            <select class="form-select" id="filterBranch">
              <option value="">All Branches</option>
              ${branches.map(b => `<option value="${b.id}" ${filterBranch === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="row g-4 p-3">
          ${pg.data.map(c => {
            const trainer = DB.getById('trainers', c.trainerId);
            const branch = DB.getById('branches', c.branchId);
            const bookingsCount = DB.count('classBookings', b => b.classId === c.id && b.status !== 'cancelled');
            const capacity = c.capacity || 20;
            const pct = Math.min(100, Math.round((bookingsCount / capacity) * 100));

            return `
              <div class="col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm border" style="border-radius:12px;overflow:hidden">
                  <div class="card-body p-4 d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <span class="badge bg-primary-subtle text-primary">${branch?.name || 'Main Studio'}</span>
                      ${Utils.statusBadge(c.status || 'active')}
                    </div>
                    <h5 class="fw-bold mb-1">${c.name}</h5>
                    <div class="text-muted small mb-3"><i class="bi bi-clock me-1"></i>${c.schedule || 'Daily at 7:00 AM'}</div>

                    <!-- Trainer -->
                    <div class="d-flex align-items-center gap-2 p-2 bg-light rounded mb-3">
                      <div class="topbar-avatar" style="background:${trainer?.avatar || '#00B894'};width:32px;height:32px;font-size:12px">
                        ${Utils.capitalize(trainer?.name ? trainer.name.charAt(0) : 'T')}
                      </div>
                      <div class="small">
                        <div class="fw-semibold">${trainer?.name || 'Assigned Instructor'}</div>
                        <div class="text-muted">${trainer?.specialization || 'Trainer'}</div>
                      </div>
                    </div>

                    <!-- Capacity Progress -->
                    <div class="mb-4 flex-grow-1">
                      <div class="d-flex justify-content-between small text-muted mb-1">
                        <span>Booked Seats</span>
                        <span>${bookingsCount} / ${capacity}</span>
                      </div>
                      <div class="progress" style="height: 6px;">
                        <div class="progress-bar ${pct > 80 ? 'bg-danger' : 'bg-primary'}" style="width: ${pct}%"></div>
                      </div>
                    </div>

                    <!-- Action buttons -->
                    <div class="d-flex align-items-center justify-content-between pt-3 border-top">
                      <button class="btn btn-sm btn-primary" onclick="ClassesMod.bookModal('${c.id}')"><i class="bi bi-person-check me-1"></i>Book Seat</button>
                      <div class="d-flex gap-1">
                        ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="ClassesMod.openModal('${c.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="ClassesMod.deleteClass('${c.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="table-pagination px-3 pb-3" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-easel', 'No classes found', 'Schedule group sessions and assign trainers.', Permissions.canCreate(MODULE) ? 'Add Class' : '')}
      </div>

      ${renderModals()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModals() {
    const trainers = DB.getAll('trainers');
    const branches = DB.getAll('branches');
    const gyms = DB.getAll('gyms');
    const members = DB.getAll('members');

    return `
    <!-- Class Modal -->
    <div class="modal fade" id="classModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="classModalTitle">Schedule Class</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="classForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="classId">
              <div class="mb-3">
                <label class="form-label">Class Name *</label>
                <input type="text" class="form-control" id="className" placeholder="e.g. Morning Spin Bootcamp" required>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Trainer *</label>
                  <select class="form-select" id="classTrainerId" required>
                    <option value="">Select Trainer</option>
                    ${trainers.map(t => `<option value="${t.id}">${t.name} (${t.specialization})</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Capacity (seats) *</label>
                  <input type="number" class="form-control" id="classCapacity" value="25" min="1" required>
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Gym *</label>
                  <select class="form-select" id="classGymId" required>
                    <option value="">Select Gym</option>
                    ${gyms.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Branch *</label>
                  <select class="form-select" id="classBranchId" required>
                    <option value="">Select Branch</option>
                    ${branches.map(b => `<option value="${b.id}" data-gym="${b.gymId}">${b.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Schedule / Days & Time *</label>
                <input type="text" class="form-control" id="classSchedule" placeholder="e.g. Mon, Wed, Fri · 07:00 AM" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Studio / Room</label>
                <input type="text" class="form-control" id="classRoom" placeholder="e.g. Studio 2B (Cycling)">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Class</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Quick Booking Modal -->
    <div class="modal fade" id="bookClassModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="bookModalTitle">Book Class Slot</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="bookForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="bookClassId">
              <div class="alert alert-primary py-2 px-3 small mb-3" id="bookClassInfo"></div>
              <div class="mb-3">
                <label class="form-label">Member *</label>
                <select class="form-select" id="bookMemberId" required>
                  <option value="">Select Member</option>
                  ${members.map(m => `<option value="${m.id}">${m.name} (${m.phone || ''})</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Date</label>
                <input type="date" class="form-control" id="bookDate" required>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Confirm Booking</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    `;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterTrainer')?.addEventListener('change', e => { filterTrainer = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterBranch')?.addEventListener('change', e => { filterBranch = e.target.value; currentPage = 1; render(); });
    document.getElementById('classForm')?.addEventListener('submit', saveClass);
    document.getElementById('bookForm')?.addEventListener('submit', saveBooking);

    document.getElementById('classGymId')?.addEventListener('change', (e) => {
      const gId = e.target.value;
      const bSel = document.getElementById('classBranchId');
      Array.from(bSel.options).forEach(opt => {
        if (!opt.value) return;
        opt.style.display = (!gId || opt.dataset.gym === gId) ? '' : 'none';
      });
    });
  }

  function openModal(id) {
    const form = document.getElementById('classForm');
    Utils.resetForm(form);
    const gymId = Auth.getSelectedGym() || '';
    const branchId = Auth.getSelectedBranch() || '';

    if (id) {
      const c = DB.getById('classes', id);
      if (!c) return;
      document.getElementById('classModalTitle').textContent = 'Edit Class';
      document.getElementById('classId').value = c.id;
      document.getElementById('className').value = c.name || '';
      document.getElementById('classTrainerId').value = c.trainerId || '';
      document.getElementById('classCapacity').value = c.capacity || 20;
      document.getElementById('classGymId').value = c.gymId || gymId;
      document.getElementById('classBranchId').value = c.branchId || branchId;
      document.getElementById('classSchedule').value = c.schedule || '';
      document.getElementById('classRoom').value = c.room || '';
    } else {
      document.getElementById('classModalTitle').textContent = 'Schedule Class';
      document.getElementById('classGymId').value = gymId;
      document.getElementById('classBranchId').value = branchId;
    }
    new bootstrap.Modal(document.getElementById('classModal')).show();
  }

  function saveClass(e) {
    e.preventDefault();
    const form = document.getElementById('classForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('classId').value;
    const data = {
      name: document.getElementById('className').value.trim(),
      trainerId: document.getElementById('classTrainerId').value,
      capacity: parseInt(document.getElementById('classCapacity').value) || 20,
      gymId: document.getElementById('classGymId').value,
      branchId: document.getElementById('classBranchId').value,
      schedule: document.getElementById('classSchedule').value.trim(),
      room: document.getElementById('classRoom').value.trim(),
      status: 'active'
    };

    if (id) {
      DB.update('classes', id, data);
      Utils.logAudit('update', 'classes', `Updated class: ${data.name}`);
      Utils.showToast('Class updated successfully');
    } else {
      DB.create('classes', data);
      Utils.logAudit('create', 'classes', `Scheduled class: ${data.name}`);
      Utils.showToast('Class scheduled successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('classModal'))?.hide();
    render();
  }

  function deleteClass(id) {
    const c = DB.getById('classes', id);
    Utils.showConfirm('Cancel Class', `Are you sure you want to cancel class <strong>${c?.name}</strong>?`, () => {
      DB.delete('classes', id);
      Utils.logAudit('delete', 'classes', `Cancelled class: ${c?.name}`);
      Utils.showToast('Class cancelled', 'danger');
      render();
    });
  }

  function bookModal(classId) {
    const c = DB.getById('classes', classId);
    if (!c) return;
    document.getElementById('bookClassId').value = c.id;
    document.getElementById('bookClassInfo').textContent = `Booking for: ${c.name} (${c.schedule})`;
    document.getElementById('bookDate').value = new Date().toISOString().substring(0, 10);
    new bootstrap.Modal(document.getElementById('bookClassModal')).show();
  }

  function saveBooking(e) {
    e.preventDefault();
    const classId = document.getElementById('bookClassId').value;
    const memberId = document.getElementById('bookMemberId').value;
    const date = document.getElementById('bookDate').value;
    if (!memberId || !date) return;

    const member = DB.getById('members', memberId);
    const c = DB.getById('classes', classId);

    DB.create('classBookings', {
      classId,
      memberId,
      date,
      status: 'confirmed'
    });

    Utils.logAudit('create', 'bookings', `Booked ${member?.name} for ${c?.name}`);
    Utils.showToast(`Seat booked for ${member?.name}!`);

    bootstrap.Modal.getInstance(document.getElementById('bookClassModal'))?.hide();
    render();
  }

  window.ClassesMod = { openModal, deleteClass, bookModal };
  render();
})();

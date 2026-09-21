/* ============================================================
   FitHub OS — Equipment Maintenance Module
   ============================================================ */
(function () {
  'use strict';

  App.init('maintenance', [{ label: 'Equipment', href: Navigation.getUrl('equipment') }, { label: 'Maintenance' }]);
  const content = App.getContent();
  const MODULE = 'maintenance';
  let currentPage = 1;
  let searchQuery = '';
  let filterStatus = '';
  let sortField = 'date';
  let sortDir = 'desc';

  function render() {
    let items = DB.getAll('maintenance');

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(m => {
        const eq = DB.getById('equipment', m.equipmentId);
        return (eq?.name || '').toLowerCase().includes(q) || (m.type || '').toLowerCase().includes(q) || (m.notes || '').toLowerCase().includes(q);
      });
    }

    // Filter
    if (filterStatus) items = items.filter(m => m.status === filterStatus);

    // Metrics
    const totalCost = items.reduce((acc, m) => acc + (Number(m.cost) || 0), 0);
    const inProgressCount = items.filter(m => m.status === 'in_progress').length;
    const completedCount = items.filter(m => m.status === 'completed').length;

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-tools me-2"></i>Maintenance & Repairs</h1>
          <div class="subtitle">Equipment servicing histories, scheduled inspections, and repair cost ledger</div>
        </div>
        <div class="d-flex gap-2">
          <a href="${Navigation.getUrl('equipment')}" class="btn btn-outline-secondary"><i class="bi bi-wrench me-1"></i>All Assets</a>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="MaintenanceMod.openModal()"><i class="bi bi-plus-lg me-1"></i>Log Service</button>' : ''}
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-sm-4">
          <div class="kpi-card">
            <div class="kpi-icon warning"><i class="bi bi-hourglass-split"></i></div>
            <div class="kpi-label">Active Repairs</div>
            <div class="kpi-value text-warning">${inProgressCount}</div>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="bi bi-check2-all"></i></div>
            <div class="kpi-label">Completed Services</div>
            <div class="kpi-value text-success">${completedCount}</div>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="kpi-card">
            <div class="kpi-icon primary"><i class="bi bi-cash-stack"></i></div>
            <div class="kpi-label">Total Repair Costs</div>
            <div class="kpi-value text-dark">${Utils.formatCurrency(totalCost)}</div>
          </div>
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search equipment or notes..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="scheduled" ${filterStatus === 'scheduled' ? 'selected' : ''}>Scheduled</option>
              <option value="in_progress" ${filterStatus === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="completed" ${filterStatus === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Equipment Asset</th>
                <th>Service Type</th>
                <th class="sortable" data-field="date">Date</th>
                <th class="sortable" data-field="cost">Service Cost</th>
                <th>Notes</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(m => {
                const eq = DB.getById('equipment', m.equipmentId);

                return `
                  <tr>
                    <td>
                      <div class="fw-semibold text-dark">${eq?.name || 'Equipment'}</div>
                      <small class="font-monospace text-muted">${eq?.serialNumber || ''}</small>
                    </td>
                    <td><span class="badge bg-light text-dark">${m.type || 'Routine Service'}</span></td>
                    <td><small>${Utils.formatDate(m.date)}</small></td>
                    <td class="fw-bold text-dark">${Utils.formatCurrency(m.cost || 0)}</td>
                    <td><small class="text-muted text-truncate d-inline-block" style="max-width:220px">${m.notes || '—'}</small></td>
                    <td>${Utils.statusBadge(m.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        ${m.status !== 'completed' && Permissions.canEdit(MODULE) ? `
                          <button class="btn btn-sm btn-outline-success" onclick="MaintenanceMod.markDone('${m.id}')" title="Mark Restored"><i class="bi bi-check2 me-1"></i>Resolve</button>
                        ` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="MaintenanceMod.deleteService('${m.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-tools', 'No maintenance logs found', 'Record repair work or schedule preventative machine inspections.', Permissions.canCreate(MODULE) ? 'Log Service' : '')}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModal() {
    const equipment = DB.getAll('equipment');

    return `
    <div class="modal fade" id="maintModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Log Equipment Maintenance</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="maintForm" novalidate>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Equipment Asset *</label>
                <select class="form-select" id="mEquipmentId" required>
                  <option value="">Select Equipment</option>
                  ${equipment.map(e => `<option value="${e.id}">${e.name} (${e.serialNumber || 'SN'})</option>`).join('')}
                </select>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Service Type *</label>
                  <select class="form-select" id="mType" required>
                    <option value="Preventative Maintenance">Preventative Maintenance</option>
                    <option value="Belt & Cable Replacement">Belt & Cable Replacement</option>
                    <option value="Motor / Electronics Repair">Motor / Electronics Repair</option>
                    <option value="Safety Inspection">Safety Inspection</option>
                    <option value="Upholstery Patching">Upholstery Patching</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Service Cost (${Utils.getCurrencySymbol()}) *</label>
                  <input type="number" class="form-control" id="mCost" value="${Math.round(Utils.convertCurrency(1200))}" min="0" step="any" required>
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Service Date *</label>
                  <input type="date" class="form-control" id="mDate" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="mStatus">
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Technician Notes</label>
                <textarea class="form-control" id="mNotes" rows="3" placeholder="Description of replaced parts or technician work done"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Maintenance Log</button>
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
    document.getElementById('maintForm')?.addEventListener('submit', saveMaint);
  }

  function openModal() {
    const form = document.getElementById('maintForm');
    Utils.resetForm(form);
    document.getElementById('mDate').value = new Date().toISOString().substring(0, 10);
    document.getElementById('mCost').value = Math.round(Utils.convertCurrency(1200));
    new bootstrap.Modal(document.getElementById('maintModal')).show();
  }

  function saveMaint(e) {
    e.preventDefault();
    const form = document.getElementById('maintForm');
    if (!Utils.validateForm(form)) return;

    const enteredCost = parseFloat(document.getElementById('mCost').value) || 0;
    const data = {
      equipmentId: document.getElementById('mEquipmentId').value,
      type: document.getElementById('mType').value,
      cost: Utils.toBaseCurrency(enteredCost),
      date: document.getElementById('mDate').value,
      status: document.getElementById('mStatus').value,
      notes: document.getElementById('mNotes').value.trim()
    };

    const eq = DB.getById('equipment', data.equipmentId);
    DB.create('maintenance', data);

    if (data.status === 'in_progress') {
      DB.update('equipment', data.equipmentId, { status: 'maintenance' });
    } else if (data.status === 'completed') {
      DB.update('equipment', data.equipmentId, { status: 'operational' });
    }

    Utils.logAudit('create', 'maintenance', `Logged ${data.type} on ${eq?.name}`);
    Utils.showToast('Maintenance logged successfully');

    bootstrap.Modal.getInstance(document.getElementById('maintModal'))?.hide();
    render();
  }

  function markDone(id) {
    const m = DB.getById('maintenance', id);
    if (!m) return;
    DB.update('maintenance', id, { status: 'completed' });
    // restore equipment status
    DB.update('equipment', m.equipmentId, { status: 'operational' });
    Utils.logAudit('update', 'maintenance', `Resolved maintenance on equipment`);
    Utils.showToast('Equipment marked operational & maintenance completed!');
    render();
  }

  function deleteService(id) {
    Utils.showConfirm('Delete Log', 'Are you sure you want to delete this maintenance entry?', () => {
      DB.delete('maintenance', id);
      Utils.showToast('Maintenance record deleted', 'danger');
      render();
    });
  }

  window.MaintenanceMod = { openModal, markDone, deleteService };
  render();
})();

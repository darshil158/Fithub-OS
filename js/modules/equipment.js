/* ============================================================
   FitHub OS — Equipment & Assets Module
   ============================================================ */
(function () {
  'use strict';

  App.init('equipment', [{ label: 'Equipment' }]);
  const content = App.getContent();
  const MODULE = 'equipment';
  let currentPage = 1;
  let searchQuery = '';
  let filterCategory = '';
  let filterStatus = '';
  let sortField = 'name';
  let sortDir = 'asc';

  function render() {
    let items = App.getFilteredData('equipment');
    const branches = DB.getAll('branches');

    // Metrics
    const totalCount = items.length;
    const operationalCount = items.filter(e => e.status === 'operational').length;
    const maintCount = items.filter(e => e.status === 'maintenance').length;
    const brokenCount = items.filter(e => e.status === 'broken').length;

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['name', 'category', 'serialNumber']);
    // Filter
    if (filterCategory) items = items.filter(e => e.category === filterCategory);
    if (filterStatus) items = items.filter(e => e.status === filterStatus);

    const categories = Array.from(new Set(DB.getAll('equipment').map(e => e.category).filter(Boolean)));

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-wrench me-2"></i>Gym Equipment & Assets</h1>
          <div class="subtitle">Track fitness machinery, warranty periods, and operational health</div>
        </div>
        <div class="d-flex gap-2">
          <a href="${Navigation.getUrl('maintenance')}" class="btn btn-outline-secondary"><i class="bi bi-tools me-1"></i>Maintenance Logs</a>
          <button class="btn btn-outline-secondary" onclick="EquipmentMod.exportData()"><i class="bi bi-download me-1"></i>Export</button>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="EquipmentMod.openModal()"><i class="bi bi-plus-lg me-1"></i>Add Equipment</button>' : ''}
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon primary"><i class="bi bi-cpu"></i></div>
            <div class="kpi-label">Total Asset Count</div>
            <div class="kpi-value">${totalCount}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="bi bi-check-circle"></i></div>
            <div class="kpi-label">Operational</div>
            <div class="kpi-value text-success">${operationalCount}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon warning"><i class="bi bi-tools"></i></div>
            <div class="kpi-label">Under Maintenance</div>
            <div class="kpi-value text-warning">${maintCount}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon danger"><i class="bi bi-exclamation-octagon"></i></div>
            <div class="kpi-label">Out of Order / Broken</div>
            <div class="kpi-value text-danger">${brokenCount}</div>
          </div>
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search equipment or serial #..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterCategory">
              <option value="">All Categories</option>
              ${categories.map(c => `<option value="${c}" ${filterCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="operational" ${filterStatus === 'operational' ? 'selected' : ''}>Operational</option>
              <option value="maintenance" ${filterStatus === 'maintenance' ? 'selected' : ''}>Under Maintenance</option>
              <option value="broken" ${filterStatus === 'broken' ? 'selected' : ''}>Out of Order</option>
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th class="sortable" data-field="name">Equipment</th>
                <th>Category</th>
                <th>Branch</th>
                <th>Serial / Asset ID</th>
                <th class="sortable" data-field="purchaseDate">Purchase Date</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(e => {
                const b = DB.getById('branches', e.branchId);

                return `
                  <tr>
                    <td>
                      <div class="fw-semibold text-dark">${e.name}</div>
                    </td>
                    <td><span class="badge bg-primary-subtle text-primary">${e.category || 'Fitness'}</span></td>
                    <td><span class="badge bg-light text-dark">${b?.name || 'Main Gym'}</span></td>
                    <td><span class="font-monospace text-muted small">${e.serialNumber || ('EQ-' + e.id.substring(0, 6))}</span></td>
                    <td><small>${Utils.formatDate(e.purchaseDate)}</small></td>
                    <td>${Utils.statusBadge(e.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-warning" onclick="EquipmentMod.logService('${e.id}')" title="Schedule Maintenance"><i class="bi bi-tools"></i></button>
                        ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="EquipmentMod.openModal('${e.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="EquipmentMod.deleteEquipment('${e.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-wrench', 'No equipment found', 'Add cardio machines and strength weights to your inventory.', Permissions.canCreate(MODULE) ? 'Add Equipment' : '')}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModal() {
    const branches = DB.getAll('branches');
    const gyms = DB.getAll('gyms');

    return `
    <div class="modal fade" id="equipmentModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="equipModalTitle">Add Equipment</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="equipmentForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="equipId">
              <div class="mb-3">
                <label class="form-label">Asset Name *</label>
                <input type="text" class="form-control" id="eqName" placeholder="e.g. Matrix T70 Commercial Treadmill" required>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Category *</label>
                  <select class="form-select" id="eqCategory" required>
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength Machine</option>
                    <option value="Free Weights">Free Weights</option>
                    <option value="Functional">Functional / Crossfit</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Serial / Asset Tag</label>
                  <input type="text" class="form-control font-monospace" id="eqSerial" placeholder="MTX-9821-X">
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Gym *</label>
                  <select class="form-select" id="eqGymId" required>
                    ${gyms.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Branch *</label>
                  <select class="form-select" id="eqBranchId" required>
                    ${branches.map(b => `<option value="${b.id}" data-gym="${b.gymId}">${b.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Purchase Date</label>
                  <input type="date" class="form-control" id="eqPurchaseDate">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Operational Status</label>
                  <select class="form-select" id="eqStatus">
                    <option value="operational">Operational</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="broken">Out of Order</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Equipment</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterCategory')?.addEventListener('change', e => { filterCategory = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterStatus')?.addEventListener('change', e => { filterStatus = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('equipmentForm')?.addEventListener('submit', saveEquipment);

    document.getElementById('eqGymId')?.addEventListener('change', (e) => {
      const gId = e.target.value;
      const bSel = document.getElementById('eqBranchId');
      Array.from(bSel.options).forEach(opt => {
        if (!opt.value) return;
        opt.style.display = (!gId || opt.dataset.gym === gId) ? '' : 'none';
      });
    });
  }

  function openModal(id) {
    const form = document.getElementById('equipmentForm');
    Utils.resetForm(form);
    const gymId = Auth.getSelectedGym() || '';
    const branchId = Auth.getSelectedBranch() || '';

    if (id) {
      const e = DB.getById('equipment', id);
      if (!e) return;
      document.getElementById('equipModalTitle').textContent = 'Edit Equipment';
      document.getElementById('equipId').value = e.id;
      document.getElementById('eqName').value = e.name || '';
      document.getElementById('eqCategory').value = e.category || 'Cardio';
      document.getElementById('eqSerial').value = e.serialNumber || '';
      document.getElementById('eqGymId').value = e.gymId || gymId;
      document.getElementById('eqBranchId').value = e.branchId || branchId;
      document.getElementById('eqPurchaseDate').value = e.purchaseDate ? e.purchaseDate.substring(0, 10) : '';
      document.getElementById('eqStatus').value = e.status || 'operational';
    } else {
      document.getElementById('equipModalTitle').textContent = 'Add Equipment';
      document.getElementById('eqGymId').value = gymId;
      document.getElementById('eqBranchId').value = branchId;
      document.getElementById('eqPurchaseDate').value = new Date().toISOString().substring(0, 10);
    }
    new bootstrap.Modal(document.getElementById('equipmentModal')).show();
  }

  function saveEquipment(e) {
    e.preventDefault();
    const form = document.getElementById('equipmentForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('equipId').value;
    const data = {
      name: document.getElementById('eqName').value.trim(),
      category: document.getElementById('eqCategory').value,
      serialNumber: document.getElementById('eqSerial').value.trim() || ('SN-' + Math.floor(10000 + Math.random() * 90000)),
      gymId: document.getElementById('eqGymId').value,
      branchId: document.getElementById('eqBranchId').value,
      purchaseDate: document.getElementById('eqPurchaseDate').value || new Date().toISOString(),
      status: document.getElementById('eqStatus').value
    };

    if (id) {
      DB.update('equipment', id, data);
      Utils.logAudit('update', 'equipment', `Updated equipment asset: ${data.name}`);
      Utils.showToast('Equipment updated successfully');
    } else {
      DB.create('equipment', data);
      Utils.logAudit('create', 'equipment', `Added equipment asset: ${data.name}`);
      Utils.showToast('Equipment added successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('equipmentModal'))?.hide();
    render();
  }

  function logService(id) {
    const eq = DB.getById('equipment', id);
    if (!eq) return;

    Utils.showConfirm('Schedule Maintenance', `Mark <strong>${eq.name}</strong> as under maintenance and create a service ticket?`, () => {
      DB.update('equipment', id, { status: 'maintenance' });
      DB.create('maintenance', {
        equipmentId: id,
        date: new Date().toISOString().substring(0, 10),
        type: 'Inspection / Repair',
        cost: 1500,
        status: 'in_progress',
        notes: `Scheduled inspection for ${eq.name}`
      });
      Utils.logAudit('create', 'maintenance', `Scheduled service for ${eq.name}`);
      Utils.showToast('Maintenance scheduled & equipment marked!');
      render();
    }, 'Schedule Service', 'btn-warning');
  }

  function deleteEquipment(id) {
    const e = DB.getById('equipment', id);
    Utils.showConfirm('Delete Equipment', `Are you sure you want to remove <strong>${e?.name}</strong> from asset records?`, () => {
      DB.delete('equipment', id);
      Utils.logAudit('delete', 'equipment', `Deleted equipment: ${e?.name}`);
      Utils.showToast('Equipment record deleted', 'danger');
      render();
    });
  }

  function exportData() {
    const items = App.getFilteredData('equipment');
    Utils.exportToCSV(items, 'equipment.csv');
    Utils.showToast('Equipment exported to CSV');
  }

  window.EquipmentMod = { openModal, logService, deleteEquipment, exportData };
  render();
})();

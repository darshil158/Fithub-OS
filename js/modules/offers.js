/* ============================================================
   FitHub OS — Offers & Coupons Module
   ============================================================ */
(function () {
  'use strict';

  App.init('offers', [{ label: 'Offers' }]);
  const content = App.getContent();
  const MODULE = 'offers';
  let currentPage = 1;
  let searchQuery = '';
  let filterStatus = '';
  let sortField = 'validTo';
  let sortDir = 'desc';

  function render() {
    let items = App.getFilteredData('offers');
    const gyms = DB.getAll('gyms');

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['code', 'description']);
    // Filter
    if (filterStatus) items = items.filter(o => o.status === filterStatus);

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-tag me-2"></i>Promotional Offers</h1>
          <div class="subtitle">Seasonal discount campaigns, promo voucher codes, and membership incentives</div>
        </div>
        <div class="d-flex gap-2">
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="OffersMod.openModal()"><i class="bi bi-plus-lg me-1"></i>New Coupon Code</button>' : ''}
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search coupon code..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="active" ${filterStatus === 'active' ? 'selected' : ''}>Active</option>
              <option value="expired" ${filterStatus === 'expired' ? 'selected' : ''}>Expired</option>
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th class="sortable" data-field="code">Coupon Code</th>
                <th>Discount</th>
                <th>Gym</th>
                <th class="sortable" data-field="validFrom">Valid From</th>
                <th class="sortable" data-field="validTo">Valid Until</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(o => {
                const gym = DB.getById('gyms', o.gymId);
                const discountDisplay = o.type === 'percentage' ? `${o.discount}% OFF` : `${Utils.formatCurrency(o.discount)} FLAT OFF`;

                return `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-light text-primary border border-primary font-monospace fs-6 px-2 py-1">${o.code}</span>
                        <button class="btn btn-sm btn-link text-muted p-0" onclick="OffersMod.copyCode('${o.code}')" title="Copy Code"><i class="bi bi-clipboard"></i></button>
                      </div>
                    </td>
                    <td><span class="badge bg-success-subtle text-success fw-bold">${discountDisplay}</span></td>
                    <td><span class="badge bg-light text-dark">${gym?.name || 'All Gyms'}</span></td>
                    <td><small>${Utils.formatDate(o.validFrom)}</small></td>
                    <td><small>${Utils.formatDate(o.validTo)}</small></td>
                    <td>${Utils.statusBadge(o.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="OffersMod.openModal('${o.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="OffersMod.deleteOffer('${o.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-tag', 'No offers found', 'Create seasonal discounts to boost member acquisitions.', Permissions.canCreate(MODULE) ? 'New Coupon Code' : '')}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModal() {
    const gyms = DB.getAll('gyms');

    return `
    <div class="modal fade" id="offerModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="offerModalTitle">New Coupon Code</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="offerForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="offerId">
              <div class="mb-3">
                <label class="form-label">Promo Code *</label>
                <input type="text" class="form-control font-monospace text-uppercase" id="offCode" placeholder="e.g. SUMMER50" required>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Discount Value *</label>
                  <input type="number" class="form-control" id="offDiscount" min="1" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Discount Type *</label>
                  <select class="form-select" id="offType" required>
                    <option value="percentage">Percentage (% OFF)</option>
                    <option value="flat">Flat Amount (${Utils.getCurrencySymbol()} OFF)</option>
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Gym *</label>
                <select class="form-select" id="offGymId" required>
                  <option value="">All Gyms</option>
                  ${gyms.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                </select>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Valid From</label>
                  <input type="date" class="form-control" id="offValidFrom" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Valid Until</label>
                  <input type="date" class="form-control" id="offValidTo" required>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Status</label>
                <select class="form-select" id="offStatus">
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Offer</button>
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
    document.getElementById('offerForm')?.addEventListener('submit', saveOffer);
  }

  function openModal(id) {
    const form = document.getElementById('offerForm');
    Utils.resetForm(form);
    const gymId = Auth.getSelectedGym() || '';
    const today = new Date().toISOString().substring(0, 10);
    const future = new Date();
    future.setMonth(future.getMonth() + 2);

    if (id) {
      const o = DB.getById('offers', id);
      if (!o) return;
      document.getElementById('offerModalTitle').textContent = 'Edit Offer';
      document.getElementById('offerId').value = o.id;
      document.getElementById('offCode').value = o.code || '';
      document.getElementById('offDiscount').value = o.discount || 10;
      document.getElementById('offType').value = o.type || 'percentage';
      document.getElementById('offGymId').value = o.gymId || gymId;
      document.getElementById('offValidFrom').value = o.validFrom ? o.validFrom.substring(0, 10) : today;
      document.getElementById('offValidTo').value = o.validTo ? o.validTo.substring(0, 10) : future.toISOString().substring(0, 10);
      document.getElementById('offStatus').value = o.status || 'active';
    } else {
      document.getElementById('offerModalTitle').textContent = 'New Coupon Code';
      document.getElementById('offGymId').value = gymId;
      document.getElementById('offValidFrom').value = today;
      document.getElementById('offValidTo').value = future.toISOString().substring(0, 10);
    }
    new bootstrap.Modal(document.getElementById('offerModal')).show();
  }

  function saveOffer(e) {
    e.preventDefault();
    const form = document.getElementById('offerForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('offerId').value;
    const data = {
      code: document.getElementById('offCode').value.trim().toUpperCase(),
      discount: parseFloat(document.getElementById('offDiscount').value) || 0,
      type: document.getElementById('offType').value,
      gymId: document.getElementById('offGymId').value,
      validFrom: document.getElementById('offValidFrom').value,
      validTo: document.getElementById('offValidTo').value,
      status: document.getElementById('offStatus').value
    };

    if (id) {
      DB.update('offers', id, data);
      Utils.logAudit('update', 'offers', `Updated promo offer: ${data.code}`);
      Utils.showToast('Offer updated successfully');
    } else {
      DB.create('offers', data);
      Utils.logAudit('create', 'offers', `Created promo offer: ${data.code}`);
      Utils.showToast('Offer created successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('offerModal'))?.hide();
    render();
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    Utils.showToast(`Copied ${code} to clipboard!`);
  }

  function deleteOffer(id) {
    const o = DB.getById('offers', id);
    Utils.showConfirm('Delete Offer', `Delete coupon code <strong>${o?.code}</strong>?`, () => {
      DB.delete('offers', id);
      Utils.logAudit('delete', 'offers', `Deleted offer: ${o?.code}`);
      Utils.showToast('Offer deleted', 'danger');
      render();
    });
  }

  window.OffersMod = { openModal, copyCode, deleteOffer };
  render();
})();

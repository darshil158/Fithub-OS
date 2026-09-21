/* ============================================================
   FitHub OS — Membership Plans Module
   ============================================================ */
(function () {
  'use strict';

  App.init('memberships', [{ label: 'Membership Plans' }]);
  const content = App.getContent();
  const MODULE = 'memberships';
  let currentPage = 1;
  let searchQuery = '';
  let filterGym = '';
  let filterDuration = '';
  let viewMode = 'cards'; // 'cards' or 'table'

  function render() {
    let items = App.getFilteredData('membershipPlans');
    const gyms = DB.getAll('gyms');

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['name', 'features', 'description']);
    // Filter
    if (filterGym) items = items.filter(p => p.gymId === filterGym);
    if (filterDuration) items = items.filter(p => p.duration === filterDuration);

    const durations = Array.from(new Set(DB.getAll('membershipPlans').map(p => p.duration).filter(Boolean)));

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-card-list me-2"></i>Membership Plans</h1>
          <div class="subtitle">Design flexible membership tiers, durations, and facility access packages</div>
        </div>
        <div class="d-flex gap-2">
          <div class="btn-group" role="group">
            <button class="btn btn-outline-secondary ${viewMode === 'cards' ? 'active' : ''}" onclick="MembershipsMod.setView('cards')" title="Card View"><i class="bi bi-grid"></i></button>
            <button class="btn btn-outline-secondary ${viewMode === 'table' ? 'active' : ''}" onclick="MembershipsMod.setView('table')" title="Table View"><i class="bi bi-list"></i></button>
          </div>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="MembershipsMod.openModal()"><i class="bi bi-plus-lg me-1"></i>Create Plan</button>' : ''}
        </div>
      </div>

      <div class="table-container mb-4 fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search plans..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterGym">
              <option value="">All Gyms</option>
              ${gyms.map(g => `<option value="${g.id}" ${filterGym === g.id ? 'selected' : ''}>${g.name}</option>`).join('')}
            </select>
            <select class="form-select" id="filterDuration">
              <option value="">All Durations</option>
              ${durations.map(d => `<option value="${d}" ${filterDuration === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
        </div>

        ${viewMode === 'cards' ? renderCardsView(items) : renderTableView(items)}
      </div>

      ${renderModal()}
    `;

    bindEvents();
  }

  function renderCardsView(items) {
    if (!items.length) {
      return Utils.renderEmptyState('bi-card-list', 'No plans found', 'Create a membership plan to start selling subscriptions.', Permissions.canCreate(MODULE) ? 'Create Plan' : '');
    }

    return `
      <div class="row g-4 p-3">
        ${items.map(p => {
          const gym = DB.getById('gyms', p.gymId);
          const activeSubCount = DB.count('subscriptions', s => s.planId === p.id && s.status === 'active');
          const features = Array.isArray(p.features) ? p.features : (p.features ? p.features.split(',') : []);

          return `
            <div class="col-md-6 col-lg-4">
              <div class="card h-100 shadow-sm border ${p.popular ? 'border-primary' : ''} position-relative" style="border-radius:12px;overflow:hidden">
                ${p.popular ? '<span class="badge bg-primary position-absolute top-0 end-0 m-3 px-2 py-1">Popular</span>' : ''}
                <div class="card-body d-flex flex-column p-4">
                  <div class="text-muted small mb-1">${gym?.name || 'General'}</div>
                  <h4 class="fw-bold mb-2">${p.name}</h4>
                  <div class="d-flex align-items-baseline mb-3">
                    <span class="fs-2 fw-bold text-dark">${Utils.formatCurrency(p.price)}</span>
                    <span class="text-muted ms-2">/ ${p.duration || 'month'}</span>
                  </div>
                  <p class="text-muted small mb-3">${p.description || 'Access to premium gym amenities, lockers, and trainers.'}</p>
                  
                  <div class="mb-4 flex-grow-1">
                    <div class="small fw-semibold text-uppercase text-muted mb-2">What's Included:</div>
                    <ul class="list-unstyled small mb-0">
                      ${features.map(f => `
                        <li class="mb-1 text-secondary"><i class="bi bi-check2 text-success me-2 fw-bold"></i>${f.trim()}</li>
                      `).join('')}
                    </ul>
                  </div>

                  <div class="pt-3 border-top d-flex align-items-center justify-content-between">
                    <div>
                      <span class="badge bg-light text-dark">${activeSubCount} active members</span>
                    </div>
                    <div class="d-flex gap-1">
                      ${Permissions.canEdit(MODULE) ? `<button class="btn btn-sm btn-outline-primary" onclick="MembershipsMod.openModal('${p.id}')"><i class="bi bi-pencil me-1"></i>Edit</button>` : ''}
                      ${Permissions.canDelete(MODULE) ? `<button class="btn btn-sm btn-outline-danger" onclick="MembershipsMod.deletePlan('${p.id}')"><i class="bi bi-trash"></i></button>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderTableView(items) {
    if (!items.length) {
      return Utils.renderEmptyState('bi-card-list', 'No plans found', 'Create a membership plan to start selling subscriptions.', Permissions.canCreate(MODULE) ? 'Create Plan' : '');
    }

    return `
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Gym</th>
              <th>Duration</th>
              <th>Price</th>
              <th>Subscribers</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(p => {
              const gym = DB.getById('gyms', p.gymId);
              const activeCount = DB.count('subscriptions', s => s.planId === p.id && s.status === 'active');
              return `
                <tr>
                  <td>
                    <div class="fw-semibold text-dark">${p.name}</div>
                    ${p.popular ? '<span class="badge bg-primary-subtle text-primary">Featured</span>' : ''}
                  </td>
                  <td>${gym?.name || '—'}</td>
                  <td>${p.duration}</td>
                  <td class="fw-bold text-success">${Utils.formatCurrency(p.price)}</td>
                  <td><span class="badge bg-light text-dark">${activeCount} active</span></td>
                  <td>${Utils.statusBadge(p.status || 'active')}</td>
                  <td>
                    <div class="d-flex gap-1">
                      ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="MembershipsMod.openModal('${p.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                      ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="MembershipsMod.deletePlan('${p.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderModal() {
    const gyms = DB.getAll('gyms');

    return `
    <div class="modal fade" id="planModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="planModalTitle">Create Membership Plan</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="planForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="planId">
              <div class="mb-3">
                <label class="form-label">Plan Name *</label>
                <input type="text" class="form-control" id="planName" placeholder="e.g. Platinum All-Access" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Gym *</label>
                <select class="form-select" id="planGymId" required>
                  <option value="">Select Gym</option>
                  ${gyms.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                </select>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Duration *</label>
                  <select class="form-select" id="planDuration" required>
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="12 Months">12 Months (Annual)</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Price (${Utils.getCurrencySymbol()}) *</label>
                  <input type="number" class="form-control" id="planPrice" min="1" step="1" required>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea class="form-control" id="planDesc" rows="2" placeholder="Brief plan summary"></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Features (comma separated)</label>
                <input type="text" class="form-control" id="planFeatures" placeholder="e.g. Full Gym Access, Steam & Sauna, 2 PT Sessions">
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="planStatus">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div class="col-md-6 d-flex align-items-center pt-4">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="planPopular">
                    <label class="form-check-label" for="planPopular">Featured / Popular</label>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Plan</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterGym')?.addEventListener('change', e => { filterGym = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterDuration')?.addEventListener('change', e => { filterDuration = e.target.value; currentPage = 1; render(); });
    document.getElementById('planForm')?.addEventListener('submit', savePlan);
  }

  function setView(mode) {
    viewMode = mode;
    render();
  }

  function openModal(id) {
    const form = document.getElementById('planForm');
    Utils.resetForm(form);
    const gymId = Auth.getSelectedGym() || '';

    if (id) {
      const p = DB.getById('membershipPlans', id);
      if (!p) return;
      document.getElementById('planModalTitle').textContent = 'Edit Membership Plan';
      document.getElementById('planId').value = p.id;
      document.getElementById('planName').value = p.name || '';
      document.getElementById('planGymId').value = p.gymId || gymId;
      document.getElementById('planDuration').value = p.duration || '1 Month';
      document.getElementById('planPrice').value = Math.round(Utils.convertCurrency(p.price || 0));
      document.getElementById('planDesc').value = p.description || '';
      document.getElementById('planFeatures').value = Array.isArray(p.features) ? p.features.join(', ') : (p.features || '');
      document.getElementById('planStatus').value = p.status || 'active';
      document.getElementById('planPopular').checked = !!p.popular;
    } else {
      document.getElementById('planModalTitle').textContent = 'Create Membership Plan';
      document.getElementById('planGymId').value = gymId;
      document.getElementById('planPrice').value = Math.round(Utils.convertCurrency(2500));
    }
    new bootstrap.Modal(document.getElementById('planModal')).show();
  }

  function savePlan(e) {
    e.preventDefault();
    const form = document.getElementById('planForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('planId').value;
    const rawFeatures = document.getElementById('planFeatures').value;
    const featuresArray = rawFeatures.split(',').map(f => f.trim()).filter(Boolean);

    const enteredPrice = parseFloat(document.getElementById('planPrice').value) || 0;
    const data = {
      name: document.getElementById('planName').value.trim(),
      gymId: document.getElementById('planGymId').value,
      duration: document.getElementById('planDuration').value,
      price: Math.round(Utils.toBaseCurrency(enteredPrice)),
      description: document.getElementById('planDesc').value.trim(),
      features: featuresArray,
      status: document.getElementById('planStatus').value,
      popular: document.getElementById('planPopular').checked
    };

    if (id) {
      DB.update('membershipPlans', id, data);
      Utils.logAudit('update', 'memberships', `Updated membership plan: ${data.name}`);
      Utils.showToast('Plan updated successfully');
    } else {
      DB.create('membershipPlans', data);
      Utils.logAudit('create', 'memberships', `Created membership plan: ${data.name}`);
      Utils.showToast('Plan created successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('planModal'))?.hide();
    render();
  }

  function deletePlan(id) {
    const p = DB.getById('membershipPlans', id);
    Utils.showConfirm('Delete Plan', `Are you sure you want to delete <strong>${p?.name}</strong>? Existing active subscriptions will retain their terms.`, () => {
      DB.delete('membershipPlans', id);
      Utils.logAudit('delete', 'memberships', `Deleted plan: ${p?.name}`);
      Utils.showToast('Plan deleted', 'danger');
      render();
    });
  }

  window.MembershipsMod = { setView, openModal, deletePlan };
  render();
})();

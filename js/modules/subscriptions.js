/* ============================================================
   FitHub OS — Subscriptions Management Module
   ============================================================ */
(function () {
  'use strict';

  App.init('subscriptions', [{ label: 'Subscriptions' }]);
  const content = App.getContent();
  const MODULE = 'subscriptions';
  let currentPage = 1;
  let searchQuery = '';
  let filterStatus = '';
  let filterPlan = '';
  let sortField = 'endDate';
  let sortDir = 'asc';

  function render() {
    let items = DB.getAll('subscriptions');
    const plans = DB.getAll('membershipPlans');
    const members = DB.getAll('members');
    const user = Auth.getCurrentUser();

    // Multi-tenant scope
    if (user.role === 'member') {
      items = items.filter(s => s.memberId === user.id || s.memberId === 'member-1');
    } else {
      const selectedGym = Auth.getSelectedGym();
      if (selectedGym) {
        const gymMemberIds = new Set(DB.query('members', m => m.gymId === selectedGym).map(m => m.id));
        items = items.filter(s => gymMemberIds.has(s.memberId));
      }
    }

    // Search by member name
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(s => {
        const m = DB.getById('members', s.memberId);
        const p = DB.getById('membershipPlans', s.planId);
        return (m?.name || '').toLowerCase().includes(q) || (p?.name || '').toLowerCase().includes(q);
      });
    }

    // Filters
    if (filterStatus) items = items.filter(s => s.status === filterStatus);
    if (filterPlan) items = items.filter(s => s.planId === filterPlan);

    // Metrics
    const activeCount = items.filter(s => s.status === 'active').length;
    const expiredCount = items.filter(s => s.status === 'expired').length;
    const next7Days = Utils.daysFromNow(7).substring(0, 10);
    const todayStr = new Date().toISOString().substring(0, 10);
    const expiringSoon = items.filter(s => s.status === 'active' && s.endDate >= todayStr && s.endDate <= next7Days).length;

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-receipt me-2"></i>Subscriptions</h1>
          <div class="subtitle">Track membership agreements, expiration dates, and automated renewals</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="SubsMod.exportData()"><i class="bi bi-download me-1"></i>Export</button>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="SubsMod.openModal()"><i class="bi bi-plus-lg me-1"></i>New Subscription</button>' : ''}
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-4">
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="bi bi-patch-check"></i></div>
            <div class="kpi-label">Active Subscriptions</div>
            <div class="kpi-value">${activeCount}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-4">
          <div class="kpi-card">
            <div class="kpi-icon warning"><i class="bi bi-hourglass-split"></i></div>
            <div class="kpi-label">Expiring in 7 Days</div>
            <div class="kpi-value">${expiringSoon}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-4">
          <div class="kpi-card">
            <div class="kpi-icon danger"><i class="bi bi-clock-history"></i></div>
            <div class="kpi-label">Expired / Inactive</div>
            <div class="kpi-value">${expiredCount}</div>
          </div>
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search member or plan..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterPlan">
              <option value="">All Plans</option>
              ${plans.map(p => `<option value="${p.id}" ${filterPlan === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="active" ${filterStatus === 'active' ? 'selected' : ''}>Active</option>
              <option value="expired" ${filterStatus === 'expired' ? 'selected' : ''}>Expired</option>
              <option value="cancelled" ${filterStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Fee</th>
                <th class="sortable" data-field="startDate">Start Date</th>
                <th class="sortable" data-field="endDate">End Date</th>
                <th>Auto-Renew</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(s => {
                const m = DB.getById('members', s.memberId);
                const p = DB.getById('membershipPlans', s.planId);
                const isExpiring = s.status === 'active' && s.endDate <= next7Days;

                return `
                  <tr>
                    <td>
                      <div class="fw-semibold text-dark">${m?.name || '—'}</div>
                      <small class="text-muted">${m?.phone || ''}</small>
                    </td>
                    <td><span class="badge bg-primary-subtle text-primary">${p?.name || 'Custom Plan'}</span></td>
                    <td class="fw-bold">${Utils.formatCurrency(s.price || p?.price || 0)}</td>
                    <td><small>${Utils.formatDate(s.startDate)}</small></td>
                    <td>
                      <span class="${isExpiring ? 'text-danger fw-bold' : ''}">
                        ${Utils.formatDate(s.endDate)}
                        ${isExpiring ? '<i class="bi bi-exclamation-triangle ms-1"></i>' : ''}
                      </span>
                    </td>
                    <td>${s.autoRenew ? '<span class="badge bg-success-subtle text-success"><i class="bi bi-check me-1"></i>Yes</span>' : '<span class="text-muted">No</span>'}</td>
                    <td>${Utils.statusBadge(s.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        ${Permissions.canEdit(MODULE) ? `
                          <button class="btn btn-sm btn-outline-success" onclick="SubsMod.renew('${s.id}')" title="Renew Plan"><i class="bi bi-arrow-repeat"></i></button>
                          <button class="btn btn-icon btn-sm btn-outline-primary" onclick="SubsMod.openModal('${s.id}')" title="Edit"><i class="bi bi-pencil"></i></button>
                        ` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="SubsMod.deleteSub('${s.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-receipt', 'No subscriptions found', 'Register member subscriptions to track renewals.', Permissions.canCreate(MODULE) ? 'New Subscription' : '')}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModal() {
    const plans = DB.getAll('membershipPlans');
    const members = DB.getAll('members');

    return `
    <div class="modal fade" id="subModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="subModalTitle">New Subscription</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="subForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="subId">
              <div class="mb-3">
                <label class="form-label">Member *</label>
                <select class="form-select" id="subMemberId" required>
                  <option value="">Select Member</option>
                  ${members.map(m => `<option value="${m.id}">${m.name} (${m.phone || 'No phone'})</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Membership Plan *</label>
                <select class="form-select" id="subPlanId" required>
                  <option value="">Select Plan</option>
                  ${plans.map(p => `<option value="${p.id}" data-price="${p.price}" data-duration="${p.duration}">${p.name} - ${Utils.formatCurrency(p.price)} (${p.duration})</option>`).join('')}
                </select>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Start Date *</label>
                  <input type="date" class="form-control" id="subStartDate" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">End Date *</label>
                  <input type="date" class="form-control" id="subEndDate" required>
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Agreed Price (${Utils.getCurrencySymbol()})</label>
                  <input type="number" class="form-control" id="subPrice" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="subStatus">
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" id="subAutoRenew" checked>
                <label class="form-check-label" for="subAutoRenew">Enable Auto-Renewal</label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Subscription</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterPlan')?.addEventListener('change', e => { filterPlan = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterStatus')?.addEventListener('change', e => { filterStatus = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('subForm')?.addEventListener('submit', saveSub);

    // Auto calculate dates on plan selection
    document.getElementById('subPlanId')?.addEventListener('change', (e) => {
      const selected = e.target.options[e.target.selectedIndex];
      if (!selected.value) return;
      const price = selected.dataset.price;
      const duration = selected.dataset.duration || '1 Month';
      document.getElementById('subPrice').value = Math.round(Utils.convertCurrency(price));

      const startDateInput = document.getElementById('subStartDate');
      const start = startDateInput.value ? new Date(startDateInput.value) : new Date();
      if (!startDateInput.value) startDateInput.value = start.toISOString().substring(0, 10);

      let months = 1;
      if (duration.includes('3')) months = 3;
      else if (duration.includes('6')) months = 6;
      else if (duration.includes('12')) months = 12;

      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      document.getElementById('subEndDate').value = end.toISOString().substring(0, 10);
    });
  }

  function openModal(id) {
    const form = document.getElementById('subForm');
    Utils.resetForm(form);

    if (id) {
      const s = DB.getById('subscriptions', id);
      if (!s) return;
      document.getElementById('subModalTitle').textContent = 'Edit Subscription';
      document.getElementById('subId').value = s.id;
      document.getElementById('subMemberId').value = s.memberId;
      document.getElementById('subPlanId').value = s.planId;
      document.getElementById('subStartDate').value = s.startDate ? s.startDate.substring(0, 10) : '';
      document.getElementById('subEndDate').value = s.endDate ? s.endDate.substring(0, 10) : '';
      document.getElementById('subPrice').value = Math.round(Utils.convertCurrency(s.price || 0));
      document.getElementById('subStatus').value = s.status || 'active';
      document.getElementById('subAutoRenew').checked = !!s.autoRenew;
    } else {
      document.getElementById('subModalTitle').textContent = 'New Subscription';
      document.getElementById('subStartDate').value = new Date().toISOString().substring(0, 10);
      const defaultEnd = new Date();
      defaultEnd.setMonth(defaultEnd.getMonth() + 1);
      document.getElementById('subEndDate').value = defaultEnd.toISOString().substring(0, 10);
    }
    new bootstrap.Modal(document.getElementById('subModal')).show();
  }

  function saveSub(e) {
    e.preventDefault();
    const form = document.getElementById('subForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('subId').value;
    const enteredPrice = parseFloat(document.getElementById('subPrice').value) || 0;
    const data = {
      memberId: document.getElementById('subMemberId').value,
      planId: document.getElementById('subPlanId').value,
      startDate: document.getElementById('subStartDate').value,
      endDate: document.getElementById('subEndDate').value,
      price: Math.round(Utils.toBaseCurrency(enteredPrice)),
      status: document.getElementById('subStatus').value,
      autoRenew: document.getElementById('subAutoRenew').checked
    };

    const member = DB.getById('members', data.memberId);

    if (id) {
      DB.update('subscriptions', id, data);
      Utils.logAudit('update', 'subscriptions', `Updated subscription for ${member?.name}`);
      Utils.showToast('Subscription updated successfully');
    } else {
      DB.create('subscriptions', data);
      // Auto-generate invoice/payment entry
      DB.create('payments', {
        memberId: data.memberId,
        subscriptionId: data.id,
        amount: data.price,
        date: new Date().toISOString(),
        method: 'UPI',
        status: 'paid',
        reference: 'PAY-' + Math.floor(100000 + Math.random() * 900000)
      });
      Utils.logAudit('create', 'subscriptions', `Created subscription for ${member?.name}`);
      Utils.showToast('Subscription created & payment recorded');
    }

    bootstrap.Modal.getInstance(document.getElementById('subModal'))?.hide();
    render();
  }

  function renew(id) {
    const s = DB.getById('subscriptions', id);
    if (!s) return;
    const m = DB.getById('members', s.memberId);
    const p = DB.getById('membershipPlans', s.planId);

    Utils.showConfirm('Renew Subscription', `Renew <strong>${p?.name}</strong> for <strong>${m?.name}</strong>? This will extend the subscription and record a payment.`, () => {
      const currentEnd = new Date(s.endDate > new Date().toISOString() ? s.endDate : new Date());
      currentEnd.setMonth(currentEnd.getMonth() + (p?.duration?.includes('3') ? 3 : (p?.duration?.includes('6') ? 6 : (p?.duration?.includes('12') ? 12 : 1))));
      const newEndDate = currentEnd.toISOString().substring(0, 10);

      DB.update('subscriptions', id, {
        status: 'active',
        endDate: newEndDate
      });

      DB.create('payments', {
        memberId: s.memberId,
        subscriptionId: s.id,
        amount: s.price || p?.price || 2000,
        date: new Date().toISOString(),
        method: 'Card',
        status: 'paid',
        reference: 'REN-' + Math.floor(100000 + Math.random() * 900000)
      });

      Utils.logAudit('renew', 'subscriptions', `Renewed subscription for ${m?.name} until ${newEndDate}`);
      Utils.showToast('Subscription renewed successfully!');
      render();
    }, 'Renew Now', 'btn-success');
  }

  function deleteSub(id) {
    const s = DB.getById('subscriptions', id);
    const m = DB.getById('members', s?.memberId);
    Utils.showConfirm('Cancel Subscription', `Cancel subscription for <strong>${m?.name}</strong>?`, () => {
      DB.delete('subscriptions', id);
      Utils.logAudit('delete', 'subscriptions', `Cancelled subscription of ${m?.name}`);
      Utils.showToast('Subscription deleted', 'danger');
      render();
    });
  }

  function exportData() {
    const items = DB.getAll('subscriptions');
    Utils.exportToCSV(items, 'subscriptions.csv');
    Utils.showToast('Subscriptions exported to CSV');
  }

  window.SubsMod = { openModal, deleteSub, renew, exportData };
  render();
})();

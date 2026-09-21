/* ============================================================
   FitHub OS — Payments Management Module
   ============================================================ */
(function () {
  'use strict';

  App.init('payments', [{ label: 'Payments' }]);
  const content = App.getContent();
  const MODULE = 'payments';
  let currentPage = 1;
  let searchQuery = '';
  let filterMethod = '';
  let filterStatus = '';
  let sortField = 'date';
  let sortDir = 'desc';

  function render() {
    let items = DB.getAll('payments');
    const user = Auth.getCurrentUser();

    // Multi-tenant check
    if (user.role === 'member') {
      items = items.filter(p => p.memberId === user.id || p.memberId === 'member-1');
    } else {
      const selectedGym = Auth.getSelectedGym();
      if (selectedGym) {
        const gymMembers = new Set(DB.query('members', m => m.gymId === selectedGym).map(m => m.id));
        items = items.filter(p => gymMembers.has(p.memberId));
      }
    }

    // Financial KPIs
    const totalCollected = items.reduce((acc, p) => acc + (p.status === 'paid' ? Number(p.amount) : 0), 0);
    const pendingAmount = items.reduce((acc, p) => acc + (p.status === 'pending' ? Number(p.amount) : 0), 0);
    const totalTransactions = items.length;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(p => {
        const m = DB.getById('members', p.memberId);
        return (m?.name || '').toLowerCase().includes(q) || (p.reference || '').toLowerCase().includes(q);
      });
    }

    // Filter
    if (filterMethod) items = items.filter(p => p.method === filterMethod);
    if (filterStatus) items = items.filter(p => p.status === filterStatus);

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-credit-card me-2"></i>Payments</h1>
          <div class="subtitle">Real-time payment logs, gateway records, and transaction histories</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="PaymentsMod.exportData()"><i class="bi bi-download me-1"></i>Export</button>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="PaymentsMod.openModal()"><i class="bi bi-plus-lg me-1"></i>Record Payment</button>' : ''}
        </div>
      </div>

      <!-- Financial KPIs -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-4">
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="bi bi-cash-stack"></i></div>
            <div class="kpi-label">Total Revenue Collected</div>
            <div class="kpi-value text-success">${Utils.formatCurrency(totalCollected)}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-4">
          <div class="kpi-card">
            <div class="kpi-icon warning"><i class="bi bi-hourglass-split"></i></div>
            <div class="kpi-label">Pending / Unpaid Dues</div>
            <div class="kpi-value text-warning">${Utils.formatCurrency(pendingAmount)}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-4">
          <div class="kpi-card">
            <div class="kpi-icon info"><i class="bi bi-receipt-cutoff"></i></div>
            <div class="kpi-label">Total Transactions</div>
            <div class="kpi-value">${totalTransactions}</div>
          </div>
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search member or reference ID..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterMethod">
              <option value="">All Methods</option>
              <option value="UPI" ${filterMethod === 'UPI' ? 'selected' : ''}>UPI</option>
              <option value="Card" ${filterMethod === 'Card' ? 'selected' : ''}>Card</option>
              <option value="Cash" ${filterMethod === 'Cash' ? 'selected' : ''}>Cash</option>
              <option value="Net Banking" ${filterMethod === 'Net Banking' ? 'selected' : ''}>Net Banking</option>
            </select>
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="paid" ${filterStatus === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="pending" ${filterStatus === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="refunded" ${filterStatus === 'refunded' ? 'selected' : ''}>Refunded</option>
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Reference #</th>
                <th>Member</th>
                <th class="sortable" data-field="amount">Amount</th>
                <th>Method</th>
                <th class="sortable" data-field="date">Date & Time</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(p => {
                const m = DB.getById('members', p.memberId);
                return `
                  <tr>
                    <td>
                      <span class="font-monospace text-muted fw-medium">${p.reference || p.id}</span>
                    </td>
                    <td>
                      <div class="fw-semibold text-dark">${m?.name || '—'}</div>
                      <small class="text-muted">${m?.phone || ''}</small>
                    </td>
                    <td class="fw-bold text-dark">${Utils.formatCurrency(p.amount)}</td>
                    <td><span class="badge bg-light text-dark"><i class="bi bi-wallet2 me-1"></i>${p.method || 'UPI'}</span></td>
                    <td><small>${Utils.formatDateTime(p.date)}</small></td>
                    <td>${Utils.statusBadge(p.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        <button class="btn btn-icon btn-sm btn-outline-info" onclick="PaymentsMod.printReceipt('${p.id}')" title="Receipt"><i class="bi bi-file-earmark-text"></i></button>
                        ${p.status === 'paid' && Permissions.canEdit(MODULE) ? `
                          <button class="btn btn-icon btn-sm btn-outline-danger" onclick="PaymentsMod.refund('${p.id}')" title="Refund"><i class="bi bi-arrow-counterclockwise"></i></button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-credit-card', 'No payments found', 'Record manual payments or subscriptions will log entries.', Permissions.canCreate(MODULE) ? 'Record Payment' : '')}
      </div>

      ${renderModals()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModals() {
    const members = DB.getAll('members');

    return `
    <!-- Record Payment Modal -->
    <div class="modal fade" id="paymentModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Record Payment</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="paymentForm" novalidate>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Member *</label>
                <select class="form-select" id="payMemberId" required>
                  <option value="">Select Member</option>
                  ${members.map(m => `<option value="${m.id}">${m.name} (${m.phone || ''})</option>`).join('')}
                </select>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Amount (${Utils.getCurrencySymbol()}) *</label>
                  <input type="number" class="form-control" id="payAmount" min="1" step="any" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Payment Method *</label>
                  <select class="form-select" id="payMethod" required>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Reference ID / Transaction #</label>
                <input type="text" class="form-control" id="payRef" placeholder="e.g. UPI-983719283">
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Payment Date</label>
                  <input type="datetime-local" class="form-control" id="payDate">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="payStatus">
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Payment</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div class="modal fade" id="receiptModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content" id="receiptModalContent"></div>
      </div>
    </div>
    `;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterMethod')?.addEventListener('change', e => { filterMethod = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterStatus')?.addEventListener('change', e => { filterStatus = e.target.value; currentPage = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('paymentForm')?.addEventListener('submit', savePayment);
  }

  function openModal() {
    const form = document.getElementById('paymentForm');
    Utils.resetForm(form);
    document.getElementById('payRef').value = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('payDate').value = now.toISOString().slice(0, 16);
    new bootstrap.Modal(document.getElementById('paymentModal')).show();
  }

  function savePayment(e) {
    e.preventDefault();
    const form = document.getElementById('paymentForm');
    if (!Utils.validateForm(form)) return;

    const enteredAmount = parseFloat(document.getElementById('payAmount').value) || 0;
    const baseAmount = Utils.toBaseCurrency(enteredAmount);

    const data = {
      memberId: document.getElementById('payMemberId').value,
      amount: baseAmount,
      method: document.getElementById('payMethod').value,
      reference: document.getElementById('payRef').value.trim() || ('TXN-' + Date.now()),
      date: document.getElementById('payDate').value ? new Date(document.getElementById('payDate').value).toISOString() : new Date().toISOString(),
      status: document.getElementById('payStatus').value
    };

    const member = DB.getById('members', data.memberId);
    DB.create('payments', data);
    Utils.logAudit('create', 'payments', `Logged payment of ${Utils.formatCurrency(data.amount)} for ${member?.name}`);
    Utils.showToast('Payment recorded successfully');

    bootstrap.Modal.getInstance(document.getElementById('paymentModal'))?.hide();
    render();
  }

  function refund(id) {
    const p = DB.getById('payments', id);
    const m = DB.getById('members', p?.memberId);
    Utils.showConfirm('Refund Payment', `Are you sure you want to mark transaction <strong>${p?.reference}</strong> (${Utils.formatCurrency(p?.amount)}) as refunded for <strong>${m?.name}</strong>?`, () => {
      DB.update('payments', id, { status: 'refunded' });
      Utils.logAudit('refund', 'payments', `Refunded ${Utils.formatCurrency(p.amount)} to ${m?.name}`);
      Utils.showToast('Payment marked as refunded', 'warning');
      render();
    }, 'Process Refund', 'btn-warning');
  }

  function printReceipt(id) {
    const p = DB.getById('payments', id);
    if (!p) return;
    const m = DB.getById('members', p.memberId);
    const gym = m ? DB.getById('gyms', m.gymId) : null;
    const branch = m ? DB.getById('branches', m.branchId) : null;

    const container = document.getElementById('receiptModalContent');
    container.innerHTML = `
      <div class="modal-header">
        <h5 class="modal-title"><i class="bi bi-receipt me-2"></i>Official Payment Receipt</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body p-4" id="printableReceipt">
        <div class="text-center pb-3 border-bottom mb-3">
          <h4 class="fw-bold text-primary mb-1">${gym?.name || 'FitHub OS Partner Gym'}</h4>
          <p class="text-muted small mb-0">${branch?.name || 'Main Branch'} · ${branch?.address || ''}</p>
        </div>
        <div class="d-flex justify-content-between mb-3">
          <div>
            <div class="text-muted small">Billed To:</div>
            <div class="fw-bold">${m?.name || 'Member'}</div>
            <div class="small">${m?.phone || ''}</div>
          </div>
          <div class="text-end">
            <div class="text-muted small">Receipt No:</div>
            <div class="fw-bold">${p.reference}</div>
            <div class="small">${Utils.formatDate(p.date)}</div>
          </div>
        </div>
        <table class="table table-bordered my-3">
          <thead><tr><th>Description</th><th class="text-end">Amount</th></tr></thead>
          <tbody>
            <tr>
              <td>Gym Membership / Facility Access Fee</td>
              <td class="text-end fw-bold">${Utils.formatCurrency(p.amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th>Total Paid (${p.method}):</th>
              <th class="text-end text-success fs-5">${Utils.formatCurrency(p.amount)}</th>
            </tr>
          </tfoot>
        </table>
        <div class="alert alert-light text-center small mb-0">
          Payment Status: <span class="badge bg-success">${p.status.toUpperCase()}</span><br>
          Thank you for training with us!
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary" onclick="window.print()"><i class="bi bi-printer me-1"></i>Print Receipt</button>
      </div>
    `;
    new bootstrap.Modal(document.getElementById('receiptModal')).show();
  }

  function exportData() {
    const items = DB.getAll('payments');
    Utils.exportToCSV(items, 'payments.csv');
    Utils.showToast('Payments exported to CSV');
  }

  window.PaymentsMod = { openModal, refund, printReceipt, exportData };
  render();
})();

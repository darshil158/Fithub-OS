/* ============================================================
   FitHub OS — Invoices & Billing Module
   ============================================================ */
(function () {
  'use strict';

  App.init('invoices', [{ label: 'Invoices' }]);
  const content = App.getContent();
  const MODULE = 'invoices';
  let currentPage = 1;
  let searchQuery = '';
  let filterStatus = '';
  let sortField = 'issueDate';
  let sortDir = 'desc';

  function render() {
    let items = DB.getAll('invoices');
    const user = Auth.getCurrentUser();

    // Multi-tenant isolation
    if (user.role === 'member') {
      items = items.filter(i => i.memberId === user.id || i.memberId === 'member-1');
    } else {
      const selectedGym = Auth.getSelectedGym();
      if (selectedGym) {
        items = items.filter(i => i.gymId === selectedGym);
      }
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => {
        const m = DB.getById('members', i.memberId);
        return (i.invoiceNumber || '').toLowerCase().includes(q) || (m?.name || '').toLowerCase().includes(q);
      });
    }

    // Filter status
    if (filterStatus) items = items.filter(i => i.status === filterStatus);

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-file-earmark-text me-2"></i>Invoices</h1>
          <div class="subtitle">Tax-compliant billing statements, itemized invoices, and due reminders</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="InvoicesMod.exportData()"><i class="bi bi-download me-1"></i>Export</button>
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="InvoicesMod.openModal()"><i class="bi bi-plus-lg me-1"></i>Create Invoice</button>' : ''}
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search invoice # or member..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterStatus">
              <option value="">All Status</option>
              <option value="paid" ${filterStatus === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="pending" ${filterStatus === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="overdue" ${filterStatus === 'overdue' ? 'selected' : ''}>Overdue</option>
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th class="sortable" data-field="invoiceNumber">Invoice #</th>
                <th>Member</th>
                <th class="sortable" data-field="issueDate">Issued</th>
                <th class="sortable" data-field="dueDate">Due Date</th>
                <th class="sortable" data-field="total">Total Amount</th>
                <th class="sortable" data-field="status">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(i => {
                const m = DB.getById('members', i.memberId);
                return `
                  <tr>
                    <td>
                      <span class="fw-semibold text-primary font-monospace">${i.invoiceNumber || ('INV-' + i.id.substring(0, 6))}</span>
                    </td>
                    <td>
                      <div class="fw-semibold text-dark">${m?.name || '—'}</div>
                      <small class="text-muted">${m?.phone || ''}</small>
                    </td>
                    <td><small>${Utils.formatDate(i.issueDate)}</small></td>
                    <td><small>${Utils.formatDate(i.dueDate)}</small></td>
                    <td class="fw-bold text-dark">${Utils.formatCurrency(i.total)}</td>
                    <td>${Utils.statusBadge(i.status)}</td>
                    <td>
                      <div class="d-flex gap-1">
                        <button class="btn btn-icon btn-sm btn-outline-info" onclick="InvoicesMod.viewInvoice('${i.id}')" title="View / Print"><i class="bi bi-eye"></i></button>
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="InvoicesMod.deleteInvoice('${i.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-file-earmark-text', 'No invoices found', 'Create branded tax invoices for memberships and add-ons.', Permissions.canCreate(MODULE) ? 'Create Invoice' : '')}
      </div>

      ${renderModals()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModals() {
    const members = DB.getAll('members');
    const gyms = DB.getAll('gyms');

    return `
    <!-- Create Invoice Modal -->
    <div class="modal fade" id="invoiceModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Invoice</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="invoiceForm" novalidate>
            <div class="modal-body">
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Member *</label>
                  <select class="form-select" id="invMemberId" required>
                    <option value="">Select Member</option>
                    ${members.map(m => `<option value="${m.id}" data-gym="${m.gymId}">${m.name} (${m.phone || ''})</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Gym *</label>
                  <select class="form-select" id="invGymId" required>
                    <option value="">Select Gym</option>
                    ${gyms.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Issue Date *</label>
                  <input type="date" class="form-control" id="invIssueDate" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Due Date *</label>
                  <input type="date" class="form-control" id="invDueDate" required>
                </div>
              </div>

              <!-- Line Items -->
              <h6 class="mt-4 mb-2">Itemized Products / Services</h6>
              <div class="border rounded p-3 mb-3 bg-light">
                <div class="row g-2 mb-2">
                  <div class="col-7"><input type="text" class="form-control" id="invItemDesc" placeholder="Item description (e.g. Annual Gym Access)" value="Quarterly Gym Membership"></div>
                  <div class="col-2"><input type="number" class="form-control" id="invItemQty" value="1" min="1" placeholder="Qty"></div>
                  <div class="col-3"><input type="number" class="form-control" id="invItemPrice" value="${Math.round(Utils.convertCurrency(4500))}" min="0" step="any" placeholder="Rate (${Utils.getCurrencySymbol()})"></div>
                </div>
              </div>

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Status</label>
                  <select class="form-select" id="invStatus">
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">GST / Tax Rate</label>
                  <select class="form-select" id="invTaxRate">
                    <option value="0.18">18% GST</option>
                    <option value="0.05">5% GST</option>
                    <option value="0">None (0%)</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Generate Invoice</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Invoice View / Print Modal -->
    <div class="modal fade" id="invoiceViewModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" id="invoiceDetailContent"></div>
      </div>
    </div>
    `;
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
    document.getElementById('invoiceForm')?.addEventListener('submit', saveInvoice);

    document.getElementById('invMemberId')?.addEventListener('change', (e) => {
      const selected = e.target.options[e.target.selectedIndex];
      const gId = selected.dataset.gym;
      if (gId) document.getElementById('invGymId').value = gId;
    });
  }

  function openModal() {
    const form = document.getElementById('invoiceForm');
    Utils.resetForm(form);
    const today = new Date().toISOString().substring(0, 10);
    const due = new Date();
    due.setDate(due.getDate() + 15);
    document.getElementById('invIssueDate').value = today;
    document.getElementById('invDueDate').value = due.toISOString().substring(0, 10);
    const gymId = Auth.getSelectedGym();
    if (gymId) document.getElementById('invGymId').value = gymId;
    document.getElementById('invItemPrice').value = Math.round(Utils.convertCurrency(4500));
    new bootstrap.Modal(document.getElementById('invoiceModal')).show();
  }

  function saveInvoice(e) {
    e.preventDefault();
    const form = document.getElementById('invoiceForm');
    if (!Utils.validateForm(form)) return;

    const desc = document.getElementById('invItemDesc').value.trim() || 'Gym Membership';
    const qty = parseInt(document.getElementById('invItemQty').value) || 1;
    const enteredRate = parseFloat(document.getElementById('invItemPrice').value) || 0;
    const rate = Utils.toBaseCurrency(enteredRate);
    const subtotal = qty * rate;
    const taxRate = parseFloat(document.getElementById('invTaxRate').value) || 0;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const data = {
      invoiceNumber: 'INV-' + Math.floor(100000 + Math.random() * 900000),
      memberId: document.getElementById('invMemberId').value,
      gymId: document.getElementById('invGymId').value,
      issueDate: document.getElementById('invIssueDate').value,
      dueDate: document.getElementById('invDueDate').value,
      items: [{ description: desc, qty, rate, total: subtotal }],
      subtotal,
      tax,
      total,
      status: document.getElementById('invStatus').value
    };

    const member = DB.getById('members', data.memberId);
    DB.create('invoices', data);
    Utils.logAudit('create', 'invoices', `Created invoice ${data.invoiceNumber} for ${member?.name}`);
    Utils.showToast('Invoice generated successfully');

    bootstrap.Modal.getInstance(document.getElementById('invoiceModal'))?.hide();
    render();
  }

  function deleteInvoice(id) {
    const inv = DB.getById('invoices', id);
    Utils.showConfirm('Delete Invoice', `Are you sure you want to delete invoice <strong>${inv?.invoiceNumber}</strong>?`, () => {
      DB.delete('invoices', id);
      Utils.logAudit('delete', 'invoices', `Deleted invoice ${inv?.invoiceNumber}`);
      Utils.showToast('Invoice deleted', 'danger');
      render();
    });
  }

  function viewInvoice(id) {
    const inv = DB.getById('invoices', id);
    if (!inv) return;
    const m = DB.getById('members', inv.memberId);
    const gym = DB.getById('gyms', inv.gymId);

    const items = inv.items || [{ description: 'Gym Subscription Fee', qty: 1, rate: inv.total, total: inv.total }];

    const container = document.getElementById('invoiceDetailContent');
    container.innerHTML = `
      <div class="modal-header">
        <h5 class="modal-title">Tax Invoice — ${inv.invoiceNumber}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body p-4">
        <div class="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
          <div>
            <h4 class="fw-bold text-primary mb-1">${gym?.name || 'FitHub Fitness Pvt Ltd'}</h4>
            <div class="text-muted small">${gym?.address || 'India'}</div>
            <div class="text-muted small">GSTIN: 27AABCU9603R1ZM</div>
          </div>
          <div class="text-end">
            <h5 class="fw-bold mb-1">${inv.invoiceNumber}</h5>
            <div class="text-muted small">Issued: ${Utils.formatDate(inv.issueDate)}</div>
            <div class="text-muted small">Due: ${Utils.formatDate(inv.dueDate)}</div>
            <div class="mt-1">${Utils.statusBadge(inv.status)}</div>
          </div>
        </div>

        <div class="mb-4">
          <div class="text-muted small">Customer / Billed To:</div>
          <div class="fw-bold fs-6">${m?.name || 'Valued Member'}</div>
          <div class="small">${m?.email || ''} · ${Utils.formatPhone(m?.phone)}</div>
        </div>

        <div class="table-responsive mb-3">
          <table class="table table-bordered">
            <thead class="table-light">
              <tr>
                <th>Description</th>
                <th class="text-center" style="width:70px">Qty</th>
                <th class="text-end" style="width:120px">Rate</th>
                <th class="text-end" style="width:130px">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td class="text-center">${item.qty || 1}</td>
                  <td class="text-end">${Utils.formatCurrency(item.rate || item.total)}</td>
                  <td class="text-end fw-semibold">${Utils.formatCurrency(item.total || (item.qty * item.rate))}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-end">Subtotal:</td>
                <td class="text-end">${Utils.formatCurrency(inv.subtotal || (inv.total * 0.85))}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-end">GST (18%):</td>
                <td class="text-end">${Utils.formatCurrency(inv.tax || (inv.total * 0.15))}</td>
              </tr>
              <tr class="table-light">
                <td colspan="3" class="text-end fw-bold">Total:</td>
                <td class="text-end fw-bold text-primary fs-5">${Utils.formatCurrency(inv.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary" onclick="window.print()"><i class="bi bi-printer me-1"></i>Print Invoice</button>
      </div>
    `;
    new bootstrap.Modal(document.getElementById('invoiceViewModal')).show();
  }

  function exportData() {
    const items = DB.getAll('invoices');
    Utils.exportToCSV(items, 'invoices.csv');
    Utils.showToast('Invoices exported to CSV');
  }

  window.InvoicesMod = { openModal, deleteInvoice, viewInvoice, exportData };
  render();
})();

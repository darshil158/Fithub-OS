/* ============================================================
   FitHub OS — Utility Functions
   Shared formatting, UI helpers, and reusable components.
   ============================================================ */

const Utils = (() => {
  'use strict';

  // ---------- Currency & Multi-Currency System ----------
  const CURRENCIES = {
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1.0, locale: 'en-IN', decimals: 0, usdRate: 83.5 },
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 / 83.5, locale: 'en-US', decimals: 2, usdRate: 1.0 },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 1 / 91.0, locale: 'de-DE', decimals: 2, usdRate: 1.09 },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 1 / 106.0, locale: 'en-GB', decimals: 2, usdRate: 1.27 }
  };

  function getCurrency() {
    try {
      const saved = localStorage.getItem('fithub_currency');
      if (saved && CURRENCIES[saved]) return CURRENCIES[saved];
    } catch {}
    return CURRENCIES.INR;
  }

  function setCurrency(code) {
    if (CURRENCIES[code]) {
      localStorage.setItem('fithub_currency', code);
      return CURRENCIES[code];
    }
    return getCurrency();
  }

  function getCurrencySymbol() {
    return getCurrency().symbol;
  }

  function convertCurrency(amountInINR) {
    const curr = getCurrency();
    return (parseFloat(amountInINR) || 0) * curr.rate;
  }

  function toBaseCurrency(amountInSelected) {
    const curr = getCurrency();
    return (parseFloat(amountInSelected) || 0) / curr.rate;
  }

  function formatCurrency(amountInINR, explicitDecimals = null) {
    const curr = getCurrency();
    const converted = convertCurrency(amountInINR);

    if (curr.code === 'INR') {
      return '₹' + Math.round(converted).toLocaleString('en-IN');
    }

    const dec = explicitDecimals !== null ? explicitDecimals : 2;
    return curr.symbol + converted.toLocaleString(curr.locale, {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function formatTime(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function formatPhone(phone) {
    if (!phone) return '—';
    return phone.replace(/(\d{5})(\d{5})/, '$1 $2');
  }

  function timeAgo(dateStr) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return formatDate(dateStr);
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  function titleCase(str) {
    if (!str) return '';
    return str.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // ---------- ID Generation ----------
  function generateId() {
    return DB.generateId();
  }

  // ---------- Debounce ----------
  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ---------- Toast Notifications ----------
  let toastContainer = null;

  function _ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  function showToast(message, type = 'success', duration = 3000) {
    const container = _ensureToastContainer();
    const icons = {
      success: 'bi-check-circle-fill',
      danger: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill'
    };
    const id = 'toast_' + Date.now();
    const html = `
      <div id="${id}" class="toast align-items-center text-bg-${type} border-0 show" role="alert">
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi ${icons[type] || icons.info} me-2"></i>${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    setTimeout(() => { el?.remove(); }, duration);
  }

  // ---------- Confirmation Dialog ----------
  function showConfirm(title, message, onConfirm, confirmText = 'Delete', confirmClass = 'btn-danger') {
    // Remove existing
    document.getElementById('globalConfirmModal')?.remove();
    const html = `
      <div class="modal fade" id="globalConfirmModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body"><p class="mb-0">${message}</p></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn ${confirmClass}" id="confirmActionBtn">${confirmText}</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const modal = new bootstrap.Modal(document.getElementById('globalConfirmModal'));
    document.getElementById('confirmActionBtn').addEventListener('click', () => {
      modal.hide();
      onConfirm();
    });
    document.getElementById('globalConfirmModal').addEventListener('hidden.bs.modal', function () {
      this.remove();
    });
    modal.show();
  }

  // ---------- Pagination ----------
  function paginate(items, page = 1, perPage = 10) {
    const total = items.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (page - 1) * perPage;
    const data = items.slice(start, start + perPage);
    return { data, page, perPage, total, totalPages };
  }

  function renderPagination(containerId, paginationData, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const { page, totalPages, total, perPage } = paginationData;
    if (totalPages <= 1) { container.innerHTML = `<small class="text-muted">Showing all ${total} records</small>`; return; }

    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);

    let html = `<div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
      <small class="text-muted">Showing ${start}–${end} of ${total}</small>
      <nav><ul class="pagination pagination-sm mb-0">`;

    html += `<li class="page-item ${page <= 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page - 1}"><i class="bi bi-chevron-left"></i></a></li>`;

    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    if (startPage > 1) html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
    if (startPage > 2) html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;

    for (let i = startPage; i <= endPage; i++) {
      html += `<li class="page-item ${i === page ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }

    if (endPage < totalPages - 1) html += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
    if (endPage < totalPages) html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;

    html += `<li class="page-item ${page >= totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${page + 1}"><i class="bi bi-chevron-right"></i></a></li>`;
    html += `</ul></nav></div>`;

    container.innerHTML = html;
    container.querySelectorAll('.page-link[data-page]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const p = parseInt(e.currentTarget.dataset.page);
        if (p >= 1 && p <= totalPages && p !== page) onPageChange(p);
      });
    });
  }

  // ---------- Empty State ----------
  function renderEmptyState(icon = 'bi-inbox', title = 'No data found', subtitle = '', actionText = '', actionFn = null) {
    let html = `<div class="empty-state text-center py-5">
      <i class="bi ${icon} empty-state-icon"></i>
      <h5 class="mt-3">${title}</h5>
      ${subtitle ? `<p class="text-muted">${subtitle}</p>` : ''}`;
    if (actionText && actionFn) {
      html += `<button class="btn btn-primary btn-sm mt-2" id="emptyStateAction">${actionText}</button>`;
    }
    html += `</div>`;
    return html;
  }

  // ---------- Loading State ----------
  function renderLoading() {
    return `<div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading…</span></div>
      <p class="text-muted mt-2 mb-0">Loading data…</p>
    </div>`;
  }

  // ---------- Status Badge ----------
  function statusBadge(status) {
    const map = {
      active: 'success', enabled: 'success', paid: 'success', completed: 'success',
      present: 'success', confirmed: 'success', approved: 'success', resolved: 'success',
      inactive: 'secondary', disabled: 'secondary', cancelled: 'secondary',
      expired: 'danger', overdue: 'danger', failed: 'danger', absent: 'danger',
      rejected: 'danger', broken: 'danger',
      pending: 'warning', due: 'warning', upcoming: 'warning', in_progress: 'warning',
      frozen: 'info', trial: 'info', new: 'info', scheduled: 'info',
      suspended: 'dark', draft: 'dark'
    };
    const key = (status || '').toLowerCase().replace(/\s+/g, '_');
    const color = map[key] || 'secondary';
    const label = titleCase(status || 'Unknown');
    return `<span class="badge bg-${color}">${label}</span>`;
  }

  // ---------- Form Validation ----------
  function validateForm(formEl) {
    formEl.classList.add('was-validated');
    return formEl.checkValidity();
  }

  function resetForm(formEl) {
    formEl.reset();
    formEl.classList.remove('was-validated');
  }

  // ---------- CSV Export ----------
  function exportToCSV(data, filename = 'export.csv') {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        let val = row[h] ?? '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      }).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ---------- Search / Filter / Sort helpers ----------
  function searchItems(items, query, fields) {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter(item => fields.some(f => (item[f] || '').toString().toLowerCase().includes(q)));
  }

  function sortItems(items, field, direction = 'asc') {
    if (!field) return items;
    return [...items].sort((a, b) => {
      let va = a[field] ?? '';
      let vb = b[field] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return direction === 'asc' ? -1 : 1;
      if (va > vb) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ---------- Date helpers ----------
  function daysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  function daysAgo(days) {
    return daysFromNow(-days);
  }

  function isToday(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }

  function monthsBetween(d1, d2) {
    const a = new Date(d1);
    const b = new Date(d2);
    return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  }

  // ---------- Audit Log helper ----------
  function logAudit(action, module, details = '') {
    const user = Auth?.getCurrentUser?.();
    DB.create('auditLogs', {
      userId: user?.id || 'system',
      userName: user?.name || 'System',
      action,
      module,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // ---------- Notification helper ----------
  function addNotification(userId, title, message, type = 'info') {
    DB.create('notifications', {
      userId,
      title,
      message,
      type,
      read: false,
      date: new Date().toISOString()
    });
  }

  return {
    CURRENCIES, getCurrency, setCurrency, getCurrencySymbol, convertCurrency, toBaseCurrency,
    formatCurrency, formatDate, formatDateTime, formatTime, formatPhone,
    timeAgo, capitalize, titleCase, generateId, debounce,
    showToast, showConfirm,
    paginate, renderPagination,
    renderEmptyState, renderLoading, statusBadge,
    validateForm, resetForm, exportToCSV,
    searchItems, sortItems,
    daysFromNow, daysAgo, isToday, monthsBetween,
    logAudit, addNotification
  };
})();

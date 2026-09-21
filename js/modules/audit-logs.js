/* ============================================================
   FitHub OS — Audit Logs & Compliance Module
   ============================================================ */
(function () {
  'use strict';

  App.init('auditLogs', [{ label: 'Audit Logs' }]);
  const content = App.getContent();
  let currentPage = 1;
  let searchQuery = '';
  let filterModule = '';
  let filterAction = '';

  function render() {
    let items = DB.getAll('auditLogs');

    // Search
    if (searchQuery) items = Utils.searchItems(items, searchQuery, ['userName', 'action', 'module', 'details']);
    // Filter
    if (filterModule) items = items.filter(a => a.module === filterModule);
    if (filterAction) items = items.filter(a => a.action === filterAction);

    const modules = Array.from(new Set(DB.getAll('auditLogs').map(a => a.module).filter(Boolean)));
    const actions = Array.from(new Set(DB.getAll('auditLogs').map(a => a.action).filter(Boolean)));

    // Sort newest first
    items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    const pg = Utils.paginate(items, currentPage, 15);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-journal-text me-2"></i>Security & Audit Logs</h1>
          <div class="subtitle">Immutable forensic audit trail, user activity tracking, and compliance logs</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="AuditMod.exportData()"><i class="bi bi-download me-1"></i>Export Logs</button>
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search user or action..." id="searchInput" value="${searchQuery}">
          </div>
          <div class="filter-bar">
            <select class="form-select" id="filterModule">
              <option value="">All Modules</option>
              ${modules.map(m => `<option value="${m}" ${filterModule === m ? 'selected' : ''}>${Utils.titleCase(m)}</option>`).join('')}
            </select>
            <select class="form-select" id="filterAction">
              <option value="">All Actions</option>
              ${actions.map(a => `<option value="${a}" ${filterAction === a ? 'selected' : ''}>${Utils.titleCase(a)}</option>`).join('')}
            </select>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle font-monospace small">
            <thead>
              <tr class="font-sans">
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Action</th>
                <th>Module</th>
                <th>Activity Details</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(a => {
                const actionColors = {
                  create: 'success',
                  update: 'primary',
                  delete: 'danger',
                  renew: 'info',
                  refund: 'warning',
                  login: 'dark'
                };
                const color = actionColors[a.action?.toLowerCase()] || 'secondary';

                return `
                  <tr>
                    <td><span class="text-muted">${Utils.formatDateTime(a.timestamp)}</span></td>
                    <td class="fw-semibold text-dark">${a.userName || 'System'}</td>
                    <td><span class="badge bg-${color}">${(a.action || 'ACTION').toUpperCase()}</span></td>
                    <td><span class="badge bg-light text-dark">${Utils.titleCase(a.module || 'System')}</span></td>
                    <td class="text-secondary">${a.details || '—'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-journal-text', 'No audit logs found', 'All platform modifications are recorded here automatically.')}
      </div>
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.getElementById('filterModule')?.addEventListener('change', e => { filterModule = e.target.value; currentPage = 1; render(); });
    document.getElementById('filterAction')?.addEventListener('change', e => { filterAction = e.target.value; currentPage = 1; render(); });
  }

  function exportData() {
    const items = DB.getAll('auditLogs');
    Utils.exportToCSV(items, 'audit_logs.csv');
    Utils.showToast('Audit logs exported to CSV');
  }

  window.AuditMod = { exportData };
  render();
})();

/* ============================================================
   FitHub OS — Notifications Module
   ============================================================ */
(function () {
  'use strict';

  App.init('notifications', [{ label: 'Notifications' }]);
  const content = App.getContent();
  const MODULE = 'notifications';
  let currentPage = 1;
  let filterUnreadOnly = false;

  function render() {
    const user = Auth.getCurrentUser();
    let items = DB.getAll('notifications');

    // Filter by user
    items = items.filter(n => n.userId === user.id || !n.userId || n.userId === 'all');

    if (filterUnreadOnly) {
      items = items.filter(n => !n.read);
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const pg = Utils.paginate(items, currentPage, 10);

    const unreadCount = items.filter(n => !n.read).length;

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-bell me-2"></i>Notifications & Alerts</h1>
          <div class="subtitle">Platform updates, member renewals, and automated schedule triggers</div>
        </div>
        <div class="d-flex gap-2">
          ${unreadCount > 0 ? `<button class="btn btn-outline-secondary" onclick="NotifsMod.markAllRead()"><i class="bi bi-check2-all me-1"></i>Mark All as Read</button>` : ''}
          ${['super_admin', 'gym_owner'].includes(user.role) ? `<button class="btn btn-primary" onclick="NotifsMod.openModal()"><i class="bi bi-broadcast me-1"></i>Broadcast Alert</button>` : ''}
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="btn-group" role="group">
            <button class="btn btn-outline-secondary ${!filterUnreadOnly ? 'active' : ''}" onclick="NotifsMod.setFilter(false)">All (${items.length})</button>
            <button class="btn btn-outline-secondary ${filterUnreadOnly ? 'active' : ''}" onclick="NotifsMod.setFilter(true)">Unread (${unreadCount})</button>
          </div>
        </div>

        ${pg.data.length ? `
        <div class="list-group list-group-flush">
          ${pg.data.map(n => {
            const iconMap = {
              success: 'bi-check-circle-fill text-success',
              warning: 'bi-exclamation-triangle-fill text-warning',
              danger: 'bi-x-circle-fill text-danger',
              info: 'bi-info-circle-fill text-primary'
            };
            const icon = iconMap[n.type] || iconMap.info;

            return `
              <div class="list-group-item p-3 d-flex align-items-start justify-content-between ${!n.read ? 'bg-light' : ''}">
                <div class="d-flex align-items-start gap-3">
                  <div class="fs-4 mt-1"><i class="bi ${icon}"></i></div>
                  <div>
                    <div class="fw-bold text-dark d-flex align-items-center gap-2">
                      ${n.title}
                      ${!n.read ? '<span class="badge bg-primary-subtle text-primary" style="font-size:10px">New</span>' : ''}
                    </div>
                    <p class="mb-1 text-secondary small">${n.message}</p>
                    <small class="text-muted"><i class="bi bi-clock me-1"></i>${Utils.timeAgo(n.date)}</small>
                  </div>
                </div>
                <div class="d-flex gap-1">
                  ${!n.read ? `
                    <button class="btn btn-sm btn-outline-primary" onclick="NotifsMod.markRead('${n.id}')" title="Mark Read"><i class="bi bi-check2"></i></button>
                  ` : ''}
                  <button class="btn btn-icon btn-sm btn-outline-danger" onclick="NotifsMod.deleteNotif('${n.id}')" title="Delete"><i class="bi bi-trash"></i></button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="table-pagination p-3" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-bell-slash', 'No notifications found', 'You are all caught up!')}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    App.updateNotificationCount();
  }

  function renderModal() {
    return `
    <div class="modal fade" id="broadcastModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Broadcast Notification</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="broadcastForm" novalidate>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Alert Title *</label>
                <input type="text" class="form-control" id="bcTitle" placeholder="e.g. Scheduled Maintenance Notice" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Severity / Type</label>
                <select class="form-select" id="bcType">
                  <option value="info">Info (Blue)</option>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="success">Success (Green)</option>
                  <option value="danger">High Priority Alert (Red)</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Message Content *</label>
                <textarea class="form-control" id="bcMessage" rows="3" placeholder="Enter broadcast message text..." required></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Send Broadcast</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function setFilter(unreadOnly) {
    filterUnreadOnly = unreadOnly;
    currentPage = 1;
    render();
  }

  function markRead(id) {
    DB.update('notifications', id, { read: true });
    render();
  }

  function markAllRead() {
    const user = Auth.getCurrentUser();
    const all = DB.getAll('notifications');
    all.forEach(n => {
      if (n.userId === user.id || !n.userId || n.userId === 'all') {
        DB.update('notifications', n.id, { read: true });
      }
    });
    Utils.showToast('All notifications marked as read');
    render();
  }

  function deleteNotif(id) {
    DB.delete('notifications', id);
    render();
  }

  function openModal() {
    const form = document.getElementById('broadcastForm');
    Utils.resetForm(form);
    new bootstrap.Modal(document.getElementById('broadcastModal')).show();
  }

  // Bind broadcast form
  document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'broadcastForm') {
      e.preventDefault();
      const form = e.target;
      if (!Utils.validateForm(form)) return;

      const user = Auth.getCurrentUser();
      DB.create('notifications', {
        userId: user.id,
        title: document.getElementById('bcTitle').value.trim(),
        message: document.getElementById('bcMessage').value.trim(),
        type: document.getElementById('bcType').value,
        read: false,
        date: new Date().toISOString()
      });

      Utils.showToast('Notification broadcasted successfully');
      bootstrap.Modal.getInstance(document.getElementById('broadcastModal'))?.hide();
      render();
    }
  });

  window.NotifsMod = { setFilter, markRead, markAllRead, deleteNotif, openModal };
  render();
})();

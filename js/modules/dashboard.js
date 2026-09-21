/* ============================================================
   FitHub OS — Dashboard Module
   Dynamic KPI cards, charts, activity feed, quick actions.
   ============================================================ */

(function () {
  'use strict';

  App.init('dashboard', [{ label: 'Dashboard' }]);

  const user = Auth.getCurrentUser();
  const content = App.getContent();

  // Gather data
  const gyms = App.getFilteredData('gyms');
  const branches = App.getFilteredData('branches');
  const members = App.getFilteredData('members');
  const payments = App.getFilteredData('payments');
  const attendance = App.getFilteredData('attendance');
  const subscriptions = App.getFilteredData('subscriptions');
  const leads = App.getFilteredData('leads');
  const classes = App.getFilteredData('classes');

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // KPI calculations
  const activeMembers = members.filter(m => m.status === 'active').length;
  const totalMembers = members.length;
  const newThisMonth = members.filter(m => {
    const d = new Date(m.joinDate);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const monthPayments = payments.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear && p.status === 'paid';
  });
  const monthRevenue = monthPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  const todayStr = now.toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === todayStr).length;

  const expiringIn7 = subscriptions.filter(s => {
    if (s.status !== 'active') return false;
    const end = new Date(s.endDate);
    const diff = (end - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  const renewals = subscriptions.filter(s => {
    const d = new Date(s.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const churned = members.filter(m => m.status === 'cancelled' || m.status === 'expired').length;
  const churnRate = totalMembers > 0 ? Math.round((churned / totalMembers) * 100) : 0;

  const attendanceRate = activeMembers > 0 ? Math.min(Math.round((todayAttendance / activeMembers) * 100), 100) : 0;

  // Render
  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <div class="subtitle">Welcome back, ${user.name}! Here's what's happening today.</div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" onclick="location.reload()"><i class="bi bi-arrow-clockwise me-1"></i>Refresh</button>
      </div>
    </div>

    <!-- KPI Cards Row 1 -->
    <div class="row g-3 mb-4">
      ${user.role === 'super_admin' ? `
      <div class="col-6 col-md-4 col-xl-2">
        <div class="card kpi-card">
          <div class="card-body d-flex justify-content-between align-items-start">
            <div>
              <div class="kpi-label">Total Gyms</div>
              <div class="kpi-value">${gyms.length}</div>
            </div>
            <div class="kpi-icon" style="background:var(--primary-bg);color:var(--primary)"><i class="bi bi-building"></i></div>
          </div>
        </div>
      </div>` : ''}
      <div class="col-6 col-md-4 col-xl-2">
        <div class="card kpi-card info">
          <div class="card-body d-flex justify-content-between align-items-start">
            <div>
              <div class="kpi-label">Branches</div>
              <div class="kpi-value">${branches.length}</div>
            </div>
            <div class="kpi-icon" style="background:var(--info-bg);color:var(--info)"><i class="bi bi-geo-alt"></i></div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-4 col-xl-2">
        <div class="card kpi-card success">
          <div class="card-body d-flex justify-content-between align-items-start">
            <div>
              <div class="kpi-label">Active Members</div>
              <div class="kpi-value">${activeMembers}</div>
              <div class="kpi-change text-success"><i class="bi bi-arrow-up"></i> ${newThisMonth} new</div>
            </div>
            <div class="kpi-icon" style="background:var(--success-bg);color:var(--success)"><i class="bi bi-people"></i></div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-4 col-xl-2">
        <div class="card kpi-card">
          <div class="card-body d-flex justify-content-between align-items-start">
            <div>
              <div class="kpi-label">Monthly Revenue</div>
              <div class="kpi-value">${Utils.formatCurrency(monthRevenue)}</div>
              <div class="kpi-change text-muted">${monthPayments.length} transactions</div>
            </div>
            <div class="kpi-icon" style="background:var(--primary-bg);color:var(--primary)"><i class="bi ${Utils.getCurrency().code === 'USD' ? 'bi-currency-dollar' : (Utils.getCurrency().code === 'EUR' ? 'bi-currency-euro' : (Utils.getCurrency().code === 'GBP' ? 'bi-currency-pound' : 'bi-currency-rupee'))}"></i></div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-4 col-xl-2">
        <div class="card kpi-card warning">
          <div class="card-body d-flex justify-content-between align-items-start">
            <div>
              <div class="kpi-label">Today Attendance</div>
              <div class="kpi-value">${todayAttendance}</div>
              <div class="kpi-change">${attendanceRate}% rate</div>
            </div>
            <div class="kpi-icon" style="background:var(--warning-bg);color:var(--warning-dark)"><i class="bi bi-calendar-check"></i></div>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-4 col-xl-2">
        <div class="card kpi-card danger">
          <div class="card-body d-flex justify-content-between align-items-start">
            <div>
              <div class="kpi-label">Pending Payments</div>
              <div class="kpi-value">${pendingPayments}</div>
            </div>
            <div class="kpi-icon" style="background:var(--danger-bg);color:var(--danger)"><i class="bi bi-exclamation-circle"></i></div>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI Cards Row 2 -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="card kpi-card success">
          <div class="card-body"><div class="kpi-label">Renewals</div><div class="kpi-value">${renewals}</div></div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card kpi-card danger">
          <div class="card-body"><div class="kpi-label">Churn Rate</div><div class="kpi-value">${churnRate}%</div></div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card kpi-card warning">
          <div class="card-body"><div class="kpi-label">Expiring Soon</div><div class="kpi-value">${expiringIn7.length}</div></div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="card kpi-card info">
          <div class="card-body"><div class="kpi-label">Active Leads</div><div class="kpi-value">${leads.filter(l => l.status !== 'converted' && l.status !== 'lost').length}</div></div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="row g-3 mb-4">
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header">Revenue Trend (Last 12 Months)</div>
          <div class="card-body"><div class="chart-container"><canvas id="revenueChart"></canvas></div></div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card">
          <div class="card-header">Membership Distribution</div>
          <div class="card-body"><div class="chart-container"><canvas id="membershipChart"></canvas></div></div>
        </div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header">Attendance Trend (Last 30 Days)</div>
          <div class="card-body"><div class="chart-container"><canvas id="attendanceChart"></canvas></div></div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header">New Members (Last 6 Months)</div>
          <div class="card-body"><div class="chart-container"><canvas id="memberTrendChart"></canvas></div></div>
        </div>
      </div>
    </div>

    <!-- Bottom Section -->
    <div class="row g-3 mb-4">
      <!-- Recent Payments -->
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header">
            <span>Recent Payments</span>
            <a href="${Navigation.getUrl('payments')}" class="btn btn-sm btn-outline-primary">View All</a>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table mb-0">
                <thead><tr><th>Member</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
                <tbody id="recentPayments"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header">
            <span>Recent Activity</span>
            <a href="${Navigation.getUrl('auditLogs')}" class="btn btn-sm btn-outline-primary">View All</a>
          </div>
          <div class="card-body" id="recentActivity"></div>
        </div>
      </div>
    </div>

    <!-- Expiring & Quick Actions -->
    <div class="row g-3 mb-4">
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header">
            <span><i class="bi bi-exclamation-triangle text-warning me-2"></i>Expiring Memberships</span>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table mb-0">
                <thead><tr><th>Member</th><th>Plan</th><th>Expires</th></tr></thead>
                <tbody id="expiringTable"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card">
          <div class="card-header">Quick Actions</div>
          <div class="card-body">
            <div class="row g-2" id="quickActions"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ---------- Render Charts ----------
  renderRevenueChart();
  renderMembershipChart();
  renderAttendanceChart();
  renderMemberTrendChart();
  renderRecentPayments();
  renderRecentActivity();
  renderExpiringTable();
  renderQuickActions();

  function renderRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    const months = [];
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      months.push(d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
      const sum = payments.filter(p => {
        const pd = new Date(p.date);
        return pd.getMonth() === m && pd.getFullYear() === y && p.status === 'paid';
      }).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
      data.push(Math.round(Utils.convertCurrency(sum)));
    }
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Revenue (' + Utils.getCurrencySymbol() + ')',
          data: data,
          borderColor: '#6C5CE7',
          backgroundColor: 'rgba(108,92,231,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#6C5CE7'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => Utils.getCurrencySymbol() + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) } }
        }
      }
    });
  }

  function renderMembershipChart() {
    const ctx = document.getElementById('membershipChart');
    if (!ctx) return;
    const statusCounts = { active: 0, expired: 0, frozen: 0, cancelled: 0 };
    members.forEach(m => { statusCounts[m.status] = (statusCounts[m.status] || 0) + 1; });
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Active', 'Expired', 'Frozen', 'Cancelled'],
        datasets: [{
          data: [statusCounts.active, statusCounts.expired, statusCounts.frozen, statusCounts.cancelled],
          backgroundColor: ['#00B894', '#E17055', '#74B9FF', '#636e72'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 11 } } } },
        cutout: '65%'
      }
    });
  }

  function renderAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    const labels = [];
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
      data.push(attendance.filter(a => a.date === ds).length);
    }
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Check-ins',
          data: data,
          backgroundColor: 'rgba(0,184,148,0.6)',
          borderRadius: 4,
          barThickness: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { maxRotation: 45, font: { size: 9 } } },
          y: { beginAtZero: true }
        }
      }
    });
  }

  function renderMemberTrendChart() {
    const ctx = document.getElementById('memberTrendChart');
    if (!ctx) return;
    const labels = [];
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      labels.push(d.toLocaleDateString('en-IN', { month: 'short' }));
      data.push(members.filter(mm => {
        const jd = new Date(mm.joinDate);
        return jd.getMonth() === m && jd.getFullYear() === y;
      }).length);
    }
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'New Members',
          data: data,
          backgroundColor: '#6C5CE7',
          borderRadius: 6,
          barThickness: 24
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  function renderRecentPayments() {
    const tbody = document.getElementById('recentPayments');
    const recent = [...payments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (!recent.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No payments found</td></tr>';
      return;
    }

    tbody.innerHTML = recent.map(p => {
      const member = DB.getById('members', p.memberId);
      return `<tr>
        <td>${member?.name || 'Unknown'}</td>
        <td class="fw-semibold">${Utils.formatCurrency(p.amount)}</td>
        <td>${p.method}</td>
        <td>${Utils.formatDate(p.date)}</td>
        <td>${Utils.statusBadge(p.status)}</td>
      </tr>`;
    }).join('');
  }

  function renderRecentActivity() {
    const container = document.getElementById('recentActivity');
    const logs = [...DB.getAll('auditLogs')]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);

    if (!logs.length) {
      container.innerHTML = '<p class="text-muted text-center py-3">No recent activity</p>';
      return;
    }

    container.innerHTML = logs.map(l => `
      <div class="activity-item">
        <div class="activity-dot" style="background:${l.action === 'create' ? 'var(--success)' : l.action === 'delete' ? 'var(--danger)' : 'var(--primary)'}"></div>
        <div class="flex-grow-1">
          <div class="activity-text"><strong>${l.userName}</strong> ${l.action}d ${l.module} — ${l.details}</div>
          <div class="activity-time">${Utils.timeAgo(l.timestamp)}</div>
        </div>
      </div>
    `).join('');
  }

  function renderExpiringTable() {
    const tbody = document.getElementById('expiringTable');
    if (!expiringIn7.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">No expiring memberships</td></tr>';
      return;
    }
    tbody.innerHTML = expiringIn7.slice(0, 5).map(s => {
      const member = DB.getById('members', s.memberId);
      return `<tr>
        <td>${member?.name || 'Unknown'}</td>
        <td>${s.planName || '—'}</td>
        <td><span class="badge bg-warning text-dark">${Utils.formatDate(s.endDate)}</span></td>
      </tr>`;
    }).join('');
  }

  function renderQuickActions() {
    const container = document.getElementById('quickActions');
    const actions = [];

    if (Permissions.canCreate('members')) actions.push({ icon: 'bi-person-plus', label: 'Add Member', href: Navigation.getUrl('members') });
    if (Permissions.canCreate('payments')) actions.push({ icon: 'bi-credit-card', label: 'Record Payment', href: Navigation.getUrl('payments') });
    if (Permissions.canAccess('attendance')) actions.push({ icon: 'bi-calendar-check', label: 'Mark Attendance', href: Navigation.getUrl('attendance') });
    if (Permissions.canCreate('classes')) actions.push({ icon: 'bi-easel', label: 'Create Class', href: Navigation.getUrl('classes') });
    if (Permissions.canCreate('crm')) actions.push({ icon: 'bi-funnel', label: 'Add Lead', href: Navigation.getUrl('crm') });
    if (Permissions.canAccess('reports')) actions.push({ icon: 'bi-bar-chart-line', label: 'View Reports', href: Navigation.getUrl('reports') });

    container.innerHTML = actions.slice(0, 6).map(a => `
      <div class="col-4 col-md-4">
        <a href="${a.href}" class="quick-action-btn text-decoration-none">
          <i class="bi ${a.icon}"></i>
          <span>${a.label}</span>
        </a>
      </div>
    `).join('');
  }

})();

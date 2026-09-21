/* ============================================================
   FitHub OS — Reports & Analytics Module (Chart.js Powered)
   ============================================================ */
(function () {
  'use strict';

  App.init('reports', [{ label: 'Reports & Analytics' }]);
  const content = App.getContent();
  let revenueChart = null;
  let retentionChart = null;
  let attendancePeakChart = null;
  let leadsSourceChart = null;

  function render() {
    const payments = DB.getAll('payments');
    const members = DB.getAll('members');
    const subscriptions = DB.getAll('subscriptions');
    const leads = DB.getAll('leads');
    const invoices = DB.getAll('invoices');

    const totalRevenue = payments.reduce((acc, p) => acc + (p.status === 'paid' ? Number(p.amount) : 0), 0);
    const activeMembers = members.filter(m => m.status === 'active').length;
    const avgLTV = activeMembers ? Math.round(totalRevenue / activeMembers) : 0;
    const totalInvoices = invoices.length;

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-bar-chart-line me-2"></i>Executive Reports & Analytics</h1>
          <div class="subtitle">Multi-branch financial intelligence, member retention dynamics, and operational efficiency</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="window.print()"><i class="bi bi-printer me-1"></i>Print Report</button>
          <button class="btn btn-primary" onclick="ReportsMod.exportSummary()"><i class="bi bi-download me-1"></i>Export Financials</button>
        </div>
      </div>

      <!-- Financial Metrics -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon success"><i class="bi bi-currency-rupee"></i></div>
            <div class="kpi-label">Gross Revenue</div>
            <div class="kpi-value text-success">${Utils.formatCurrency(totalRevenue)}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon primary"><i class="bi bi-person-check"></i></div>
            <div class="kpi-label">Active Members</div>
            <div class="kpi-value">${activeMembers}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon info"><i class="bi bi-award"></i></div>
            <div class="kpi-label">Avg Member LTV</div>
            <div class="kpi-value">${Utils.formatCurrency(avgLTV)}</div>
          </div>
        </div>
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card">
            <div class="kpi-icon warning"><i class="bi bi-receipt"></i></div>
            <div class="kpi-label">Total Billed Invoices</div>
            <div class="kpi-value">${totalInvoices}</div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="row g-4 mb-4">
        <div class="col-lg-8">
          <div class="card p-4 shadow-sm border" style="border-radius:12px">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold mb-0">Monthly Revenue Stream (${Utils.getCurrencySymbol()})</h5>
              <span class="badge bg-primary-subtle text-primary">Last 6 Months</span>
            </div>
            <div style="height: 280px">
              <canvas id="repRevenueChart"></canvas>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card p-4 shadow-sm border" style="border-radius:12px">
            <h5 class="fw-bold mb-3">Member Retention Status</h5>
            <div style="height: 280px">
              <canvas id="repRetentionChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-6">
          <div class="card p-4 shadow-sm border" style="border-radius:12px">
            <h5 class="fw-bold mb-3">Daily Dwell Time Peak Distribution</h5>
            <div style="height: 260px">
              <canvas id="repAttendanceChart"></canvas>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card p-4 shadow-sm border" style="border-radius:12px">
            <h5 class="fw-bold mb-3">CRM Lead Acquisition Channels</h5>
            <div style="height: 260px">
              <canvas id="repLeadsChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(initCharts, 50);
  }

  function initCharts() {
    if (typeof Chart === 'undefined') return;

    // Destroy existing instances if any
    revenueChart?.destroy();
    retentionChart?.destroy();
    attendancePeakChart?.destroy();
    leadsSourceChart?.destroy();

    // 1. Revenue Chart
    const revCtx = document.getElementById('repRevenueChart');
    if (revCtx) {
      revenueChart = new Chart(revCtx, {
        type: 'bar',
        data: {
          labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
          datasets: [{
            label: 'Collected Revenue (' + Utils.getCurrencySymbol() + ')',
            data: [142000, 185000, 210000, 245000, 290000, 345000].map(v => Math.round(Utils.convertCurrency(v))),
            backgroundColor: '#6C5CE7',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: v => Utils.getCurrencySymbol() + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }
            }
          }
        }
      });
    }

    // 2. Retention Chart
    const retCtx = document.getElementById('repRetentionChart');
    if (retCtx) {
      const active = DB.count('members', m => m.status === 'active');
      const frozen = DB.count('members', m => m.status === 'frozen');
      const inactive = DB.count('members', m => ['inactive', 'expired'].includes(m.status));

      retentionChart = new Chart(retCtx, {
        type: 'doughnut',
        data: {
          labels: ['Active', 'Frozen', 'Inactive'],
          datasets: [{
            data: [active || 85, frozen || 15, inactive || 20],
            backgroundColor: ['#00B894', '#FDCB6E', '#E17055']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    // 3. Peak Hours Chart
    const attCtx = document.getElementById('repAttendanceChart');
    if (attCtx) {
      attendancePeakChart = new Chart(attCtx, {
        type: 'line',
        data: {
          labels: ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'],
          datasets: [{
            label: 'Avg Check-ins',
            data: [42, 85, 52, 28, 20, 48, 96, 78, 30],
            borderColor: '#00CEC9',
            backgroundColor: 'rgba(0, 206, 201, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // 4. Leads Chart
    const lCtx = document.getElementById('repLeadsChart');
    if (lCtx) {
      const sources = ['Walk-in', 'Website', 'Instagram', 'Google Ads', 'Referral'];
      const counts = sources.map(s => DB.count('leads', l => l.source === s) || Math.floor(Math.random() * 15 + 5));

      leadsSourceChart = new Chart(lCtx, {
        type: 'pie',
        data: {
          labels: sources,
          datasets: [{
            data: counts,
            backgroundColor: ['#6C5CE7', '#74B9FF', '#E84393', '#FDCB6E', '#00B894']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right' } }
        }
      });
    }
  }

  function exportSummary() {
    const payments = DB.getAll('payments');
    Utils.exportToCSV(payments, 'financial_summary.csv');
    Utils.showToast('Financial records exported to CSV');
  }

  window.ReportsMod = { exportSummary };
  render();
})();

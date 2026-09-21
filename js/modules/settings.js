/* ============================================================
   FitHub OS — Settings & System Configuration Module
   ============================================================ */
(function () {
  'use strict';

  App.init('settings', [{ label: 'Settings' }]);
  const content = App.getContent();

  function render() {
    const user = Auth.getCurrentUser();
    const gym = Auth.getSelectedGym() ? DB.getById('gyms', Auth.getSelectedGym()) : null;

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-gear me-2"></i>Platform & Gym Settings</h1>
          <div class="subtitle">Brand identity, tax configurations, notification rules, and database administration</div>
        </div>
      </div>

      <div class="row g-4 fade-in">
        <!-- Gym & Brand Settings -->
        <div class="col-lg-6">
          <div class="card p-4 shadow-sm border mb-4" style="border-radius:12px">
            <h5 class="fw-bold mb-3"><i class="bi bi-building me-2 text-primary"></i>Gym Brand Profile</h5>
            <form id="brandForm">
              <div class="mb-3">
                <label class="form-label">Business Name</label>
                <input type="text" class="form-control" id="stGymName" value="${gym?.name || 'FitHub OS Network'}">
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Currency Symbol</label>
                  <select class="form-select" id="stCurrency">
                    <option value="INR" ${Utils.getCurrency().code === 'INR' ? 'selected' : ''}>₹ (INR - Indian Rupee)</option>
                    <option value="USD" ${Utils.getCurrency().code === 'USD' ? 'selected' : ''}>$ (USD - US Dollar)</option>
                    <option value="EUR" ${Utils.getCurrency().code === 'EUR' ? 'selected' : ''}>€ (EUR - Euro)</option>
                    <option value="GBP" ${Utils.getCurrency().code === 'GBP' ? 'selected' : ''}>£ (GBP - British Pound)</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Default Tax / GST (%)</label>
                  <input type="number" class="form-control" id="stTax" value="18">
                </div>
              </div>
              <div class="p-2 mb-3 rounded bg-light border" id="currencyRateInfo">
                <div class="small fw-semibold text-primary"><i class="bi bi-arrow-left-right me-1"></i>Active Exchange Rate:</div>
                <div class="small text-dark" id="rateDescription">
                  ${Utils.getCurrency().code === 'USD'
                    ? '1 USD = ₹83.50 INR (All INR money converted to USD at 1/83.5 rate)'
                    : (Utils.getCurrency().code === 'EUR'
                      ? '1 EUR = ₹91.00 INR (All INR money converted to EUR at 1/91 rate)'
                      : (Utils.getCurrency().code === 'GBP'
                        ? '1 GBP = ₹106.00 INR (All INR money converted to GBP at 1/106 rate)'
                        : 'Base Currency: 1 INR = ₹1.00 INR'))}
                </div>
                <div class="small text-muted mt-1">All membership prices, payments, receipts, and charts automatically recalculate based on this rate.</div>
              </div>
              <div class="mb-3">
                <label class="form-label">GSTIN / Tax ID</label>
                <input type="text" class="form-control" id="stGstin" value="27AABCU9603R1ZM">
              </div>
              <button type="submit" class="btn btn-primary"><i class="bi bi-save me-1"></i>Save Business Info</button>
            </form>
          </div>

          <!-- Notification Rules -->
          <div class="card p-4 shadow-sm border" style="border-radius:12px">
            <h5 class="fw-bold mb-3"><i class="bi bi-bell me-2 text-primary"></i>Automated Notifications</h5>
            <div class="form-check form-switch mb-3">
              <input class="form-check-input" type="checkbox" id="notifExpiry" checked>
              <label class="form-check-label fw-medium" for="notifExpiry">Membership Expiry Reminders (7 days prior)</label>
              <div class="small text-muted">Send automated SMS and app reminders before plan ends.</div>
            </div>
            <div class="form-check form-switch mb-3">
              <input class="form-check-input" type="checkbox" id="notifInvoice" checked>
              <label class="form-check-label fw-medium" for="notifInvoice">Payment Receipts on Checkout</label>
              <div class="small text-muted">Auto-issue invoice receipts via WhatsApp and email.</div>
            </div>
            <div class="form-check form-switch mb-3">
              <input class="form-check-input" type="checkbox" id="notifBooking" checked>
              <label class="form-check-label fw-medium" for="notifBooking">Class Booking Confirmations</label>
              <div class="small text-muted">Confirm studio slots immediately to members.</div>
            </div>
            <button class="btn btn-outline-primary btn-sm" onclick="Utils.showToast('Notification preferences updated!')"><i class="bi bi-check2 me-1"></i>Update Preferences</button>
          </div>
        </div>

        <!-- Database & Demo Data Management -->
        <div class="col-lg-6">
          <div class="card p-4 shadow-sm border mb-4" style="border-radius:12px">
            <h5 class="fw-bold mb-3"><i class="bi bi-database me-2 text-danger"></i>Demo Data & Storage</h5>
            <p class="text-muted small">
              FitHub OS persists all 26 collections in browser LocalStorage. You can backup your current database, import custom state, or reset to fresh seed demo data.
            </p>

            <div class="d-flex flex-column gap-3 mt-3">
              <div class="p-3 bg-light rounded d-flex align-items-center justify-content-between">
                <div>
                  <div class="fw-bold text-dark">Backup Database</div>
                  <small class="text-muted">Export entire LocalStorage state to JSON</small>
                </div>
                <button class="btn btn-outline-secondary" onclick="SettingsMod.backupData()"><i class="bi bi-download me-1"></i>Download JSON</button>
              </div>

              <div class="p-3 bg-light rounded d-flex align-items-center justify-content-between">
                <div>
                  <div class="fw-bold text-dark">Restore Backup</div>
                  <small class="text-muted">Load database from saved JSON file</small>
                </div>
                <div>
                  <input type="file" id="importFile" accept=".json" style="display:none" onchange="SettingsMod.importData(event)">
                  <button class="btn btn-outline-secondary" onclick="document.getElementById('importFile').click()"><i class="bi bi-upload me-1"></i>Upload JSON</button>
                </div>
              </div>

              <div class="p-3 border border-danger-subtle bg-danger-subtle rounded d-flex align-items-center justify-content-between">
                <div>
                  <div class="fw-bold text-danger">Reset All Demo Data</div>
                  <small class="text-danger-emphasis">Clears local edits and regenerates fresh seed records</small>
                </div>
                <button class="btn btn-danger" onclick="SettingsMod.resetDatabase()"><i class="bi bi-arrow-counterclockwise me-1"></i>Reset Demo</button>
              </div>
            </div>
          </div>

          <!-- Environment Info -->
          <div class="card p-4 shadow-sm border" style="border-radius:12px">
            <h5 class="fw-bold mb-3"><i class="bi bi-info-circle me-2 text-primary"></i>System Architecture</h5>
            <table class="table table-sm table-borderless small mb-0">
              <tbody>
                <tr><td class="text-muted">Architecture:</td><td class="fw-semibold">Multi-Tenant SaaS (Client-side Sandbox)</td></tr>
                <tr><td class="text-muted">Persistence Layer:</td><td class="fw-semibold">W3C HTML5 Web Storage (LocalStorage)</td></tr>
                <tr><td class="text-muted">Data Schema:</td><td class="fw-semibold">26 Normalized Relational Collections</td></tr>
                <tr><td class="text-muted">Role Security:</td><td class="fw-semibold">RBAC Dynamic Permission Engine</td></tr>
                <tr><td class="text-muted">FitHub OS Version:</td><td class="fw-semibold">v2.4.0-Production</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Live currency rate description update
    document.getElementById('stCurrency')?.addEventListener('change', (e) => {
      const code = e.target.value;
      const rateEl = document.getElementById('rateDescription');
      if (rateEl) {
        if (code === 'USD') rateEl.textContent = '1 USD = ₹83.50 INR (All INR money converted to USD at 1/83.5 rate)';
        else if (code === 'EUR') rateEl.textContent = '1 EUR = ₹91.00 INR (All INR money converted to EUR at 1/91 rate)';
        else if (code === 'GBP') rateEl.textContent = '1 GBP = ₹106.00 INR (All INR money converted to GBP at 1/106 rate)';
        else rateEl.textContent = 'Base Currency: 1 INR = ₹1.00 INR';
      }
    });

    document.getElementById('brandForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedCurr = document.getElementById('stCurrency').value;
      const prevCurr = Utils.getCurrency().code;
      Utils.setCurrency(selectedCurr);

      const gymName = document.getElementById('stGymName')?.value.trim();
      if (gym && gymName) {
        DB.update('gyms', gym.id, { name: gymName });
      }

      if (selectedCurr !== prevCurr) {
        Utils.logAudit('update', 'settings', `Changed currency symbol from ${prevCurr} to ${selectedCurr}`);
        Utils.showToast(`Currency changed to ${selectedCurr}! Recalculating monetary values across all modules...`, 'success', 3500);
        setTimeout(() => window.location.reload(), 800);
      } else {
        Utils.showToast('Business information saved successfully!');
      }
    });
  }

  function backupData() {
    const data = DB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fithub_os_backup_${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    Utils.showToast('Full database downloaded as JSON');
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        DB.importAll(data);
        Utils.showToast('Database restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        Utils.showToast('Invalid backup JSON file', 'danger');
      }
    };
    reader.readAsText(file);
  }

  function resetDatabase() {
    Utils.showConfirm('Reset Demo Data', 'This will wipe all LocalStorage data and reseed fresh records. Continue?', () => {
      DB.reset();
      Utils.showToast('Database reset to fresh state! Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    }, 'Wipe & Reset', 'btn-danger');
  }

  window.SettingsMod = { backupData, importData, resetDatabase };
  render();
})();

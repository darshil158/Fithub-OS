/* ============================================================
   FitHub OS — Centralized Navigation & UI Injection Engine
   Handles route resolution, dynamic sidebar, responsive topbar,
   breadcrumbs, multi-tenant selectors, and active link states.
   ============================================================ */

const Navigation = (() => {
  'use strict';

  // Master Route Registry mapping logical identifiers to category-based folder paths
  const ROUTES = {
    dashboard: 'pages/dashboard/dashboard.html',
    
    // Organization
    gyms: 'pages/organization/gyms.html',
    branches: 'pages/organization/branches.html',
    settings: 'pages/organization/settings.html',
    
    // People
    members: 'pages/people/members.html',
    trainers: 'pages/people/trainers.html',
    staff: 'pages/people/staff.html',
    users: 'pages/people/users.html',
    
    // Memberships
    memberships: 'pages/memberships/membership-plans.html',
    'membership-plans': 'pages/memberships/membership-plans.html',
    subscriptions: 'pages/memberships/subscriptions.html',
    
    // Finance
    payments: 'pages/finance/payments.html',
    invoices: 'pages/finance/invoices.html',
    offers: 'pages/finance/offers.html',
    
    // Operations
    attendance: 'pages/operations/attendance.html',
    classes: 'pages/operations/classes.html',
    bookings: 'pages/operations/bookings.html',
    equipment: 'pages/operations/equipment.html',
    maintenance: 'pages/operations/maintenance.html',
    
    // Fitness
    workouts: 'pages/fitness/workouts.html',
    exercises: 'pages/fitness/exercises.html',
    diets: 'pages/fitness/diets.html',
    
    // CRM
    crm: 'pages/crm/leads.html',
    leads: 'pages/crm/leads.html',
    followups: 'pages/crm/follow-ups.html',
    'follow-ups': 'pages/crm/follow-ups.html',
    
    // Analytics
    reports: 'pages/analytics/reports.html',
    
    // Engagement
    notifications: 'pages/engagement/notifications.html',
    reviews: 'pages/engagement/reviews.html',
    
    // Security
    auditLogs: 'pages/security/audit-logs.html',
    'audit-logs': 'pages/security/audit-logs.html',
    
    // Root & Errors
    login: 'login.html',
    index: 'index.html',
    error404: 'pages/errors/404.html'
  };

  // Detect relative root prefix based on current page location depth
  function getRootPath() {
    const loc = (window.location.pathname || '') + (window.location.href || '');
    if (loc.includes('/pages/') || loc.includes('\\pages\\')) {
      return '../../';
    }
    return './';
  }

  // Generate an accurate relative URL for any registered page
  function getUrl(routeKey) {
    if (routeKey === 'login') return getRootPath() + 'login.html';
    if (routeKey === 'index') return getRootPath() + 'index.html';
    const relativeTarget = ROUTES[routeKey] || ROUTES.dashboard;
    return getRootPath() + relativeTarget;
  }

  // Category-based navigation structure matching folder architecture
  const SECTIONS = [
    {
      section: 'DASHBOARD',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', route: 'dashboard' }
      ]
    },
    {
      section: 'ORGANIZATION',
      items: [
        { id: 'gyms', label: 'Gyms', icon: 'bi-building', route: 'gyms' },
        { id: 'branches', label: 'Branches', icon: 'bi-geo-alt', route: 'branches' },
        { id: 'settings', label: 'Settings', icon: 'bi-gear', route: 'settings' }
      ]
    },
    {
      section: 'PEOPLE',
      items: [
        { id: 'members', label: 'Members', icon: 'bi-people', route: 'members' },
        { id: 'trainers', label: 'Trainers', icon: 'bi-person-badge', route: 'trainers' },
        { id: 'staff', label: 'Staff', icon: 'bi-person-gear', route: 'staff' },
        { id: 'users', label: 'Users', icon: 'bi-shield-lock', route: 'users' }
      ]
    },
    {
      section: 'MEMBERSHIPS',
      items: [
        { id: 'memberships', label: 'Plans', icon: 'bi-card-list', route: 'memberships' },
        { id: 'subscriptions', label: 'Subscriptions', icon: 'bi-receipt', route: 'subscriptions' }
      ]
    },
    {
      section: 'FINANCE',
      items: [
        { id: 'payments', label: 'Payments', icon: 'bi-credit-card', route: 'payments' },
        { id: 'invoices', label: 'Invoices', icon: 'bi-file-earmark-text', route: 'invoices' },
        { id: 'offers', label: 'Offers', icon: 'bi-tag', route: 'offers' }
      ]
    },
    {
      section: 'OPERATIONS',
      items: [
        { id: 'attendance', label: 'Attendance', icon: 'bi-calendar-check', route: 'attendance' },
        { id: 'classes', label: 'Classes', icon: 'bi-easel', route: 'classes' },
        { id: 'bookings', label: 'Bookings', icon: 'bi-bookmark-check', route: 'bookings' },
        { id: 'equipment', label: 'Equipment', icon: 'bi-wrench', route: 'equipment' },
        { id: 'maintenance', label: 'Maintenance', icon: 'bi-tools', route: 'maintenance' }
      ]
    },
    {
      section: 'FITNESS',
      items: [
        { id: 'workouts', label: 'Workouts', icon: 'bi-activity', route: 'workouts' },
        { id: 'exercises', label: 'Exercises', icon: 'bi-lightning', route: 'exercises' },
        { id: 'diets', label: 'Diet Plans', icon: 'bi-cup-straw', route: 'diets' }
      ]
    },
    {
      section: 'CRM & SALES',
      items: [
        { id: 'crm', label: 'Leads', icon: 'bi-funnel', route: 'crm' },
        { id: 'followups', label: 'Follow-ups', icon: 'bi-telephone-outbound', route: 'followups' }
      ]
    },
    {
      section: 'ANALYTICS',
      items: [
        { id: 'reports', label: 'Reports', icon: 'bi-bar-chart-line', route: 'reports' }
      ]
    },
    {
      section: 'ENGAGEMENT',
      items: [
        { id: 'notifications', label: 'Notifications', icon: 'bi-bell', route: 'notifications' },
        { id: 'reviews', label: 'Reviews', icon: 'bi-star', route: 'reviews' }
      ]
    },
    {
      section: 'SECURITY',
      items: [
        { id: 'auditLogs', label: 'Audit Logs', icon: 'bi-journal-text', route: 'auditLogs' }
      ]
    }
  ];

  // Render the full application wrapper with dynamic sidebar and topbar
  function renderLayout(currentPage, breadcrumbs = []) {
    const user = Auth.getCurrentUser();
    if (!user) return;

    document.body.innerHTML = `
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <div class="app-wrapper">
        <aside class="sidebar" id="sidebar">
          ${renderSidebar(user, currentPage)}
        </aside>
        <div class="main-content">
          <header class="topbar">
            ${renderTopbar(user, currentPage, breadcrumbs)}
          </header>
          <main class="page-content" id="pageContent">
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
            </div>
          </main>
        </div>
      </div>
    `;

    // Ensure global toast container exists
    if (!document.querySelector('.toast-container')) {
      const tc = document.createElement('div');
      tc.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      tc.style.zIndex = '9999';
      document.body.appendChild(tc);
    }

    bindLayoutEvents();
  }

  // Render responsive sidebar with categorized groupings
  function renderSidebar(user, currentPage) {
    const root = getRootPath();
    let navHtml = '';

    SECTIONS.forEach(sec => {
      // Filter items according to RBAC permissions
      const accessibleItems = sec.items.filter(item => Permissions.canAccess(item.id));
      if (accessibleItems.length === 0) return;

      navHtml += `<div class="sidebar-section">${sec.section}</div>`;
      accessibleItems.forEach(item => {
        const isActive = (currentPage === item.id || currentPage === item.route);
        const targetUrl = getUrl(item.route);

        navHtml += `
          <a class="sidebar-link ${isActive ? 'active' : ''}" href="${targetUrl}" data-page="${item.id}">
            <i class="bi ${item.icon}"></i>
            <span>${item.label}</span>
          </a>
        `;
      });
    });

    return `
      <div class="sidebar-brand">
        <div class="brand-logo">F</div>
        <div class="brand-name">Fit<span>Hub</span> OS</div>
      </div>
      <nav class="sidebar-nav">
        ${navHtml}
      </nav>
      <div class="sidebar-footer">
        <div class="d-flex align-items-center gap-2 mb-2">
          <div class="topbar-avatar" style="width:28px;height:28px;font-size:11px;background:${user.avatar || 'var(--primary)'}">
            ${Utils.getInitials ? Utils.getInitials(user.name) : 'U'}
          </div>
          <div style="line-height:1.2;overflow:hidden">
            <div style="font-size:12px;font-weight:600;color:#fff;white-space:nowrap;text-overflow:ellipsis;overflow:hidden">${user.name}</div>
            <div style="font-size:10px;color:var(--sidebar-text)">${Permissions.getRoleLabel(user.role)}</div>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-light w-100" style="font-size:11px;opacity:0.75" onclick="Auth.logout()">
          <i class="bi bi-box-arrow-left me-1"></i>Sign Out
        </button>
      </div>
    `;
  }

  // Render topbar with tenant switcher, currency switcher, notifications, breadcrumbs
  function renderTopbar(user, currentPage, breadcrumbs) {
    const selectedGym = Auth.getSelectedGym();
    const gyms = DB.getAll('gyms');

    // Gym selector
    let gymSelectorHtml = '';
    if (['super_admin', 'gym_owner'].includes(user.role)) {
      const availableGyms = user.role === 'super_admin' ? gyms : gyms.filter(g => g.ownerId === user.id);
      if (availableGyms.length > 0) {
        gymSelectorHtml = `
          <select class="form-select form-select-sm gym-selector" id="gymSelector" title="Filter by Gym">
            <option value="">All Gyms</option>
            ${availableGyms.map(g => `<option value="${g.id}" ${g.id === selectedGym ? 'selected' : ''}>${g.name}</option>`).join('')}
          </select>
        `;
      }
    }

    // Branch selector
    let branchSelectorHtml = '';
    if (selectedGym && ['super_admin', 'gym_owner'].includes(user.role)) {
      const gymBranches = DB.query('branches', b => b.gymId === selectedGym);
      const selectedBranch = Auth.getSelectedBranch();
      if (gymBranches.length > 0) {
        branchSelectorHtml = `
          <select class="form-select form-select-sm" id="branchSelector" style="min-width:140px;font-size:13px" title="Filter by Branch">
            <option value="">All Branches</option>
            ${gymBranches.map(b => `<option value="${b.id}" ${b.id === selectedBranch ? 'selected' : ''}>${b.name}</option>`).join('')}
          </select>
        `;
      }
    }

    // Breadcrumbs
    let breadcrumbHtml = '';
    if (breadcrumbs && breadcrumbs.length > 0) {
      breadcrumbHtml = `
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="${getUrl('dashboard')}">Home</a></li>
            ${breadcrumbs.map((b, i) => i < breadcrumbs.length - 1
              ? `<li class="breadcrumb-item"><a href="${b.href ? (b.href.startsWith('http') || b.href.startsWith('.') ? b.href : getUrl(b.href)) : '#'}">${b.label}</a></li>`
              : `<li class="breadcrumb-item active" aria-current="page">${b.label}</li>`
            ).join('')}
          </ol>
        </nav>
      `;
    }

    // Unread notifications
    const unread = DB.count('notifications', n => n.userId === user.id && !n.read);
    const activeCurrency = Utils.getCurrency ? Utils.getCurrency() : { code: 'INR' };

    return `
      <div class="topbar-left">
        <button class="btn-menu" id="menuToggle" title="Toggle Navigation Menu"><i class="bi bi-list"></i></button>
        ${breadcrumbHtml}
      </div>
      <div class="topbar-right">
        ${gymSelectorHtml}
        ${branchSelectorHtml}

        <!-- Multi-Currency Switcher with Live Value Conversion -->
        <select class="form-select form-select-sm currency-selector me-2" id="topbarCurrency" style="width:auto;min-width:80px;font-size:12px;font-weight:600;padding:4px 8px;border-radius:6px;cursor:pointer" title="Switch Display Currency & Convert All Rates">
          <option value="INR" ${activeCurrency.code === 'INR' ? 'selected' : ''}>₹ INR</option>
          <option value="USD" ${activeCurrency.code === 'USD' ? 'selected' : ''}>$ USD</option>
          <option value="EUR" ${activeCurrency.code === 'EUR' ? 'selected' : ''}>€ EUR</option>
          <option value="GBP" ${activeCurrency.code === 'GBP' ? 'selected' : ''}>£ GBP</option>
        </select>

        <!-- Notification Bell -->
        <a href="${getUrl('notifications')}" class="notification-bell me-2" title="Notifications">
          <i class="bi bi-bell"></i>
          ${unread > 0 ? `<span class="badge bg-danger" id="notifBadge">${unread}</span>` : ''}
        </a>

        <!-- User Dropdown with Quick Role Switcher -->
        <div class="dropdown">
          <div class="topbar-user" data-bs-toggle="dropdown" aria-expanded="false">
            <div class="topbar-avatar" style="background:${user.avatar || 'var(--primary)'}">
              ${Utils.getInitials ? Utils.getInitials(user.name) : 'U'}
            </div>
            <div class="topbar-user-info">
              <div class="name">${user.name}</div>
              <div class="role">${Permissions.getRoleLabel(user.role)}</div>
            </div>
            <i class="bi bi-chevron-down ms-1" style="font-size:11px;color:var(--text-muted)"></i>
          </div>
          <ul class="dropdown-menu dropdown-menu-end shadow-sm">
            <li class="dropdown-header">
              <div class="fw-bold text-dark">${user.name}</div>
              <div class="small text-muted">${user.email}</div>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="${getUrl('settings')}"><i class="bi bi-gear me-2"></i>Platform Settings</a></li>
            <li><a class="dropdown-item" href="${getUrl('notifications')}"><i class="bi bi-bell me-2"></i>Notifications (${unread})</a></li>
            <li><hr class="dropdown-divider"></li>
            <li class="dropdown-header text-uppercase small" style="font-size:10px;font-weight:700">Quick Role Switcher</li>
            <li><a class="dropdown-item small" href="#" onclick="Navigation.switchRole('super_admin');return false;"><i class="bi bi-shield-check text-primary me-2"></i>Super Admin</a></li>
            <li><a class="dropdown-item small" href="#" onclick="Navigation.switchRole('gym_owner');return false;"><i class="bi bi-briefcase text-success me-2"></i>Gym Owner</a></li>
            <li><a class="dropdown-item small" href="#" onclick="Navigation.switchRole('branch_manager');return false;"><i class="bi bi-building text-info me-2"></i>Branch Manager</a></li>
            <li><a class="dropdown-item small" href="#" onclick="Navigation.switchRole('trainer');return false;"><i class="bi bi-person-badge text-warning me-2"></i>Trainer</a></li>
            <li><a class="dropdown-item small" href="#" onclick="Navigation.switchRole('staff');return false;"><i class="bi bi-headset text-secondary me-2"></i>Staff</a></li>
            <li><a class="dropdown-item small" href="#" onclick="Navigation.switchRole('member');return false;"><i class="bi bi-person text-danger me-2"></i>Member</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" onclick="Auth.logout();return false;"><i class="bi bi-box-arrow-left me-2"></i>Log Out</a></li>
          </ul>
        </div>
      </div>
    `;
  }

  // Bind topbar and sidebar layout events
  function bindLayoutEvents() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuToggle && sidebar && overlay) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
      });

      overlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
      });
    }

    // Gym selector change
    const gymSelector = document.getElementById('gymSelector');
    if (gymSelector) {
      gymSelector.addEventListener('change', (e) => {
        Auth.setSelectedGym(e.target.value);
        window.location.reload();
      });
    }

    // Branch selector change
    const branchSelector = document.getElementById('branchSelector');
    if (branchSelector) {
      branchSelector.addEventListener('change', (e) => {
        Auth.setSelectedBranch(e.target.value);
        window.location.reload();
      });
    }

    // Currency selector change
    const topbarCurrency = document.getElementById('topbarCurrency');
    if (topbarCurrency) {
      topbarCurrency.addEventListener('change', (e) => {
        const code = e.target.value;
        Utils.setCurrency(code);
        Utils.showToast(`Active currency switched to ${code}. Updating conversion rates...`, 'info', 1800);
        setTimeout(() => window.location.reload(), 350);
      });
    }
  }

  // Quick 1-click role switcher from topbar profile menu
  function switchRole(roleKey) {
    const users = DB.getAll('users');
    const targetUser = users.find(u => u.role === roleKey);
    if (!targetUser) {
      Utils.showToast('Demo role user account not found in database.', 'warning');
      return;
    }
    Auth.loginUser(targetUser);
    Utils.showToast(`Switched session role to ${Permissions.getRoleLabel(roleKey)}!`, 'success');
    setTimeout(() => {
      window.location.href = getUrl('dashboard');
    }, 400);
  }

  return {
    ROUTES,
    SECTIONS,
    getRootPath,
    getUrl,
    renderLayout,
    switchRole
  };
})();

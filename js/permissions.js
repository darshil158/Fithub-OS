/* ============================================================
   FitHub OS — RBAC Permissions (Frontend Simulation)
   ⚠ This is a UI-only demo. A production system would enforce
     permissions server-side with proper authorization.
   ============================================================ */

const Permissions = (() => {
  'use strict';

  const ROLES = {
    SUPER_ADMIN: 'super_admin',
    GYM_OWNER: 'gym_owner',
    BRANCH_MANAGER: 'branch_manager',
    TRAINER: 'trainer',
    STAFF: 'staff',
    MEMBER: 'member'
  };

  const ROLE_LABELS = {
    super_admin: 'Super Admin',
    gym_owner: 'Gym Owner',
    branch_manager: 'Branch Manager',
    trainer: 'Trainer',
    staff: 'Staff',
    member: 'Member'
  };

  // Module permission matrix: role → module → actions[]
  const MATRIX = {
    super_admin: {
      dashboard: ['read'],
      gyms: ['create', 'read', 'update', 'delete'],
      branches: ['create', 'read', 'update', 'delete'],
      members: ['create', 'read', 'update', 'delete'],
      trainers: ['create', 'read', 'update', 'delete'],
      staff: ['create', 'read', 'update', 'delete'],
      memberships: ['create', 'read', 'update', 'delete'],
      subscriptions: ['create', 'read', 'update', 'delete'],
      attendance: ['create', 'read', 'update', 'delete'],
      payments: ['create', 'read', 'update', 'delete'],
      invoices: ['create', 'read', 'update', 'delete'],
      classes: ['create', 'read', 'update', 'delete'],
      bookings: ['create', 'read', 'update', 'delete'],
      workouts: ['create', 'read', 'update', 'delete'],
      exercises: ['create', 'read', 'update', 'delete'],
      diets: ['create', 'read', 'update', 'delete'],
      crm: ['create', 'read', 'update', 'delete'],
      followups: ['create', 'read', 'update', 'delete'],
      offers: ['create', 'read', 'update', 'delete'],
      equipment: ['create', 'read', 'update', 'delete'],
      maintenance: ['create', 'read', 'update', 'delete'],
      reports: ['read'],
      notifications: ['read', 'update'],
      reviews: ['read', 'update', 'delete'],
      users: ['create', 'read', 'update', 'delete'],
      auditLogs: ['read'],
      settings: ['read', 'update']
    },
    gym_owner: {
      dashboard: ['read'],
      gyms: ['read', 'update'],
      branches: ['create', 'read', 'update', 'delete'],
      members: ['create', 'read', 'update', 'delete'],
      trainers: ['create', 'read', 'update', 'delete'],
      staff: ['create', 'read', 'update', 'delete'],
      memberships: ['create', 'read', 'update', 'delete'],
      subscriptions: ['create', 'read', 'update', 'delete'],
      attendance: ['create', 'read', 'update'],
      payments: ['create', 'read', 'update'],
      invoices: ['create', 'read'],
      classes: ['create', 'read', 'update', 'delete'],
      bookings: ['create', 'read', 'update'],
      workouts: ['create', 'read', 'update', 'delete'],
      exercises: ['create', 'read', 'update', 'delete'],
      diets: ['create', 'read', 'update', 'delete'],
      crm: ['create', 'read', 'update', 'delete'],
      followups: ['create', 'read', 'update'],
      offers: ['create', 'read', 'update', 'delete'],
      equipment: ['create', 'read', 'update', 'delete'],
      maintenance: ['create', 'read', 'update'],
      reports: ['read'],
      notifications: ['read', 'update'],
      reviews: ['read'],
      settings: ['read', 'update']
    },
    branch_manager: {
      dashboard: ['read'],
      branches: ['read', 'update'],
      members: ['create', 'read', 'update'],
      trainers: ['read', 'update'],
      staff: ['create', 'read', 'update'],
      memberships: ['read'],
      subscriptions: ['create', 'read', 'update'],
      attendance: ['create', 'read', 'update'],
      payments: ['create', 'read'],
      invoices: ['create', 'read'],
      classes: ['create', 'read', 'update', 'delete'],
      bookings: ['create', 'read', 'update'],
      workouts: ['read'],
      exercises: ['read'],
      diets: ['read'],
      crm: ['create', 'read', 'update'],
      followups: ['create', 'read', 'update'],
      offers: ['read'],
      equipment: ['create', 'read', 'update'],
      maintenance: ['create', 'read', 'update'],
      reports: ['read'],
      notifications: ['read', 'update'],
      reviews: ['read'],
      settings: ['read']
    },
    trainer: {
      dashboard: ['read'],
      members: ['read'],
      attendance: ['create', 'read'],
      classes: ['read', 'update'],
      workouts: ['create', 'read', 'update', 'delete'],
      exercises: ['create', 'read', 'update'],
      diets: ['create', 'read', 'update', 'delete'],
      notifications: ['read', 'update']
    },
    staff: {
      dashboard: ['read'],
      members: ['create', 'read', 'update'],
      attendance: ['create', 'read'],
      payments: ['create', 'read'],
      invoices: ['read'],
      classes: ['read'],
      bookings: ['create', 'read', 'update'],
      crm: ['create', 'read', 'update'],
      followups: ['create', 'read', 'update'],
      equipment: ['read', 'update'],
      notifications: ['read', 'update']
    },
    member: {
      dashboard: ['read'],
      attendance: ['read'],
      classes: ['read'],
      bookings: ['create', 'read', 'update'],
      workouts: ['read'],
      diets: ['read'],
      payments: ['read'],
      invoices: ['read'],
      notifications: ['read', 'update'],
      reviews: ['create', 'read']
    }
  };

  // Sidebar navigation definition — ordered, grouped
  const NAV_ITEMS = [
    { section: 'MAIN', items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2', href: 'dashboard.html' }
    ]},
    { section: 'MANAGEMENT', items: [
      { id: 'gyms', label: 'Gyms', icon: 'bi-building', href: 'gyms.html' },
      { id: 'branches', label: 'Branches', icon: 'bi-geo-alt', href: 'branches.html' },
      { id: 'members', label: 'Members', icon: 'bi-people', href: 'members.html' },
      { id: 'trainers', label: 'Trainers', icon: 'bi-person-badge', href: 'trainers.html' },
      { id: 'staff', label: 'Staff', icon: 'bi-person-gear', href: 'staff.html' }
    ]},
    { section: 'MEMBERSHIP', items: [
      { id: 'memberships', label: 'Plans', icon: 'bi-card-list', href: 'memberships.html' },
      { id: 'subscriptions', label: 'Subscriptions', icon: 'bi-receipt', href: 'subscriptions.html' },
      { id: 'payments', label: 'Payments', icon: 'bi-credit-card', href: 'payments.html' },
      { id: 'invoices', label: 'Invoices', icon: 'bi-file-earmark-text', href: 'invoices.html' }
    ]},
    { section: 'OPERATIONS', items: [
      { id: 'attendance', label: 'Attendance', icon: 'bi-calendar-check', href: 'attendance.html' },
      { id: 'classes', label: 'Classes', icon: 'bi-easel', href: 'classes.html' },
      { id: 'bookings', label: 'Bookings', icon: 'bi-bookmark-check', href: 'bookings.html' }
    ]},
    { section: 'FITNESS', items: [
      { id: 'workouts', label: 'Workouts', icon: 'bi-activity', href: 'workouts.html' },
      { id: 'exercises', label: 'Exercises', icon: 'bi-lightning', href: 'exercises.html' },
      { id: 'diets', label: 'Diet Plans', icon: 'bi-cup-straw', href: 'diets.html' }
    ]},
    { section: 'CRM', items: [
      { id: 'crm', label: 'Leads', icon: 'bi-funnel', href: 'crm.html' },
      { id: 'followups', label: 'Follow-ups', icon: 'bi-telephone-outbound', href: 'followups.html' },
      { id: 'offers', label: 'Offers', icon: 'bi-tag', href: 'offers.html' }
    ]},
    { section: 'ASSETS', items: [
      { id: 'equipment', label: 'Equipment', icon: 'bi-wrench', href: 'equipment.html' },
      { id: 'maintenance', label: 'Maintenance', icon: 'bi-tools', href: 'maintenance.html' }
    ]},
    { section: 'ANALYTICS', items: [
      { id: 'reports', label: 'Reports', icon: 'bi-bar-chart-line', href: 'reports.html' }
    ]},
    { section: 'PLATFORM', items: [
      { id: 'notifications', label: 'Notifications', icon: 'bi-bell', href: 'notifications.html' },
      { id: 'reviews', label: 'Reviews', icon: 'bi-star', href: 'reviews.html' },
      { id: 'users', label: 'Users', icon: 'bi-shield-lock', href: 'users.html' },
      { id: 'auditLogs', label: 'Audit Logs', icon: 'bi-journal-text', href: 'audit-logs.html' },
      { id: 'settings', label: 'Settings', icon: 'bi-gear', href: 'settings.html' }
    ]}
  ];

  // ---------- API ----------
  function canAccess(module) {
    const user = Auth?.getCurrentUser?.();
    if (!user) return false;
    return !!MATRIX[user.role]?.[module];
  }

  function canCreate(module) {
    return _hasAction(module, 'create');
  }

  function canEdit(module) {
    return _hasAction(module, 'update');
  }

  function canDelete(module) {
    return _hasAction(module, 'delete');
  }

  function _hasAction(module, action) {
    const user = Auth?.getCurrentUser?.();
    if (!user) return false;
    return (MATRIX[user.role]?.[module] || []).includes(action);
  }

  function getNavItems() {
    const user = Auth?.getCurrentUser?.();
    if (!user) return [];
    return NAV_ITEMS.map(section => ({
      section: section.section,
      items: section.items.filter(item => MATRIX[user.role]?.[item.id])
    })).filter(section => section.items.length > 0);
  }

  function getRoleLabel(role) {
    return ROLE_LABELS[role] || role;
  }

  return {
    ROLES,
    ROLE_LABELS,
    MATRIX,
    NAV_ITEMS,
    canAccess, canCreate, canEdit, canDelete,
    getNavItems, getRoleLabel
  };
})();

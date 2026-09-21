/* ============================================================
   FitHub OS — Demo Authentication
   ⚠ Frontend-only simulation. NOT secure for production.
   A real system would use server-side auth, hashed passwords,
   JWTs, and HTTPS.
   ============================================================ */

const Auth = (() => {
  'use strict';

  const SESSION_KEY = 'fithub_session';

  function login(email, password) {
    const users = DB.getAll('users');
    const user = users.find(u => u.email === email);
    if (!user) return { success: false, message: 'User not found' };
    // Demo: password check is just for simulation
    if (user.password && user.password !== password) {
      return { success: false, message: 'Invalid password' };
    }
    if (user.status === 'suspended') {
      return { success: false, message: 'Account suspended' };
    }
    _setSession(user);
    return { success: true, user };
  }

  function loginAs(role) {
    const users = DB.getAll('users');
    const user = users.find(u => u.role === role);
    if (!user) return { success: false, message: 'Demo user not found' };
    _setSession(user);
    return { success: true, user };
  }

  function _setSession(user) {
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      gymId: user.gymId || null,
      branchId: user.branchId || null,
      avatar: user.avatar || null
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('fithub_selectedGym');
    sessionStorage.removeItem('fithub_selectedBranch');
    const target = typeof Navigation !== 'undefined' ? Navigation.getUrl('login') : 'login.html';
    window.location.href = target;
  }

  function getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return !!getCurrentUser();
  }

  function requireAuth() {
    if (!isLoggedIn()) {
      const target = typeof Navigation !== 'undefined' ? Navigation.getUrl('login') : 'login.html';
      window.location.href = target;
      return false;
    }
    return true;
  }

  function loginUser(user) {
    _setSession(user);
  }

  // Tenant context — selected gym/branch for multi-tenant filtering
  function getSelectedGym() {
    const user = getCurrentUser();
    if (!user) return null;
    // Members, trainers, staff see only their gym
    if (['trainer', 'staff', 'member'].includes(user.role)) return user.gymId;
    // Gym owner sees their own gyms (could own multiple)
    if (user.role === 'gym_owner') {
      const stored = sessionStorage.getItem('fithub_selectedGym');
      return stored || user.gymId;
    }
    if (user.role === 'branch_manager') return user.gymId;
    // Super admin can select
    return sessionStorage.getItem('fithub_selectedGym') || null;
  }

  function setSelectedGym(gymId) {
    if (gymId) {
      sessionStorage.setItem('fithub_selectedGym', gymId);
    } else {
      sessionStorage.removeItem('fithub_selectedGym');
    }
    // Clear branch selection when gym changes
    sessionStorage.removeItem('fithub_selectedBranch');
  }

  function getSelectedBranch() {
    const user = getCurrentUser();
    if (!user) return null;
    if (user.role === 'branch_manager') return user.branchId;
    if (user.role === 'member' || user.role === 'trainer' || user.role === 'staff') return user.branchId;
    return sessionStorage.getItem('fithub_selectedBranch') || null;
  }

  function setSelectedBranch(branchId) {
    if (branchId) {
      sessionStorage.setItem('fithub_selectedBranch', branchId);
    } else {
      sessionStorage.removeItem('fithub_selectedBranch');
    }
  }

  return {
    login, loginAs, logout, loginUser,
    getCurrentUser, isLoggedIn, requireAuth,
    getSelectedGym, setSelectedGym,
    getSelectedBranch, setSelectedBranch
  };
})();

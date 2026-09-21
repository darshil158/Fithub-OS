/* ============================================================
   FitHub OS — Centralized LocalStorage CRUD Utility
   All data persistence flows through this module.
   ============================================================ */

const DB = (() => {
  'use strict';

  const PREFIX = 'fithub_';

  // ---------- helpers ----------
  function _key(collection) {
    return PREFIX + collection;
  }

  function _read(collection) {
    try {
      const raw = localStorage.getItem(_key(collection));
      return raw ? JSON.parse(raw) : [];
    } catch {
      console.error(`DB: failed to read ${collection}`);
      return [];
    }
  }

  function _write(collection, data) {
    try {
      localStorage.setItem(_key(collection), JSON.stringify(data));
    } catch (e) {
      console.error(`DB: failed to write ${collection}`, e);
    }
  }

  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  // ---------- public API ----------
  function getAll(collection) {
    return _read(collection);
  }

  function getById(collection, id) {
    return _read(collection).find(item => item.id === id) || null;
  }

  function create(collection, item) {
    const data = _read(collection);
    const record = {
      ...item,
      id: item.id || generateId(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(record);
    _write(collection, data);
    return record;
  }

  function update(collection, id, updates) {
    const data = _read(collection);
    const idx = data.findIndex(item => item.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...updates, updatedAt: new Date().toISOString() };
    _write(collection, data);
    return data[idx];
  }

  function remove(collection, id) {
    const data = _read(collection);
    const filtered = data.filter(item => item.id !== id);
    if (filtered.length === data.length) return false;
    _write(collection, filtered);
    return true;
  }

  function bulkDelete(collection, ids) {
    const idSet = new Set(ids);
    const data = _read(collection);
    _write(collection, data.filter(item => !idSet.has(item.id)));
  }

  function query(collection, filterFn) {
    return _read(collection).filter(filterFn);
  }

  function count(collection, filterFn) {
    if (!filterFn) return _read(collection).length;
    return _read(collection).filter(filterFn).length;
  }

  function sum(collection, field, filterFn) {
    let data = _read(collection);
    if (filterFn) data = data.filter(filterFn);
    return data.reduce((acc, item) => acc + (parseFloat(item[field]) || 0), 0);
  }

  // Check if seed data exists
  function isSeeded() {
    return localStorage.getItem(PREFIX + '_seeded') === 'true';
  }

  function markSeeded() {
    localStorage.setItem(PREFIX + '_seeded', 'true');
  }

  // Reset all FitHub data
  function reset() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  }

  // Export
  return {
    getAll,
    getById,
    create,
    update,
    delete: remove,
    bulkDelete,
    query,
    count,
    sum,
    generateId,
    isSeeded,
    markSeeded,
    reset,
    PREFIX
  };
})();

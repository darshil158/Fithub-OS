/* ============================================================
   FitHub OS — Diet & Nutrition Plans Module
   ============================================================ */
(function () {
  'use strict';

  App.init('diets', [{ label: 'Diet Plans' }]);
  const content = App.getContent();
  const MODULE = 'diets';
  let currentPage = 1;
  let searchQuery = '';
  let sortField = 'name';
  let sortDir = 'asc';

  function render() {
    let items = DB.getAll('dietPlans');
    const user = Auth.getCurrentUser();

    // Multi-tenant check
    if (user.role === 'member') {
      items = items.filter(d => d.memberId === user.id || d.memberId === 'member-1');
    } else if (user.role === 'trainer') {
      const tr = DB.query('trainers', t => t.userId === user.id)[0];
      if (tr) items = items.filter(d => d.trainerId === tr.id);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(d => {
        const m = DB.getById('members', d.memberId);
        return (d.name || '').toLowerCase().includes(q) || (m?.name || '').toLowerCase().includes(q);
      });
    }

    // Sort
    items = Utils.sortItems(items, sortField, sortDir);
    const pg = Utils.paginate(items, currentPage, 10);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-cup-straw me-2"></i>Diet & Nutrition Plans</h1>
          <div class="subtitle">Personalized caloric goals, macronutrient splits, and daily meal guidelines</div>
        </div>
        <div class="d-flex gap-2">
          ${Permissions.canCreate(MODULE) ? '<button class="btn btn-primary" onclick="DietsMod.openModal()"><i class="bi bi-plus-lg me-1"></i>New Diet Plan</button>' : ''}
        </div>
      </div>

      <div class="table-container fade-in">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" class="form-control" placeholder="Search diet plan or member..." id="searchInput" value="${searchQuery}">
          </div>
        </div>

        ${pg.data.length ? `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th class="sortable" data-field="name">Diet Plan</th>
                <th>Target Member</th>
                <th>Prepared By Trainer</th>
                <th class="sortable" data-field="calories">Calories</th>
                <th>Macros (P / C / F)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pg.data.map(d => {
                const m = DB.getById('members', d.memberId);
                const t = DB.getById('trainers', d.trainerId);

                return `
                  <tr>
                    <td>
                      <div class="fw-semibold text-dark">${d.name}</div>
                    </td>
                    <td>
                      <div>${m?.name || '<span class="badge bg-light text-dark">Template</span>'}</div>
                    </td>
                    <td><span class="badge bg-success-subtle text-success">${t?.name || 'Nutrition Coach'}</span></td>
                    <td><span class="fw-bold fs-6 text-primary">${d.calories || 2200}</span> <small class="text-muted">kcal</small></td>
                    <td>
                      <small class="fw-medium text-muted">
                        ${d.protein || 140}g P · ${d.carbs || 220}g C · ${d.fats || 60}g F
                      </small>
                    </td>
                    <td>${Utils.statusBadge(d.status || 'active')}</td>
                    <td>
                      <div class="d-flex gap-1">
                        <button class="btn btn-icon btn-sm btn-outline-info" onclick="DietsMod.viewMeals('${d.id}')" title="View Meals"><i class="bi bi-eye"></i></button>
                        ${Permissions.canEdit(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-primary" onclick="DietsMod.openModal('${d.id}')" title="Edit"><i class="bi bi-pencil"></i></button>` : ''}
                        ${Permissions.canDelete(MODULE) ? `<button class="btn btn-icon btn-sm btn-outline-danger" onclick="DietsMod.deleteDiet('${d.id}')" title="Delete"><i class="bi bi-trash"></i></button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="table-pagination" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-cup-straw', 'No diet plans found', 'Formulate nutrition guidelines for your gym members.', Permissions.canCreate(MODULE) ? 'New Diet Plan' : '')}
      </div>

      ${renderModals()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
    bindEvents();
  }

  function renderModals() {
    const members = DB.getAll('members');
    const trainers = DB.getAll('trainers');

    return `
    <!-- Create/Edit Modal -->
    <div class="modal fade" id="dietModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="dietModalTitle">New Diet Plan</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="dietForm" novalidate>
            <div class="modal-body">
              <input type="hidden" id="dietId">
              <div class="mb-3">
                <label class="form-label">Plan Name *</label>
                <input type="text" class="form-control" id="dName" placeholder="e.g. Lean Muscle Gain & High Protein" required>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Trainer / Nutritionist *</label>
                  <select class="form-select" id="dTrainerId" required>
                    <option value="">Select Trainer</option>
                    ${trainers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Member</label>
                  <select class="form-select" id="dMemberId">
                    <option value="">General Template</option>
                    ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="row g-3 mb-3">
                <div class="col-md-3">
                  <label class="form-label">Target Calories</label>
                  <input type="number" class="form-control" id="dCalories" value="2200" required>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Protein (g)</label>
                  <input type="number" class="form-control" id="dProtein" value="150">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Carbs (g)</label>
                  <input type="number" class="form-control" id="dCarbs" value="240">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Fats (g)</label>
                  <input type="number" class="form-control" id="dFats" value="65">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Meal Breakdown / Schedule</label>
                <textarea class="form-control" id="dMeals" rows="4" placeholder="Breakfast: Oats + Whey Protein + Berries&#10;Lunch: Grilled Chicken / Paneer + Brown Rice&#10;Evening: Almonds + Green Tea&#10;Dinner: Steamed Fish / Tofu + Salad"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Diet Plan</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Meal Viewer Modal -->
    <div class="modal fade" id="mealViewModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content" id="mealDetailContent"></div>
      </div>
    </div>
    `;
  }

  function bindEvents() {
    document.getElementById('searchInput')?.addEventListener('input', Utils.debounce(e => { searchQuery = e.target.value; currentPage = 1; render(); }));
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const f = th.dataset.field;
        if (sortField === f) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortField = f; sortDir = 'asc'; }
        render();
      });
    });
    document.getElementById('dietForm')?.addEventListener('submit', saveDiet);
  }

  function openModal(id) {
    const form = document.getElementById('dietForm');
    Utils.resetForm(form);

    if (id) {
      const d = DB.getById('dietPlans', id);
      if (!d) return;
      document.getElementById('dietModalTitle').textContent = 'Edit Diet Plan';
      document.getElementById('dietId').value = d.id;
      document.getElementById('dName').value = d.name || '';
      document.getElementById('dTrainerId').value = d.trainerId || '';
      document.getElementById('dMemberId').value = d.memberId || '';
      document.getElementById('dCalories').value = d.calories || 2200;
      document.getElementById('dProtein').value = d.protein || 150;
      document.getElementById('dCarbs').value = d.carbs || 240;
      document.getElementById('dFats').value = d.fats || 65;
      document.getElementById('dMeals').value = Array.isArray(d.meals) ? d.meals.join('\n') : (d.meals || '');
    } else {
      document.getElementById('dietModalTitle').textContent = 'New Diet Plan';
    }
    new bootstrap.Modal(document.getElementById('dietModal')).show();
  }

  function saveDiet(e) {
    e.preventDefault();
    const form = document.getElementById('dietForm');
    if (!Utils.validateForm(form)) return;

    const id = document.getElementById('dietId').value;
    const mealsText = document.getElementById('dMeals').value.trim();
    const mealsArray = mealsText ? mealsText.split('\n').filter(Boolean) : [];

    const data = {
      name: document.getElementById('dName').value.trim(),
      trainerId: document.getElementById('dTrainerId').value,
      memberId: document.getElementById('dMemberId').value || null,
      calories: parseInt(document.getElementById('dCalories').value) || 2200,
      protein: parseInt(document.getElementById('dProtein').value) || 150,
      carbs: parseInt(document.getElementById('dCarbs').value) || 240,
      fats: parseInt(document.getElementById('dFats').value) || 65,
      meals: mealsArray,
      status: 'active'
    };

    if (id) {
      DB.update('dietPlans', id, data);
      Utils.logAudit('update', 'diets', `Updated diet plan: ${data.name}`);
      Utils.showToast('Diet plan updated successfully');
    } else {
      DB.create('dietPlans', data);
      Utils.logAudit('create', 'diets', `Created diet plan: ${data.name}`);
      Utils.showToast('Diet plan created successfully');
    }

    bootstrap.Modal.getInstance(document.getElementById('dietModal'))?.hide();
    render();
  }

  function deleteDiet(id) {
    const d = DB.getById('dietPlans', id);
    Utils.showConfirm('Delete Diet Plan', `Are you sure you want to delete <strong>${d?.name}</strong>?`, () => {
      DB.delete('dietPlans', id);
      Utils.logAudit('delete', 'diets', `Deleted diet plan: ${d?.name}`);
      Utils.showToast('Diet plan deleted', 'danger');
      render();
    });
  }

  function viewMeals(id) {
    const d = DB.getById('dietPlans', id);
    if (!d) return;
    const m = DB.getById('members', d.memberId);
    const meals = Array.isArray(d.meals) ? d.meals : (d.meals ? [d.meals] : [
      'Breakfast: Oatmeal with protein shake and banana',
      'Mid-morning: Apple with 15 almonds',
      'Lunch: Grilled chicken / paneer salad with brown rice',
      'Evening Snack: Boiled eggs / roasted chana',
      'Dinner: Stir-fried veggies with grilled fish / tofu'
    ]);

    const container = document.getElementById('mealDetailContent');
    container.innerHTML = `
      <div class="modal-header">
        <h5 class="modal-title">${d.name}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body p-4">
        <div class="alert alert-light border d-flex justify-content-between mb-3">
          <span>Member: <strong>${m?.name || 'General Template'}</strong></span>
          <span class="badge bg-primary fs-6">${d.calories || 2200} kcal</span>
        </div>

        <div class="row g-2 mb-4 text-center">
          <div class="col-4"><div class="p-2 border rounded bg-light"><small class="text-muted">Protein</small><div class="fw-bold text-success">${d.protein || 150}g</div></div></div>
          <div class="col-4"><div class="p-2 border rounded bg-light"><small class="text-muted">Carbs</small><div class="fw-bold text-warning">${d.carbs || 240}g</div></div></div>
          <div class="col-4"><div class="p-2 border rounded bg-light"><small class="text-muted">Fats</small><div class="fw-bold text-danger">${d.fats || 65}g</div></div></div>
        </div>

        <h6>Daily Meal Guidelines:</h6>
        <ul class="list-group">
          ${meals.map(meal => `<li class="list-group-item"><i class="bi bi-check2-circle text-success me-2"></i>${meal}</li>`).join('')}
        </ul>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    `;
    new bootstrap.Modal(document.getElementById('mealViewModal')).show();
  }

  window.DietsMod = { openModal, deleteDiet, viewMeals };
  render();
})();

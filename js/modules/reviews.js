/* ============================================================
   FitHub OS — Member Reviews & Feedback Module
   ============================================================ */
(function () {
  'use strict';

  App.init('reviews', [{ label: 'Reviews' }]);
  const content = App.getContent();
  const MODULE = 'reviews';
  let currentPage = 1;
  let filterRating = 0;

  function render() {
    let items = DB.getAll('reviews');
    const user = Auth.getCurrentUser();

    // Multi-tenant isolation
    const selectedGym = Auth.getSelectedGym();
    if (selectedGym) {
      items = items.filter(r => r.gymId === selectedGym);
    }

    // Rating Filter
    if (filterRating > 0) {
      items = items.filter(r => Math.floor(r.rating) === filterRating);
    }

    // Calculate rating score
    const avgScore = items.length ? (items.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / items.length).toFixed(1) : '5.0';

    items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const pg = Utils.paginate(items, currentPage, 8);

    content.innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-star me-2"></i>Customer Reviews & Ratings</h1>
          <div class="subtitle">Member testimonials, equipment feedback, and facility cleanliness scores</div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-primary" onclick="ReviewsMod.openModal()"><i class="bi bi-pencil-square me-1"></i>Write a Review</button>
        </div>
      </div>

      <!-- Rating Highlight Card -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card p-4 shadow-sm border text-center h-100" style="border-radius:12px">
            <div class="fs-1 fw-bold text-dark mb-0">${avgScore}</div>
            <div class="text-warning fs-5 mb-1">
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-fill"></i>
              <i class="bi bi-star-half"></i>
            </div>
            <div class="text-muted small">Based on ${items.length} verified reviews</div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="card p-4 shadow-sm border h-100" style="border-radius:12px">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="fw-bold mb-0">Rating Breakdown</h6>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary ${filterRating === 0 ? 'active' : ''}" onclick="ReviewsMod.setRating(0)">All</button>
                <button class="btn btn-outline-secondary ${filterRating === 5 ? 'active' : ''}" onclick="ReviewsMod.setRating(5)">5 ★</button>
                <button class="btn btn-outline-secondary ${filterRating === 4 ? 'active' : ''}" onclick="ReviewsMod.setRating(4)">4 ★</button>
                <button class="btn btn-outline-secondary ${filterRating === 3 ? 'active' : ''}" onclick="ReviewsMod.setRating(3)">3 ★</button>
              </div>
            </div>
            ${[5, 4, 3, 2, 1].map(stars => {
              const count = items.filter(r => Math.floor(r.rating) === stars).length;
              const pct = items.length ? Math.round((count / items.length) * 100) : 0;
              return `
                <div class="d-flex align-items-center gap-2 mb-2 small">
                  <span style="width:35px">${stars} ★</span>
                  <div class="progress flex-grow-1" style="height:8px">
                    <div class="progress-bar bg-warning" style="width: ${pct}%"></div>
                  </div>
                  <span class="text-muted" style="width:35px;text-align:right">${count}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="table-container fade-in">
        ${pg.data.length ? `
        <div class="row g-3 p-3">
          ${pg.data.map(r => {
            const m = DB.getById('members', r.memberId);
            const gym = DB.getById('gyms', r.gymId);
            const ratingNum = Math.floor(r.rating || 5);

            return `
              <div class="col-md-6">
                <div class="card h-100 p-3 border shadow-sm" style="border-radius:10px">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center gap-2">
                      <div class="topbar-avatar" style="background:#6C5CE7;width:32px;height:32px;font-size:12px">
                        ${Utils.capitalize(m?.name ? m.name.charAt(0) : 'M')}
                      </div>
                      <div>
                        <div class="fw-semibold text-dark small">${m?.name || 'Verified Member'}</div>
                        <small class="text-muted">${gym?.name || 'Partner Gym'}</small>
                      </div>
                    </div>
                    <div class="text-warning small">
                      ${Array(ratingNum).fill('<i class="bi bi-star-fill"></i>').join('')}
                      ${Array(5 - ratingNum).fill('<i class="bi bi-star"></i>').join('')}
                    </div>
                  </div>
                  <p class="text-secondary small mb-2 flex-grow-1">"${r.comment || 'Great facilities, clean locker rooms, and very supportive trainers.'}"</p>
                  <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                    <small class="text-muted">${Utils.timeAgo(r.date)}</small>
                    <div class="d-flex gap-1">
                      ${Permissions.canDelete(MODULE) ? `
                        <button class="btn btn-sm btn-link text-danger p-0" onclick="ReviewsMod.deleteReview('${r.id}')" title="Delete"><i class="bi bi-trash"></i></button>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="table-pagination p-3" id="pagination"></div>
        ` : Utils.renderEmptyState('bi-star', 'No reviews found', 'Share your fitness journey feedback.', 'Write a Review', () => ReviewsMod.openModal())}
      </div>

      ${renderModal()}
    `;

    Utils.renderPagination('pagination', pg, p => { currentPage = p; render(); });
  }

  function renderModal() {
    const gyms = DB.getAll('gyms');
    const members = DB.getAll('members');

    return `
    <div class="modal fade" id="reviewModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Share Member Feedback</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form id="reviewForm" novalidate>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Reviewing Member *</label>
                <select class="form-select" id="revMemberId" required>
                  <option value="">Select Member Profile</option>
                  ${members.map(m => `<option value="${m.id}" data-gym="${m.gymId}">${m.name}</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Gym *</label>
                <select class="form-select" id="revGymId" required>
                  ${gyms.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Rating (1 to 5 Stars) *</label>
                <select class="form-select" id="revRating" required>
                  <option value="5">⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                  <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                  <option value="3">⭐⭐⭐ (3 - Average)</option>
                  <option value="2">⭐⭐ (2 - Needs Improvement)</option>
                  <option value="1">⭐ (1 - Unsatisfactory)</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Your Review / Comments *</label>
                <textarea class="form-control" id="revComment" rows="3" placeholder="Share your experience about machines, classes, cleanliness, or staff" required></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Review</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function setRating(rating) {
    filterRating = rating;
    currentPage = 1;
    render();
  }

  function openModal() {
    const form = document.getElementById('reviewForm');
    Utils.resetForm(form);
    const gymId = Auth.getSelectedGym() || '';
    if (gymId) document.getElementById('revGymId').value = gymId;
    new bootstrap.Modal(document.getElementById('reviewModal')).show();
  }

  document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'reviewForm') {
      e.preventDefault();
      const form = e.target;
      if (!Utils.validateForm(form)) return;

      const data = {
        memberId: document.getElementById('revMemberId').value,
        gymId: document.getElementById('revGymId').value,
        rating: parseFloat(document.getElementById('revRating').value) || 5,
        comment: document.getElementById('revComment').value.trim(),
        date: new Date().toISOString(),
        status: 'approved'
      };

      DB.create('reviews', data);
      Utils.showToast('Thank you for your feedback!');
      bootstrap.Modal.getInstance(document.getElementById('reviewModal'))?.hide();
      render();
    }
  });

  function deleteReview(id) {
    Utils.showConfirm('Delete Review', 'Are you sure you want to remove this review?', () => {
      DB.delete('reviews', id);
      Utils.showToast('Review removed');
      render();
    });
  }

  window.ReviewsMod = { openModal, setRating, deleteReview };
  render();
})();

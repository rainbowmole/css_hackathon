import { freelancers } from './data.js';
import { state } from './state.js';
import { setChatFreelancer } from './chat.js';

export function switchView(view) {
  document.querySelectorAll('.view').forEach((node) => node.classList.remove('active'));
  document.querySelectorAll('.topbar-tab').forEach((node) => {
    node.classList.remove('active');
    node.setAttribute('aria-selected', 'false');
  });

  const viewEl = document.getElementById('view-' + view);
  const tabEl = document.querySelector(`.topbar-tab[data-view="${view}"]`);

  if (viewEl) viewEl.classList.add('active');
  if (tabEl) {
    tabEl.classList.add('active');
    tabEl.setAttribute('aria-selected', 'true');
  }
}

export function renderGrid(list) {
  const gridEl = document.getElementById('fl-grid');
  if (!gridEl) return;

  if (!list.length) {
    gridEl.innerHTML = '<p style="color:var(--text-tertiary);font-size:14px;padding:24px 0;">No freelancers match your search.</p>';
    return;
  }

  gridEl.innerHTML = list.map((f) => `
    <div class="fl-card" role="button" tabindex="0" data-freelancer-id="${f.id}" aria-label="Open profile for ${f.name}">
      <div class="fl-avatar" style="background:${f.color};color:${f.tcolor}">${f.initials}</div>
      <div class="fl-name">${f.name}</div>
      <div class="fl-role">${f.role}</div>
      <div class="fl-skills">
        ${f.skills.slice(0, 3).map((skill) => `<span class="skill-tag">${skill}</span>`).join('')}
      </div>
      <div class="fl-footer">
        <span class="fl-rate">${f.rate}</span>
        <span class="avail-badge ${f.avail ? 'avail-yes' : 'avail-no'}">
          ${f.avail ? 'Available' : 'Booked'}
        </span>
      </div>
    </div>`).join('');
}

export function filterFreelancers() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const category = document.getElementById('filter-cat').value;

  const result = freelancers.filter((f) => {
    const matchQuery = !query || [f.name, f.role, ...f.skills].some((s) => s.toLowerCase().includes(query));
    const matchCategory = !category || f.cat === category;
    return matchQuery && matchCategory;
  });

  renderGrid(result);
}

export function openProfile(id) {
  const selected = freelancers.find((f) => f.id === id);
  if (!selected) return;

  state.currentFreelancer = selected;
  state.chatHistory = [];

  document.getElementById('client-list').style.display = 'none';
  document.getElementById('client-profile').style.display = 'block';

  const statusText = selected.avail ? 'Available now' : 'Currently booked';
  const statusColor = selected.avail ? '#1D9E75' : '#D85A30';

  document.getElementById('profile-detail').innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar" style="background:${selected.color};color:${selected.tcolor}">${selected.initials}</div>
      <div>
        <div class="profile-name">${selected.name}</div>
        <div class="profile-role">${selected.role}</div>
        <div class="profile-rate">${selected.rate}
          &nbsp;·&nbsp;
          <span style="color:${statusColor};font-weight:500">${statusText}</span>
        </div>
      </div>
    </div>
    <div class="profile-bio">${selected.bio}</div>
    <div class="fl-skills" style="margin-bottom:16px">
      ${selected.skills.map((skill) => `<span class="skill-tag">${skill}</span>`).join('')}
    </div>
    <div class="profile-meta">
      <div class="meta-item">
        <div class="meta-label">Email</div>
        <div class="meta-val link">${selected.email}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Portfolio</div>
        <div class="meta-val link">${selected.portfolio}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Min. budget</div>
        <div class="meta-val">$${selected.minBudget.toLocaleString()}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Category</div>
        <div class="meta-val">${selected.cat}</div>
      </div>
    </div>`;

  setChatFreelancer(selected);
}

export function showList() {
  document.getElementById('client-list').style.display = 'block';
  document.getElementById('client-profile').style.display = 'none';
}

export function bindUIEvents() {
  const tabs = document.querySelector('.topbar-tabs');
  const grid = document.getElementById('fl-grid');

  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('.topbar-tab');
    if (!button) return;
    switchView(button.dataset.view);
  });

  document.getElementById('search-input').addEventListener('input', filterFreelancers);
  document.getElementById('filter-cat').addEventListener('change', filterFreelancers);
  document.getElementById('back-to-list').addEventListener('click', showList);

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('[data-freelancer-id]');
    if (!card) return;
    openProfile(Number(card.dataset.freelancerId));
  });

  grid.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('[data-freelancer-id]');
    if (!card) return;

    event.preventDefault();
    openProfile(Number(card.dataset.freelancerId));
  });
}

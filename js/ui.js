import { freelancers } from './data.js';
import { categorySkillMap, serviceCatalog } from './data.js';
import { state } from './state.js';
import { setChatFreelancer } from './chat.js';

export function switchView(view) {
  document.querySelectorAll('.view').forEach((node) => node.classList.remove('active'));
  document.querySelectorAll('.topbar-tab').forEach((node) => {
    node.classList.remove('active');
    node.setAttribute('aria-selected', 'false');
  });
  const topbar = document.querySelector('.topbar');

  const viewEl = document.getElementById('view-' + view);
  const tabEl = document.querySelector(`.topbar-tab[data-view="${view}"]:not([data-contact-trigger="true"])`);

  if (viewEl) viewEl.classList.add('active');
  if (topbar) topbar.hidden = view === 'intro';
  if (tabEl) {
    tabEl.classList.add('active');
    tabEl.setAttribute('aria-selected', 'true');
  }
}

export function setAppMode(mode) {
  const dashboardTab = document.querySelector('.topbar-tab[data-view="dashboard"]');
  const settingsTab = document.querySelector('.topbar-tab[data-view="settings"]');
  const profileTab = document.querySelector('.topbar-tab[data-view="profile"]');
  const viewDashboard = document.getElementById('view-dashboard');
  const viewSettings = document.getElementById('view-settings');
  const viewProfile = document.getElementById('view-profile');

  document.body.dataset.appMode = mode;

  const isFreelancerMode = mode === 'freelancer';
  if (dashboardTab) dashboardTab.hidden = !isFreelancerMode;
  if (settingsTab) settingsTab.hidden = !isFreelancerMode;
  if (profileTab) profileTab.hidden = !isFreelancerMode;
  if (viewDashboard) viewDashboard.hidden = !isFreelancerMode;
  if (viewSettings) viewSettings.hidden = !isFreelancerMode;
  if (viewProfile) viewProfile.hidden = !isFreelancerMode;
}

export function renderGrid(list) {
  const gridEl = document.getElementById('fl-grid');
  if (!gridEl) return;

  if (!list.length) {
    gridEl.innerHTML = '<p style="color:var(--text-tertiary);font-size:14px;padding:24px 0;">No freelancers match your search.</p>';
    return;
  }

  gridEl.innerHTML = list.map((f) => `
    <div class="fl-card" role="button" tabindex="0" data-freelancer-id="${f.id}" aria-expanded="false" aria-label="Flip card for ${f.name}">
      <div class="fl-card-inner">
        <article class="fl-face fl-front">
          <span class="fl-status-dot ${f.avail ? 'is-live' : 'is-busy'}" aria-hidden="true"></span>
          <div class="fl-id-avatar" style="background:${f.color};color:${f.tcolor}">${f.initials}</div>
          <div class="fl-id-name">${f.name}</div>
          <div class="fl-id-role">${f.role}</div>
          <div class="fl-skills">
            ${f.skills.slice(0, 3).map((skill) => `<span class="skill-tag">${skill}</span>`).join('')}
          </div>
        </article>
        <article class="fl-face fl-back">
          <div class="fl-back-head">
            <div class="fl-name">${f.name}</div>
            <div class="fl-role">${f.role}</div>
            <div class="fl-rate">${f.rate} · <span class="fl-inline-status ${f.avail ? 'is-live' : 'is-busy'}">${f.avail ? 'Available now' : 'Booked'}</span></div>
          </div>
          <p class="fl-back-bio">${f.bio}</p>
          <div class="fl-back-meta">
            <div><span>Email</span><strong>${f.email}</strong></div>
            <div><span>Portfolio</span><a class="fl-portfolio-link" href="https://${f.portfolio}" target="_blank" rel="noopener noreferrer">${f.portfolio}</a></div>
            <div><span>Min. budget</span><strong>$${f.minBudget.toLocaleString()}</strong></div>
            <div><span>Category</span><strong>${f.cat}</strong></div>
          </div>
          <div class="fl-back-actions">
            <button class="btn fl-check-profile" type="button" data-check-profile-id="${f.id}">Check Profile</button>
            <button class="btn btn-primary fl-chat-now" type="button" data-chat-now-id="${f.id}">Chat Now</button>
          </div>
        </article>
      </div>
    </div>`).join('');
}

function renderSkillOptions(category, selectedSkill = '') {
  const skillSelect = document.getElementById('filter-skill');
  if (!skillSelect) return;

  const options = category ? (categorySkillMap[category] || []) : [];
  const current = selectedSkill && options.includes(selectedSkill) ? selectedSkill : '';

  skillSelect.innerHTML = ['<option value="">Any skill</option>', ...options.map((skill) => `<option value="${skill}">${skill}</option>`)].join('');
  skillSelect.value = current;
}

function applyServicePreset() {
  const serviceSelect = document.getElementById('filter-service');
  const categorySelect = document.getElementById('filter-cat');
  const skillSelect = document.getElementById('filter-skill');

  const selectedService = serviceCatalog.find((service) => service.value === serviceSelect.value);
  if (!selectedService) {
    renderSkillOptions(categorySelect.value);
    filterFreelancers();
    return;
  }

  categorySelect.value = selectedService.category;
  renderSkillOptions(selectedService.category, selectedService.skill);
  skillSelect.value = selectedService.skill;
  filterFreelancers();
}

export function filterFreelancers() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const service = document.getElementById('filter-service').value;
  const category = document.getElementById('filter-cat').value;
  const skill = document.getElementById('filter-skill').value;
  const budget = Number(document.getElementById('filter-budget').value || 0);

  const selectedService = serviceCatalog.find((item) => item.value === service);
  const effectiveCategory = category || selectedService?.category || '';
  const effectiveSkill = skill || selectedService?.skill || '';

  const result = freelancers.filter((f) => {
    const matchQuery = !query || [f.name, f.role, ...f.skills].some((s) => s.toLowerCase().includes(query));
    const matchCategory = !effectiveCategory || f.cat === effectiveCategory;
    const matchSkill = !effectiveSkill || f.skills.some((item) => item === effectiveSkill);
    const matchBudget = !budget || f.minBudget <= budget;
    return matchQuery && matchCategory && matchSkill && matchBudget;
  });

  renderGrid(result);
}

function setProfilePanel(panel, options = {}) {
  const shouldAnimate = options.animate !== false;
  const profileTab = document.querySelector('[data-panel-target="profile"]');
  const chatTab = document.querySelector('[data-panel-target="chat"]');
  const deckPicker = document.querySelector('[data-deck-picker="true"]');
  const activeButton = document.querySelector(`[data-panel-target="${panel}"]`);
  const currentActive = deckPicker?.querySelector('.profile-panel-card.is-active');

  const shouldShuffle = Boolean(
    shouldAnimate
    &&
    deckPicker
    && activeButton
    && currentActive
    && currentActive !== activeButton
  );

  if (shouldShuffle) {
    if (deckPicker.firstElementChild !== activeButton) {
      deckPicker.prepend(activeButton);
    }

    activeButton.classList.remove('shuffle-out');
    currentActive.classList.remove('shuffle-in');
    activeButton.classList.add('shuffle-in');
    currentActive.classList.add('shuffle-out');

    if (deckPicker._shuffleTimer) {
      clearTimeout(deckPicker._shuffleTimer);
    }

    deckPicker._shuffleTimer = setTimeout(() => {
      activeButton.classList.remove('shuffle-in');
      currentActive.classList.remove('shuffle-out');
      deckPicker._shuffleTimer = null;
    }, 500);
  }

  if (!shouldShuffle && deckPicker && activeButton && deckPicker.firstElementChild !== activeButton) {
    deckPicker.prepend(activeButton);
  }

  const showChat = panel === 'chat';
  const applyPanelState = () => {
    if (profileTab) {
      profileTab.classList.toggle('is-active', !showChat);
      profileTab.setAttribute('aria-selected', showChat ? 'false' : 'true');
    }
    if (chatTab) {
      chatTab.classList.toggle('is-active', showChat);
      chatTab.setAttribute('aria-selected', showChat ? 'true' : 'false');
    }
  };

  if (deckPicker?._panelStateTimer) {
    clearTimeout(deckPicker._panelStateTimer);
    deckPicker._panelStateTimer = null;
  }

  if (shouldShuffle) {
    deckPicker._panelStateTimer = setTimeout(() => {
      applyPanelState();
      deckPicker._panelStateTimer = null;
    }, 200);
  } else {
    applyPanelState();
  }
}

export function openProfile(id, initialPanel = 'chat') {
  const selected = freelancers.find((f) => f.id === id);
  if (!selected) return;

  state.currentFreelancer = selected;
  state.chatHistory = [];

  const listPanel = document.getElementById('client-list');
  const profilePanel = document.getElementById('client-profile');
  const isModalPanel = profilePanel?.classList.contains('profile-modal');

  if (isModalPanel) {
    profilePanel.classList.add('open');
    profilePanel.setAttribute('aria-hidden', 'false');
  } else {
    if (listPanel) listPanel.style.display = 'none';
    if (profilePanel) profilePanel.style.display = 'block';
  }

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
  setProfilePanel(initialPanel, { animate: false });

  if (initialPanel === 'chat') {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) chatInput.focus();
  }
}

export function showList() {
  const listPanel = document.getElementById('client-list');
  const profilePanel = document.getElementById('client-profile');
  const isModalPanel = profilePanel?.classList.contains('profile-modal');

  if (isModalPanel) {
    profilePanel.classList.remove('open');
    profilePanel.setAttribute('aria-hidden', 'true');
  } else {
    if (listPanel) listPanel.style.display = 'block';
    if (profilePanel) profilePanel.style.display = 'none';
  }
}

export function bindUIEvents() {
  const tabs = document.querySelector('.topbar-tabs');
  const grid = document.getElementById('fl-grid');
  const serviceSelect = document.getElementById('filter-service');
  const categorySelect = document.getElementById('filter-cat');
  const skillSelect = document.getElementById('filter-skill');
  const profilePanel = document.getElementById('client-profile');
  const deckPicker = document.querySelector('[data-deck-picker="true"]');

  const resetActiveCards = () => {
    grid.querySelectorAll('.fl-card.is-flipped').forEach((node) => {
      node.classList.remove('is-flipped');
      node.setAttribute('aria-expanded', 'false');
    });
  };

  const toggleCardState = (card) => {
    if (!card) return;

    const willOpen = !card.classList.contains('is-flipped');
    resetActiveCards();

    if (!willOpen) return;
    card.classList.add('is-flipped');
    card.setAttribute('aria-expanded', 'true');
  };

  if (tabs) {
    tabs.addEventListener('click', (event) => {
      const button = event.target.closest('.topbar-tab');
      if (!button) return;
      if (button.dataset.contactTrigger === 'true') return;
      switchView(button.dataset.view);
    });
  }

  document.getElementById('search-input').addEventListener('input', filterFreelancers);
  serviceSelect.addEventListener('change', applyServicePreset);
  categorySelect.addEventListener('change', () => {
    serviceSelect.value = '';
    renderSkillOptions(categorySelect.value);
    filterFreelancers();
  });
  skillSelect.addEventListener('change', filterFreelancers);
  document.getElementById('filter-budget').addEventListener('change', filterFreelancers);
  document.getElementById('back-to-list').addEventListener('click', showList);

  document.querySelectorAll('[data-panel-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.panelTarget;
      if (!target) return;
      setProfilePanel(target);
      if (target === 'chat') {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.focus();
      }
    });

    button.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      const target = button.dataset.panelTarget;
      if (!target) return;
      setProfilePanel(target);
      if (target === 'chat') {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.focus();
      }
    });
  });

  if (deckPicker) {
    deckPicker.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) < 1) return;
      event.preventDefault();

      const activeTarget = deckPicker.querySelector('.profile-panel-card.is-active')?.dataset.panelTarget || 'profile';
      const nextTarget = event.deltaY > 0 ? 'chat' : 'profile';

      if (nextTarget !== activeTarget) {
        setProfilePanel(nextTarget);
      }
    }, { passive: false });

    deckPicker.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      setProfilePanel(event.key === 'ArrowDown' ? 'chat' : 'profile');
    });
  }

  if (profilePanel?.classList.contains('profile-modal')) {
    profilePanel.addEventListener('click', (event) => {
      if (!event.target.closest('[data-profile-close="true"]')) return;
      showList();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!profilePanel.classList.contains('open')) return;
      showList();
    });
  }

  grid.addEventListener('click', (event) => {
    const checkProfile = event.target.closest('[data-check-profile-id]');
    if (checkProfile) {
      event.preventDefault();
      event.stopPropagation();
      openProfile(Number(checkProfile.dataset.checkProfileId), 'profile');
      return;
    }

    const chatNow = event.target.closest('[data-chat-now-id]');
    if (chatNow) {
      event.preventDefault();
      event.stopPropagation();
      openProfile(Number(chatNow.dataset.chatNowId), 'chat');
      return;
    }

    const link = event.target.closest('.fl-portfolio-link');
    if (link) {
      event.stopPropagation();
      return;
    }

    const card = event.target.closest('[data-freelancer-id]');
    if (!card) return;

    toggleCardState(card);
  });

  grid.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('[data-freelancer-id]');
    if (!card) return;

    event.preventDefault();
    toggleCardState(card);
  });

  renderSkillOptions(categorySelect.value);
}

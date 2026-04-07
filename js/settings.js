import { state } from './state.js';

let showToast = () => {};

export function configureSettings(options = {}) {
  showToast = options.showToast || showToast;
}

export function renderSkillChips() {
  const chips = document.getElementById('skill-chips');
  chips.innerHTML = state.skills.map((skill, index) => `
    <div class="skill-chip">
      ${skill}
      <button type="button" data-remove-skill-index="${index}" aria-label="Remove skill ${skill}" title="Remove">x</button>
    </div>`).join('');
}

export function addSkill() {
  const input = document.getElementById('new-skill-input');
  const value = input.value.trim();

  if (value && !state.skills.includes(value)) {
    state.skills.push(value);
    renderSkillChips();
  }

  input.value = '';
  input.focus();
}

function removeSkill(index) {
  state.skills.splice(index, 1);
  renderSkillChips();
}

export function renderTriggers() {
  const triggerList = document.getElementById('trigger-list');
  triggerList.innerHTML = state.triggers.map((trigger, index) => `
    <label class="trigger-item">
      <input type="checkbox" ${trigger.checked ? 'checked' : ''} data-trigger-index="${index}">
      <div>
        <div class="trigger-text">${trigger.label}</div>
        <div class="trigger-sub">${trigger.sub}</div>
      </div>
    </label>`).join('');
}

export function saveProfile() {
  const name = document.getElementById('set-name').value || 'You';
  showToast(`Profile saved! Your bot is live, ${name.split(' ')[0]}.`);
}

export function bindSettingsEvents() {
  document.getElementById('add-skill-btn').addEventListener('click', addSkill);
  document.getElementById('new-skill-input').addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addSkill();
  });

  document.getElementById('skill-chips').addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-skill-index]');
    if (!button) return;

    removeSkill(Number(button.dataset.removeSkillIndex));
  });

  document.getElementById('trigger-list').addEventListener('change', (event) => {
    const input = event.target.closest('[data-trigger-index]');
    if (!input) return;

    const index = Number(input.dataset.triggerIndex);
    if (!Number.isNaN(index) && state.triggers[index]) {
      state.triggers[index].checked = input.checked;
    }
  });

  document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
}

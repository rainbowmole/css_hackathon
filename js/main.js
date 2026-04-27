import { freelancers } from './data.js';
import { showToast } from './toast.js';
import { configureChat, sendChat } from './chat.js';
import { bindUIEvents, renderGrid, setAppMode, switchView } from './ui.js';
import { bindSettingsEvents, configureSettings, renderSkillChips, renderTriggers } from './settings.js';

function bindChatEvents() {
  document.getElementById('send-btn').addEventListener('click', sendChat);
  document.getElementById('chat-input').addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    sendChat();
  });
}

function bindToastShortcutEvents() {
  document.querySelectorAll('[data-toast]').forEach((button) => {
    button.addEventListener('click', () => {
      showToast(button.dataset.toast);
    });
  });
}

function bindIntroEvents() {
  document.querySelectorAll('[data-open-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.appMode || 'customer';
      setAppMode(mode);
      switchView(button.dataset.openView);
    });

    button.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      const mode = button.dataset.appMode || 'customer';
      setAppMode(mode);
      switchView(button.dataset.openView);
    });
  });
}

function bindContactCardEvents() {
  const trigger = document.querySelector('[data-contact-trigger="true"]');
  const modal = document.getElementById('contact-modal');
  if (!trigger || !modal) return;

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  });

  modal.addEventListener('click', (event) => {
    if (!event.target.closest('[data-contact-close="true"]')) return;
    closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeModal();
  });
}

function init() {
  configureChat({ showToast });
  configureSettings({ showToast });

  const startView = document.body.dataset.startView || 'intro';
  const startMode = document.body.dataset.startMode
    || (startView === 'settings' || startView === 'dashboard' ? 'freelancer' : 'customer');

  setAppMode(startMode);
  switchView(startView);
  bindUIEvents();
  bindContactCardEvents();
  bindIntroEvents();
  bindChatEvents();
  bindSettingsEvents();
  bindToastShortcutEvents();

  renderGrid(freelancers);
  renderSkillChips();
  renderTriggers();
}

document.addEventListener('DOMContentLoaded', init);

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
  });
}

function init() {
  configureChat({ showToast });
  configureSettings({ showToast });

  setAppMode('customer');
  bindUIEvents();
  bindIntroEvents();
  bindChatEvents();
  bindSettingsEvents();
  bindToastShortcutEvents();

  renderGrid(freelancers);
  renderSkillChips();
  renderTriggers();
}

document.addEventListener('DOMContentLoaded', init);

import { freelancers } from './data.js';
import { showToast } from './toast.js';
import { configureChat, sendChat } from './chat.js';
import { bindUIEvents, renderGrid } from './ui.js';
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

function init() {
  configureChat({ showToast });
  configureSettings({ showToast });

  bindUIEvents();
  bindChatEvents();
  bindSettingsEvents();
  bindToastShortcutEvents();

  renderGrid(freelancers);
  renderSkillChips();
  renderTriggers();
}

document.addEventListener('DOMContentLoaded', init);

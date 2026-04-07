import { state } from './state.js';

let showToast = () => {};

export function configureChat(options = {}) {
  showToast = options.showToast || showToast;
}

export function setChatFreelancer(freelancer) {
  if (!freelancer) return;

  const avatarEl = document.getElementById('chat-avatar');
  const nameEl = document.getElementById('chat-name');
  const msgsEl = document.getElementById('chat-messages');

  avatarEl.style.background = freelancer.color;
  avatarEl.style.color = freelancer.tcolor;
  avatarEl.textContent = freelancer.initials;
  nameEl.textContent = freelancer.name + "'s assistant";

  msgsEl.innerHTML = '';
  appendBotMsg(
    `Hi! I'm ${freelancer.name}'s assistant. ${freelancer.name} is a ${freelancer.role.toLowerCase()} specialising in ${freelancer.skills.slice(0, 2).join(' and ')}. What project can I help you explore today?`
  );
}

function appendMessage(text, className) {
  const msgs = document.getElementById('chat-messages');
  const item = document.createElement('div');
  item.className = className;
  item.textContent = text;
  msgs.appendChild(item);
  msgs.scrollTop = msgs.scrollHeight;
}

export function appendBotMsg(text) {
  appendMessage(text, 'msg msg-bot');
}

function appendUserMsg(text) {
  appendMessage(text, 'msg msg-user');
}

function showTyping() {
  const msgs = document.getElementById('chat-messages');
  const wrapper = document.createElement('div');
  wrapper.className = 'typing-indicator';
  wrapper.id = 'typing-ind';
  wrapper.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  msgs.appendChild(wrapper);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideTyping() {
  const typing = document.getElementById('typing-ind');
  if (typing) typing.remove();
}

export async function sendChat() {
  if (state.isBotTyping || !state.currentFreelancer) return;

  const input = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-btn');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  appendUserMsg(text);
  state.chatHistory.push({ role: 'user', content: text });

  state.isBotTyping = true;
  sendButton.disabled = true;
  showTyping();

  const f = state.currentFreelancer;
  const systemPrompt = `You are a friendly, concise AI intake assistant for ${f.name}, a freelance ${f.role}.

Your job: qualify potential clients and help them decide if ${f.name} is a good fit for their project.

About ${f.name}:
- Skills: ${f.skills.join(', ')}
- Rate: ${f.rate}
- Minimum project budget: $${f.minBudget}
- Availability: ${f.avail ? 'Available now' : 'Currently booked - waitlist available'}
- Email: ${f.email}
- Portfolio: ${f.portfolio}
- Bio: ${f.bio}

Rules:
1. Ask ONE question at a time. Keep replies to 1-3 sentences.
2. Naturally gather: project type, goals, timeline, and budget - do not ask all at once.
3. If budget is below $${f.minBudget}, say something like: "That's a bit below ${f.name}'s minimum for this type of project, which starts around $${f.minBudget}. You can browse the portfolio at ${f.portfolio} - or I can let ${f.name} know you reached out."
4. If budget and scope are a good fit, collect the client's name and email, then offer a discovery call.
5. When they agree to a meeting, say exactly: "Great! I'll notify ${f.name} right away and you'll receive a calendar link shortly. Looking forward to connecting you two!"
6. Be warm and human - not robotic or form-like.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: state.chatHistory
      })
    });

    const data = await response.json();
    const reply = data?.content?.[0]?.text || 'Something went wrong - please try again.';

    state.chatHistory.push({ role: 'assistant', content: reply });
    hideTyping();
    appendBotMsg(reply);

    const normalizedReply = reply.toLowerCase();
    if (normalizedReply.includes('notify') || normalizedReply.includes('calendar link')) {
      setTimeout(() => showToast('Freelancer notified - meeting request sent!'), 800);
    }
  } catch (error) {
    hideTyping();
    appendBotMsg('Connection error - please try again in a moment.');
  } finally {
    state.isBotTyping = false;
    sendButton.disabled = false;
    input.focus();
  }
}

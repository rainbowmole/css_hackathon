import { state } from './state.js';
import { buildGoogleCalendarLink, generateGeminiReply, getSuggestedMeetingSlots } from './integrations.js';

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

function appendScheduleCard(freelancer, summaryText) {
  const msgs = document.getElementById('chat-messages');
  const card = document.createElement('div');
  card.className = 'schedule-card';

  const title = document.createElement('div');
  title.className = 'schedule-card-title';
  title.textContent = 'Pick a time to schedule the meeting';

  const summary = document.createElement('div');
  summary.className = 'schedule-card-sub';
  summary.textContent = summaryText;

  const actions = document.createElement('div');
  actions.className = 'schedule-card-actions';

  getSuggestedMeetingSlots().forEach((slot) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary schedule-slot-btn';
    button.textContent = slot.label;
    button.addEventListener('click', () => {
      const link = buildGoogleCalendarLink({
        title: `Meeting with ${freelancer.name}`,
        details: `Scheduled via FreelanceConnect for ${freelancer.name}.`,
        location: 'Google Meet',
        start: slot.start,
        end: slot.end
      });

      window.open(link, '_blank', 'noopener,noreferrer');
      appendBotMsg(`Invite created for ${slot.label}. I opened the Google Calendar event link.`);
      showToast('Calendar invite opened in a new tab.');
    });
    actions.appendChild(button);
  });

  card.appendChild(title);
  card.appendChild(summary);
  card.appendChild(actions);
  msgs.appendChild(card);
  msgs.scrollTop = msgs.scrollHeight;
}

function generateLocalReply(text, freelancer) {
  const lower = text.toLowerCase();

  if (/(meeting|call|calendar|book|schedule)/.test(lower)) {
    return `Great. I can help schedule a meeting with ${freelancer.name}. Pick a time below and I’ll generate a Google Calendar invite.`;
  }

  if (/(budget|cost|price|rate)/.test(lower)) {
    return `Projects with ${freelancer.name} typically start around $${freelancer.minBudget}. What budget range are you aiming for?`;
  }

  if (/(timeline|deadline|when)/.test(lower)) {
    return `What delivery timeline are you working with? That helps me check if ${freelancer.name} is the right fit.`;
  }

  return `Tell me a bit more about the project goals, budget, and timeline, and I’ll narrow it down.`;
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
    const geminiReply = await generateGeminiReply({ systemPrompt, messages: state.chatHistory });
    const reply = geminiReply || generateLocalReply(text, f);

    state.chatHistory.push({ role: 'assistant', content: reply });
    hideTyping();
    appendBotMsg(reply);

    const normalizedReply = reply.toLowerCase();
    if (normalizedReply.includes('calendar invite') || normalizedReply.includes('schedule a meeting') || normalizedReply.includes('pick a time')) {
      appendScheduleCard(f, 'Choose a slot and I will generate the event link for both sides.');
    }

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

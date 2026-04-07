import { state } from './state.js';
import { buildGoogleCalendarLink, generateGeminiReply, getSuggestedMeetingSlots } from './integrations.js';

let showToast = () => {};
let leadCapture = null;

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
  leadCapture = {
    project: '',
    budget: null,
    timeline: '',
    name: '',
    email: ''
  };
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

function extractHourlyRate(rateText) {
  const match = String(rateText || '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function getFreelancerInfoReply(text, freelancer) {
  const lower = text.toLowerCase();
  const hourlyRate = extractHourlyRate(freelancer.rate);
  const dailyRate = hourlyRate ? hourlyRate * 8 : null;

  if (/(daily rate|per day|day rate)/.test(lower)) {
    if (dailyRate) {
      return `${freelancer.name}'s estimated day rate is about $${dailyRate}/day (based on ${freelancer.rate}).`;
    }
    return `${freelancer.name}'s listed rate is ${freelancer.rate}.`;
  }

  if (/(hourly rate|rate|cost|price|pricing)/.test(lower)) {
    return `${freelancer.name}'s standard rate is ${freelancer.rate}, and typical projects start around $${freelancer.minBudget}.`;
  }

  if (/(available|availability|booked|free this week|free now)/.test(lower)) {
    return freelancer.avail
      ? `${freelancer.name} is currently available for new work.`
      : `${freelancer.name} is currently booked, but can join a waitlist or discuss future start dates.`;
  }

  if (/(skills|expertise|speciali[sz]e|what can .* do|services)/.test(lower)) {
    return `${freelancer.name} specializes in ${freelancer.skills.join(', ')}.`;
  }

  if (/(about|background|experience|bio|who is|tell me more)/.test(lower)) {
    return `${freelancer.name} is a ${freelancer.role}. ${freelancer.bio}`;
  }

  if (/(portfolio|work samples|past work)/.test(lower)) {
    return `You can review ${freelancer.name}'s portfolio at ${freelancer.portfolio}.`;
  }

  if (/(email|contact|reach)/.test(lower)) {
    return `You can contact ${freelancer.name} at ${freelancer.email}. If you want, I can also help schedule a call.`;
  }

  return '';
}

function parseBudget(text) {
  const normalized = text.replace(/,/g, '');
  const rangeMatch = normalized.match(/\$?\s*(\d{2,6})\s*(?:-|to)\s*\$?\s*(\d{2,6})/i);
  if (rangeMatch) {
    return Math.max(Number(rangeMatch[1]), Number(rangeMatch[2]));
  }

  const singleMatch = normalized.match(/\$\s*(\d{2,6})|\b(\d{2,6})\s*(usd|dollars?)\b/i);
  if (!singleMatch) return null;
  return Number(singleMatch[1] || singleMatch[2]);
}

function parseEmail(text) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0] : '';
}

function parseName(text) {
  const intentMatch = text.match(/(?:i am|i'm|my name is)\s+([a-z][a-z\s'-]{1,40})/i);
  if (!intentMatch) return '';
  return intentMatch[1]
    .trim()
    .split(' ')
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function inferProjectType(text) {
  const lower = text.toLowerCase();
  if (/(logo|brand|identity|figma|ui|ux|design)/.test(lower)) return 'design project';
  if (/(web|website|app|react|node|api|mobile|ios|android)/.test(lower)) return 'development project';
  if (/(copy|content|blog|seo|email)/.test(lower)) return 'content project';
  if (/(ads|growth|marketing|funnel|campaign)/.test(lower)) return 'marketing project';
  return '';
}

function updateLeadCapture(text) {
  if (!leadCapture) {
    leadCapture = { project: '', budget: null, timeline: '', name: '', email: '' };
  }

  const budget = parseBudget(text);
  const email = parseEmail(text);
  const name = parseName(text);
  const project = inferProjectType(text);

  if (budget) leadCapture.budget = budget;
  if (email) leadCapture.email = email;
  if (name) leadCapture.name = name;
  if (project && !leadCapture.project) leadCapture.project = project;

  if (!leadCapture.timeline && /(day|week|month|asap|urgent|deadline|launch|timeline)/i.test(text)) {
    leadCapture.timeline = text.trim();
  }
}

function generateLocalReply(text, freelancer) {
  const lower = text.toLowerCase();
  const freelancerInfoReply = getFreelancerInfoReply(text, freelancer);
  if (freelancerInfoReply) {
    return freelancerInfoReply;
  }

  updateLeadCapture(text);

  const asksToMeet = /(meeting|call|calendar|book|schedule|discovery)/.test(lower);

  if (asksToMeet && (!leadCapture.name || !leadCapture.email)) {
    return 'Happy to set that up. Before I schedule, can you share your name and best email?';
  }

  if (asksToMeet && leadCapture.name && leadCapture.email) {
    return `Perfect, ${leadCapture.name}. I have your email as ${leadCapture.email}. Pick a time below and I will prepare the Google Calendar invite for both of you.`;
  }

  if (leadCapture.budget && leadCapture.budget < freelancer.minBudget) {
    return `Thanks for sharing. That budget is a bit below ${freelancer.name}'s usual minimum of $${freelancer.minBudget}. If flexible, we can explore a smaller scope, or I can still pass your request to ${freelancer.name}.`;
  }

  if (!leadCapture.project) {
    return `Great start. What type of project are you planning so I can check fit with ${freelancer.name}'s expertise?`;
  }

  if (!leadCapture.budget) {
    return `Got it. What budget range are you targeting for this ${leadCapture.project}?`;
  }

  if (!leadCapture.timeline) {
    return 'Thanks. What timeline are you aiming for? A rough target is enough.';
  }

  if (!leadCapture.name || !leadCapture.email) {
    return 'This looks like a strong fit. Share your name and email, and I can line up a discovery call.';
  }

  if (/(budget|cost|price|rate)/.test(lower)) {
    return `Projects with ${freelancer.name} typically start around $${freelancer.minBudget}. What budget range are you aiming for?`;
  }

  if (/(timeline|deadline|when)/.test(lower)) {
    return `What delivery timeline are you working with? That helps me check if ${freelancer.name} is the right fit.`;
  }

  return `Nice - this sounds like a potential fit for ${freelancer.name}. If you want, I can schedule a discovery call now.`;
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
    let reply = '';
    try {
      const geminiReply = await generateGeminiReply({ systemPrompt, messages: state.chatHistory });
      reply = geminiReply || generateLocalReply(text, f);
      if (!geminiReply) {
        showToast('Using local assistant reply. Add a working Gemini key for AI responses.');
      }
    } catch (geminiError) {
      reply = generateLocalReply(text, f);
      showToast('Gemini unavailable or quota exceeded. Using local assistant.');
    }

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

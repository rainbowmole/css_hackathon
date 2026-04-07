const appConfig = globalThis.APP_CONFIG || {};

function formatCalendarDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export function getSuggestedMeetingSlots() {
  const now = new Date();
  const base = new Date(now);
  base.setUTCDate(base.getUTCDate() + 1);

  const buildSlot = (dayOffset, hour, minute, label) => {
    const start = new Date(base);
    start.setUTCDate(base.getUTCDate() + dayOffset);
    start.setUTCHours(hour, minute, 0, 0);
    const end = new Date(start);
    end.setUTCMinutes(end.getUTCMinutes() + 30);

    return {
      label,
      start,
      end,
      value: `${formatCalendarDate(start)} / ${formatCalendarDate(end)}`
    };
  };

  return [
    buildSlot(0, 14, 0, 'Tomorrow, 2:00 PM'),
    buildSlot(0, 16, 0, 'Tomorrow, 4:00 PM'),
    buildSlot(1, 15, 0, 'Day after tomorrow, 3:00 PM')
  ];
}

export function buildGoogleCalendarLink({ title, details, location, start, end }) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details,
    location,
    dates: `${formatCalendarDate(start)}/${formatCalendarDate(end)}`
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export async function generateGeminiReply({ systemPrompt, messages }) {
  const apiKey = appConfig.geminiApiKey;
  if (!apiKey) return null;

  const model = appConfig.geminiModel || 'gemini-2.0-flash';
  const contents = messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }]
  }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.6, maxOutputTokens: 300 }
    })
  });

  if (!response.ok) {
    throw new Error('Gemini request failed');
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || null;
}
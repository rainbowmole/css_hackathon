import { defaultSkills, defaultTriggers } from './data.js';

export const state = {
  currentFreelancer: null,
  chatHistory: [],
  isBotTyping: false,
  skills: [...defaultSkills],
  triggers: defaultTriggers.map((trigger) => ({ ...trigger }))
};

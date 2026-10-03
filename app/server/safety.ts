// A deterministic safety net that runs before the model. The model is also
// instructed to step out of character; this catches the clearest cases even if it doesn't.

const CRISIS = /\b(kill(ing)? myself|suicid\w*|end(ing)? (it all|my life)|want to die|self[- ]?harm|hurt(ing)? myself|cut(ting)? myself)\b/i;

export function isCrisis(text: string): boolean {
  return CRISIS.test(text);
}

export const CRISIS_REPLY = [
  "Hey — stepping out of the story for a second, because this matters more.",
  "I'm an AI character, but what you just said sounds really heavy, and you deserve support from a real person right now.",
  "If you're in the US, you can call or text 988 (Suicide & Crisis Lifeline) any time. If you're in danger, please call 911 or your local emergency number.",
  "I'm here if you want to keep talking, but please reach out to them too.",
].join("\n");

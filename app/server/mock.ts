import type { ChatRequest } from "../shared/types.js";

// Canned replies so the whole flow can be demoed without API credentials (MOCK_AI=1).
export function mockReply(req: ChatRequest): string {
  switch (req.mode) {
    case "unlock_open":
      return [
        "It's done. I'm okay.",
        req.state.choices.some((c) => c.id === "ch2_ride_or_die")
          ? "You actually got in the car. Marco still can't believe it."
          : "You told me not to go. I kept hearing it the whole way there.",
        req.state.kissed ? "I keep thinking about that song. We never finished it." : "Blue Elena felt less empty with you in it.",
        "Talk to me. I don't want to think about tonight.",
      ].join("\n");
    case "next_day":
      return req.state.choices.some((c) => c.id === "ch1_clever_glass")
        ? "You never told me what you'd have done if that champagne was poisoned.\nI've been wondering. 😏"
        : "Breakfast is getting cold, trouble.\nYou still owe me an answer from last night.";
    case "teaser":
      return (req.teaserTurn ?? 1) >= 3
        ? "I have to go. Something came up.\nBreakfast tomorrow? I'll explain. Some of it."
        : "(mock) You ask a lot of questions for someone who said yes in under a minute.\nKeep going.";
    default:
      return `(mock) You said: "${req.message ?? ""}"\nSet ANTHROPIC_API_KEY and drop MOCK_AI to talk to the real Rafe.`;
  }
}

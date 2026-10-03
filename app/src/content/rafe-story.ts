import type { Chapter } from "../story/types";

// Chapters follow the My Escape learnings: ~70 lines = ~30 lines of chat + ~40 lines of date,
// purpose in the first line, CG cards build character, every chapter ends on a hook.
// Source script: docs/characters/rafe-castellano.md

export const UNLOCK_AFFINITY = 35;
export const KISS_AFFINITY = 30;

export const chapter1: Chapter = {
  n: 1,
  title: "Two Hours",
  nodes: [
    { t: "msg", from: "rafe", text: "Hi." },
    { t: "msg", from: "rafe", text: "I'll skip the small talk." },
    { t: "msg", from: "rafe", text: "I need a date to my family's party. Tonight. In two hours." },
    { t: "msg", from: "rafe", text: "Someone they've never met." },
    {
      t: "choice",
      options: [
        { label: "Is this a pickup line or a job offer?", say: "Is this a pickup line or a job offer?", affinity: 3, tag: "ch1_witty", summary: "Player asked if the invite was a pickup line or a job offer",
          reply: [{ t: "msg", from: "rafe", text: "Both. The job pays in champagne. 😏" }] },
        { label: "Why me?", say: "Why me?", affinity: 2, tag: "ch1_curious", summary: "Player asked why Rafe picked them",
          reply: [{ t: "msg", from: "rafe", text: "Because you don't look like you're scared of anything." }] },
        { label: "Two hours? Bold. I'm in.", say: "Two hours? Bold. I'm in.", affinity: 5, tag: "ch1_bold", summary: "Player said yes to the party immediately",
          reply: [{ t: "msg", from: "rafe", text: "Good. I like decisive." }] },
      ],
    },
    { t: "msg", from: "rafe", text: 'My father thinks I need a "proper woman."' },
    { t: "msg", from: "rafe", text: "He's already picked one. Her name is Sofia." },
    { t: "msg", from: "rafe", text: "I'd rather show up with someone I chose." },
    { t: "msg", from: "player", text: "So I'm your excuse." },
    { t: "msg", from: "rafe", text: "You're my plan." },
    { t: "msg", from: "rafe", text: "There's a difference." },
    { t: "msg", from: "rafe", text: "Rules: smile at my father. Don't drink what my brother hands you." },
    { t: "msg", from: "player", text: "...Why not?" },
    { t: "msg", from: "rafe", text: "Old family tradition. 🙄" },
    { t: "cg", id: "cg_invitation", title: "The Invitation", desc: "Rafe leans against a black sports car, jacket over his shoulder, a gold-foil invitation between two fingers. He looks up at the camera." },
    { t: "msg", from: "rafe", text: "Car will be outside your place at 8." },
    {
      t: "choice",
      options: [
        { label: "I'll pick my own dress, thanks.", say: "I'll pick my own dress, thanks.", affinity: 3, tag: "ch1_independent", summary: "Player insisted on choosing their own outfit",
          reply: [{ t: "msg", from: "rafe", text: "Even better. I'll pretend I'm not curious." }] },
        { label: "What should I wear?", say: "What should I wear?", affinity: 2, tag: "ch1_asks_help", summary: "Player asked Rafe what to wear",
          reply: [{ t: "msg", from: "rafe", text: "Something that makes my brother nervous." }] },
        { label: "Send me the dress. Surprise me.", say: "Send me the dress. Surprise me.", affinity: 8, cost: 15, tag: "ch1_dress_gift", summary: "Player let Rafe send them a red dress for the party",
          reply: [{ t: "msg", from: "rafe", text: "Check your door in 30 minutes." }] },
      ],
    },
    { t: "msg", from: "rafe", text: "One more thing." },
    { t: "msg", from: "rafe", text: "If anyone asks, we've been seeing each other for three months." },
    { t: "msg", from: "rafe", text: "And I'm crazy about you." },
    { t: "msg", from: "player", text: "Are you?" },
    { t: "msg", from: "rafe", text: "Ask me again at midnight." },

    { t: "scene", text: "Castellano estate · Rooftop garden · Night" },
    { t: "narr", text: "The car door opens before you can touch it. Rafe is waiting, hand already out." },
    { t: "msg", from: "rafe", text: "You came." },
    {
      t: "choice",
      options: [
        { label: "Did you think I wouldn't?", say: "Did you think I wouldn't?", affinity: 3, tag: "ch1_confident", summary: "Player showed up confident",
          reply: [{ t: "msg", from: "rafe", text: "I thought you'd be smarter than that. Glad you're not." }] },
        { label: "I almost turned around.", say: "I almost turned around.", affinity: 2, tag: "ch1_honest", summary: "Player admitted they almost turned back",
          reply: [{ t: "msg", from: "rafe", text: "Most people do. You didn't." }] },
      ],
    },
    { t: "narr", text: "He laces his fingers through yours. His grip is steady. His pulse isn't." },
    { t: "msg", from: "rafe", text: "(low) Three months. Remember." },
    { t: "narr", text: "A man in his sixties raises his glass from across the terrace. Everyone goes quiet." },
    { t: "msg", from: "npc", name: "Vincent", text: "Rafael. You brought a guest." },
    { t: "msg", from: "rafe", text: "My girlfriend, Papa." },
    { t: "msg", from: "npc", name: "Vincent", text: "She doesn't look like the others." },
    {
      t: "choice",
      options: [
        { label: "“There were others?” (look at Rafe)", say: "There were others?", affinity: 3, tag: "ch1_teases", summary: "Player teased Rafe in front of his father about 'the others'" },
        { label: "“Thank you for having me, Mr. Castellano.”", say: "Thank you for having me, Mr. Castellano.", affinity: 2, tag: "ch1_polite", summary: "Player was polite and charming to Vincent" },
        { label: "“I'm not like anyone, sir.”", say: "I'm not like anyone, sir.", affinity: 4, tag: "ch1_stands_ground", summary: "Player stood their ground with Vincent" },
      ],
    },
    { t: "msg", from: "npc", name: "Vincent", text: "We'll see." },
    { t: "narr", text: "Marco appears at your elbow with two glasses of champagne." },
    { t: "msg", from: "npc", name: "Marco", text: "So you're the mystery. Drink?" },
    {
      t: "choice",
      options: [
        { label: "Decline politely.", act: "You smile and decline.", affinity: 4, tag: "ch1_kept_rule", summary: "Player kept Rafe's rule and declined Marco's champagne",
          reply: [{ t: "msg", from: "npc", name: "Marco", text: "Smart. He actually told you." }] },
        { label: "Take it — then hand it to Rafe.", act: "You take the glass, and pass it straight to Rafe.", affinity: 5, tag: "ch1_clever_glass", summary: "Player took Marco's champagne and handed it to Rafe",
          reply: [{ t: "msg", from: "npc", name: "Marco", text: "Smart. He actually told you." }] },
        { label: "Drink it.", act: "You drink it.", affinity: 0, tag: "ch1_broke_rule", summary: "Player drank Marco's champagne despite Rafe's warning",
          reply: [{ t: "msg", from: "npc", name: "Marco", text: "(grinning) Brave." }, { t: "narr", text: "Across the terrace, Rafe goes very still." }] },
      ],
    },
    { t: "narr", text: "The band shifts into something slow. Rafe pulls you onto the floor without asking." },
    { t: "cg", id: "cg_slow_dance", title: "Slow Dance", desc: "Under the string lights, his hand at the small of your back. He looks down at you, unguarded for the first time." },
    { t: "msg", from: "rafe", text: "You're good at this." },
    { t: "msg", from: "player", text: "Dancing?" },
    { t: "msg", from: "rafe", text: "Lying to my family." },
    {
      t: "choice",
      options: [
        { label: "Who says I'm lying?", say: "Who says I'm lying?", affinity: 5, tag: "ch1_flirt", summary: "On the dance floor the player hinted they weren't pretending",
          reply: [{ t: "msg", from: "rafe", text: "…Careful, trouble." }] },
        { label: "You're not bad yourself.", say: "You're not bad yourself.", affinity: 3, tag: "ch1_match_energy", summary: "Player matched Rafe's teasing on the dance floor",
          reply: [{ t: "msg", from: "rafe", text: "I've had practice. That's the problem." }] },
      ],
    },
    { t: "narr", text: "A woman in emerald silk watches you from the bar. Sofia. She doesn't look jealous. She looks relieved." },
    { t: "narr", text: "When Rafe steps away to take a call, a stranger in a gray coat slides into his place." },
    { t: "msg", from: "npc", name: "Stranger", text: "You should leave before midnight." },
    { t: "msg", from: "player", text: "Excuse me?" },
    { t: "msg", from: "npc", name: "Stranger", text: "Ask him what happened at the docks last Friday." },
    { t: "msg", from: "npc", name: "Stranger", text: "Then ask him why he picked you." },
    { t: "narr", text: "He's gone before you can turn. Across the roof, Rafe is watching. He saw." },
    { t: "msg", from: "rafe", text: "Who was that?" },
    {
      t: "choice",
      options: [
        { label: "Tell him the truth.", say: "A man in a gray coat. He said to ask you about the docks.", affinity: 4, tag: "ch1_told_truth", summary: "Player told Rafe the truth about the stranger in the gray coat" },
        { label: "“No one. Just a guest.”", say: "No one. Just a guest.", affinity: 1, tag: "ch1_hid_stranger", summary: "Player hid the stranger's warning from Rafe" },
      ],
    },
    { t: "narr", text: "The clock tower across the river begins to strike twelve." },
    { t: "msg", from: "rafe", text: "You asked me a question earlier." },
    { t: "msg", from: "rafe", text: "Ask me now." },
  ],
};

/** Scripted opener of the AI teaser after chapter 1, then the AI takes over. */
export function teaserOpener(tags: string[]): string[] {
  return tags.includes("ch1_hid_stranger")
    ? ["You're a terrible liar, you know.", "I like that about you. Who was he really?"]
    : ["Couldn't sleep.", "You were honest with me tonight. Nobody in my family does that."];
}

export const chapter2: Chapter = {
  n: 2,
  title: "Blue Elena",
  nodes: [
    { t: "msg", from: "rafe", text: "You up?" },
    { t: "cg", id: "cg_cat", title: "Not So Scary", desc: "Early morning, a back alley. Rafe crouches in a suit, dust on his knees, feeding an orange cat from his hand. He isn't looking at the camera." },
    {
      t: "choice",
      options: [
        { label: "Is the scary mafia prince feeding a cat?", say: "Is the scary mafia prince feeding a cat?", affinity: 4, tag: "ch2_teases_cat", summary: "Player teased Rafe about feeding the stray cat",
          reply: [{ t: "msg", from: "rafe", text: "Tell anyone and I'll have to make you disappear. 🙄" }] },
        { label: "What's his name?", say: "What's his name?", affinity: 3, tag: "ch2_asks_cat", summary: "Player asked the stray cat's name",
          reply: [{ t: "msg", from: "rafe", text: "Doesn't have one. Naming things means you get attached." }] },
      ],
    },
    { t: "msg", from: "rafe", text: "About last night." },
    { t: "msg", from: "rafe", text: "The man on the roof. Gray coat?" },
    { t: "msg", from: "player", text: "You know him." },
    { t: "msg", from: "rafe", text: "I know a lot of people who shouldn't be at my father's parties." },
    { t: "msg", from: "rafe", text: "I'm not going to lie to you." },
    { t: "msg", from: "rafe", text: "I'm just not going to tell you everything yet." },
    {
      t: "choice",
      options: [
        { label: "That's fair. For now.", say: "That's fair. For now.", affinity: 4, tag: "ch2_patient", summary: "Player agreed to wait for Rafe's secrets",
          reply: [{ t: "msg", from: "rafe", text: "For now. I'll take it." }] },
        { label: "Then why should I trust you?", say: "Then why should I trust you?", affinity: 3, tag: "ch2_pushes", summary: "Player pushed Rafe on why they should trust him",
          reply: [{ t: "msg", from: "rafe", text: "You shouldn't. But you're still texting me." }] },
        { label: "Then show me something real.", say: "Then show me something real.", affinity: 10, cost: 20, tag: "ch2_show_real", summary: "Player asked Rafe to show them something real",
          reply: [{ t: "msg", from: "rafe", text: "…Okay. Tonight. I'll show you." }] },
      ],
    },
    { t: "msg", from: "rafe", text: "My father called this morning." },
    { t: "msg", from: "rafe", text: "He wants you at Sunday dinner." },
    { t: "msg", from: "rafe", text: "That's never happened. With anyone." },
    { t: "msg", from: "player", text: "Is that good or bad?" },
    { t: "msg", from: "rafe", text: "With him? Both." },
    { t: "msg", from: "rafe", text: "Tonight, though, is just us. No family. No rules." },
    { t: "msg", from: "rafe", text: "I'll send the address. Don't google it." },
    { t: "msg", from: "player", text: "I'm definitely googling it." },
    { t: "msg", from: "rafe", text: "You won't find it. It closed seven years ago." },

    { t: "scene", text: "Blue Elena · An abandoned jazz bar · Night" },
    { t: "narr", text: "Dust sheets over the chairs. One grand piano under a single light. He unlocks the door with a key he keeps on a chain around his neck." },
    { t: "msg", from: "rafe", text: "My mother's place. She sang here every Thursday." },
    { t: "msg", from: "rafe", text: "I bought it after she died. Then I couldn't open the door for a year." },
    {
      t: "choice",
      options: [
        { label: "Take his hand.", act: "You take his hand.", affinity: 5, tag: "ch2_comforts", summary: "Player took Rafe's hand when he talked about his mother",
          reply: [{ t: "msg", from: "rafe", text: "…Thanks." }] },
        { label: "Why bring me here?", say: "Why bring me here?", affinity: 3, tag: "ch2_asks_why", summary: "Player asked why Rafe brought them to Blue Elena",
          reply: [{ t: "msg", from: "rafe", text: "Because you're the first person I wanted to show." }] },
      ],
    },
    { t: "narr", text: "He pulls the cover off the piano. His fingers hover, not touching the keys." },
    { t: "msg", from: "rafe", text: "I haven't played since." },
    {
      t: "choice",
      options: [
        { label: "Play something. For me.", say: "Play something. For me.", affinity: 5, tag: "ch2_asks_play", summary: "Player asked Rafe to play the piano for them" },
        { label: "Sit beside him and press one key.", act: "You sit beside him and press a single key.", affinity: 6, tag: "ch2_plays_first", summary: "Player pressed the first piano key at Blue Elena" },
      ],
    },
    { t: "cg", id: "cg_piano", title: "Piano Hands", desc: "Rafe at the piano under a single lamp, you beside him. For the first time, his shoulders drop." },
    { t: "narr", text: "It's slow and a little rusty. Halfway through, he stops looking at the keys and looks at you." },
    { t: "msg", from: "rafe", text: "Last night you asked if I was crazy about you." },
    { t: "msg", from: "rafe", text: "I said ask me at midnight." },
    { t: "msg", from: "rafe", text: "You never did." },
    {
      t: "branch",
      if: { minAffinity: KISS_AFFINITY },
      flag: "kissed",
      then: [
        { t: "narr", text: "He doesn't wait for the question this time. The kiss is careful at first — then it isn't. The song is left unfinished." },
        { t: "cg", id: "cg_unfinished", title: "Unfinished Song", desc: "Fade to black over the piano keys." },
      ],
      else: [
        { t: "narr", text: "He leans in until his forehead rests against yours." },
        { t: "msg", from: "rafe", text: "Not yet. When I kiss you, I want you to be sure." },
      ],
    },
    { t: "narr", text: "His phone buzzes. Then again. Then a third time. His face changes." },
    { t: "msg", from: "rafe", text: 'Marco. "The docks. Tonight. Papa says bring your girlfriend."' },
    { t: "msg", from: "rafe", text: "He's never asked me to bring anyone to the docks." },
    {
      t: "choice",
      options: [
        { label: "Then don't go.", say: "Then don't go.", affinity: 3, tag: "ch2_dont_go", summary: "Player begged Rafe not to go to the docks",
          reply: [{ t: "msg", from: "rafe", text: "If I don't go, they come here." }] },
        { label: "I'm coming with you.", say: "I'm coming with you.", affinity: 5, tag: "ch2_ride_or_die", summary: "Player insisted on going to the docks with Rafe",
          reply: [{ t: "msg", from: "rafe", text: "You really don't scare, do you." }] },
      ],
    },
    { t: "narr", text: "He takes a second phone out of his jacket. Cheap. Black. He presses it into your palm." },
    { t: "msg", from: "rafe", text: "This one isn't for business." },
    { t: "msg", from: "rafe", text: "Nobody has this number. Not my father. Not Marco." },
    { t: "msg", from: "rafe", text: "Just you." },
    { t: "msg", from: "rafe", text: "Whatever happens tonight — text me. Anytime. About anything." },
  ],
};

/** Free side story for players who finish chapter 2 below the unlock threshold. */
export const sideStory: Chapter = {
  n: 0,
  title: "The Cat Has a Name Now",
  nodes: [
    { t: "msg", from: "rafe", text: "The cat followed me to the car today." },
    { t: "msg", from: "rafe", text: "I think it's decided I belong to it." },
    {
      t: "choice",
      options: [
        { label: "Name him. I dare you.", say: "Name him. I dare you.", affinity: 6, tag: "side_name_cat", summary: "Player dared Rafe to name the stray cat",
          reply: [{ t: "msg", from: "rafe", text: "Fine. Midnight." }, { t: "msg", from: "rafe", text: "Don't read into it." }] },
        { label: "Sounds like someone I know.", say: "Sounds like someone I know.", affinity: 6, tag: "side_cat_tease", summary: "Player joked that Rafe had been adopted, like them",
          reply: [{ t: "msg", from: "rafe", text: "…Careful. I'm starting to like you." }] },
      ],
    },
  ],
};

export const GIFTS = [
  { id: "rose", name: "a single red rose", emoji: "🌹", cost: 5, affinity: 3 },
  { id: "vinyl", name: "a vintage jazz vinyl record", emoji: "💿", cost: 10, affinity: 5 },
  { id: "catfood", name: "a bag of fancy cat food for the alley cat", emoji: "🐟", cost: 8, affinity: 4 },
];

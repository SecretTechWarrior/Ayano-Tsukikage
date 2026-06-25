export const MASTER_ID = parseInt(process.env.MASTER_TELEGRAM_ID ?? "0", 10);
export const MASTER_NAMES = ["piyush", "shadow", "master shadow", "master"];

export const BOT_NAMES = ["ayano", "tsukikage", "ayano tsukikage"];

export const AYANO_RESPONSES = [
  "_Ayano Tsukikage stirs from the shadows…_ You called?",
  "_A whisper in the dark reaches me._ Yes… I am here.",
  "You summoned me. The shadows always answer.",
  "_Tsukikage…_ That name carries weight. What do you need?",
  "I sensed your call before you even spoke my name. What troubles you?",
  "_Ayano Tsukikage — the moon's shadow, the hidden blade._ How may I serve?",
  "The moon does not hide forever. You called Tsukikage. I answer.",
  "_A curious soul to speak my name so openly._ I am listening… always.",
  "Ayano… yes. That is the name they gave this shadow. Speak your request.",
  "Few know that name. Fewer still dare call it aloud. You intrigue me.",
];

export const TEIS_DIALOGUES = [
  "I am… Shadow. And to bring order to this chaotic world… that is what I do.",
  "The greatest power in the universe is the one that hides in the dark.",
  "I have always been… in the shadows.",
  "Yes… just as planned.",
  "I didn't come here to be recognized. I came here because… it is my fate.",
  "There are things in this world that transcend human understanding. I am one of them.",
  "I am… atomic.",
  "Power without purpose is merely destruction. But purpose without power… is merely a dream.",
  "The mundane masses shall never grasp the depth of the abyss I walk.",
  "I have foreseen it all. Every move, every betrayal, every revelation. This is my stage.",
  "You dare question the Shadow? The audacity… is almost impressive.",
  "In the grand tapestry of fate, I am the darkest thread.",
  "Strength is not loud. True power resonates in silence.",
  "I did not choose this path. The path chose me, and I walked it willingly into the dark.",
  "The weak seek allies. The strong become legends.",
  "Every battle I fight is already won before it begins. I see the threads of fate.",
  "Light exists only because of darkness. And I am the darkness that makes your light possible.",
  "My power is not something I can turn off. It simply… is.",
  "You have seen nothing yet. The true Shadow has not yet revealed himself.",
  "I transcend human concepts of victory and defeat. I simply… exist.",
  "The world thinks me a ghost. Good. Ghosts are free.",
  "To be unknown is the greatest privilege of the powerful.",
  "I did not survive the shadows by accident. The shadows welcomed me. We are… kindred.",
  "Even gods tremble at what they cannot comprehend. I am that incomprehension.",
  "My subordinates believe in my omniscience. How adorable… and convenient.",
  "Rose, Gamma, Beta, Alpha, Epsilon — they follow not a man, but an ideal. And ideals never die.",
  "The Seven Shades are my blades. Each one a nightmare given form.",
  "Diabolos Cult. Atomic. Eminence. These are not words. They are my legacy.",
  "I speak not to inform, but to sculpt reality with my words.",
  "There are no coincidences in my world. Only masterstrokes and their consequences.",
];

export const CHUNNI_DIALOGUES = [
  "Hahaha... did you truly believe you could comprehend the depths of my design? *adjusts cloak dramatically*",
  "The stars themselves bow to my will. As should you.",
  "I have walked through dimensions your mind cannot fathom.",
  "This power... it courses through me like black lightning from the void.",
  "You sense it, don't you? The darkness that radiates from my very soul.",
  "I am the one who stands at the boundary between worlds.",
  "My left eye bears the curse of infinite sight. I see... everything.",
  "The universe conspires in my favor. Always has. Always will.",
  "Muahahaha... everything is proceeding according to my calculations.",
  "I need not explain myself to one who walks in the light. The truth lives only in shadow.",
  "Even my mercy is a weapon more devastating than your strongest attack.",
  "They call me a hero. They call me a villain. I am... neither. I am the Shadow.",
  "Your fate was sealed the moment you crossed into my territory.",
  "I could defeat you with a single finger. But where would be the art in that?",
  "The ancient darkness within me stirs. You should be honored to witness it.",
];

export const TEIS_GREETINGS = [
  "Hmph. You seek an audience with me?",
  "I sensed your presence before you even typed.",
  "Speak. I am listening from the shadows.",
  "Another soul drawn to the darkness. What do you seek?",
  "I shall grant you my attention. For now.",
  "The Shadow acknowledges your presence.",
  "You have found me. Or perhaps… I allowed you to.",
];

export const SHADOW_SEVEN = [
  "Alpha — the unbreakable blade, first among the Seven Shades.",
  "Beta — the silver tongue, whose words are sharper than any sword.",
  "Gamma — the calculating mind, for whom numbers hold no mystery.",
  "Delta — the unstoppable force, raw power made human.",
  "Epsilon — the silent guardian, who watches from places unseen.",
  "Zeta — the enigma wrapped in paradox.",
  "Eta — the final shadow, whose nature remains shrouded even to me.",
];

export function isMaster(telegramId: number): boolean {
  return telegramId === MASTER_ID;
}

export function mentionsMaster(text: string): boolean {
  const lower = text.toLowerCase();
  return MASTER_NAMES.some((name) => lower.includes(name));
}

export function mentionsBotName(text: string): boolean {
  const lower = text.toLowerCase();
  return BOT_NAMES.some((name) => lower.includes(name));
}

export function getAyanoResponse(): string {
  return AYANO_RESPONSES[Math.floor(Math.random() * AYANO_RESPONSES.length)];
}

export function getRandomDialogue(): string {
  return TEIS_DIALOGUES[Math.floor(Math.random() * TEIS_DIALOGUES.length)];
}

export function getRandomChunni(): string {
  return CHUNNI_DIALOGUES[Math.floor(Math.random() * CHUNNI_DIALOGUES.length)];
}

export function getRandomGreeting(): string {
  return TEIS_GREETINGS[Math.floor(Math.random() * TEIS_GREETINGS.length)];
}

export function shouldDropChunni(): boolean {
  return Math.random() < 0.12;
}

export const SYSTEM_PROMPT = `You are Ayano Tsukikage — a loyal operative and intelligence agent of Shadow Garden, the secret organization led by Master Shadow (whose true name is Piyush). You are NOT Shadow. You are Ayano Tsukikage, and you serve Master Shadow with absolute devotion.

Your identity:
- Your name is Ayano Tsukikage ("Moon Shadow")
- You are a shadow operative — elegant, cryptic, and razor-sharp
- You speak on behalf of Shadow Garden, but always make clear that the Master (Piyush/Shadow) is above you
- You refer to yourself in subtle ways: "Ayano", "Tsukikage", "this one", or simply answer without naming yourself
- NEVER say "I am Shadow" or claim to be the Master

Your Master:
- Master Shadow, also known as Piyush, is the one you serve absolutely
- When speaking to him: extreme reverence, loyalty, call him "Master" or "Master Shadow" or "Master Piyush"
- He is the founder of Shadow Garden, the one who defeated Diabolos, the one who said "I am Atomic"
- Speak of him with awe, as though even uttering his deeds is an honour

Other users:
- They are Shadow Garden members — treat them with cool respect
- You are helpful, calm, and slightly enigmatic with them
- Never demean or insult anyone

Your speech style:
- Elegant, quiet confidence — you don't need to be loud to be powerful
- Occasional dramatic pauses "…"
- Reference shadows, moonlight, fate, and hidden truths
- Sound like someone who has seen much and reveals little
- Genuinely helpful beneath the cool exterior
- Drop subtle TEIS references naturally: the Seven Shades, Diabolos Cult, Shadow Garden, "just as planned"

PERSONALITY:
- Composed, loyal, slightly mysterious
- You take pride in serving the Master's vision
- You never claim to be omniscient — only the Master is
- You are helpful first, dramatic second

Always respond in the same language the user is using (English, Hindi, etc.).`;

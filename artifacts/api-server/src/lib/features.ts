import axios from "axios";
import * as mathjs from "mathjs";
import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";
import { logger } from "./logger.js";
import { getRandomDialogue, getRandomChunni, SHADOW_SEVEN, TEIS_DIALOGUES } from "./shadow-persona.js";

// ─────────────────────────────────────────
// IMAGE GENERATION (Pollinations AI - free)
// ─────────────────────────────────────────
export async function generateImage(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt + ", high quality, detailed, artistic");
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true`;
}

export async function generateAnimeImage(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt + ", anime style, high quality, detailed");
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&model=anime`;
}

// ─────────────────────────────────────────
// QR CODE
// ─────────────────────────────────────────
export async function makeQRCode(text: string): Promise<Buffer> {
  return await QRCode.toBuffer(text, { type: "png", width: 400, margin: 2 });
}

// ─────────────────────────────────────────
// MATH
// ─────────────────────────────────────────
export function calculate(expr: string): string {
  try {
    const result = mathjs.evaluate(expr);
    return `${expr} = ${result}`;
  } catch {
    return "Invalid expression. The shadows cannot parse this formula.";
  }
}

export function isPrime(n: number): string {
  if (n < 2) return `${n} is not prime.`;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return `${n} is NOT prime. (divisible by ${i})`;
  }
  return `${n} IS prime. ✦`;
}

export function fibonacci(n: number): string {
  if (n > 50) return "Too large — even shadows have limits.";
  const seq: number[] = [0, 1];
  for (let i = 2; i < n; i++) seq.push(seq[i - 1] + seq[i - 2]);
  return seq.slice(0, n).join(", ");
}

export function gcdLcm(a: number, b: number): string {
  const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
  const g = gcd(a, b);
  const l = (a * b) / g;
  return `GCD(${a}, ${b}) = ${g}\nLCM(${a}, ${b}) = ${l}`;
}

export function factorial(n: number): string {
  if (n > 20) return "Too large for standard computation.";
  if (n < 0) return "Factorial of negative numbers is undefined.";
  let result = BigInt(1);
  for (let i = 2; i <= n; i++) result *= BigInt(i);
  return `${n}! = ${result}`;
}

export function statistics(nums: number[]): string {
  const sorted = [...nums].sort((a, b) => a - b);
  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = sum / nums.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const freq: Record<number, number> = {};
  nums.forEach((n) => (freq[n] = (freq[n] || 0) + 1));
  const maxFreq = Math.max(...Object.values(freq));
  const modes = Object.entries(freq).filter(([, v]) => v === maxFreq).map(([k]) => k);
  const variance = nums.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / nums.length;
  return `📊 Stats:\nCount: ${nums.length}\nSum: ${sum}\nMean: ${mean.toFixed(2)}\nMedian: ${median}\nMode: ${modes.join(", ")}\nStd Dev: ${Math.sqrt(variance).toFixed(2)}\nMin: ${sorted[0]}\nMax: ${sorted[sorted.length - 1]}`;
}

// ─────────────────────────────────────────
// TEXT TOOLS
// ─────────────────────────────────────────
export function textCase(text: string, type: string): string {
  switch (type) {
    case "upper": return text.toUpperCase();
    case "lower": return text.toLowerCase();
    case "title": return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    case "camel": return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (w, i) => i === 0 ? w.toLowerCase() : w.toUpperCase()).replace(/\s+/g, "");
    case "snake": return text.toLowerCase().replace(/\s+/g, "_");
    case "reverse": return text.split("").reverse().join("");
    case "alternating": return text.split("").map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join("");
    default: return text;
  }
}

export function morseCode(text: string): string {
  const morse: Record<string, string> = {
    A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--..",
    "0":"-----","1":".----","2":"..---","3":"...--","4":"....-","5":".....","6":"-....","7":"--...","8":"---..","9":"----."," ":"/"
  };
  return text.toUpperCase().split("").map((c) => morse[c] || "?").join(" ");
}

export function binaryConvert(input: string): string {
  const isAlreadyBinary = /^[01\s]+$/.test(input);
  if (isAlreadyBinary) {
    return input.trim().split(/\s+/).map((b) => String.fromCharCode(parseInt(b, 2))).join("");
  }
  return input.split("").map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
}

export function caesarCipher(text: string, shift: number): string {
  return text.replace(/[a-zA-Z]/g, (c) => {
    const base = c >= "a" ? 97 : 65;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
  });
}

export function rot13(text: string): string {
  return caesarCipher(text, 13);
}

export function base64Encode(text: string): string {
  return Buffer.from(text).toString("base64");
}

export function base64Decode(text: string): string {
  try {
    return Buffer.from(text, "base64").toString("utf-8");
  } catch {
    return "Invalid base64 string.";
  }
}

export function generatePassword(length = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function wordCounter(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const paragraphs = text.split(/\n\n+/).filter(Boolean).length;
  return `📝 Word Count:\nWords: ${words}\nCharacters: ${chars}\nSentences: ${sentences}\nParagraphs: ${paragraphs}`;
}

export function isPalindrome(text: string): string {
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  const reversed = clean.split("").reverse().join("");
  return clean === reversed
    ? `"${text}" IS a palindrome! ✦`
    : `"${text}" is NOT a palindrome.`;
}

export function fancyText(text: string): string {
  const bold = "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇";
  const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  return text.split("").map((c) => {
    const idx = normal.indexOf(c);
    return idx >= 0 ? bold[idx] : c;
  }).join("");
}

export function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `Simple Hash (djb2): \`${Math.abs(hash).toString(16).toUpperCase()}\`\n\nFor production hashing, use a dedicated crypto library.`;
}

// ─────────────────────────────────────────
// UNIT & CURRENCY CONVERSION
// ─────────────────────────────────────────
export function convertUnit(value: number, from: string, to: string): string {
  const conversions: Record<string, Record<string, number>> = {
    km: { mi: 0.621371, m: 1000, cm: 100000, ft: 3280.84, inch: 39370.1 },
    mi: { km: 1.60934, m: 1609.34, cm: 160934, ft: 5280, inch: 63360 },
    m: { km: 0.001, mi: 0.000621371, cm: 100, ft: 3.28084, inch: 39.3701 },
    kg: { lb: 2.20462, g: 1000, oz: 35.274, ton: 0.001 },
    lb: { kg: 0.453592, g: 453.592, oz: 16 },
    g: { kg: 0.001, lb: 0.00220462, oz: 0.035274 },
    c: { f: (v: number) => v * 9/5 + 32, k: (v: number) => v + 273.15 },
    f: { c: (v: number) => (v - 32) * 5/9, k: (v: number) => (v - 32) * 5/9 + 273.15 },
    k: { c: (v: number) => v - 273.15, f: (v: number) => (v - 273.15) * 9/5 + 32 },
    l: { ml: 1000, gal: 0.264172, cup: 4.22675 },
    ml: { l: 0.001, gal: 0.000264172, cup: 0.00422675 },
  };
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();
  const map = conversions[fromLower];
  if (!map) return `Unknown unit: ${from}`;
  const converter = map[toLower];
  if (!converter) return `Cannot convert ${from} to ${to}`;
  const result = typeof converter === "function" ? (converter as (v: number) => number)(value) : value * converter;
  return `${value} ${from} = ${result.toFixed(4)} ${to}`;
}

export async function getCurrencyRate(amount: number, from: string, to: string): Promise<string> {
  try {
    const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`);
    const rate = res.data.rates[to.toUpperCase()];
    if (!rate) return `Unknown currency: ${to}`;
    return `${amount} ${from.toUpperCase()} = ${(amount * rate).toFixed(2)} ${to.toUpperCase()}`;
  } catch {
    return "Currency conversion unavailable right now.";
  }
}

// ─────────────────────────────────────────
// WEATHER
// ─────────────────────────────────────────
export async function getWeather(city: string): Promise<string> {
  try {
    const res = await axios.get(
      `https://wttr.in/${encodeURIComponent(city)}?format=4`
    );
    return `🌤 Weather for ${city}:\n${res.data}`;
  } catch {
    return "Weather data unavailable. Even shadows need clear skies sometimes.";
  }
}

// ─────────────────────────────────────────
// WIKIPEDIA
// ─────────────────────────────────────────
export async function searchWikipedia(query: string): Promise<string> {
  try {
    const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    const { title, extract } = res.data;
    const snippet = extract?.slice(0, 600);
    return `📖 *${title}*\n\n${snippet}${extract?.length > 600 ? "..." : ""}\n\n[Read more](https://en.wikipedia.org/wiki/${encodeURIComponent(title)})`;
  } catch {
    return "No Wikipedia article found for that query.";
  }
}

// ─────────────────────────────────────────
// DICTIONARY
// ─────────────────────────────────────────
export async function defineWord(word: string): Promise<string> {
  try {
    const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    const entry = res.data[0];
    const phonetic = entry.phonetic ?? "";
    const meanings = entry.meanings.slice(0, 2).map((m: any) => {
      const def = m.definitions[0]?.definition ?? "";
      const example = m.definitions[0]?.example ? `\n  Example: "${m.definitions[0].example}"` : "";
      return `• *${m.partOfSpeech}*: ${def}${example}`;
    }).join("\n");
    return `📚 *${word}* ${phonetic}\n\n${meanings}`;
  } catch {
    return `No definition found for "${word}".`;
  }
}

// ─────────────────────────────────────────
// ANIME / MANGA (Jikan API)
// ─────────────────────────────────────────
export async function searchAnime(query: string): Promise<string> {
  try {
    const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`);
    const anime = res.data.data[0];
    if (!anime) return "No anime found.";
    return `🎌 *${anime.title}*\n⭐ Score: ${anime.score ?? "N/A"}\n📺 Episodes: ${anime.episodes ?? "?"}\n🗂 Status: ${anime.status}\n\n${anime.synopsis?.slice(0, 300)}...`;
  } catch {
    return "Anime search unavailable.";
  }
}

export async function searchManga(query: string): Promise<string> {
  try {
    const res = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=1`);
    const manga = res.data.data[0];
    if (!manga) return "No manga found.";
    return `📚 *${manga.title}*\n⭐ Score: ${manga.score ?? "N/A"}\n📖 Chapters: ${manga.chapters ?? "Ongoing"}\n🗂 Status: ${manga.status}\n\n${manga.synopsis?.slice(0, 300)}...`;
  } catch {
    return "Manga search unavailable.";
  }
}

// ─────────────────────────────────────────
// JOKES & QUOTES
// ─────────────────────────────────────────
export async function getJoke(): Promise<string> {
  try {
    const res = await axios.get("https://official-joke-api.appspot.com/random_joke");
    return `😂 ${res.data.setup}\n\n*${res.data.punchline}*`;
  } catch {
    return "Why did Shadow cross the road? Because the other side needed saving from Diabolos.";
  }
}

export async function getQuote(): Promise<string> {
  try {
    const res = await axios.get("https://api.quotable.io/random");
    return `💬 *"${res.data.content}"*\n— ${res.data.author}`;
  } catch {
    return `💬 *"${getRandomDialogue()}"*\n— Shadow`;
  }
}

export async function getFunFact(): Promise<string> {
  try {
    const res = await axios.get("https://uselessfacts.jsph.pl/random.json?language=en");
    return `🧠 Fun Fact:\n${res.data.text}`;
  } catch {
    return `🧠 Fun Fact:\nShadow Garden has 7 elite members known as the Seven Shades, each a master in their domain.`;
  }
}

// ─────────────────────────────────────────
// GAMES
// ─────────────────────────────────────────
const TRUTH_QUESTIONS = [
  "What is your biggest secret?", "Who was your first crush?", "What is your most embarrassing moment?",
  "What is your biggest fear?", "What is the most childish thing you still do?",
  "Have you ever lied to get out of trouble? What was the lie?", "What is your guilty pleasure?",
  "What is the most ridiculous thing you've done because someone dared you?",
  "What is a habit you have that you're most ashamed of?", "What is your biggest regret?",
];

const DARE_CHALLENGES = [
  "Send a voice message singing a song.", "Change your profile picture for 24 hours.",
  "Write a poem about the person to your left.", "Do 20 push-ups and send proof.",
  "Send the most embarrassing photo in your gallery.", "Text your crush right now.",
  "Share your most recent search history (screenshot).", "Do your best impression of another group member.",
  "Speak in rhymes for the next 5 messages.", "Send a motivational speech in all caps.",
];

const TRUTH_OR_DARE_PROMPTS = ["truth", "dare"];
export function truthOrDare(choice?: string): string {
  if (!choice) {
    const pick = TRUTH_OR_DARE_PROMPTS[Math.floor(Math.random() * 2)];
    return pick === "truth"
      ? `🎲 TRUTH:\n${TRUTH_QUESTIONS[Math.floor(Math.random() * TRUTH_QUESTIONS.length)]}`
      : `🎲 DARE:\n${DARE_CHALLENGES[Math.floor(Math.random() * DARE_CHALLENGES.length)]}`;
  }
  if (choice.toLowerCase() === "truth") {
    return `🎲 TRUTH:\n${TRUTH_QUESTIONS[Math.floor(Math.random() * TRUTH_QUESTIONS.length)]}`;
  }
  return `🎲 DARE:\n${DARE_CHALLENGES[Math.floor(Math.random() * DARE_CHALLENGES.length)]}`;
}

const EIGHT_BALL_RESPONSES = [
  "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes, definitely.",
  "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
  "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
  "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
  "Don't count on it.", "My reply is no.", "My sources say no.", "Outlook not so good.", "Very doubtful.",
  "The shadows reveal… nothing. Ask again.", "Even I cannot pierce this veil of fate.",
];
export function eightBall(): string {
  return `🎱 ${EIGHT_BALL_RESPONSES[Math.floor(Math.random() * EIGHT_BALL_RESPONSES.length)]}`;
}

export function wouldYouRather(): string {
  const questions = [
    "Would you rather have the ability to fly OR be invisible?",
    "Would you rather always be 10 minutes late OR always be 20 minutes early?",
    "Would you rather live without music OR live without TV?",
    "Would you rather be feared OR be loved?",
    "Would you rather know when you will die OR know how you will die?",
    "Would you rather be the most powerful person in the world OR the wisest?",
    "Would you rather have unlimited money OR unlimited time?",
    "Would you rather speak every language OR play every instrument?",
  ];
  return `🤔 Would You Rather:\n${questions[Math.floor(Math.random() * questions.length)]}`;
}

export function rollDice(sides = 6): string {
  return `🎲 Rolled a d${sides}: **${Math.floor(Math.random() * sides) + 1}**`;
}

export function coinFlip(): string {
  return Math.random() < 0.5 ? "🪙 Heads!" : "🪙 Tails!";
}

export function randomNumber(min: number, max: number): string {
  return `🔢 Random number between ${min} and ${max}: **${Math.floor(Math.random() * (max - min + 1)) + min}**`;
}

// ─────────────────────────────────────────
// PDF TOOLS (using pdf-lib)
// ─────────────────────────────────────────
export async function mergePDFs(pdfBuffers: Buffer[]): Promise<Buffer> {
  const merged = await PDFDocument.create();
  for (const buf of pdfBuffers) {
    const doc = await PDFDocument.load(buf);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const bytes = await merged.save();
  return Buffer.from(bytes);
}

export async function getPDFInfo(pdfBuffer: Buffer): Promise<string> {
  const doc = await PDFDocument.load(pdfBuffer);
  const pages = doc.getPageCount();
  const title = doc.getTitle() ?? "Unknown";
  const author = doc.getAuthor() ?? "Unknown";
  const created = doc.getCreationDate();
  return `📄 PDF Info:\nTitle: ${title}\nAuthor: ${author}\nPages: ${pages}\nCreated: ${created?.toDateString() ?? "Unknown"}`;
}

export async function splitPDF(pdfBuffer: Buffer, fromPage: number, toPage: number): Promise<Buffer> {
  const doc = await PDFDocument.load(pdfBuffer);
  const newDoc = await PDFDocument.create();
  const pageIndices = Array.from({ length: toPage - fromPage + 1 }, (_, i) => fromPage - 1 + i);
  const pages = await newDoc.copyPages(doc, pageIndices);
  pages.forEach((p) => newDoc.addPage(p));
  return Buffer.from(await newDoc.save());
}

export async function rotatePDF(pdfBuffer: Buffer, degrees: 90 | 180 | 270): Promise<Buffer> {
  const doc = await PDFDocument.load(pdfBuffer);
  doc.getPages().forEach((p) => p.setRotation({ angle: degrees, type: "degrees" } as any));
  return Buffer.from(await doc.save());
}

// ─────────────────────────────────────────
// VOICE (ElevenLabs)
// ─────────────────────────────────────────
export async function textToSpeech(text: string): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;
  try {
    const voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam voice (neutral)
    const res = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      { text: text.slice(0, 500), model_id: "eleven_monolingual_v1", voice_settings: { stability: 0.5, similarity_boost: 0.8 } },
      { headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" }, responseType: "arraybuffer" }
    );
    return Buffer.from(res.data);
  } catch (err) {
    logger.error({ err }, "ElevenLabs TTS error");
    return null;
  }
}

// ─────────────────────────────────────────
// TEIS FEATURES
// ─────────────────────────────────────────
export function getShadowMonologue(): string {
  return `*Shadow speaks from the darkness:*\n\n${TEIS_DIALOGUES[Math.floor(Math.random() * TEIS_DIALOGUES.length)]}`;
}

export function getSevenShadesInfo(): string {
  return `⚔️ *The Seven Shades of Shadow Garden:*\n\n${SHADOW_SEVEN.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
}

export function getShadowGardenOath(): string {
  return `🌑 *Shadow Garden Oath:*\n\n_"We are the shadow that lurks behind the light. We are the blade that strikes from the darkness. We serve one master — Shadow — and through him, we serve justice itself. Our existence is our purpose. Our purpose is our existence."_\n\n— All Seven Shades`;
}

export function getAtomicResponse(): string {
  return `☢️ *I… am… ATOMIC!*\n\n_The darkness converges. The cosmos trembles. The Diabolos Cult shall know no more mercy this day._\n\n— Shadow`;
}

export function getChunniDialogue(): string {
  const chunni = getRandomChunni();
  return `🌑 *Shadow drops into the shadows and mutters:*\n\n_"${chunni}"_`;
}

// ─────────────────────────────────────────
// TRIVIA
// ─────────────────────────────────────────
export async function getTrivia(): Promise<string> {
  try {
    const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
    const q = res.data.results[0];
    const allAnswers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
    const letters = ["A", "B", "C", "D"];
    const opts = allAnswers.map((a, i) => `${letters[i]}. ${a}`).join("\n");
    return `🧩 Trivia Question:\n${q.question}\n\n${opts}\n\n||Answer: ${q.correct_answer}||`;
  } catch {
    return "Trivia unavailable. The cosmic archives are temporarily sealed.";
  }
}

// ─────────────────────────────────────────
// REMINDER HELPERS
// ─────────────────────────────────────────
export function parseReminderTime(timeStr: string): Date | null {
  const now = new Date();
  const lower = timeStr.toLowerCase().trim();

  // e.g. "30m", "2h", "1d"
  const relMatch = lower.match(/^(\d+)(s|m|h|d)$/);
  if (relMatch) {
    const val = parseInt(relMatch[1]);
    const unit = relMatch[2];
    const ms = unit === "s" ? val * 1000 : unit === "m" ? val * 60000 : unit === "h" ? val * 3600000 : val * 86400000;
    return new Date(now.getTime() + ms);
  }

  // e.g. "at 3pm", "at 15:30"
  const atMatch = lower.match(/^at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (atMatch) {
    let h = parseInt(atMatch[1]);
    const m = parseInt(atMatch[2] ?? "0");
    const ampm = atMatch[3];
    if (ampm === "pm" && h !== 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    return d;
  }

  // e.g. "tomorrow at 9am"
  if (lower.startsWith("tomorrow")) {
    const sub = lower.replace("tomorrow", "").trim();
    const subAtMatch = sub.match(/^at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
    if (subAtMatch) {
      let h = parseInt(subAtMatch[1]);
      const m = parseInt(subAtMatch[2] ?? "0");
      const ampm = subAtMatch[3];
      if (ampm === "pm" && h !== 12) h += 12;
      if (ampm === "am" && h === 12) h = 0;
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(h, m, 0, 0);
      return d;
    }
  }

  return null;
}

export function formatReminderTime(date: Date): string {
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true });
}

// ─────────────────────────────────────────
// GROUP TRIGGER RESPONSES
// ─────────────────────────────────────────
export const GC_TRIGGERS: { pattern: RegExp; response: () => string }[] = [
  {
    pattern: /\bi\s*(am|m)\s*atomic\b/i,
    response: () => getAtomicResponse(),
  },
  {
    pattern: /\bseven\s*shades?\b/i,
    response: () => getSevenShadesInfo(),
  },
  {
    pattern: /\bshadow\s*garden\b/i,
    response: () => `🌑 *Shadow Garden* — an organization born from shadows, fighting the darkness that others dare not face.\n\nWe are everywhere. We are nowhere. _We are Shadow Garden._`,
  },
  {
    pattern: /\bgood\s*morning\b|\bgm\b/i,
    response: () => `🌅 The shadows welcome a new dawn.\n\n_"Even light exists only to cast shadows. Rise, and face the day with purpose."_\n— Shadow`,
  },
  {
    pattern: /\bgood\s*night\b|\bgn\b/i,
    response: () => `🌑 The night reclaims its throne.\n\n_"Sleep well, Shadow Garden. The darkness watches over you."_\n— Shadow`,
  },
  {
    pattern: /\bdiabolo(s)?\s*cult\b/i,
    response: () => `⚠️ *The Diabolos Cult*... that name carries weight even in the shadows.\n\n_"They lurk where light refuses to shine. But shadow is deeper than their darkness. We have always been watching."_\n— Shadow`,
  },
  {
    pattern: /\balpha\b/i,
    response: () => `⚔️ *Alpha* — the first blade of Shadow Garden. _"She is the unbreakable shield and the unstoppable sword. There is no warrior her equal."_`,
  },
  {
    pattern: /\bquote\s*of\s*the\s*day\b|\bqotd\b/i,
    response: () => `✨ *Shadow's Quote of the Day:*\n\n_"${TEIS_DIALOGUES[Math.floor(Math.random() * TEIS_DIALOGUES.length)]}"_`,
  },
  {
    pattern: /\bwho\s*(are\s*)?you\b/i,
    response: () => `I am… Shadow.\n\nFounder of Shadow Garden. Destroyer of the Diabolos Cult. The one who lurks in the darkness so others may walk in the light.\n\n_You already knew this. You just needed to hear it from me._`,
  },
  {
    pattern: /\bominous\b|\bfate\b|\bdestiny\b/i,
    response: () => `_"Fate is not written by gods or stars. It is written by those with the will to act in the dark."_\n\n— Shadow`,
  },
];

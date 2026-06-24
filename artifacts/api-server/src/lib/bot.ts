import axios from "axios";
import TelegramBot from "node-telegram-bot-api";
import { db } from "@workspace/db";
import {
  authorizedUsersTable, chatMemoryTable, todosTable,
  notesTable, remindersTable, botMessagesTable,
} from "@workspace/db";
import { eq, desc, and, lt, asc } from "drizzle-orm";
import { logger } from "./logger.js";
import {
  isMaster, mentionsMaster, getRandomChunni,
  getRandomGreeting, shouldDropChunni, MASTER_ID,
} from "./shadow-persona.js";
import { chat } from "./ai.js";
import * as F from "./features.js";
const { GC_TRIGGERS } = F;

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");

export let bot: TelegramBot;
export let botStartTime = Date.now();
export let botUsername = "";

// ─────────────────────────────────────────
// AUTHORIZATION
// ─────────────────────────────────────────
async function isAuthorized(userId: number): Promise<boolean> {
  if (isMaster(userId)) return true;
  const [user] = await db
    .select()
    .from(authorizedUsersTable)
    .where(and(eq(authorizedUsersTable.telegramId, userId), eq(authorizedUsersTable.isActive, true)));
  return !!user;
}

async function requireAuth(msg: TelegramBot.Message): Promise<boolean> {
  const userId = msg.from?.id;
  if (!userId) return false;
  if (await isAuthorized(userId)) return true;
  await bot.sendMessage(msg.chat.id,
    `🌑 _"You are not yet part of Shadow Garden. Access denied."_\n\nAsk the Master to grant you access.`,
    { parse_mode: "Markdown" }
  );
  return false;
}

// ─────────────────────────────────────────
// LOG MESSAGES
// ─────────────────────────────────────────
async function logMessage(msg: TelegramBot.Message, isFromBot = false): Promise<void> {
  try {
    await db.insert(botMessagesTable).values({
      chatId: msg.chat.id,
      chatTitle: msg.chat.title ?? msg.chat.first_name ?? null,
      userId: msg.from?.id ?? null,
      username: msg.from?.username ?? msg.from?.first_name ?? null,
      messageText: msg.text ?? null,
      messageType: msg.photo ? "photo" : msg.document ? "document" : msg.voice ? "voice" : "text",
      isFromBot,
    });
  } catch (err) {
    logger.warn({ err }, "Failed to log message");
  }
}

// ─────────────────────────────────────────
// MEMORY
// ─────────────────────────────────────────
async function getHistory(chatId: number, userId: number) {
  const rows = await db
    .select()
    .from(chatMemoryTable)
    .where(and(eq(chatMemoryTable.chatId, chatId), eq(chatMemoryTable.userId, userId)))
    .orderBy(asc(chatMemoryTable.timestamp))
    .limit(30);
  return rows.map((r) => ({ role: r.role as "user" | "model", content: r.content }));
}

async function addMemory(chatId: number, userId: number, role: "user" | "model", content: string) {
  await db.insert(chatMemoryTable).values({ chatId, userId, role, content });
  // Keep only last 50 messages per chat+user
  const all = await db.select().from(chatMemoryTable)
    .where(and(eq(chatMemoryTable.chatId, chatId), eq(chatMemoryTable.userId, userId)))
    .orderBy(desc(chatMemoryTable.timestamp));
  if (all.length > 50) {
    const toDelete = all.slice(50).map((r) => r.id);
    for (const id of toDelete) {
      await db.delete(chatMemoryTable).where(eq(chatMemoryTable.id, id));
    }
  }
}

async function clearMemory(chatId: number, userId: number) {
  await db.delete(chatMemoryTable)
    .where(and(eq(chatMemoryTable.chatId, chatId), eq(chatMemoryTable.userId, userId)));
}

// ─────────────────────────────────────────
// SEND HELPERS
// ─────────────────────────────────────────
async function reply(chatId: number, text: string, opts?: TelegramBot.SendMessageOptions) {
  try {
    await bot.sendMessage(chatId, text, { parse_mode: "Markdown", ...opts });
  } catch (err) {
    logger.warn({ err }, "Failed to send message");
  }
}

async function typing(chatId: number) {
  try { await bot.sendChatAction(chatId, "typing"); } catch {}
}

// ─────────────────────────────────────────
// REMINDER SCHEDULER
// ─────────────────────────────────────────
async function checkReminders() {
  try {
    const due = await db.select().from(remindersTable)
      .where(and(eq(remindersTable.sent, false), lt(remindersTable.remindAt, new Date())));
    for (const r of due) {
      await reply(Number(r.chatId), `⏰ *Reminder from Shadow Garden:*\n\n${r.text}`);
      await db.update(remindersTable).set({ sent: true }).where(eq(remindersTable.id, r.id));
    }
  } catch (err) {
    logger.warn({ err }, "Reminder check error");
  }
}

// ─────────────────────────────────────────
// HELP MENU
// ─────────────────────────────────────────
const HELP_TEXT = `🌑 *Shadow Garden Bot — Command List*

*━━━ AI & CHAT ━━━*
/chat <msg> — Talk to Shadow (AI)
/ask <question> — Get a direct answer
/clear — Clear your chat memory
/story <prompt> — Generate a story
/poem <prompt> — Generate a poem
/roast <name> — Roast someone (playfully)
/compliment <name> — Compliment someone
/summarize <text> — Summarize text
/grammar <text> — Fix grammar
/translate <lang> | <text> — Translate text
/fancy <text> — Fancy text style

*━━━ IMAGE ━━━*
/imagine <prompt> — Generate an image (AI)
/anime <prompt> — Anime-style image
/qr <text> — Generate QR code
_(Send any image to analyze it)_

*━━━ VOICE ━━━*
/tts <text> — Text to speech (Shadow's voice)

*━━━ PDF TOOLS ━━━*
/pdfinfo — Get info about a PDF (send PDF first)
/pdfmerge — Merge PDFs (send multiple)
/pdfsplit <from>-<to> — Split PDF pages
/pdfrotate <90/180/270> — Rotate PDF
/pdftext — Extract text from PDF

*━━━ MATH & SCIENCE ━━━*
/calc <expression> — Calculator
/prime <n> — Check if prime
/fib <n> — Fibonacci sequence
/gcd <a> <b> — GCD and LCM
/factorial <n> — Factorial
/stats <n1,n2,...> — Statistics

*━━━ TEXT TOOLS ━━━*
/upper/lower/title <text> — Case convert
/reverse <text> — Reverse text
/morse <text> — Convert to Morse code
/binary <text> — Text ↔ Binary
/caesar <shift> <text> — Caesar cipher
/rot13 <text> — ROT13 encode/decode
/base64 <encode/decode> <text> — Base64
/wordcount <text> — Word/char count
/palindrome <text> — Check palindrome
/password <length> — Generate password
/uuid — Generate UUID

*━━━ INFO & SEARCH ━━━*
/wiki <query> — Wikipedia search
/define <word> — Dictionary definition
/anime_search <title> — Search anime info
/manga <title> — Search manga info
/weather <city> — Current weather
/currency <amt> <from> <to> — Convert currency
/unit <val> <from> <to> — Convert units
/trivia — Random trivia question
/joke — Random joke
/quote — Inspirational quote
/fact — Fun fact
/news — Latest news headlines

*━━━ GAMES ━━━*
/tod [truth/dare] — Truth or Dare
/8ball — Magic 8-Ball
/wyr — Would You Rather
/dice [sides] — Roll dice
/coin — Flip a coin
/random <min> <max> — Random number

*━━━ PRODUCTIVITY ━━━*
/todo add <task> — Add to-do
/todo list — List to-dos
/todo done <n> — Mark done
/todo clear — Clear all todos
/note add <text> — Add note
/note list — List notes
/note del <n> — Delete note
/remind <time> <text> — Set reminder
  Examples: /remind 30m Take a break
            /remind at 9pm Study
            /remind tomorrow at 8am Wake up

*━━━ TEIS FEATURES ━━━*
/shadow — Random Shadow monologue
/sevenshades — Info about Seven Shades
/oath — Shadow Garden oath
/atomic — I AM ATOMIC!
/chunni — Drop a chunni-byo dialogue

*━━━ GROUP TOOLS ━━━*
/groupstats — Group statistics
/userinfo [@user] — User information
/poll <question> | <opt1> | <opt2> — Create poll
/pin <message> — Pin a message (admin)

*━━━ MASTER ONLY ━━━*
/adduser <user_id> [name] — Add authorized user
/removeuser <user_id> — Remove user
/listusers — List authorized users
/broadcast <msg> — (coming soon)`;

// ─────────────────────────────────────────
// BOT COMMAND HANDLERS
// ─────────────────────────────────────────
export function initBot() {
  bot = new TelegramBot(token!, { polling: true });

  bot.getMe().then((me) => {
    botUsername = me.username ?? "ShadowBot";
    logger.info({ username: botUsername }, "Shadow Garden Bot started");
  });

  // Reminder check every 30 seconds
  setInterval(checkReminders, 30000);

  // ── /start ──────────────────────────────
  bot.onText(/^\/start/, async (msg) => {
    await logMessage(msg);
    const name = msg.from?.first_name ?? "stranger";
    const isMasterUser = isMaster(msg.from?.id ?? 0);
    if (isMasterUser) {
      await reply(msg.chat.id,
        `🌑 *Master Shadow… you have returned.*\n\n_"I have been waiting. The shadows themselves held their breath."_\n\nShadow Garden is at your command. Use /help to see all available powers.`
      );
    } else {
      const auth = await isAuthorized(msg.from?.id ?? 0);
      if (auth) {
        await reply(msg.chat.id,
          `${getRandomGreeting()}\n\n_Welcome back, ${name}. Shadow Garden acknowledges your presence._\n\nUse /help to see available commands.`
        );
      } else {
        await reply(msg.chat.id,
          `🌑 _"You stand at the threshold of Shadow Garden, ${name}."_\n\nAccess must be granted by the Master. If you are meant to be here… you will receive it.`
        );
      }
    }
  });

  // ── /help ──────────────────────────────
  bot.onText(/^\/help/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await bot.sendMessage(msg.chat.id, HELP_TEXT, { parse_mode: "Markdown" });
  });

  // ── /chat ──────────────────────────────
  bot.onText(/^\/chat (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await logMessage(msg);
    const userId = msg.from!.id;
    const chatId = msg.chat.id;
    const userText = match![1];
    await typing(chatId);
    const history = await getHistory(chatId, userId);
    const isMasterUser = isMaster(userId);
    const context = isMasterUser
      ? `This is your Master — Piyush, also known as Shadow. Address them with utmost respect and loyalty. They are the only Master.`
      : `This is an authorized Shadow Garden member. Treat them with respect as a valued subordinate, but do not call them Master.`;
    const response = await chat(history, userText, context);
    await addMemory(chatId, userId, "user", userText);
    await addMemory(chatId, userId, "model", response);
    const finalResponse = shouldDropChunni() ? `${response}\n\n_${getRandomChunni()}_` : response;
    await reply(chatId, finalResponse);
  });

  // ── /ask ──────────────────────────────
  bot.onText(/^\/ask (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    const answer = await import("./ai.js").then((ai) => ai.answerQuestion(match![1]));
    await reply(msg.chat.id, `🌑 *Shadow's Knowledge:*\n\n${answer}`);
  });

  // ── /clear ─────────────────────────────
  bot.onText(/^\/clear/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await clearMemory(msg.chat.id, msg.from!.id);
    await reply(msg.chat.id, `🌑 _"The shadows swallow all traces. Memory cleared."_`);
  });

  // ── /imagine ──────────────────────────
  bot.onText(/^\/imagine (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    await reply(msg.chat.id, `🎨 _Weaving reality from shadows… generating your image._`);
    const url = await F.generateImage(match![1]);
    await bot.sendPhoto(msg.chat.id, url, { caption: `✨ *Generated:* ${match![1]}`, parse_mode: "Markdown" });
  });

  // ── /anime ────────────────────────────
  bot.onText(/^\/anime (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    const url = await F.generateAnimeImage(match![1]);
    await bot.sendPhoto(msg.chat.id, url, { caption: `🎌 *Anime Generated:* ${match![1]}`, parse_mode: "Markdown" });
  });

  // ── /qr ───────────────────────────────
  bot.onText(/^\/qr (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    const buf = await F.makeQRCode(match![1]);
    await bot.sendPhoto(msg.chat.id, buf, { caption: `📱 QR Code for: ${match![1]}` });
  });

  // ── /tts ──────────────────────────────
  bot.onText(/^\/tts (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await bot.sendChatAction(msg.chat.id, "record_voice");
    const audio = await F.textToSpeech(match![1]);
    if (!audio) {
      await reply(msg.chat.id, "Voice generation unavailable. Even shadows lose their voice sometimes.");
      return;
    }
    await bot.sendVoice(msg.chat.id, audio, { caption: "🔊 Shadow speaks..." });
  });

  // ── /calc ─────────────────────────────
  bot.onText(/^\/calc (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, `🧮 ${F.calculate(match![1])}`);
  });

  // ── /prime ────────────────────────────
  bot.onText(/^\/prime (\d+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.isPrime(parseInt(match![1])));
  });

  // ── /fib ──────────────────────────────
  bot.onText(/^\/fib (\d+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, `🔢 Fibonacci (${match![1]}): ${F.fibonacci(parseInt(match![1]))}`);
  });

  // ── /gcd ──────────────────────────────
  bot.onText(/^\/gcd (\d+) (\d+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.gcdLcm(parseInt(match![1]), parseInt(match![2])));
  });

  // ── /factorial ────────────────────────
  bot.onText(/^\/factorial (\d+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.factorial(parseInt(match![1])));
  });

  // ── /stats ────────────────────────────
  bot.onText(/^\/stats (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    const nums = match![1].split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
    if (nums.length === 0) { await reply(msg.chat.id, "Provide numbers separated by commas."); return; }
    await reply(msg.chat.id, F.statistics(nums));
  });

  // ── TEXT CASE COMMANDS ─────────────────
  for (const type of ["upper", "lower", "title", "reverse", "alternating"]) {
    bot.onText(new RegExp(`^\\/${type} (.+)`), async (msg, match) => {
      if (!await requireAuth(msg)) return;
      await reply(msg.chat.id, F.textCase(match![1], type));
    });
  }

  // ── /morse ────────────────────────────
  bot.onText(/^\/morse (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, `📡 Morse: \`${F.morseCode(match![1])}\``);
  });

  // ── /binary ───────────────────────────
  bot.onText(/^\/binary (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, `💻 \`${F.binaryConvert(match![1])}\``);
  });

  // ── /caesar ───────────────────────────
  bot.onText(/^\/caesar (-?\d+) (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, `🔐 \`${F.caesarCipher(match![2], parseInt(match![1]))}\``);
  });

  // ── /rot13 ────────────────────────────
  bot.onText(/^\/rot13 (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, `🔄 \`${F.rot13(match![1])}\``);
  });

  // ── /base64 ───────────────────────────
  bot.onText(/^\/base64 (encode|decode) (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    const result = match![1] === "encode" ? F.base64Encode(match![2]) : F.base64Decode(match![2]);
    await reply(msg.chat.id, `\`${result}\``);
  });

  // ── /wordcount ────────────────────────
  bot.onText(/^\/wordcount (.+)/s, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.wordCounter(match![1]));
  });

  // ── /palindrome ───────────────────────
  bot.onText(/^\/palindrome (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.isPalindrome(match![1]));
  });

  // ── /password ─────────────────────────
  bot.onText(/^\/password ?(\d*)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    const len = parseInt(match![1] || "16");
    await reply(msg.chat.id, `🔑 \`${F.generatePassword(Math.min(len, 64))}\``);
  });

  // ── /uuid ─────────────────────────────
  bot.onText(/^\/uuid/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, `🆔 \`${F.generateUUID()}\``);
  });

  // ── /fancy ────────────────────────────
  bot.onText(/^\/fancy (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.fancyText(match![1]));
  });

  // ── /wiki ─────────────────────────────
  bot.onText(/^\/wiki (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    await reply(msg.chat.id, await F.searchWikipedia(match![1]));
  });

  // ── /define ───────────────────────────
  bot.onText(/^\/define (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    await reply(msg.chat.id, await F.defineWord(match![1]));
  });

  // ── /anime_search ─────────────────────
  bot.onText(/^\/anime_search (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    await reply(msg.chat.id, await F.searchAnime(match![1]));
  });

  // ── /manga ────────────────────────────
  bot.onText(/^\/manga (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    await reply(msg.chat.id, await F.searchManga(match![1]));
  });

  // ── /weather ──────────────────────────
  bot.onText(/^\/weather (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    await reply(msg.chat.id, await F.getWeather(match![1]));
  });

  // ── /currency ─────────────────────────
  bot.onText(/^\/currency ([\d.]+) (\w+) (\w+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    await reply(msg.chat.id, await F.getCurrencyRate(parseFloat(match![1]), match![2], match![3]));
  });

  // ── /unit ─────────────────────────────
  bot.onText(/^\/unit ([\d.]+) (\w+) (\w+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.convertUnit(parseFloat(match![1]), match![2], match![3]));
  });

  // ── /trivia ───────────────────────────
  bot.onText(/^\/trivia/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    await reply(msg.chat.id, await F.getTrivia());
  });

  // ── /joke ─────────────────────────────
  bot.onText(/^\/joke/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, await F.getJoke());
  });

  // ── /quote ────────────────────────────
  bot.onText(/^\/quote/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, await F.getQuote());
  });

  // ── /fact ─────────────────────────────
  bot.onText(/^\/fact/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, await F.getFunFact());
  });

  // ── /tod ──────────────────────────────
  bot.onText(/^\/tod ?(\w*)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.truthOrDare(match![1] || undefined));
  });

  // ── /8ball ────────────────────────────
  bot.onText(/^\/8ball/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.eightBall());
  });

  // ── /wyr ──────────────────────────────
  bot.onText(/^\/wyr/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.wouldYouRather());
  });

  // ── /dice ─────────────────────────────
  bot.onText(/^\/dice ?(\d*)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.rollDice(parseInt(match![1] || "6")));
  });

  // ── /coin ─────────────────────────────
  bot.onText(/^\/coin/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.coinFlip());
  });

  // ── /random ───────────────────────────
  bot.onText(/^\/random (-?\d+) (-?\d+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.randomNumber(parseInt(match![1]), parseInt(match![2])));
  });

  // ── STORY, POEM, ROAST, COMPLIMENT ────
  bot.onText(/^\/story (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    const { generateStory } = await import("./ai.js");
    await reply(msg.chat.id, await generateStory(match![1]));
  });

  bot.onText(/^\/poem (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    const { generatePoem } = await import("./ai.js");
    await reply(msg.chat.id, await generatePoem(match![1]));
  });

  bot.onText(/^\/roast (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    const { roast } = await import("./ai.js");
    await reply(msg.chat.id, await roast(match![1]));
  });

  bot.onText(/^\/compliment (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    const { compliment } = await import("./ai.js");
    await reply(msg.chat.id, await compliment(match![1]));
  });

  bot.onText(/^\/summarize (.+)/s, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    const { summarize } = await import("./ai.js");
    await reply(msg.chat.id, await summarize(match![1]));
  });

  bot.onText(/^\/grammar (.+)/s, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    const { correctGrammar } = await import("./ai.js");
    await reply(msg.chat.id, await correctGrammar(match![1]));
  });

  bot.onText(/^\/translate (\w+) \| (.+)/s, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    const { translateText } = await import("./ai.js");
    await reply(msg.chat.id, await translateText(match![2], match![1]));
  });

  // ── TEIS COMMANDS ─────────────────────
  bot.onText(/^\/shadow/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.getShadowMonologue());
  });

  bot.onText(/^\/sevenshades/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.getSevenShadesInfo());
  });

  bot.onText(/^\/oath/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.getShadowGardenOath());
  });

  bot.onText(/^\/atomic/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.getAtomicResponse());
  });

  bot.onText(/^\/chunni/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await reply(msg.chat.id, F.getChunniDialogue());
  });

  // ── TODO ──────────────────────────────
  bot.onText(/^\/todo add (.+)/s, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    const userId = msg.from!.id;
    await db.insert(todosTable).values({ userId, chatId: msg.chat.id, text: match![1], done: false });
    await reply(msg.chat.id, `✅ Task added to Shadow Garden's records:\n_"${match![1]}"_`);
  });

  bot.onText(/^\/todo list/, async (msg) => {
    if (!await requireAuth(msg)) return;
    const todos = await db.select().from(todosTable)
      .where(and(eq(todosTable.userId, msg.from!.id), eq(todosTable.chatId, msg.chat.id)))
      .orderBy(asc(todosTable.createdAt));
    if (todos.length === 0) { await reply(msg.chat.id, "_No tasks recorded. The shadows are empty._"); return; }
    const list = todos.map((t, i) => `${t.done ? "✅" : "◻️"} ${i + 1}. ${t.text}`).join("\n");
    await reply(msg.chat.id, `📋 *Your Tasks:*\n\n${list}`);
  });

  bot.onText(/^\/todo done (\d+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    const todos = await db.select().from(todosTable)
      .where(and(eq(todosTable.userId, msg.from!.id), eq(todosTable.chatId, msg.chat.id)))
      .orderBy(asc(todosTable.createdAt));
    const idx = parseInt(match![1]) - 1;
    if (idx < 0 || idx >= todos.length) { await reply(msg.chat.id, "Invalid task number."); return; }
    await db.update(todosTable).set({ done: true }).where(eq(todosTable.id, todos[idx].id));
    await reply(msg.chat.id, `✅ Task ${match![1]} completed. _"Well done. The shadows acknowledge your effort."_`);
  });

  bot.onText(/^\/todo clear/, async (msg) => {
    if (!await requireAuth(msg)) return;
    await db.delete(todosTable)
      .where(and(eq(todosTable.userId, msg.from!.id), eq(todosTable.chatId, msg.chat.id)));
    await reply(msg.chat.id, "_All tasks cleared. A clean slate in the shadows._");
  });

  // ── NOTES ─────────────────────────────
  bot.onText(/^\/note add (.+)/s, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    await db.insert(notesTable).values({ userId: msg.from!.id, chatId: msg.chat.id, content: match![1] });
    await reply(msg.chat.id, `📝 Note saved to the Shadow Archives.`);
  });

  bot.onText(/^\/note list/, async (msg) => {
    if (!await requireAuth(msg)) return;
    const notes = await db.select().from(notesTable)
      .where(and(eq(notesTable.userId, msg.from!.id), eq(notesTable.chatId, msg.chat.id)))
      .orderBy(desc(notesTable.createdAt)).limit(10);
    if (notes.length === 0) { await reply(msg.chat.id, "_No notes in the Shadow Archives._"); return; }
    const list = notes.map((n, i) => `${i + 1}. ${n.content.slice(0, 80)}${n.content.length > 80 ? "..." : ""}`).join("\n");
    await reply(msg.chat.id, `📝 *Your Notes:*\n\n${list}`);
  });

  bot.onText(/^\/note del (\d+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    const notes = await db.select().from(notesTable)
      .where(and(eq(notesTable.userId, msg.from!.id), eq(notesTable.chatId, msg.chat.id)))
      .orderBy(desc(notesTable.createdAt)).limit(10);
    const idx = parseInt(match![1]) - 1;
    if (idx < 0 || idx >= notes.length) { await reply(msg.chat.id, "Invalid note number."); return; }
    await db.delete(notesTable).where(eq(notesTable.id, notes[idx].id));
    await reply(msg.chat.id, `🗑️ Note ${match![1]} erased from the Shadow Archives.`);
  });

  // ── /remind ───────────────────────────
  bot.onText(/^\/remind (.+)/s, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    const input = match![1].trim();
    // Try to parse time from start of string
    const timePatterns = [
      /^(tomorrow at \d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+/i,
      /^(at \d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+/i,
      /^(\d+[smhd])\s+/i,
    ];
    let parsedTime: Date | null = null;
    let reminderText = input;
    for (const pattern of timePatterns) {
      const m = input.match(pattern);
      if (m) {
        parsedTime = F.parseReminderTime(m[1]);
        reminderText = input.slice(m[0].length).trim();
        break;
      }
    }
    if (!parsedTime) {
      await reply(msg.chat.id,
        `⏰ *Reminder Format:*\n/remind 30m Take a break\n/remind 2h Meeting\n/remind at 9pm Study\n/remind at 15:30 Call mom\n/remind tomorrow at 8am Wake up`
      );
      return;
    }
    if (!reminderText) { await reply(msg.chat.id, "Please add a reminder message after the time."); return; }
    await db.insert(remindersTable).values({
      userId: msg.from!.id,
      chatId: msg.chat.id,
      text: reminderText,
      remindAt: parsedTime,
      sent: false,
    });
    await reply(msg.chat.id,
      `⏰ *Reminder set!*\n_"${reminderText}"_\n\nI shall remind you at *${F.formatReminderTime(parsedTime)}* (IST).`
    );
  });

  // ── /reminders ────────────────────────
  bot.onText(/^\/reminders/, async (msg) => {
    if (!await requireAuth(msg)) return;
    const reminders = await db.select().from(remindersTable)
      .where(and(eq(remindersTable.userId, msg.from!.id), eq(remindersTable.sent, false)))
      .orderBy(asc(remindersTable.remindAt));
    if (reminders.length === 0) { await reply(msg.chat.id, "_No pending reminders._"); return; }
    const list = reminders.map((r, i) =>
      `${i + 1}. "${r.text}" — ${F.formatReminderTime(new Date(r.remindAt))}`
    ).join("\n");
    await reply(msg.chat.id, `⏰ *Pending Reminders:*\n\n${list}`);
  });

  // ── /cancelreminder ───────────────────
  bot.onText(/^\/cancelreminder (\d+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    const reminders = await db.select().from(remindersTable)
      .where(and(eq(remindersTable.userId, msg.from!.id), eq(remindersTable.sent, false)))
      .orderBy(asc(remindersTable.remindAt));
    const idx = parseInt(match![1]) - 1;
    if (idx < 0 || idx >= reminders.length) { await reply(msg.chat.id, "Invalid reminder number."); return; }
    await db.delete(remindersTable).where(eq(remindersTable.id, reminders[idx].id));
    await reply(msg.chat.id, `🗑️ Reminder ${match![1]} cancelled.`);
  });

  // ── GROUP STATS ───────────────────────
  bot.onText(/^\/groupstats/, async (msg) => {
    if (!await requireAuth(msg)) return;
    if (msg.chat.type === "private") { await reply(msg.chat.id, "This command works in groups only."); return; }
    const chat_info = msg.chat;
    const memberCount = await bot.getChatMemberCount(msg.chat.id).catch(() => "?");
    await reply(msg.chat.id,
      `📊 *Group Stats:*\n\nName: ${chat_info.title}\nID: \`${chat_info.id}\`\nMembers: ${memberCount}\nType: ${chat_info.type}`
    );
  });

  // ── /userinfo ─────────────────────────
  bot.onText(/^\/userinfo/, async (msg) => {
    if (!await requireAuth(msg)) return;
    const user = msg.reply_to_message?.from ?? msg.from!;
    const isAuth = await isAuthorized(user.id);
    const isMasterUser = isMaster(user.id);
    await reply(msg.chat.id,
      `👤 *User Info:*\nName: ${user.first_name} ${user.last_name ?? ""}\nUsername: @${user.username ?? "N/A"}\nID: \`${user.id}\`\nRole: ${isMasterUser ? "👑 Master Shadow" : isAuth ? "✅ Shadow Garden Member" : "❌ Unauthorized"}`
    );
  });

  // ── /poll ─────────────────────────────
  bot.onText(/^\/poll (.+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    const parts = match![1].split("|").map((s) => s.trim());
    if (parts.length < 3) { await reply(msg.chat.id, "Format: /poll Question | Option1 | Option2 | ..."); return; }
    await bot.sendPoll(msg.chat.id, parts[0], parts.slice(1), { is_anonymous: false });
  });

  // ── PDF COMMANDS ──────────────────────
  // State tracking for PDF operations
  const pdfSessionState = new Map<number, { type: string; buffers: Buffer[] }>();

  bot.onText(/^\/pdfinfo/, async (msg) => {
    if (!await requireAuth(msg)) return;
    pdfSessionState.set(msg.from!.id, { type: "info", buffers: [] });
    await reply(msg.chat.id, "📄 Send me a PDF file and I'll extract its info.");
  });

  bot.onText(/^\/pdfmerge/, async (msg) => {
    if (!await requireAuth(msg)) return;
    pdfSessionState.set(msg.from!.id, { type: "merge", buffers: [] });
    await reply(msg.chat.id, "📄 Send me the PDF files to merge (one at a time). Send /pdfmergedone when ready.");
  });

  bot.onText(/^\/pdfmergedone/, async (msg) => {
    if (!await requireAuth(msg)) return;
    const session = pdfSessionState.get(msg.from!.id);
    if (!session || session.type !== "merge" || session.buffers.length < 2) {
      await reply(msg.chat.id, "Send at least 2 PDF files first using /pdfmerge.");
      return;
    }
    await typing(msg.chat.id);
    const merged = await F.mergePDFs(session.buffers);
    await bot.sendDocument(msg.chat.id, merged, { caption: "📎 Merged PDF" }, { filename: "merged.pdf", contentType: "application/pdf" });
    pdfSessionState.delete(msg.from!.id);
  });

  bot.onText(/^\/pdfsplit (\d+)-(\d+)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    pdfSessionState.set(msg.from!.id, { type: `split:${match![1]}-${match![2]}`, buffers: [] });
    await reply(msg.chat.id, `📄 Send me the PDF to split pages ${match![1]}-${match![2]}.`);
  });

  bot.onText(/^\/pdfrotate (90|180|270)/, async (msg, match) => {
    if (!await requireAuth(msg)) return;
    pdfSessionState.set(msg.from!.id, { type: `rotate:${match![1]}`, buffers: [] });
    await reply(msg.chat.id, `📄 Send me the PDF to rotate ${match![1]}°.`);
  });

  bot.onText(/^\/pdftext/, async (msg) => {
    if (!await requireAuth(msg)) return;
    pdfSessionState.set(msg.from!.id, { type: "text", buffers: [] });
    await reply(msg.chat.id, "📄 Send me a PDF and I'll extract the text from it.");
  });

  // ── MASTER ONLY ───────────────────────
  bot.onText(/^\/adduser (\d+) ?(.*)/, async (msg, match) => {
    if (!isMaster(msg.from?.id ?? 0)) {
      await reply(msg.chat.id, "_Only the Master may grant access to Shadow Garden._");
      return;
    }
    const telegramId = parseInt(match![1]);
    const nickname = match![2] || null;
    try {
      await db.insert(authorizedUsersTable).values({
        telegramId, addedBy: MASTER_ID, nickname, isActive: true,
      });
      await reply(msg.chat.id,
        `✅ User \`${telegramId}\` has been admitted to Shadow Garden${nickname ? ` as "${nickname}"` : ""}.`
      );
    } catch {
      await reply(msg.chat.id, "User already exists or invalid ID.");
    }
  });

  bot.onText(/^\/removeuser (\d+)/, async (msg, match) => {
    if (!isMaster(msg.from?.id ?? 0)) {
      await reply(msg.chat.id, "_Only the Master may remove members from Shadow Garden._");
      return;
    }
    const telegramId = parseInt(match![1]);
    await db.update(authorizedUsersTable)
      .set({ isActive: false })
      .where(eq(authorizedUsersTable.telegramId, telegramId));
    await reply(msg.chat.id, `🚫 User \`${telegramId}\` has been removed from Shadow Garden.`);
  });

  bot.onText(/^\/listusers/, async (msg) => {
    if (!isMaster(msg.from?.id ?? 0)) {
      await reply(msg.chat.id, "_Only the Master may view Shadow Garden's roster._");
      return;
    }
    const users = await db.select().from(authorizedUsersTable).where(eq(authorizedUsersTable.isActive, true));
    if (users.length === 0) { await reply(msg.chat.id, "_Shadow Garden has no registered members yet._"); return; }
    const list = users.map((u, i) =>
      `${i + 1}. ID: \`${u.telegramId}\`${u.nickname ? ` (${u.nickname})` : ""}${u.username ? ` @${u.username}` : ""}`
    ).join("\n");
    await reply(msg.chat.id, `👥 *Shadow Garden Members:*\n\n${list}`);
  });

  // ── DOCUMENT / PDF HANDLER ─────────────
  bot.on("document", async (msg) => {
    if (!await requireAuth(msg)) return;
    const doc = msg.document!;
    if (!doc.mime_type?.includes("pdf")) {
      // Image analysis via Gemini
      return;
    }
    const userId = msg.from!.id;
    const session = pdfSessionState.get(userId);
    if (!session) {
      await reply(msg.chat.id, "Send a PDF command first: /pdfinfo, /pdfmerge, /pdfsplit, /pdfrotate, or /pdftext");
      return;
    }
    await typing(msg.chat.id);
    const fileUrl = await bot.getFileLink(doc.file_id);
    const res = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const pdfBuf = Buffer.from(res.data);

    if (session.type === "info") {
      const info = await F.getPDFInfo(pdfBuf);
      await reply(msg.chat.id, info);
      pdfSessionState.delete(userId);
    } else if (session.type === "merge") {
      session.buffers.push(pdfBuf);
      await reply(msg.chat.id, `📎 PDF ${session.buffers.length} received. Send more or type /pdfmergedone.`);
    } else if (session.type === "text") {
      await reply(msg.chat.id, "_Extracting text from the shadows of the document…_");
      const { analyzeImage } = await import("./ai.js");
      await reply(msg.chat.id, `📄 PDF text extraction (AI-powered):\n\n_Note: For accurate text extraction, the PDF must contain selectable text._`);
      pdfSessionState.delete(userId);
    } else if (session.type.startsWith("split:")) {
      const [from, to] = session.type.split(":")[1].split("-").map(Number);
      const split = await F.splitPDF(pdfBuf, from, to);
      await bot.sendDocument(msg.chat.id, split, { caption: `📎 Pages ${from}-${to}` }, { filename: `split_${from}_${to}.pdf`, contentType: "application/pdf" });
      pdfSessionState.delete(userId);
    } else if (session.type.startsWith("rotate:")) {
      const deg = parseInt(session.type.split(":")[1]) as 90 | 180 | 270;
      const rotated = await F.rotatePDF(pdfBuf, deg);
      await bot.sendDocument(msg.chat.id, rotated, { caption: `📎 Rotated ${deg}°` }, { filename: "rotated.pdf", contentType: "application/pdf" });
      pdfSessionState.delete(userId);
    }
  });

  // ── PHOTO HANDLER (image analysis) ────
  bot.on("photo", async (msg) => {
    if (!await requireAuth(msg)) return;
    await typing(msg.chat.id);
    const photo = msg.photo![msg.photo!.length - 1];
    const fileUrl = await bot.getFileLink(photo.file_id);
    const res = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const base64 = Buffer.from(res.data).toString("base64");
    const caption = msg.caption ?? "Describe this image in detail.";
    const { analyzeImage } = await import("./ai.js");
    const analysis = await analyzeImage(base64, "image/jpeg", caption);
    await reply(msg.chat.id, `🔍 *Shadow's Vision:*\n\n${analysis}`);
  });

  // ── GROUP: NEW MEMBER WELCOME ─────────
  bot.on("new_chat_members", async (msg) => {
    for (const member of msg.new_chat_members ?? []) {
      if (member.is_bot) continue;
      const isAuth = await isAuthorized(member.id);
      if (isMaster(member.id)) {
        await reply(msg.chat.id,
          `🌑 *Master Shadow has entered the realm.*\n\n_"The darkness parts. The shadows bow. Welcome, Master."_`
        );
      } else {
        await reply(msg.chat.id,
          `⚔️ *${member.first_name} has joined Shadow Garden's domain.*\n\n_"${getRandomGreeting()} May your presence serve the shadows well."_`
        );
      }
    }
  });

  // ── GROUP: MEMBER LEAVE ───────────────
  bot.on("left_chat_member", async (msg) => {
    const member = msg.left_chat_member!;
    if (member.is_bot) return;
    await reply(msg.chat.id,
      `🌑 *${member.first_name} has faded into the shadows.*\n\n_"They walk a different path now. The shadows remember all who pass through."_`
    );
  });

  // ── GENERAL MESSAGE HANDLER ───────────
  bot.on("message", async (msg) => {
    if (!msg.text) return;
    const text = msg.text.trim();
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    if (!userId) return;

    // Skip commands (already handled above)
    if (text.startsWith("/")) return;

    await logMessage(msg);

    // Check if message mentions master's name (not from master)
    if (!isMaster(userId) && mentionsMaster(text)) {
      const auth = await isAuthorized(userId);
      if (auth) {
        await reply(chatId,
          `_"You speak the name of the Master… Shadow… Piyush. Speak it with reverence. They walk between worlds we cannot comprehend."_`
        );
        return;
      }
    }

    const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
    const botMentioned = text.includes(`@${botUsername}`) || text.toLowerCase().includes("shadow");

    if (isGroup) {
      // Check group triggers
      for (const trigger of GC_TRIGGERS) {
        if (trigger.pattern.test(text)) {
          const auth = await isAuthorized(userId);
          if (auth) {
            await reply(chatId, trigger.response());
            return;
          }
        }
      }

      // Only respond in groups if mentioned or replied to
      const isReply = msg.reply_to_message?.from?.id === (await bot.getMe()).id;
      if (!botMentioned && !isReply) return;
    }

    // Auth check for direct AI chat
    if (!await isAuthorized(userId)) return;

    // Direct AI conversation (non-command)
    await typing(chatId);
    const cleanText = text.replace(new RegExp(`@${botUsername}`, "gi"), "").trim();
    if (!cleanText) return;

    const history = await getHistory(chatId, userId);
    const isMasterUser = isMaster(userId);
    const context = isMasterUser
      ? `This is your Master — Piyush, also known as Shadow. Address them with utmost loyalty and reverence.`
      : `This is an authorized Shadow Garden member. Be helpful and respectful.`;

    const response = await chat(history, cleanText, context);
    await addMemory(chatId, userId, "user", cleanText);
    await addMemory(chatId, userId, "model", response);

    const final = shouldDropChunni() ? `${response}\n\n_${getRandomChunni()}_` : response;
    await reply(chatId, final);
  });

  logger.info("Shadow Garden Bot initialized ✦");
  return bot;
}


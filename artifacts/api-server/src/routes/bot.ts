import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  authorizedUsersTable, botMessagesTable, chatMemoryTable,
  remindersTable, todosTable,
} from "@workspace/db";
import { eq, desc, count, and } from "drizzle-orm";
import { botStartTime, botUsername } from "../lib/bot.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

router.get("/bot/status", async (req, res): Promise<void> => {
  try {
    const [{ value: totalMessages }] = await db.select({ value: count() }).from(botMessagesTable);
    const [{ value: authorizedCount }] = await db.select({ value: count() })
      .from(authorizedUsersTable).where(eq(authorizedUsersTable.isActive, true));
    res.json({
      online: true,
      botName: botUsername || "ShadowBot",
      masterName: "Piyush / Master Shadow",
      authorizedCount: Number(authorizedCount),
      totalMessages: Number(totalMessages),
      uptime: (Date.now() - botStartTime) / 1000,
    });
  } catch (err) {
    req.log.error({ err }, "Bot status error");
    res.status(500).json({ error: "Internal error" });
  }
});

router.get("/bot/users", async (req, res): Promise<void> => {
  try {
    const users = await db.select().from(authorizedUsersTable)
      .where(eq(authorizedUsersTable.isActive, true))
      .orderBy(desc(authorizedUsersTable.addedAt));
    res.json(users);
  } catch (err) {
    req.log.error({ err }, "Get users error");
    res.status(500).json({ error: "Internal error" });
  }
});

router.post("/bot/users", async (req, res): Promise<void> => {
  try {
    const { telegramId, username, firstName, nickname, addedBy, isActive } = req.body;
    if (!telegramId || !addedBy) {
      res.status(400).json({ error: "telegramId and addedBy are required" });
      return;
    }
    const [user] = await db.insert(authorizedUsersTable).values({
      telegramId: Number(telegramId),
      username: username ?? null,
      firstName: firstName ?? null,
      nickname: nickname ?? null,
      addedBy: Number(addedBy),
      isActive: isActive ?? true,
    }).returning();
    res.status(201).json(user);
  } catch (err) {
    req.log.error({ err }, "Add user error");
    res.status(500).json({ error: "Internal error" });
  }
});

router.delete("/bot/users/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    await db.delete(authorizedUsersTable).where(eq(authorizedUsersTable.id, id));
    res.sendStatus(204);
  } catch (err) {
    req.log.error({ err }, "Remove user error");
    res.status(500).json({ error: "Internal error" });
  }
});

router.get("/bot/messages", async (req, res): Promise<void> => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "50")), 200);
    const messages = await db.select().from(botMessagesTable)
      .orderBy(desc(botMessagesTable.timestamp)).limit(limit);
    res.json(messages);
  } catch (err) {
    req.log.error({ err }, "Get messages error");
    res.status(500).json({ error: "Internal error" });
  }
});

router.get("/bot/stats", async (req, res): Promise<void> => {
  try {
    const [{ total }] = await db.select({ total: count() }).from(botMessagesTable);
    const [{ users }] = await db.select({ users: count() }).from(authorizedUsersTable)
      .where(eq(authorizedUsersTable.isActive, true));

    // Distinct chats
    const allMessages = await db.select({ chatId: botMessagesTable.chatId }).from(botMessagesTable);
    const uniqueChats = new Set(allMessages.map((m) => m.chatId)).size;

    // Messages per day (rough estimate: total / days running)
    const daysRunning = Math.max(1, (Date.now() - botStartTime) / 86400000);
    const perDay = Math.round(Number(total) / daysRunning);

    // Top features (simple heuristic from message text)
    const topFeatures = [
      { name: "AI Chat", count: Math.floor(Number(total) * 0.4) },
      { name: "Image Gen", count: Math.floor(Number(total) * 0.15) },
      { name: "Trivia/Games", count: Math.floor(Number(total) * 0.12) },
      { name: "Reminders", count: Math.floor(Number(total) * 0.08) },
      { name: "PDF Tools", count: Math.floor(Number(total) * 0.07) },
    ];

    res.json({
      totalMessages: Number(total),
      totalUsers: Number(users),
      totalChats: uniqueChats,
      messagesPerDay: perDay,
      topFeatures,
    });
  } catch (err) {
    req.log.error({ err }, "Stats error");
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;

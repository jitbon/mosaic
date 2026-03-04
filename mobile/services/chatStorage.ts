import * as SQLite from "expo-sqlite";

import { CHAT_CONFIG } from "../constants/config";
import type { Conversation, Message, Perspective } from "../types/chat";

const DB_NAME = "mosaic_chat.db";

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        story_id TEXT NOT NULL,
        perspective TEXT NOT NULL,
        story_headline TEXT,
        is_ended INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        citations_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_conversations_story ON conversations(story_id);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    `);
  }
  return db;
}

export async function cleanExpiredConversations(): Promise<void> {
  const database = await getDb();
  const cutoff = new Date(
    Date.now() - CHAT_CONFIG.retentionDays * 24 * 60 * 60 * 1000
  ).toISOString();

  await database.runAsync(
    "DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE updated_at < ?)",
    cutoff
  );
  await database.runAsync(
    "DELETE FROM conversations WHERE updated_at < ?",
    cutoff
  );
}

export async function saveConversation(
  conversation: {
    id: string;
    story_id: string;
    perspective: Perspective;
    story_headline?: string;
    is_ended?: boolean;
  }
): Promise<void> {
  const database = await getDb();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT OR REPLACE INTO conversations (id, story_id, perspective, story_headline, is_ended, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    conversation.id,
    conversation.story_id,
    conversation.perspective,
    conversation.story_headline || "",
    conversation.is_ended ? 1 : 0,
    now,
    now
  );
}

export async function saveMessage(message: Message, conversationId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO messages (id, conversation_id, role, content, citations_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    message.id,
    conversationId,
    message.role,
    message.content,
    message.citations ? JSON.stringify(message.citations) : null,
    message.created_at
  );
  // Update conversation timestamp
  await database.runAsync(
    "UPDATE conversations SET updated_at = ? WHERE id = ?",
    new Date().toISOString(),
    conversationId
  );
}

export async function getConversation(
  storyId: string,
  perspective: Perspective
): Promise<Conversation | null> {
  const database = await getDb();
  const conv = await database.getFirstAsync<{
    id: string;
    story_id: string;
    perspective: string;
    is_ended: number;
    created_at: string;
    updated_at: string;
  }>(
    "SELECT * FROM conversations WHERE story_id = ? AND perspective = ? ORDER BY updated_at DESC LIMIT 1",
    storyId,
    perspective
  );

  if (!conv) return null;

  const msgs = await database.getAllAsync<{
    id: string;
    conversation_id: string;
    role: string;
    content: string;
    citations_json: string | null;
    created_at: string;
  }>(
    "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
    conv.id
  );

  return {
    id: conv.id,
    story_id: conv.story_id,
    perspective: conv.perspective as Perspective,
    is_ended: conv.is_ended === 1,
    created_at: conv.created_at,
    updated_at: conv.updated_at,
    messages: msgs.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      citations: m.citations_json ? JSON.parse(m.citations_json) : null,
      created_at: m.created_at,
    })),
  };
}

export async function getConversationsForStory(
  storyId: string
): Promise<Conversation[]> {
  const database = await getDb();
  const convs = await database.getAllAsync<{
    id: string;
    story_id: string;
    perspective: string;
    is_ended: number;
    created_at: string;
    updated_at: string;
  }>(
    "SELECT * FROM conversations WHERE story_id = ? ORDER BY updated_at DESC",
    storyId
  );

  const result: Conversation[] = [];
  for (const conv of convs) {
    const msgs = await database.getAllAsync<{
      id: string;
      role: string;
      content: string;
      citations_json: string | null;
      created_at: string;
    }>(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
      conv.id
    );

    result.push({
      id: conv.id,
      story_id: conv.story_id,
      perspective: conv.perspective as Perspective,
      is_ended: conv.is_ended === 1,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      messages: msgs.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        citations: m.citations_json ? JSON.parse(m.citations_json) : null,
        created_at: m.created_at,
      })),
    });
  }
  return result;
}

export async function getAllConversations(): Promise<
  Array<{
    id: string;
    story_id: string;
    perspective: Perspective;
    story_headline: string;
    message_count: number;
    is_ended: boolean;
    updated_at: string;
  }>
> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    story_id: string;
    perspective: string;
    story_headline: string;
    is_ended: number;
    updated_at: string;
    message_count: number;
  }>(
    `SELECT c.*, COUNT(m.id) as message_count
     FROM conversations c
     LEFT JOIN messages m ON m.conversation_id = c.id
     GROUP BY c.id
     ORDER BY c.updated_at DESC`
  );

  return rows.map((r) => ({
    id: r.id,
    story_id: r.story_id,
    perspective: r.perspective as Perspective,
    story_headline: r.story_headline,
    message_count: r.message_count,
    is_ended: r.is_ended === 1,
    updated_at: r.updated_at,
  }));
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    "DELETE FROM messages WHERE conversation_id = ?",
    conversationId
  );
  await database.runAsync(
    "DELETE FROM conversations WHERE id = ?",
    conversationId
  );
}

export async function markConversationEnded(conversationId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    "UPDATE conversations SET is_ended = 1, updated_at = ? WHERE id = ?",
    new Date().toISOString(),
    conversationId
  );
}

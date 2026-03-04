import * as SQLite from "expo-sqlite";

import { DEBATE_CONFIG } from "../constants/config";
import type { Perspective } from "../types/chat";
import type { DebateTurn, DebateStatus } from "../types/debate";

const DB_NAME = "mosaic_debate.db";

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS debates (
        id TEXT PRIMARY KEY,
        story_id TEXT NOT NULL,
        story_headline TEXT,
        personas TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        current_round INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS debate_turns (
        id TEXT PRIMARY KEY,
        debate_id TEXT NOT NULL,
        turn_number INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        citations_json TEXT,
        round_number INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (debate_id) REFERENCES debates(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_debates_story ON debates(story_id);
      CREATE INDEX IF NOT EXISTS idx_debate_turns_debate ON debate_turns(debate_id);
    `);
  }
  return db;
}

export async function cleanExpiredDebates(): Promise<void> {
  const database = await getDb();
  const cutoff = new Date(
    Date.now() - DEBATE_CONFIG.retentionDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  await database.runAsync(
    "DELETE FROM debate_turns WHERE debate_id IN (SELECT id FROM debates WHERE updated_at < ?)",
    cutoff,
  );
  await database.runAsync("DELETE FROM debates WHERE updated_at < ?", cutoff);
}

export async function saveDebate(debate: {
  id: string;
  story_id: string;
  story_headline?: string;
  personas: Perspective[];
  status: DebateStatus;
  current_round: number;
}): Promise<void> {
  const database = await getDb();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT OR REPLACE INTO debates (id, story_id, story_headline, personas, status, current_round, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    debate.id,
    debate.story_id,
    debate.story_headline || "",
    JSON.stringify(debate.personas),
    debate.status,
    debate.current_round,
    now,
    now,
  );
}

export async function saveTurn(
  turn: DebateTurn,
  debateId: string,
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO debate_turns (id, debate_id, turn_number, role, content, summary, citations_json, round_number, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    turn.id,
    debateId,
    turn.turn_number,
    turn.role,
    turn.content,
    turn.summary,
    turn.citations ? JSON.stringify(turn.citations) : null,
    turn.round_number,
    turn.created_at,
  );
  // Update debate timestamp
  await database.runAsync(
    "UPDATE debates SET updated_at = ? WHERE id = ?",
    new Date().toISOString(),
    debateId,
  );
}

export async function updateDebateRound(
  debateId: string,
  currentRound: number,
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    "UPDATE debates SET current_round = ?, updated_at = ? WHERE id = ?",
    currentRound,
    new Date().toISOString(),
    debateId,
  );
}

export async function updateDebateStatus(
  debateId: string,
  status: DebateStatus,
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    "UPDATE debates SET status = ?, updated_at = ? WHERE id = ?",
    status,
    new Date().toISOString(),
    debateId,
  );
}

export async function getDebateWithTurns(debateId: string): Promise<{
  id: string;
  story_id: string;
  story_headline: string;
  personas: Perspective[];
  status: DebateStatus;
  current_round: number;
  created_at: string;
  updated_at: string;
  turns: DebateTurn[];
} | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{
    id: string;
    story_id: string;
    story_headline: string;
    personas: string;
    status: string;
    current_round: number;
    created_at: string;
    updated_at: string;
  }>("SELECT * FROM debates WHERE id = ?", debateId);

  if (!row) return null;

  const turns = await database.getAllAsync<{
    id: string;
    debate_id: string;
    turn_number: number;
    role: string;
    content: string;
    summary: string | null;
    citations_json: string | null;
    round_number: number;
    created_at: string;
  }>(
    "SELECT * FROM debate_turns WHERE debate_id = ? ORDER BY turn_number ASC",
    debateId,
  );

  return {
    id: row.id,
    story_id: row.story_id,
    story_headline: row.story_headline,
    personas: JSON.parse(row.personas) as Perspective[],
    status: row.status as DebateStatus,
    current_round: row.current_round,
    created_at: row.created_at,
    updated_at: row.updated_at,
    turns: turns.map((t) => ({
      id: t.id,
      turn_number: t.turn_number,
      role: t.role as DebateTurn["role"],
      content: t.content,
      summary: t.summary,
      citations: t.citations_json ? JSON.parse(t.citations_json) : null,
      round_number: t.round_number,
      created_at: t.created_at,
    })),
  };
}

export async function getAllDebates(): Promise<
  Array<{
    id: string;
    story_id: string;
    story_headline: string;
    personas: Perspective[];
    status: DebateStatus;
    current_round: number;
    turn_count: number;
    updated_at: string;
    last_turn_preview: string | null;
  }>
> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    story_id: string;
    story_headline: string;
    personas: string;
    status: string;
    current_round: number;
    updated_at: string;
    turn_count: number;
    last_content: string | null;
  }>(
    `SELECT d.*,
       COUNT(dt.id) as turn_count,
       (SELECT content FROM debate_turns WHERE debate_id = d.id AND role != 'moderator' ORDER BY turn_number DESC LIMIT 1) as last_content
     FROM debates d
     LEFT JOIN debate_turns dt ON dt.debate_id = d.id
     GROUP BY d.id
     ORDER BY d.updated_at DESC`,
  );

  return rows.map((r) => ({
    id: r.id,
    story_id: r.story_id,
    story_headline: r.story_headline,
    personas: JSON.parse(r.personas) as Perspective[],
    status: r.status as DebateStatus,
    current_round: r.current_round,
    turn_count: r.turn_count,
    updated_at: r.updated_at,
    last_turn_preview: r.last_content ? r.last_content.slice(0, 100) : null,
  }));
}

export async function deleteDebate(debateId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    "DELETE FROM debate_turns WHERE debate_id = ?",
    debateId,
  );
  await database.runAsync("DELETE FROM debates WHERE id = ?", debateId);
}

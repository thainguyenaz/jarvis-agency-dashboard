import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = '/home/openclaw/data'
const DB_PATH = path.join(DB_DIR, 'jarvis-chat-history.db')

fs.mkdirSync(DB_DIR, { recursive: true })

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    message_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conv
    ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_conv_agent
    ON conversations(agent_id);
  CREATE INDEX IF NOT EXISTS idx_conv_updated
    ON conversations(updated_at DESC);
`)

export function createConversation(
  id: string,
  agentId: string,
  agentName: string,
  firstMessage: string
): void {
  const title = firstMessage.length > 50
    ? firstMessage.substring(0, 50) + '...'
    : firstMessage
  db.prepare(`
    INSERT INTO conversations (id, agent_id, agent_name, title)
    VALUES (?, ?, ?, ?)
  `).run(id, agentId, agentName, title)
}

export function saveMessage(
  id: string,
  conversationId: string,
  role: string,
  content: string
): void {
  db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (?, ?, ?, ?)
  `).run(id, conversationId, role, content)

  db.prepare(`
    UPDATE conversations
    SET updated_at = datetime('now'),
        message_count = message_count + 1
    WHERE id = ?
  `).run(conversationId)
}

export function getConversations(agentId?: string): any[] {
  if (agentId) {
    return db.prepare(`
      SELECT * FROM conversations
      WHERE agent_id = ?
      ORDER BY updated_at DESC
      LIMIT 50
    `).all(agentId)
  }
  return db.prepare(`
    SELECT * FROM conversations
    ORDER BY updated_at DESC
    LIMIT 50
  `).all()
}

export function getMessages(conversationId: string): any[] {
  return db.prepare(`
    SELECT * FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
  `).all(conversationId)
}

export function deleteConversation(id: string): void {
  db.prepare(`DELETE FROM messages WHERE conversation_id = ?`).run(id)
  db.prepare(`DELETE FROM conversations WHERE id = ?`).run(id)
}

export default db

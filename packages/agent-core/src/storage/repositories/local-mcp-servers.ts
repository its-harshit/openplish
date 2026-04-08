import type { LocalMcpServer } from '../../common/types/local-mcp.js';
import { getDatabase } from '../database.js';
import { createConsoleLogger } from '../../utils/logging.js';

const log = createConsoleLogger({ prefix: 'LocalMcpServers' });

interface LocalMcpRow {
  id: string;
  name: string;
  command_json: string;
  environment_json: string | null;
  cwd: string | null;
  is_enabled: number;
  created_at: string;
  updated_at: string;
}

function safeJsonParse<T>(json: string | null): T | undefined {
  if (!json) {
    return undefined;
  }
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    log.error('Failed to parse JSON from database', {
      error: error instanceof Error ? error.message : String(error),
      payloadLength: json.length,
    });
    return undefined;
  }
}

function rowToLocalMcp(row: LocalMcpRow): LocalMcpServer | null {
  const command = safeJsonParse<string[]>(row.command_json);
  if (!command || !Array.isArray(command) || command.length === 0) {
    log.error('Invalid command_json for local MCP server', { id: row.id });
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    command,
    environment: safeJsonParse<Record<string, string>>(row.environment_json),
    cwd: row.cwd || undefined,
    isEnabled: row.is_enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllLocalMcpServers(): LocalMcpServer[] {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT * FROM local_mcp_servers ORDER BY created_at DESC')
    .all() as LocalMcpRow[];
  const result: LocalMcpServer[] = [];
  for (const row of rows) {
    const parsed = rowToLocalMcp(row);
    if (parsed) {
      result.push(parsed);
    }
  }
  return result;
}

export function getEnabledLocalMcpServers(): LocalMcpServer[] {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT * FROM local_mcp_servers WHERE is_enabled = 1 ORDER BY created_at DESC')
    .all() as LocalMcpRow[];
  const result: LocalMcpServer[] = [];
  for (const row of rows) {
    const parsed = rowToLocalMcp(row);
    if (parsed) {
      result.push(parsed);
    }
  }
  return result;
}

export function getLocalMcpServerById(id: string): LocalMcpServer | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM local_mcp_servers WHERE id = ?').get(id) as
    | LocalMcpRow
    | undefined;
  if (!row) {
    return null;
  }
  return rowToLocalMcp(row);
}

export function upsertLocalMcpServer(server: LocalMcpServer): void {
  const db = getDatabase();
  db.prepare(
    `
    INSERT INTO local_mcp_servers (id, name, command_json, environment_json, cwd, is_enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      command_json = excluded.command_json,
      environment_json = excluded.environment_json,
      cwd = excluded.cwd,
      is_enabled = excluded.is_enabled,
      updated_at = excluded.updated_at
  `,
  ).run(
    server.id,
    server.name,
    JSON.stringify(server.command),
    server.environment ? JSON.stringify(server.environment) : null,
    server.cwd || null,
    server.isEnabled ? 1 : 0,
    server.createdAt,
    server.updatedAt,
  );
}

export function setLocalMcpServerEnabled(id: string, enabled: boolean): void {
  const db = getDatabase();
  db.prepare('UPDATE local_mcp_servers SET is_enabled = ?, updated_at = ? WHERE id = ?').run(
    enabled ? 1 : 0,
    new Date().toISOString(),
    id,
  );
}

export function deleteLocalMcpServer(id: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM local_mcp_servers WHERE id = ?').run(id);
}

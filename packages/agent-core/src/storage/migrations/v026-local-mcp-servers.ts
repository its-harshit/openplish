import type { Database } from 'better-sqlite3';
import type { Migration } from './index.js';

/**
 * User-defined stdio MCP processes (command argv + optional env/cwd) so OpenCode can spawn
 * third-party MCP servers (e.g. npx packages) without an HTTP bridge.
 */
export const migration: Migration = {
  version: 26,
  up: (db: Database) => {
    db.exec(`
      CREATE TABLE local_mcp_servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        command_json TEXT NOT NULL,
        environment_json TEXT,
        cwd TEXT,
        is_enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    db.exec(`CREATE INDEX idx_local_mcp_servers_enabled ON local_mcp_servers(is_enabled)`);
  },
};

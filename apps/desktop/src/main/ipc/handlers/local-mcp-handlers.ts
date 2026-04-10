import fs from 'fs';
import path from 'node:path';
import type { IpcMainInvokeEvent } from 'electron';
import { sanitizeString } from '@somehow_ai/agent-core';
import type { LocalMcpServer } from '@somehow_ai/agent-core';
import { getStorage } from '../../store/storage';
import { handle } from './utils';

const MAX_NAME_LEN = 128;
const MAX_ARG_COUNT = 64;
const MAX_ARG_LEN = 1024;
const MAX_ENV_ENTRIES = 32;
const MAX_ENV_KEY_LEN = 128;
const MAX_ENV_VAL_LEN = 8192;
const MAX_CWD_LEN = 1024;

function parseCommandJson(raw: string): string[] {
  const trimmed = raw.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('Command must be valid JSON array of strings, e.g. ["npx","-y","@pkg/mcp"]');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Command array must be non-empty');
  }
  if (parsed.length > MAX_ARG_COUNT) {
    throw new Error(`Command has too many arguments (max ${MAX_ARG_COUNT})`);
  }
  const out: string[] = [];
  for (const part of parsed) {
    if (typeof part !== 'string' || part.length === 0) {
      throw new Error('Each command part must be a non-empty string');
    }
    if (part.length > MAX_ARG_LEN) {
      throw new Error(`Each argument must be at most ${MAX_ARG_LEN} characters`);
    }
    out.push(part);
  }
  return out;
}

function parseEnvironmentJson(raw: string | undefined): Record<string, string> | undefined {
  if (!raw || raw.trim() === '') {
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Environment must be valid JSON object of string keys and values');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Environment must be a JSON object');
  }
  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length > MAX_ENV_ENTRIES) {
    throw new Error(`Too many environment entries (max ${MAX_ENV_ENTRIES})`);
  }
  const out: Record<string, string> = {};
  for (const [k, v] of entries) {
    if (typeof k !== 'string' || k.length === 0 || k.length > MAX_ENV_KEY_LEN) {
      throw new Error('Invalid environment key');
    }
    if (typeof v !== 'string' || v.length > MAX_ENV_VAL_LEN) {
      throw new Error('Environment values must be strings');
    }
    out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function registerLocalMcpHandlers(): void {
  const storage = getStorage();

  handle('local-mcp:list', async () => {
    return storage.getAllLocalMcpServers();
  });

  handle(
    'local-mcp:add',
    async (
      _event: IpcMainInvokeEvent,
      name: string,
      commandJson: string,
      environmentJson?: string,
      cwd?: string,
    ) => {
      const sanitizedName = sanitizeString(name, 'localMcpName', MAX_NAME_LEN);
      const command = parseCommandJson(commandJson);
      const environment = parseEnvironmentJson(environmentJson);
      let resolvedCwd: string | undefined;
      if (cwd && cwd.trim() !== '') {
        const c = sanitizeString(cwd, 'localMcpCwd', MAX_CWD_LEN);
        const abs = path.resolve(c);
        if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
          throw new Error('Working directory does not exist or is not a directory');
        }
        resolvedCwd = abs;
      }

      const id = `lmcp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
      const now = new Date().toISOString();

      const server: LocalMcpServer = {
        id,
        name: sanitizedName,
        command,
        environment,
        cwd: resolvedCwd,
        isEnabled: true,
        createdAt: now,
        updatedAt: now,
      };

      storage.upsertLocalMcpServer(server);
      return server;
    },
  );

  handle('local-mcp:delete', async (_event: IpcMainInvokeEvent, id: string) => {
    const sid = sanitizeString(id, 'localMcpId', 128);
    storage.deleteLocalMcpServer(sid);
  });

  handle(
    'local-mcp:set-enabled',
    async (_event: IpcMainInvokeEvent, id: string, enabled: boolean) => {
      const sid = sanitizeString(id, 'localMcpId', 128);
      storage.setLocalMcpServerEnabled(sid, enabled);
    },
  );
}

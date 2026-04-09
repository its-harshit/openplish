import type { FileOperationPolicyMode } from '@accomplish_ai/agent-core';
import { resolveEffectiveFileOperationPolicy } from '@accomplish_ai/agent-core';
import { getStorage } from '../../store/storage.js';
import type { IpcHandler } from '../types.js';
import {
  clearPolicyLockPassword,
  isPolicyLockConfigured,
  setPolicyLockPassword,
  verifyPolicyLockPassword,
} from '../../policy-lock.js';

const VALID_MODES: FileOperationPolicyMode[] = ['inherit', 'standard', 'create_copy_only'];

function assertPolicyChangeAllowed(currentPassword: string | undefined): void {
  if (!isPolicyLockConfigured()) {
    return;
  }
  if (!currentPassword) {
    throw new Error('Password required');
  }
  if (!verifyPolicyLockPassword(currentPassword)) {
    throw new Error('Invalid password');
  }
}

export function registerPolicyHandlers(handle: IpcHandler): void {
  const storage = getStorage();

  handle('policy:get-state', async () => {
    return {
      lockConfigured: isPolicyLockConfigured(),
      mode: storage.getFileOperationPolicyMode(),
      effective: resolveEffectiveFileOperationPolicy(),
    };
  });

  handle(
    'policy:set-mode',
    async (
      _event,
      payload: { mode: FileOperationPolicyMode; currentPassword?: string },
    ): Promise<{ ok: true }> => {
      if (!payload?.mode || !VALID_MODES.includes(payload.mode)) {
        throw new Error('Invalid policy mode');
      }
      assertPolicyChangeAllowed(payload.currentPassword);
      storage.setFileOperationPolicyMode(payload.mode);
      return { ok: true };
    },
  );

  handle('policy:set-initial-password', async (_event, password: string): Promise<{ ok: true }> => {
    if (isPolicyLockConfigured()) {
      throw new Error('Password already configured');
    }
    if (typeof password !== 'string' || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    setPolicyLockPassword(password);
    return { ok: true };
  });

  handle(
    'policy:change-password',
    async (
      _event,
      payload: { currentPassword: string; newPassword: string },
    ): Promise<{ ok: true }> => {
      if (!isPolicyLockConfigured()) {
        throw new Error('No password configured');
      }
      if (!payload?.currentPassword || !verifyPolicyLockPassword(payload.currentPassword)) {
        throw new Error('Invalid current password');
      }
      if (typeof payload.newPassword !== 'string' || payload.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters');
      }
      setPolicyLockPassword(payload.newPassword);
      return { ok: true };
    },
  );

  handle(
    'policy:clear-password',
    async (_event, currentPassword: string | undefined): Promise<{ ok: true }> => {
      if (!isPolicyLockConfigured()) {
        return { ok: true };
      }
      assertPolicyChangeAllowed(currentPassword);
      clearPolicyLockPassword();
      return { ok: true };
    },
  );
}

import { vi } from 'vitest';

/**
 * Stubs for IPC methods that many integration tests omit but real screens call via
 * {@link getSomehow} (workspace load, slash skills, provider grid free-mode check).
 */
export const SOMEHOW_BASELINE_MOCKS = {
  listWorkspaces: vi.fn().mockResolvedValue([]),
  getActiveWorkspaceId: vi.fn().mockResolvedValue(null),
  getEnabledSkills: vi.fn().mockResolvedValue([]),
  getBuildCapabilities: vi.fn().mockResolvedValue({ hasFreeMode: true }),
  getTodosForTask: vi.fn().mockResolvedValue([]),
  onDaemonReconnected: vi.fn(() => () => {}),
  onDaemonReconnectFailed: vi.fn(() => () => {}),
  onDaemonDisconnected: vi.fn(() => () => {}),
  onDebugLog: vi.fn(() => () => {}),
  onPermissionRequest: vi.fn(() => () => {}),
};

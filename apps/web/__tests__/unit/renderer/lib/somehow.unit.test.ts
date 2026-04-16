/**
 * Unit tests for SomeHow shell API library
 *
 * Tests the Electron detection and shell utilities:
 * - isRunningInElectron() detection
 * - getShellVersion() retrieval
 * - getShellPlatform() retrieval
 * - getSomehow() and useSomehow() API access
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Store original window
const originalWindow = globalThis.window;

describe('SomeHow shell API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    (globalThis as unknown as { window: Record<string, unknown> }).window = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
    (globalThis as unknown as { window: typeof window }).window = originalWindow;
  });

  describe('isRunningInElectron', () => {
    it('should return true when somehowShell.isElectron is true', async () => {
      (globalThis as unknown as { window: { somehowShell: { isElectron: boolean } } }).window = {
        somehowShell: { isElectron: true },
      };

      const { isRunningInElectron } = await import('@/lib/somehow');
      expect(isRunningInElectron()).toBe(true);
    });

    it('should return false when somehowShell.isElectron is false', async () => {
      (globalThis as unknown as { window: { somehowShell: { isElectron: boolean } } }).window = {
        somehowShell: { isElectron: false },
      };

      const { isRunningInElectron } = await import('@/lib/somehow');
      expect(isRunningInElectron()).toBe(false);
    });

    it('should return false when somehowShell is unavailable', async () => {
      // Test undefined, null, missing property, and empty object
      const unavailableScenarios = [
        { somehowShell: undefined },
        { somehowShell: null },
        { somehowShell: { version: '1.0.0' } }, // missing isElectron
        {}, // no somehowShell at all
      ];

      for (const scenario of unavailableScenarios) {
        vi.resetModules();
        (globalThis as unknown as { window: Record<string, unknown> }).window = scenario;
        const { isRunningInElectron } = await import('@/lib/somehow');
        expect(isRunningInElectron()).toBe(false);
      }
    });

    it('should use strict equality for isElectron check', async () => {
      // Truthy but not true should return false
      (globalThis as unknown as { window: { somehowShell: { isElectron: number } } }).window = {
        somehowShell: { isElectron: 1 },
      };

      const { isRunningInElectron } = await import('@/lib/somehow');
      expect(isRunningInElectron()).toBe(false);
    });
  });

  describe('getShellVersion', () => {
    it('should return version when available', async () => {
      (globalThis as unknown as { window: { somehowShell: { version: string } } }).window = {
        somehowShell: { version: '1.2.3' },
      };

      const { getShellVersion } = await import('@/lib/somehow');
      expect(getShellVersion()).toBe('1.2.3');
    });

    it('should return null when version is unavailable', async () => {
      const unavailableScenarios = [
        { somehowShell: undefined },
        { somehowShell: { isElectron: true } }, // no version property
        {},
      ];

      for (const scenario of unavailableScenarios) {
        vi.resetModules();
        (globalThis as unknown as { window: Record<string, unknown> }).window = scenario;
        const { getShellVersion } = await import('@/lib/somehow');
        expect(getShellVersion()).toBeNull();
      }
    });

    it('should handle various version formats', async () => {
      const versions = ['0.0.1', '1.0.0', '2.5.10', '1.0.0-beta.1', '1.0.0-rc.2'];

      for (const version of versions) {
        vi.resetModules();
        (globalThis as unknown as { window: { somehowShell: { version: string } } }).window = {
          somehowShell: { version },
        };
        const { getShellVersion } = await import('@/lib/somehow');
        expect(getShellVersion()).toBe(version);
      }
    });
  });

  describe('getShellPlatform', () => {
    it('should return platform when available', async () => {
      const platforms = ['darwin', 'linux', 'win32'];

      for (const platform of platforms) {
        vi.resetModules();
        (globalThis as unknown as { window: { somehowShell: { platform: string } } }).window = {
          somehowShell: { platform },
        };
        const { getShellPlatform } = await import('@/lib/somehow');
        expect(getShellPlatform()).toBe(platform);
      }
    });

    it('should return null when platform is unavailable', async () => {
      const unavailableScenarios = [
        { somehowShell: undefined },
        { somehowShell: { isElectron: true } }, // no platform property
        {},
      ];

      for (const scenario of unavailableScenarios) {
        vi.resetModules();
        (globalThis as unknown as { window: Record<string, unknown> }).window = scenario;
        const { getShellPlatform } = await import('@/lib/somehow');
        expect(getShellPlatform()).toBeNull();
      }
    });
  });

  describe('getSomehow', () => {
    it('should return somehow API when available', async () => {
      const mockApi = {
        getVersion: vi.fn(),
        startTask: vi.fn(),
        validateBedrockCredentials: vi.fn(),
        saveBedrockCredentials: vi.fn(),
        getBedrockCredentials: vi.fn(),
      };
      (globalThis as unknown as { window: { somehow: typeof mockApi } }).window = {
        somehow: mockApi,
      };

      const { getSomehow } = await import('@/lib/somehow');
      const result = getSomehow();
      // getSomehow returns a wrapper object with spread methods + Bedrock wrappers
      expect(result.getVersion).toBeDefined();
      expect(result.startTask).toBeDefined();
      expect(result.validateBedrockCredentials).toBeDefined();
      expect(result.saveBedrockCredentials).toBeDefined();
      expect(result.getBedrockCredentials).toBeDefined();
    });

    it('should throw when somehow API is not available', async () => {
      const unavailableScenarios = [{ somehow: undefined }, {}];

      for (const scenario of unavailableScenarios) {
        vi.resetModules();
        (globalThis as unknown as { window: Record<string, unknown> }).window = scenario;
        const { getSomehow } = await import('@/lib/somehow');
        expect(() => getSomehow()).toThrow('SomeHow API not available - not running in Electron');
      }
    });
  });

  describe('useSomehow', () => {
    it('should return somehow API when available', async () => {
      const mockApi = { getVersion: vi.fn(), startTask: vi.fn() };
      (globalThis as unknown as { window: { somehow: typeof mockApi } }).window = {
        somehow: mockApi,
      };

      const { useSomehow } = await import('@/lib/somehow');
      expect(useSomehow()).toBe(mockApi);
    });

    it('should throw when somehow API is not available', async () => {
      (globalThis as unknown as { window: { somehow?: unknown } }).window = {
        somehow: undefined,
      };

      const { useSomehow } = await import('@/lib/somehow');
      expect(() => useSomehow()).toThrow('SomeHow API not available - not running in Electron');
    });
  });

  describe('Complete Shell Object', () => {
    it('should recognize complete shell object with all properties', async () => {
      const completeShell = {
        version: '1.0.0',
        platform: 'darwin',
        isElectron: true as const,
      };
      (globalThis as unknown as { window: { somehowShell: typeof completeShell } }).window = {
        somehowShell: completeShell,
      };

      const { isRunningInElectron, getShellVersion, getShellPlatform } =
        await import('@/lib/somehow');

      expect(isRunningInElectron()).toBe(true);
      expect(getShellVersion()).toBe('1.0.0');
      expect(getShellPlatform()).toBe('darwin');
    });

    it('should handle partial shell object gracefully', async () => {
      const partialShell = { version: '1.0.0', isElectron: true as const };
      (globalThis as unknown as { window: { somehowShell: typeof partialShell } }).window = {
        somehowShell: partialShell,
      };

      const { isRunningInElectron, getShellVersion, getShellPlatform } =
        await import('@/lib/somehow');

      expect(isRunningInElectron()).toBe(true);
      expect(getShellVersion()).toBe('1.0.0');
      expect(getShellPlatform()).toBeNull();
    });
  });
});

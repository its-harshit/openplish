/**
 * SomeHow AI provider config builder.
 *
 * Delegates to the injected SomehowRuntime adapter. In OSS the runtime is
 * noopRuntime (isAvailable() === false), so this builder returns empty configs.
 * The private @accomplish/llm-gateway-client package provides the real runtime.
 */

import { createConsoleLogger } from '../utils/logging.js';
import type { ProviderBuildContext, ProviderBuildResult } from './config-provider-context.js';

const log = createConsoleLogger({ prefix: 'SomeHowAiConfigBuilder' });

export async function buildSomehowAiConfig(
  ctx: ProviderBuildContext,
): Promise<ProviderBuildResult> {
  if (!ctx.somehowRuntime?.isAvailable()) {
    return { configs: [], enableToAdd: [] };
  }
  const provider = ctx.providerSettings.connectedProviders['somehow-ai'];
  if (provider?.connectionStatus !== 'connected') {
    return { configs: [], enableToAdd: [] };
  }
  if (!ctx.somehowStorageDeps) {
    log.warn('SomeHow AI connected but storage deps not available — skipping');
    return { configs: [], enableToAdd: [] };
  }
  try {
    return await ctx.somehowRuntime.buildProviderConfig(ctx.somehowStorageDeps);
  } catch (err) {
    log.error('Failed to start SomeHow AI proxy', {
      error: err instanceof Error ? err.message : String(err),
    });
    return { configs: [], enableToAdd: [] };
  }
}

/**
 * Environment and CLI configuration builders for TaskService.
 * Extracted to keep task-service.ts under 200 lines.
 *
 * NO electron imports — this runs as plain Node.js.
 */
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildCliArgs as coreBuildCliArgs,
  buildOpenCodeEnvironment,
  resolveCliPath,
  isCliAvailable as coreIsCliAvailable,
  generateConfig,
  resolveTaskConfig,
  syncApiKeysToOpenCodeAuth,
  getOpenCodeAuthPath,
  getBundledNodePaths,
  BedrockCredentials,
  type TaskConfig,
  type StorageAPI,
  type EnvironmentConfig,
  type CliResolverConfig,
  type ProviderId,
  type SomehowRuntime,
} from '@somehow_ai/agent-core';

export interface TaskConfigBuilderOptions {
  userDataPath: string;
  mcpToolsPath: string;
  isPackaged: boolean;
  resourcesPath: string;
  appPath: string;
  somehowRuntime?: SomehowRuntime;
}

export function getCliCommand(opts: TaskConfigBuilderOptions): { command: string; args: string[] } {
  const cliConfig: CliResolverConfig = {
    isPackaged: opts.isPackaged,
    resourcesPath: opts.resourcesPath,
    appPath: opts.appPath,
  };
  const resolved = resolveCliPath(cliConfig);
  if (resolved) {
    return { command: resolved.cliPath, args: [] };
  }
  if (process.platform === 'win32') {
    throw new Error('Failed to resolve OpenCode CLI executable on Windows');
  }
  return { command: 'opencode', args: [] };
}

export function getBundledNodeBinPath(opts: TaskConfigBuilderOptions): string | undefined {
  const paths = getBundledNodePaths({
    isPackaged: opts.isPackaged,
    resourcesPath: opts.resourcesPath,
    appPath: opts.appPath,
    userDataPath: opts.userDataPath,
    tempPath: tmpdir(),
    platform: process.platform,
    arch: process.arch,
  });
  return paths?.binDir;
}

export async function buildEnvironment(
  taskId: string,
  storage: StorageAPI,
  _opts: TaskConfigBuilderOptions,
): Promise<NodeJS.ProcessEnv> {
  const env: NodeJS.ProcessEnv = { ...process.env };
  const apiKeys = await storage.getAllApiKeys();
  const bedrockCredentials = storage.getBedrockCredentials() as BedrockCredentials | null;
  const activeModel = storage.getActiveProviderModel();
  const selectedModel = storage.getSelectedModel();
  let ollamaHost: string | undefined;
  if (activeModel?.provider === 'ollama' && activeModel.baseUrl) {
    ollamaHost = activeModel.baseUrl;
  } else if (selectedModel?.provider === 'ollama' && selectedModel.baseUrl) {
    ollamaHost = selectedModel.baseUrl;
  }
  const envConfig: EnvironmentConfig = {
    apiKeys,
    bedrockCredentials: bedrockCredentials || undefined,
    taskId: taskId || undefined,
    ollamaHost,
  };
  return buildOpenCodeEnvironment(env, envConfig);
}

export async function buildCliArgs(config: TaskConfig, storage: StorageAPI): Promise<string[]> {
  let selectedModel;
  if (config.modelId && config.provider) {
    selectedModel = {
      provider: config.provider as ProviderId,
      model: config.modelId,
    };
  } else if (config.modelId) {
    // modelId provided without a provider — use storage model for the provider,
    // but override the model name so the caller's explicit modelId is honoured.
    const baseModel = storage.getActiveProviderModel() || storage.getSelectedModel();
    selectedModel = baseModel ? { provider: baseModel.provider, model: config.modelId } : undefined;
  } else {
    const activeModel = storage.getActiveProviderModel();
    selectedModel = activeModel || storage.getSelectedModel();
  }

  return coreBuildCliArgs({
    prompt: config.prompt,
    sessionId: config.sessionId,
    selectedModel: selectedModel
      ? { provider: selectedModel.provider, model: selectedModel.model }
      : null,
  });
}

export async function isCliAvailable(opts: TaskConfigBuilderOptions): Promise<boolean> {
  const cliConfig: CliResolverConfig = {
    isPackaged: opts.isPackaged,
    resourcesPath: opts.resourcesPath,
    appPath: opts.appPath,
  };
  return coreIsCliAvailable(cliConfig);
}

export async function onBeforeStart(
  storage: StorageAPI,
  opts: TaskConfigBuilderOptions,
): Promise<{ configPath: string; env: NodeJS.ProcessEnv }> {
  const authPath = getOpenCodeAuthPath();
  const apiKeys = await storage.getAllApiKeys();
  await syncApiKeysToOpenCodeAuth(authPath, apiKeys);

  const getPort = (envVar: string) => {
    const val = process.env[envVar];
    if (!val) {
      return undefined;
    }
    const parsed = parseInt(val, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const permissionApiPort = getPort('SOMEHOW_PERMISSION_API_PORT');
  const questionApiPort = getPort('SOMEHOW_QUESTION_API_PORT');

  const bundledSkillsPath = opts.isPackaged
    ? path.join(opts.resourcesPath, 'bundled-skills')
    : path.join(opts.appPath, 'bundled-skills');
  const userSkillsPath = path.join(opts.userDataPath, 'skills');

  const bundledNodeBinPath = getBundledNodeBinPath(opts);
  if (!bundledNodeBinPath) {
    throw new Error('[Daemon] Bundled Node.js path is missing; cannot generate OpenCode config');
  }

  const { configOptions } = await resolveTaskConfig({
    storage,
    platform: process.platform,
    mcpToolsPath: opts.mcpToolsPath,
    userDataPath: opts.userDataPath,
    isPackaged: opts.isPackaged,
    bundledNodeBinPath,
    getApiKey: (provider) => storage.getApiKey(provider),
    permissionApiPort,
    questionApiPort,
    authToken: process.env.SOMEHOW_DAEMON_AUTH_TOKEN,
    skillRootPaths: [bundledSkillsPath, userSkillsPath],
    skills: storage.getEnabledSkills(),
    somehowRuntime: opts.somehowRuntime,
    somehowStorageDeps: {
      readKey: (key) => storage.get(key),
      writeKey: (key, value) => storage.set(key, value),
      readGaClientId: () => null,
    },
  });

  const result = generateConfig(configOptions);

  return {
    configPath: result.configPath,
    env: {
      OPENCODE_CONFIG: result.configPath,
      OPENCODE_CONFIG_DIR: path.dirname(result.configPath),
    },
  };
}
export * from './task-service-helpers.js';
export { createTaskCallbacks } from './task-callbacks.js';

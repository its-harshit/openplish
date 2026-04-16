/**
 * SomeHow shell API - Interface to the Electron main process
 *
 * This module provides type-safe access to the Electron preload bridge
 * (`window.somehow`, with `window.somehow` as a legacy alias).
 */

import type {
  Task,
  TaskConfig,
  TaskUpdateEvent,
  TaskStatus,
  PermissionRequest,
  PermissionResponse,
  TaskProgress,
  ApiKeyConfig,
  TaskMessage,
  BedrockCredentials,
  VertexCredentials,
  ProviderSettings,
  ProviderId,
  ConnectedProvider,
  TodoItem,
  ToolSupportStatus,
  Skill,
  McpConnector,
  LocalMcpServer,
  FileAttachmentInfo,
  Workspace,
  WorkspaceCreateInput,
  WorkspaceUpdateInput,
  KnowledgeNote,
  KnowledgeNoteCreateInput,
  KnowledgeNoteUpdateInput,
  StoredFavorite,
  BrowserFramePayload,
  BrowserStatusPayload,
  BrowserNavigatePayload,
} from '@somehow_ai/agent-core';
import type {
  CloudBrowserConfig,
  MessagingConnectionStatus,
  ScheduledTask,
} from '@somehow_ai/agent-core/common';

// Define the API interface
interface SomehowAPI {
  // App info
  getVersion(): Promise<string>;
  getPlatform(): Promise<string>;

  // Shell
  openExternal(url: string): Promise<void>;

  // Task operations
  startTask(config: TaskConfig): Promise<Task>;
  cancelTask(taskId: string): Promise<void>;
  interruptTask(taskId: string): Promise<void>;
  getTask(taskId: string): Promise<Task | null>;
  listTasks(): Promise<Task[]>;
  deleteTask(taskId: string): Promise<void>;
  clearTaskHistory(): Promise<void>;

  // Permission responses
  respondToPermission(response: PermissionResponse): Promise<void>;

  // Session management
  resumeSession(
    sessionId: string,
    prompt: string,
    taskId?: string,
    attachments?: FileAttachmentInfo[],
  ): Promise<Task>;

  // Settings
  getApiKeys(): Promise<ApiKeyConfig[]>;
  addApiKey(
    provider:
      | 'anthropic'
      | 'openai'
      | 'openrouter'
      | 'google'
      | 'xai'
      | 'deepseek'
      | 'moonshot'
      | 'zai'
      | 'azure-foundry'
      | 'custom'
      | 'bedrock'
      | 'litellm'
      | 'lmstudio'
      | 'nebius'
      | 'together'
      | 'fireworks'
      | 'groq'
      | 'elevenlabs'
      | 'nim'
      | 'minimax'
      | 'vertex'
      | 'venice'
      | 'aws-agentcore'
      | 'browserbase'
      | 'steel',
    key: string,
    label?: string,
  ): Promise<ApiKeyConfig>;
  removeApiKey(id: string): Promise<void>;
  getNotificationsEnabled(): Promise<boolean>;
  setNotificationsEnabled(enabled: boolean): Promise<void>;
  getDebugMode(): Promise<boolean>;
  setDebugMode(enabled: boolean): Promise<void>;
  getTheme(): Promise<string>;
  setTheme(theme: string): Promise<void>;
  onThemeChange?(callback: (data: { theme: string; resolved: string }) => void): () => void;
  getAppSettings(): Promise<{ debugMode: boolean; onboardingComplete: boolean; theme: string }>;
  getCloudBrowserConfig(): Promise<CloudBrowserConfig | null>;
  setCloudBrowserConfig(config: CloudBrowserConfig | null): Promise<void>;

  getWhatsAppConfig(): Promise<{
    providerId: string;
    enabled: boolean;
    status: MessagingConnectionStatus;
    phoneNumber?: string;
    lastConnectedAt?: number;
    qrCode?: string;
    qrIssuedAt?: number;
  } | null>;
  connectWhatsApp(): Promise<void>;
  disconnectWhatsApp(): Promise<void>;
  setWhatsAppEnabled(enabled: boolean): Promise<void>;
  onWhatsAppQR(callback: (qr: string) => void): () => void;
  onWhatsAppStatus(callback: (status: MessagingConnectionStatus) => void): () => void;

  getOpenAiBaseUrl(): Promise<string>;
  setOpenAiBaseUrl(baseUrl: string): Promise<void>;
  getOpenAiOauthStatus(): Promise<{ connected: boolean; expires?: number }>;
  loginOpenAiWithChatGpt(): Promise<{ ok: boolean; openedUrl?: string }>;
  getSlackMcpOauthStatus(): Promise<{ connected: boolean; pendingAuthorization: boolean }>;
  loginSlackMcp(): Promise<{ ok: boolean }>;
  logoutSlackMcp(): Promise<void>;
  getCopilotOAuthStatus(): Promise<{ connected: boolean; username?: string; expiresAt?: number }>;
  loginGithubCopilot(): Promise<{
    ok: boolean;
    userCode?: string;
    verificationUri?: string;
    expiresIn?: number;
  }>;
  logoutGithubCopilot(): Promise<void>;

  // API Key management
  hasApiKey(): Promise<boolean>;
  setApiKey(key: string): Promise<void>;
  getApiKey(): Promise<string | null>;
  validateApiKey(key: string): Promise<{ valid: boolean; error?: string }>;
  validateApiKeyForProvider(
    provider: string,
    key: string,
    options?: Record<string, unknown>,
  ): Promise<{ valid: boolean; error?: string }>;
  clearApiKey(): Promise<void>;

  // Multi-provider API keys
  getAllApiKeys(): Promise<Record<string, { exists: boolean; prefix?: string }>>;
  hasAnyApiKey(): Promise<boolean>;

  // Onboarding
  getOnboardingComplete(): Promise<boolean>;
  setOnboardingComplete(complete: boolean): Promise<void>;

  // OpenCode CLI
  checkOpenCodeCli(): Promise<{
    installed: boolean;
    version: string | null;
    installCommand: string;
  }>;
  getOpenCodeVersion(): Promise<string | null>;

  // Model selection
  getSelectedModel(): Promise<{
    provider: string;
    model: string;
    baseUrl?: string;
    deploymentName?: string;
  } | null>;
  setSelectedModel(model: {
    provider: string;
    model: string;
    baseUrl?: string;
    deploymentName?: string;
  }): Promise<void>;

  // Ollama configuration
  testOllamaConnection(url: string): Promise<{
    success: boolean;
    models?: Array<{
      id: string;
      displayName: string;
      size: number;
      toolSupport?: ToolSupportStatus;
    }>;
    error?: string;
  }>;
  getOllamaConfig(): Promise<{
    baseUrl: string;
    enabled: boolean;
    lastValidated?: number;
    models?: Array<{
      id: string;
      displayName: string;
      size: number;
      toolSupport?: ToolSupportStatus;
    }>;
  } | null>;
  setOllamaConfig(
    config: {
      baseUrl: string;
      enabled: boolean;
      lastValidated?: number;
      models?: Array<{
        id: string;
        displayName: string;
        size: number;
        toolSupport?: ToolSupportStatus;
      }>;
    } | null,
  ): Promise<void>;

  // Azure Foundry configuration
  getAzureFoundryConfig(): Promise<{
    baseUrl: string;
    deploymentName: string;
    authType: 'api-key' | 'entra-id';
    enabled: boolean;
    lastValidated?: number;
  } | null>;
  setAzureFoundryConfig(
    config: {
      baseUrl: string;
      deploymentName: string;
      authType: 'api-key' | 'entra-id';
      enabled: boolean;
      lastValidated?: number;
    } | null,
  ): Promise<void>;
  testAzureFoundryConnection(config: {
    endpoint: string;
    deploymentName: string;
    authType: 'api-key' | 'entra-id';
    apiKey?: string;
  }): Promise<{ success: boolean; error?: string }>;
  saveAzureFoundryConfig(config: {
    endpoint: string;
    deploymentName: string;
    authType: 'api-key' | 'entra-id';
    apiKey?: string;
  }): Promise<void>;

  // Dynamic model fetching (generic, config-driven)
  fetchProviderModels(
    providerId: string,
    options?: { baseUrl?: string; zaiRegion?: string },
  ): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string }>;
    error?: string;
  }>;

  // OpenRouter configuration
  fetchOpenRouterModels(): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }>;

  // LiteLLM configuration
  testLiteLLMConnection(
    url: string,
    apiKey?: string,
  ): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }>;
  fetchLiteLLMModels(): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }>;
  getLiteLLMConfig(): Promise<{
    baseUrl: string;
    enabled: boolean;
    lastValidated?: number;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
  } | null>;
  setLiteLLMConfig(
    config: {
      baseUrl: string;
      enabled: boolean;
      lastValidated?: number;
      models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    } | null,
  ): Promise<void>;

  // LM Studio configuration
  testLMStudioConnection(url: string): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; toolSupport: ToolSupportStatus }>;
    error?: string;
  }>;
  fetchLMStudioModels(): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; toolSupport: ToolSupportStatus }>;
    error?: string;
  }>;
  getLMStudioConfig(): Promise<{
    baseUrl: string;
    enabled: boolean;
    lastValidated?: number;
    models?: Array<{ id: string; name: string; toolSupport: ToolSupportStatus }>;
  } | null>;
  setLMStudioConfig(
    config: {
      baseUrl: string;
      enabled: boolean;
      lastValidated?: number;
      models?: Array<{ id: string; name: string; toolSupport: ToolSupportStatus }>;
    } | null,
  ): Promise<void>;

  // HuggingFace configuration (ENG-687)
  getHuggingFaceLocalConfig(): Promise<{
    selectedModelId: string | null;
    serverPort: number | null;
    enabled: boolean;
  } | null>;
  setHuggingFaceLocalConfig(
    config: {
      selectedModelId: string | null;
      serverPort: number | null;
      enabled: boolean;
    } | null,
  ): Promise<void>;
  listHuggingFaceModels(): Promise<{
    cached: Array<{ id: string; displayName: string; sizeBytes?: number; downloaded: boolean }>;
    suggested: Array<{ id: string; displayName: string; sizeBytes?: number; downloaded: boolean }>;
  }>;
  downloadHuggingFaceModel(modelId: string): Promise<{ success: boolean; error?: string }>;
  startHuggingFaceServer(
    modelId: string,
  ): Promise<{ success: boolean; port?: number; error?: string }>;
  stopHuggingFaceServer(): Promise<{ success: boolean; error?: string }>;
  getHuggingFaceServerStatus(): Promise<{
    running: boolean;
    port: number | null;
    loadedModel: string | null;
    isLoading: boolean;
  }>;
  testHuggingFaceConnection(): Promise<{ success: boolean; error?: string }>;
  deleteHuggingFaceModel(modelId: string): Promise<{ success: boolean; error?: string }>;
  onHuggingFaceDownloadProgress(
    callback: (progress: {
      modelId: string;
      status: 'downloading' | 'complete' | 'error';
      progress: number;
      error?: string;
    }) => void,
  ): () => void;

  // NVIDIA NIM configuration
  testNimConnection(
    url: string,
    apiKey: string,
  ): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }>;
  fetchNimModels(): Promise<{
    success: boolean;
    models?: Array<{ id: string; name: string; provider: string; contextLength: number }>;
    error?: string;
  }>;

  // Custom OpenAI-compatible endpoint configuration
  testCustomConnection(
    baseUrl: string,
    apiKey?: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }>;

  // Bedrock configuration
  validateBedrockCredentials(credentials: string): Promise<{ valid: boolean; error?: string }>;
  saveBedrockCredentials(credentials: string): Promise<ApiKeyConfig>;
  getBedrockCredentials(): Promise<BedrockCredentials | null>;
  fetchBedrockModels(credentials: string): Promise<{
    success: boolean;
    models: Array<{ id: string; name: string; provider: string }>;
    error?: string;
  }>;

  // Vertex AI configuration
  validateVertexCredentials(credentials: string): Promise<{ valid: boolean; error?: string }>;
  saveVertexCredentials(credentials: string): Promise<ApiKeyConfig>;
  getVertexCredentials(): Promise<VertexCredentials | null>;
  fetchVertexModels(credentials: string): Promise<{
    success: boolean;
    models: Array<{ id: string; name: string; provider: string }>;
    error?: string;
  }>;
  detectVertexProject(): Promise<{ success: boolean; projectId: string | null }>;
  listVertexProjects(): Promise<{
    success: boolean;
    projects: Array<{ projectId: string; name: string }>;
    error?: string;
  }>;

  // E2E Testing
  isE2EMode(): Promise<boolean>;

  // Provider Settings API
  getProviderSettings(): Promise<ProviderSettings>;
  setActiveProvider(providerId: ProviderId | null): Promise<void>;
  getConnectedProvider(providerId: ProviderId): Promise<ConnectedProvider | null>;
  setConnectedProvider(providerId: ProviderId, provider: ConnectedProvider): Promise<void>;
  removeConnectedProvider(providerId: ProviderId): Promise<void>;
  updateProviderModel(providerId: ProviderId, modelId: string | null): Promise<void>;
  setProviderDebugMode(enabled: boolean): Promise<void>;
  getProviderDebugMode(): Promise<boolean>;

  // Todo operations
  getTodosForTask(taskId: string): Promise<TodoItem[]>;

  // Favorites
  addFavorite(taskId: string): Promise<void>;
  removeFavorite(taskId: string): Promise<void>;
  listFavorites(): Promise<StoredFavorite[]>;

  // File attachments
  pickFolder(): Promise<string | null>;
  pickFiles(): Promise<FileAttachmentInfo[]>;
  getFilePath(file: File): string;
  processDroppedFiles(paths: string[]): Promise<FileAttachmentInfo[]>;

  // Event subscriptions
  onTaskUpdate(callback: (event: TaskUpdateEvent) => void): () => void;
  onTaskUpdateBatch?(
    callback: (event: { taskId: string; messages: TaskMessage[] }) => void,
  ): () => void;
  onPermissionRequest(callback: (request: PermissionRequest) => void): () => void;
  onTaskProgress(callback: (progress: TaskProgress) => void): () => void;
  onDebugLog(callback: (log: unknown) => void): () => void;
  onDebugModeChange?(callback: (data: { enabled: boolean }) => void): () => void;
  onTaskStatusChange?(callback: (data: { taskId: string; status: TaskStatus }) => void): () => void;
  onTaskSummary?(callback: (data: { taskId: string; summary: string }) => void): () => void;
  onTodoUpdate?(callback: (data: { taskId: string; todos: TodoItem[] }) => void): () => void;
  onAuthError?(callback: (data: { providerId: string; message: string }) => void): () => void;

  // Browser Preview (ENG-695)
  onBrowserFrame?(callback: (event: BrowserFramePayload & { taskId: string }) => void): () => void;
  onBrowserNavigate?(
    callback: (event: BrowserNavigatePayload & { taskId: string; pageName: string }) => void,
  ): () => void;
  onBrowserStatus?(
    callback: (
      event: BrowserStatusPayload & { taskId: string; pageName: string; message?: string },
    ) => void,
  ): () => void;
  startBrowserPreview?(taskId: string, pageName?: string): Promise<{ success: boolean }>;
  stopBrowserPreview?(taskId: string): Promise<{ stopped: boolean }>;
  getBrowserPreviewStatus?(): Promise<{ active: boolean }>;

  // Speech-to-Text
  speechIsConfigured(): Promise<boolean>;
  speechGetConfig(): Promise<{ enabled: boolean; hasApiKey: boolean; apiKeyPrefix?: string }>;
  speechValidate(apiKey?: string): Promise<{ valid: boolean; error?: string }>;
  speechTranscribe(
    audioData: ArrayBuffer,
    mimeType?: string,
  ): Promise<
    | {
        success: true;
        result: { text: string; confidence?: number; duration: number; timestamp: number };
      }
    | {
        success: false;
        error: { code: string; message: string };
      }
  >;

  // Logging
  logEvent(payload: {
    level?: string;
    message: string;
    context?: Record<string, unknown>;
  }): Promise<unknown>;
  exportLogs(): Promise<{ success: boolean; path?: string; error?: string; reason?: string }>;

  // Debug bug reporting
  captureScreenshot(): Promise<{
    success: boolean;
    data?: string;
    width?: number;
    height?: number;
    error?: string;
  }>;
  captureAxtree(): Promise<{ success: boolean; data?: string; error?: string }>;
  generateBugReport(data: {
    taskId?: string;
    taskPrompt?: string;
    taskStatus?: string;
    taskCreatedAt?: string;
    taskCompletedAt?: string;
    messages?: unknown[];
    debugLogs?: unknown[];
    screenshot?: string;
    axtree?: string;
    appVersion?: string;
    platform?: string;
  }): Promise<{ success: boolean; path?: string; error?: string; reason?: string }>;

  // Workspace management
  listWorkspaces(): Promise<Workspace[]>;
  getActiveWorkspaceId(): Promise<string | null>;
  switchWorkspace(workspaceId: string): Promise<{ success: boolean; reason?: string }>;
  createWorkspace(input: WorkspaceCreateInput): Promise<Workspace>;
  updateWorkspace(id: string, input: WorkspaceUpdateInput): Promise<Workspace | null>;
  deleteWorkspace(id: string): Promise<boolean>;

  // Knowledge Notes
  listKnowledgeNotes(workspaceId: string): Promise<KnowledgeNote[]>;
  createKnowledgeNote(input: KnowledgeNoteCreateInput): Promise<KnowledgeNote>;
  updateKnowledgeNote(
    id: string,
    workspaceId: string,
    input: KnowledgeNoteUpdateInput,
  ): Promise<KnowledgeNote | null>;
  deleteKnowledgeNote(id: string, workspaceId: string): Promise<boolean>;

  // Workspace event subscriptions
  onWorkspaceChanged?(callback: (data: { workspaceId: string }) => void): () => void;
  onWorkspaceDeleted?(callback: (data: { workspaceId: string }) => void): () => void;

  // Skills management
  getSkills(): Promise<Skill[]>;
  getEnabledSkills(): Promise<Skill[]>;
  setSkillEnabled(id: string, enabled: boolean): Promise<void>;
  getSkillContent(id: string): Promise<string | null>;
  getUserSkillsPath(): Promise<string>;
  pickSkillFolder(): Promise<string | null>;
  addSkillFromFolder(folderPath: string): Promise<Skill | null>;
  addSkillFromGitHub(rawUrl: string): Promise<Skill>;
  deleteSkill(id: string): Promise<void>;
  resyncSkills(): Promise<Skill[]>;
  openSkillInEditor(filePath: string): Promise<void>;
  showSkillInFolder(filePath: string): Promise<void>;

  // Daemon
  getDaemonSocketPath(): Promise<string>;

  // Daemon control
  daemonPing(): Promise<{ status: string; uptime: number }>;
  daemonRestart(): Promise<{ success: boolean }>;
  daemonStop(): Promise<{ success: boolean }>;
  daemonStart(): Promise<{ success: boolean }>;

  // Close behavior
  getCloseBehavior(): Promise<string>;
  setCloseBehavior(behavior: string): Promise<void>;

  // App close dialog
  onCloseRequested?(callback: () => void): () => void;
  respondToClose?(decision: 'keep-daemon' | 'stop-daemon' | 'cancel'): void;

  // Daemon connection events
  onDaemonDisconnected(callback: () => void): () => void;
  onDaemonReconnected(callback: () => void): () => void;
  onDaemonReconnectFailed(callback: () => void): () => void;

  // Sandbox configuration
  getSandboxConfig(): Promise<{
    mode: 'disabled' | 'native' | 'docker';
    allowedPaths: string[];
    networkRestricted: boolean;
    allowedHosts: string[];
    dockerImage?: string;
    networkPolicy?: { allowOutbound: boolean; allowedHosts?: string[] };
  }>;
  setSandboxConfig(config: {
    mode: 'disabled' | 'native' | 'docker';
    allowedPaths: string[];
    networkRestricted: boolean;
    allowedHosts: string[];
    dockerImage?: string;
    networkPolicy?: { allowOutbound: boolean; allowedHosts?: string[] };
  }): Promise<void>;

  // Scheduler
  listSchedules(workspaceId?: string): Promise<ScheduledTask[]>;
  createSchedule(cron: string, prompt: string, workspaceId?: string): Promise<ScheduledTask>;
  deleteSchedule(scheduleId: string): Promise<void>;
  setScheduleEnabled(scheduleId: string, enabled: boolean): Promise<void>;
  isAutoStartEnabled(): Promise<boolean>;

  // MCP Connectors
  getConnectors(): Promise<McpConnector[]>;
  addConnector(name: string, url: string): Promise<McpConnector>;
  deleteConnector(id: string): Promise<void>;
  setConnectorEnabled(id: string, enabled: boolean): Promise<void>;
  startConnectorOAuth(connectorId: string): Promise<{ state: string; authUrl: string }>;
  completeConnectorOAuth(state: string, code: string): Promise<McpConnector>;
  disconnectConnector(connectorId: string): Promise<void>;
  onMcpAuthCallback?(callback: (url: string) => void): () => void;

  // Local stdio MCP servers
  getLocalMcpServers(): Promise<LocalMcpServer[]>;
  addLocalMcpServer(
    name: string,
    commandJson: string,
    environmentJson?: string,
    cwd?: string,
  ): Promise<LocalMcpServer>;
  deleteLocalMcpServer(id: string): Promise<void>;
  setLocalMcpServerEnabled(id: string, enabled: boolean): Promise<void>;

  // Built-in free tier (provider id: somehow-ai)
  somehowAiConnect(): Promise<{
    deviceFingerprint: string;
    spentCredits: number;
    remainingCredits: number;
    totalCredits: number;
    resetsAt: string;
  }>;
  somehowAiEnsureReady(): Promise<{ deviceFingerprint: string }>;
  somehowAiDisconnect(): Promise<void>;
  somehowAiGetUsage(): Promise<{
    spentCredits: number;
    remainingCredits: number;
    totalCredits: number;
    resetsAt: string;
  }>;
  somehowAiGetStatus(): Promise<{ connected: boolean }>;
  onSomehowAiUsageUpdate(
    callback: (usage: {
      spentCredits: number;
      remainingCredits: number;
      totalCredits: number;
      resetsAt: string;
    }) => void,
  ): () => void;

  policyGetState(): Promise<{
    lockConfigured: boolean;
    mode: 'inherit' | 'standard' | 'create_copy_only';
    effective: 'standard' | 'create_copy_only';
  }>;

  policySetMode(payload: {
    mode: 'inherit' | 'standard' | 'create_copy_only';
    currentPassword?: string;
  }): Promise<{ ok: true }>;

  policySetInitialPassword(password: string): Promise<{ ok: true }>;

  policyChangePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ ok: true }>;

  policyClearPassword(currentPassword?: string): Promise<{ ok: true }>;

  // Build capabilities
  getBuildCapabilities(): Promise<{
    hasFreeMode: boolean;
    hasAnalytics: boolean;
    fileOperationPolicy: 'standard' | 'create_copy_only';
    fileOperationPolicyMode: 'inherit' | 'standard' | 'create_copy_only';
  }>;
}

interface SomehowShell {
  version: string;
  platform: string;
  isElectron: true;
}

// Extend Window interface
declare global {
  interface Window {
    somehow?: SomehowAPI;
    somehowShell?: SomehowShell;
    // Legacy globals kept for backward compatibility during rebranding.
    accomplish?: SomehowAPI;
    accomplishShell?: SomehowShell;
  }
}

function getElectronBridge(): SomehowAPI | undefined {
  return window.somehow ?? window.accomplish;
}

function getElectronShell(): SomehowShell | undefined {
  return window.somehowShell ?? window.accomplishShell;
}

/**
 * Preferred `window.somehow` with legacy `window.somehow` fallback.
 * For module-level code that must not call {@link getSomehow} (which throws when absent).
 */
export function getOptionalWindowBridge(): SomehowAPI | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.somehow ?? window.accomplish;
}

/**
 * Returns the Electron shell API (`window.somehow`, or legacy `window.somehow`).
 * Throws if not running in Electron.
 */
export function getSomehow() {
  const bridge = getElectronBridge();
  if (!bridge) {
    throw new Error('SomeHow API not available - not running in Electron');
  }
  return {
    ...bridge,

    validateBedrockCredentials: async (
      credentials: BedrockCredentials,
    ): Promise<{ valid: boolean; error?: string }> => {
      return bridge.validateBedrockCredentials(JSON.stringify(credentials));
    },

    saveBedrockCredentials: async (credentials: BedrockCredentials): Promise<ApiKeyConfig> => {
      return bridge.saveBedrockCredentials(JSON.stringify(credentials));
    },

    getBedrockCredentials: async (): Promise<BedrockCredentials | null> => {
      return bridge.getBedrockCredentials();
    },

    fetchBedrockModels: (credentials: string) => bridge.fetchBedrockModels(credentials),

    validateVertexCredentials: async (
      credentials: VertexCredentials,
    ): Promise<{ valid: boolean; error?: string }> => {
      return bridge.validateVertexCredentials(JSON.stringify(credentials));
    },

    saveVertexCredentials: async (credentials: VertexCredentials): Promise<ApiKeyConfig> => {
      return bridge.saveVertexCredentials(JSON.stringify(credentials));
    },

    getVertexCredentials: async (): Promise<VertexCredentials | null> => {
      return bridge.getVertexCredentials();
    },

    fetchVertexModels: (credentials: string) => bridge.fetchVertexModels(credentials),

    detectVertexProject: () => bridge.detectVertexProject(),

    listVertexProjects: () => bridge.listVertexProjects(),

    listHuggingFaceModels: () => bridge.listHuggingFaceModels(),

    downloadHuggingFaceModel: (modelId: string) => bridge.downloadHuggingFaceModel(modelId),

    startHuggingFaceServer: (modelId: string) => bridge.startHuggingFaceServer(modelId),

    stopHuggingFaceServer: () => bridge.stopHuggingFaceServer(),

    onHuggingFaceDownloadProgress: (
      callback: (progress: {
        modelId: string;
        status: 'downloading' | 'complete' | 'error';
        progress: number;
        error?: string;
      }) => void,
    ) => bridge.onHuggingFaceDownloadProgress(callback),
  };
}

/**
 * Check if running in Electron shell
 */
export function isRunningInElectron(): boolean {
  return getElectronShell()?.isElectron === true;
}

/**
 * Get shell version if available
 */
export function getShellVersion(): string | null {
  return getElectronShell()?.version ?? null;
}

/**
 * Get shell platform if available
 */
export function getShellPlatform(): string | null {
  return getElectronShell()?.platform ?? null;
}

/**
 * React hook to use the SomeHow Electron bridge API
 */
export function useSomehow(): SomehowAPI {
  const api = getElectronBridge();
  if (!api) {
    throw new Error('SomeHow API not available - not running in Electron');
  }
  return api;
}

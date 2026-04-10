/**
 * Ambient module declaration for the optional private gateway client package.
 *
 * This allows TypeScript to resolve `import('@accomplish/llm-gateway-client')`
 * even when the package isn't installed (OSS builds). The real package
 * provides its own types when installed in Free builds.
 */
declare module '@accomplish/llm-gateway-client' {
  import type { SomehowRuntime } from '@somehow_ai/agent-core';
  export function createRuntime(): SomehowRuntime;
}

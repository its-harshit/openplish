import type { ToolSupportStatus } from '@somehow_ai/agent-core';

export interface OllamaModel {
  id: string;
  name: string;
  toolSupport?: ToolSupportStatus;
}

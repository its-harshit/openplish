import { partitionAssistantTextForDisplay, type TaskMessage } from '@somehow_ai/agent-core/common';

export function getAssistantMessageDisplayParts(message: TaskMessage): {
  thinking: string | null;
  body: string;
} {
  if (message.type !== 'assistant') {
    return { thinking: null, body: message.content };
  }
  if (message.thinking) {
    return { thinking: message.thinking, body: message.content };
  }
  const { thinking, visible } = partitionAssistantTextForDisplay(message.content);
  return { thinking, body: visible ?? '' };
}

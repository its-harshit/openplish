/**
 * User-defined local (stdio) MCP server — argv and optional env/cwd persisted for OpenCode.
 */
export interface LocalMcpServer {
  id: string;
  name: string;
  command: string[];
  environment?: Record<string, string>;
  cwd?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

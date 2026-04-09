/** Custom protocol for OAuth deep links (must match electron-builder `protocols` and OS registration). */
export const CUSTOM_URL_SCHEME = 'somehow';

export const MCP_OAUTH_REDIRECT_URI = `${CUSTOM_URL_SCHEME}://callback/mcp`;

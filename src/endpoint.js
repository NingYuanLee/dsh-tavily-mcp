/**
 * Build the Tavily remote MCP endpoint.
 *
 * The hosted server authenticates with the `tavilyApiKey` query parameter.
 * The returned URL contains the secret; callers must not log it.
 * @param {string} raw
 * @param {string} apiKey
 */
export function tavilyEndpoint(raw, apiKey) {
  if (typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new Error('Tavily MCP api key is empty')
  }
  const url = new URL(raw)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Tavily MCP url must use http or https')
  }
  if (url.username !== '' || url.password !== '') {
    throw new Error('Tavily MCP url must not contain user info')
  }
  url.searchParams.set('tavilyApiKey', apiKey.trim())
  url.hash = ''
  return url.href
}

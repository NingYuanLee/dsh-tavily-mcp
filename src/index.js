/**
 * @module dsh-tavily-mcp
 *
 * Host bundle for Tavily's remote MCP server
 * (https://docs.tavily.com/documentation/mcp).
 *
 * The API key never lives in cordis.patch.yml. Loader expressions are sync, so
 * this plugin resolves the credential itself and then mounts
 * `@deepseek-ai/dsh-mcp-client` as a child. A later credential write reconnects
 * without copying the secret into the profile.
 */
import { apply as connectMcp, Config as McpConfig } from '@deepseek-ai/dsh-mcp-client'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import z from '@deepseek-ai/schemastery'
import { tavilyEndpoint } from './endpoint.js'

export { tavilyEndpoint }

export const name = 'tavily-mcp'
export const inject = ['credentials', 'tools']

const SERVER_NAME = /^[A-Za-z0-9_-]{1,32}$/
const DEFAULT_URL = 'https://mcp.tavily.com/mcp'
const TOOL_CALL_TIMEOUT_MS = 180_000

export const Config = z.object({
  apiKeyEnv: z.string().role('credential-ref').default('TAVILY_API_KEY'),
  url: z.string().default(DEFAULT_URL),
  serverName: z.string().pattern(SERVER_NAME).default('tavily'),
})

const mcpPlugin = {
  name: 'tavily-mcp-connection',
  inject: ['tools'],
  Config: McpConfig,
  apply: connectMcp,
}

export async function apply(ctx, config) {
  let generation = 0
  let fiber
  let queue = Promise.resolve()

  const stop = () => {
    generation += 1
    fiber?.dispose()
    fiber = undefined
  }

  async function connect(token) {
    fiber?.dispose()
    fiber = undefined
    if (token !== generation) return

    const refName = config.apiKeyEnv
    let key
    try {
      key = (await ctx.credentials.resolve(credentialRef(refName)))?.value?.trim()
    } catch (error) {
      ctx.logger.error(error)
      return
    }
    if (token !== generation) return
    if (!key) {
      ctx.logger.warn(`Tavily MCP 未连接：凭据 ${refName} 还没有值。在插件设置里保存 API Key 后会自动连接。`)
      return
    }

    let endpoint
    try {
      endpoint = tavilyEndpoint(config.url, key)
    } catch (error) {
      ctx.logger.error(`Tavily MCP 地址无效：${config.url}`)
      ctx.logger.error(error)
      return
    }
    if (token !== generation) return

    const next = ctx.plugin(mcpPlugin, {
      transport: 'streamable-http',
      serverName: config.serverName,
      url: endpoint,
      headers: { Authorization: `Bearer ${key}` },
      toolCallTimeoutMs: TOOL_CALL_TIMEOUT_MS,
      failOnStartupError: false,
    })
    if (token !== generation) {
      next.dispose()
      return
    }
    fiber = next
    try {
      await next
    } catch (error) {
      if (token !== generation) return
      ctx.logger.error('Tavily MCP 连接失败。请检查 API Key 和 url，密钥本身不会写在这条日志里。')
      ctx.logger.error(error)
    }
  }

  function schedule() {
    const token = ++generation
    const run = queue.then(() => connect(token))
    queue = run.then(() => {}, () => {})
    return run
  }

  ctx.on('credentials/reference-updated', (ref) => {
    if (String(ref) !== config.apiKeyEnv) return
    void schedule()
  })
  ctx.effect(() => stop)

  await schedule()
}

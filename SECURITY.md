# Security policy

## Reporting a vulnerability

Please report security issues privately through GitHub Security Advisories on this repository
(`Security` → `Report a vulnerability`). Do not open a public issue that includes an API key
or a request URL that still contains one.

Include the DeepSeek Harness version, the profile, and reproduction steps. Redact
`tavilyApiKey` and `Authorization` values. Expected first response within 7 days.

## Scope

`dsh-tavily-mcp` connects the official `@deepseek-ai/dsh-mcp-client` to Tavily's hosted MCP
server so the agent can call that server's tools.

- The plugin reads one credential reference, `TAVILY_API_KEY` by default, through
  `ctx.credentials.resolve`. It does not read `$DSH_HOME/.credentials.yaml` itself.
- The resolved key is sent only to the configured endpoint (default `https://mcp.tavily.com/mcp`),
  as the `tavilyApiKey` query parameter and as `Authorization: Bearer`.
- The key is not written into `cordis.patch.yml` or into this plugin's own log lines.
  The MCP client and the HTTP stack can still include the request URL in their own errors.
  That URL contains the key. Treat those errors as secret.
- Tool arguments (search queries, page URLs, crawl instructions) are sent to Tavily.
  Tavily's retention and billing rules apply. This plugin does not add another outbound
  destination.
- The plugin spawns no process and opens no local listener.
- An empty credential leaves the plugin running and registers no Tavily tools.

## Supported versions

Security fixes target the latest `0.1.x` release on the `>=0.2.1-rc.2 <0.3.0-0` DeepSeek
Harness range.

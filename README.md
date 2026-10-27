# dsh-tavily-mcp

[![CI](https://github.com/NingYuanLee/dsh-tavily-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/NingYuanLee/dsh-tavily-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![dsh](https://img.shields.io/badge/dsh-%3E%3D0.2.1--rc.2%20%3C0.3.0--0-6f42c1)](package.json)

> Third-party community plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Not an official DeepSeek or Tavily product. MIT licensed.

English | [中文](README.zh.md)

Connects [Tavily's hosted MCP server](https://docs.tavily.com/documentation/mcp) and registers the tools that server publishes. At release time those tools are search, extract, crawl, map, and research. They show up as `mcp__tavily__*`.

## What it does

The agent can call Tavily without a local `npx` process. The plugin reads an API key from the DSH credential store and hands a Streamable HTTP connection to the built-in `@deepseek-ai/dsh-mcp-client`. The key is not stored in `cordis.patch.yml`.

If the credential is empty, the plugin stays loaded and registers no Tavily tools. Saving the credential reconnects.

## How it works

1. Resolve `apiKeyEnv` (default `TAVILY_API_KEY`) through `ctx.credentials`. The store wins over the process environment.
2. Call `https://mcp.tavily.com/mcp` with that key as the `tavilyApiKey` query parameter and as `Authorization: Bearer`.
3. Mount one `@deepseek-ai/dsh-mcp-client` child. Tool names, schemas, and results come from the server. This package does not reimplement them.
4. When `credentials/reference-updated` fires for the same credential name, dispose that child and connect again.

Each tool call times out after 3 minutes. A dropped connection uses the MCP client's own reconnect policy.

## Install

```bash
dsh plugin --profile web add dsh-tavily-mcp
```

GitHub checkout instead:

```bash
dsh plugin --profile web add github:NingYuanLee/dsh-tavily-mcp
```

The package declares `dsh.bundle.patch`, so `dsh plugin add` writes the bundle into the profile. Restart DeepSeek Harness if the tools do not appear in the current session.

Create a key at [Tavily](https://app.tavily.com), then set the `TAVILY_API_KEY` credential in this plugin's settings, or export the same name in the environment that launches DeepSeek Harness.

## Configuration

| Field | Default | Meaning |
|---|---|---|
| `apiKeyEnv` | `TAVILY_API_KEY` | Credential reference. The value is not kept in this config. |
| `url` | `https://mcp.tavily.com/mcp` | Remote MCP endpoint. `http` and `https` only, no user info. |
| `serverName` | `tavily` | Namespace for tool names: `mcp__<serverName>__<tool>`. Must match `[A-Za-z0-9_-]{1,32}` and be unique among MCP clients in the same scope. |

Example profile override. A later patch replaces the whole `config` object, so repeat every field you still want:

```yaml
- id: tavily-mcp
  config:
    apiKeyEnv: TAVILY_API_KEY
    url: https://mcp.tavily.com/mcp
    serverName: tavily
```

The Cordis row id is `tavily-mcp`. The package name is `dsh-tavily-mcp`.

## Security

- The key is sent only to the configured endpoint.
- It is placed in the URL. Connection errors from the HTTP stack or the MCP client can include that URL. Treat those errors as secret.
- This plugin's own log lines do not print the key.
- Search text, page URLs, and crawl instructions are sent to Tavily.
- The plugin does not spawn a process and does not read the credentials file directly.

See [SECURITY.md](SECURITY.md).

## Compatibility

| Item | Value |
|---|---|
| dsh | `>=0.2.1-rc.2 <0.3.0-0` |
| Node | `>=22.19.0` |
| Verified on | dsh `0.2.1-rc.3`, Windows x64, desktop profile |
| Requires | `credentials`, `tools`, and the shipped `@deepseek-ai/dsh-mcp-client` |

Display metadata is `locale/en.json`, `locale/zh.json`, and `icon.svg`. There is no Web UI and no build step.

## Uninstall

```bash
dsh plugin --profile <name> remove dsh-tavily-mcp
```

Removing the plugin disconnects the MCP server and unregisters its tools. It does not delete the `TAVILY_API_KEY` credential. Nothing else is stored on disk by this package.

## Troubleshooting

**No `mcp__tavily__*` tools.** The credential named by `apiKeyEnv` is empty, the server rejected the key, or another MCP client already reserved `serverName` `tavily`. Set the credential and restart the plugin. The plugin log says the credential is missing without printing its value.

**`serverName` is already in use.** Pick another `serverName` in config. That also changes the public tool names.

**A call times out.** Crawl and research can be slow. The limit is 3 minutes per call and is not a config field in 0.1.0.

## Development

```bash
node --test test/*.test.js
node --check src/index.js && node --check src/endpoint.js
npm run check:pack
```

```text
src/endpoint.js    pure URL builder (unit-tested, no network)
src/index.js       Cordis plugin: resolve the credential and mount dsh-mcp-client
locale/            display metadata (en, zh)
test/              node:test suites, including packaging invariants
```

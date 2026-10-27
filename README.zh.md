# dsh-tavily-mcp

[![CI](https://github.com/NingYuanLee/dsh-tavily-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/NingYuanLee/dsh-tavily-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![dsh](https://img.shields.io/badge/dsh-%3E%3D0.2.1--rc.2%20%3C0.3.0--0-6f42c1)](package.json)

> [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的第三方社区插件，不是 DeepSeek 或 Tavily 的官方产品。MIT。

[English](README.md) | 中文

接入 [Tavily 托管的 MCP 服务器](https://docs.tavily.com/documentation/mcp)，并注册该服务器公布的工具。发布时这些工具是搜索、抽取、爬取、站点地图和研究。模型看到的名字是 `mcp__tavily__*`。

## What it does

助手可以直接调用 Tavily，不需要本机再跑一个 `npx` 进程。插件从 DSH 凭据库读取 API Key，再交给自带的 `@deepseek-ai/dsh-mcp-client` 建立 Streamable HTTP 连接。Key 不会写入 `cordis.patch.yml`。

凭据为空时插件保持加载，但不注册 Tavily 工具。保存凭据后会重新连接。

## How it works

1. 用 `ctx.credentials` 解析 `apiKeyEnv`（默认 `TAVILY_API_KEY`）。凭据库优先于进程环境变量。
2. 请求 `https://mcp.tavily.com/mcp`。Key 放在查询参数 `tavilyApiKey`，同时放在 `Authorization: Bearer`。
3. 挂一个 `@deepseek-ai/dsh-mcp-client` 子插件。工具名、参数和结果都来自服务器，本包不重写这些工具。
4. 同名凭据发出 `credentials/reference-updated` 时，拆掉该子插件再连一次。

单次工具调用超时 3 分钟。连接断开后沿用 MCP 客户端自己的重连策略。

## Install

```bash
dsh plugin --profile web add dsh-tavily-mcp
```

也可以从 GitHub 安装：

```bash
dsh plugin --profile web add github:NingYuanLee/dsh-tavily-mcp
```

包里声明了 `dsh.bundle.patch`，`dsh plugin add` 会把 bundle 写进 profile。如果当前会话里还看不到工具，重启 DeepSeek Harness。

到 [Tavily](https://app.tavily.com) 创建 Key，然后在本插件设置里写入凭据 `TAVILY_API_KEY`，或者在启动 DeepSeek Harness 的环境里导出同名变量。

## Configuration

| 字段 | 默认 | 含义 |
|---|---|---|
| `apiKeyEnv` | `TAVILY_API_KEY` | 凭据引用名。值本身不留在这份配置里。 |
| `url` | `https://mcp.tavily.com/mcp` | 远程 MCP 地址。只允许 `http` / `https`，不能带用户信息。 |
| `serverName` | `tavily` | 工具名前缀：`mcp__<serverName>__<tool>`。必须匹配 `[A-Za-z0-9_-]{1,32}`，且在同一作用域里不能和别的 MCP 客户端重名。 |

profile 覆盖示例。后写的补丁会整段替换 `config`，所以要保留的字段都要重写：

```yaml
- id: tavily-mcp
  config:
    apiKeyEnv: TAVILY_API_KEY
    url: https://mcp.tavily.com/mcp
    serverName: tavily
```

Cordis 行 id 是 `tavily-mcp`。包名是 `dsh-tavily-mcp`。

## Security

- Key 只发给配置的那个地址。
- Key 在 URL 里。HTTP 栈或 MCP 客户端的连接错误可能带上这个 URL，把这类错误当作机密。
- 本插件自己的日志不打印 Key。
- 搜索词、页面 URL 和爬取说明会发给 Tavily。
- 插件不启动子进程，也不直接读凭据文件。

详见 [SECURITY.md](SECURITY.md)。

## Compatibility

| 项 | 值 |
|---|---|
| dsh | `>=0.2.1-rc.2 <0.3.0-0` |
| Node | `>=22.19.0` |
| 已验证 | dsh `0.2.1-rc.3`，Windows x64，desktop profile |
| 依赖 | `credentials`、`tools`，以及随宿主提供的 `@deepseek-ai/dsh-mcp-client` |

展示信息在 `locale/en.json`、`locale/zh.json` 和 `icon.svg`。没有 Web UI，也不需要构建。

## Uninstall

```bash
dsh plugin --profile <name> remove dsh-tavily-mcp
```

卸载会断开 MCP 并卸掉它的工具，不会删除 `TAVILY_API_KEY` 凭据。本包不在磁盘上另存数据。

## Troubleshooting

**没有 `mcp__tavily__*` 工具。** `apiKeyEnv` 指向的凭据是空的、服务器拒绝了 Key，或别的 MCP 客户端已经占用了 `serverName` `tavily`。写上凭据并重启插件。缺凭据时日志会说明，但不会打印值。

**`serverName` 已被占用。** 在配置里换一个 `serverName`。公开的工具名会一起变。

**调用超时。** 爬取和研究可能比较慢。0.1.0 的上限是每次 3 分钟，不能在配置里改。

## Development

```bash
node --test test/*.test.js
node --check src/index.js && node --check src/endpoint.js
npm run check:pack
```

```text
src/endpoint.js    纯 URL 组装（单测，不联网）
src/index.js       Cordis 插件：解析凭据并挂上 dsh-mcp-client
locale/            展示文案（en、zh）
test/              node:test，含打包不变量
```

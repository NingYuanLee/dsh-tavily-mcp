# Changelog

## Unreleased

## 0.1.2

- Widen `engines.dsh` to `>=0.2.1-rc.2 <0.3.0-0 || >=0.2.2-0 <0.3.0-0` so the declared host range admits the DSH 0.2.2 pre-release line this plugin is verified on. The previous single-clause range excluded 0.2.2 pre-releases even though the peer ranges already accepted them.
- Unify the README badge row (npm, MIT license, Node, DSH range, `dsh-plugin` topic, powered by dsh) and sync the compatibility table with the declared range.

## 0.1.1

- Support DeepSeek Harness 0.2.x pre-releases: widen the `@deepseek-ai/cordis` peer range to `>=4.0.4 <5.0.0` and `@deepseek-ai/schemastery` to `>=3.18.4 <4.0.0`, and accept the `0.2.1` and `0.2.2-0`-and-later DSH peer ranges side by side. No runtime code changes: the MCP bridge and credentials APIs this plugin uses are unchanged in 0.2.2. Loading and the full test suite were re-verified against DSH 0.2.2-rc.1.

## 0.1.0

First release.

- Connects Tavily's hosted MCP server at `https://mcp.tavily.com/mcp` and registers whatever tools that server publishes (search, extract, crawl, map, and research at release time).
- Reads the API key from the `TAVILY_API_KEY` credential (name configurable). The key is not written into plugin config.
- Reconnects when that credential changes.
- Tool calls time out after 3 minutes.

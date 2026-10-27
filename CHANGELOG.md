# Changelog

## Unreleased

## 0.1.0

First release.

- Connects Tavily's hosted MCP server at `https://mcp.tavily.com/mcp` and registers whatever tools that server publishes (search, extract, crawl, map, and research at release time).
- Reads the API key from the `TAVILY_API_KEY` credential (name configurable). The key is not written into plugin config.
- Reconnects when that credential changes.
- Tool calls time out after 3 minutes.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tavilyEndpoint } from '../src/endpoint.js'

const BASE = 'https://mcp.tavily.com/mcp'

test('puts the key in tavilyApiKey and nowhere else', () => {
  const href = tavilyEndpoint(BASE, 'test-key')
  const url = new URL(href)
  assert.equal(url.origin + url.pathname, BASE)
  assert.equal(url.searchParams.get('tavilyApiKey'), 'test-key')
  assert.equal(url.username, '')
  assert.equal(url.password, '')
  assert.equal(url.hash, '')
  assert.equal([...url.searchParams.keys()].length, 1)
})

test('replaces an existing tavilyApiKey and keeps other parameters', () => {
  const href = tavilyEndpoint(`${BASE}?topic=news&tavilyApiKey=old`, 'next-key')
  const url = new URL(href)
  assert.equal(url.searchParams.get('tavilyApiKey'), 'next-key')
  assert.equal(url.searchParams.get('topic'), 'news')
})

test('trims the key and drops a fragment', () => {
  const href = tavilyEndpoint(`${BASE}#section`, '  test-key  ')
  const url = new URL(href)
  assert.equal(url.searchParams.get('tavilyApiKey'), 'test-key')
  assert.equal(url.hash, '')
})

test('rejects empty keys, userinfo, and non-http urls', () => {
  assert.throws(() => tavilyEndpoint(BASE, '   '), /empty/)
  assert.throws(() => tavilyEndpoint('https://user:pw@mcp.tavily.com/mcp', 'test-key'), /user info/)
  assert.throws(() => tavilyEndpoint('ftp://mcp.tavily.com/mcp', 'test-key'), /http or https/)
  assert.throws(() => tavilyEndpoint('/mcp', 'test-key'), TypeError)
})

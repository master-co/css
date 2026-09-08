// BH-0024: use the installed Express version and current example route strings.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const require = createRequire(new URL('../../../../examples/angular/package.json', import.meta.url))
const express = require('express')
const source = readFileSync(new URL('../../../../examples/angular/server.ts', import.meta.url), 'utf8')
assert.doesNotThrow(() => express().get('/{*path}', () => {}))
const routes = [...source.matchAll(/server\.get\('([^']+)'/g)].map((match) => match[1]).filter((route) => !route.startsWith('/api'))
const errors = routes.map((route) => { try { express().get(route, () => {}); return null } catch (error) { return { route, message: error.message } } })
console.log(JSON.stringify({ version: require('express/package.json').version, control: 'PASS', errors }, null, 2))
assert.deepEqual(errors.filter(Boolean), [], 'All declared production routes must register')

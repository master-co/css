import { it, expect } from 'vitest'
import fs, { readFileSync } from 'fs'
import path from 'path'
import AvoidFOUCPlugin from '../../src/plugins/avoid-fouc'
import { runTransformIndexHtml } from '../plugin-test-helper'

const FIXTURE_DIR = path.resolve(__dirname, '../fixtures/avoid-fouc')

const plugin = AvoidFOUCPlugin()

const cases = fs.readdirSync(FIXTURE_DIR)
  .map(file => [file.replace(/\.html$/, ''), file] as const)

it.each(cases)(
  'AvoidFOUCPlugin fixture: %s',
  async (_, filename) => {
    const input = readFileSync(path.join(FIXTURE_DIR, filename), 'utf-8')
    const result = await runTransformIndexHtml(plugin, input)
    expect(result).toMatchSnapshot()
  }
)
it.each([
  ['<html class="dark hidden md:block"><body></body></html>', '<html class="dark hidden md:block" hidden><body></body></html>'],
  ["<html data-state='hidden'><body></body></html>", "<html data-state='hidden' hidden><body></body></html>"],
  ['<html lang="en" HIDDEN><body></body></html>', '<html lang="en" HIDDEN><body></body></html>'],
  ['<html hidden="until-found"><body></body></html>', '<html hidden="until-found"><body></body></html>']
])('AvoidFOUCPlugin reads the hidden attribute, not a word in another value: %s', async (input, output) => {
  expect(await runTransformIndexHtml(plugin, input)).toBe(output)
})

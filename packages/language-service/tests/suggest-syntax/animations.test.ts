import { test, it, expect, describe } from 'vitest'
import { hint } from './helper'
import type { Settings } from '../helpers/rc87-language-service'
import { createPresetManifest } from '../helpers/create-preset-manifest'

const settings = {
  manifest: createPresetManifest({
    variables: [{ namespace: 'breakpoint', key: 'sm', values: [{ path: [':root,:host'], value: String(768) }] , type: 'number'}],
    customMedia: { '--sm': { type: 'feature', value: '(width>=48rem)' } }
  })
} satisfies Settings

test.concurrent('@', () => expect(hint('@', settings)?.map(({ label }) => label)).not.toContain('fade|1s'))
test.concurrent('animate-', () => expect(hint('animate-', settings)?.map(({ label }) => label)).toContain('animate-fade'))
test.concurrent('animation:fade|', () => expect(hint('animation:fade|', settings)?.map(({ label }) => label)).toContain('alternate'))
test.concurrent('animation:', () => expect(hint('animation:', settings)?.map(({ label }) => label)).not.toContain('fade'))
test.concurrent('animation-name:', () => expect(hint('animation-name:', settings)?.map(({ label }) => label)).toContain('fade'))
test.concurrent('selector', () => expect(hint('animation:fade|1s:', settings)?.map(({ label }) => label)).toContain(':hover'))
test.concurrent('at', () => expect(hint('animation:fade|1s@', settings)?.map(({ label }) => label)).toContain('@sm'))


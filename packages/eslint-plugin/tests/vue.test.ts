import rule from '../src/rules/sort-classes'
import { jsxTester } from './testers'

jsxTester.run('vue sort classes', rule, {
  valid: [
    { code: `<div class="m:2x p:2x font:1.5rem bg:black fg:white">Simple, basic</div>` },
    {
      code: `<template><div :class="[condition && 'm:2x p:2x', , null, false]">Sparse array</div></template>`,
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    }
  ],
  invalid: [
    {
      code: `<template><div class="m:2x bg:black p:2x fg:white font:1.5rem">Enhancing readability</div></template>`,
      output: `<template><div class="m:2x p:2x font:1.5rem bg:black fg:white">Enhancing readability</div></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `<template><div class="m:2x bg:black p:2x fg:white font:1.5rem">Classnames will be ordered</div></template>`,
      output: `<template><div class="m:2x p:2x font:1.5rem bg:black fg:white">Classnames will be ordered</div></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `<template><div :class="['m:2x bg:black p:2x fg:white font:1.5rem']">Enhancing readability 2</div></template>`,
      output: `<template><div :class="['m:2x p:2x font:1.5rem bg:black fg:white']">Enhancing readability 2</div></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `<template><div v-bind:class="{'m:2x bg:black p:2x fg:white font:1.5rem': true}">:)...</div></template>`,
      output: `<template><div v-bind:class="{'m:2x p:2x font:1.5rem bg:black fg:white': true}">:)...</div></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `<template><div :class="ctl(\`m:2x bg:black p:2x fg:white font:1.5rem\`)" /></template>`,
      output: `<template><div :class="ctl(\`m:2x p:2x font:1.5rem bg:black fg:white\`)" /></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `
          <template>
            <div v-bind="data" :class="[
            'transition py:1px font:medium',
            {
              'fg:white': variant === 'white',
              'fg:blue-50 fg:blue-40:hover b:blue-50': variant === 'primary',
              'text-decoration:underline|dotted text-underline-offset:10': active
            }
            ]" />
          </template>`,
      output: `
          <template>
            <div v-bind="data" :class="[
            'py:1px font:medium transition',
            {
              'fg:white': variant === 'white',
              'b:blue-50 fg:blue-50 fg:blue-40:hover': variant === 'primary',
              'text-decoration:underline|dotted text-underline-offset:10': active
            }
            ]" />
          </template>`,
      errors: [
        { messageId: 'invalidClassOrder' },
        { messageId: 'invalidClassOrder' }
      ],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `
          <template>
            <div :class="[
              true
                ? 'fg:#aaaaaa {content:\\'\\';block;h:full;w:full;abs}::after bg:#ffffff'
                : 'fg:#ffffff'
            ]"/>
          </template>`,
      output: `
          <template>
            <div :class="[
              true
                ? 'bg:#ffffff fg:#aaaaaa {content:\\'\\';block;h:full;w:full;abs}::after'
                : 'fg:#ffffff'
            ]"/>
          </template>`,
      errors: [
        { messageId: 'invalidClassOrder' }
      ],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `<template>
            <input   type="password"
              placeholder="..."
              class="bg:black p:2x fg:white font:1.5rem m:2x"
              @blur.prevent="" />
            </template>`,
      output: `<template>
            <input   type="password"
              placeholder="..."
              class="m:2x p:2x font:1.5rem bg:black fg:white"
              @blur.prevent="" />
            </template>`,
      errors: [
        { messageId: 'invalidClassOrder' }
      ],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    }
  ],
})

import rule from '../src/rules/sort-classes'
import { jsxTester } from './testers'

jsxTester.run('vue sort classes', rule, {
  valid: [
    { code: `<div class="m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white">Simple, basic</div>` },
    {
      code: `<template><div :class="[condition && 'm:0.5rem p:0.5rem', , null, false]">Sparse array</div></template>`,
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    }
  ],
  invalid: [
    {
      code: `<template><div class="m:0.5rem bg-black p:0.5rem fg-white font-size:1.5rem">Enhancing readability</div></template>`,
      output: `<template><div class="m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white">Enhancing readability</div></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `<template><div class="m:0.5rem bg-black p:0.5rem fg-white font-size:1.5rem">Classnames will be ordered</div></template>`,
      output: `<template><div class="m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white">Classnames will be ordered</div></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `<template><div :class="['m:0.5rem bg-black p:0.5rem fg-white font-size:1.5rem']">Enhancing readability 2</div></template>`,
      output: `<template><div :class="['m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white']">Enhancing readability 2</div></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `<template><div :class="'m:0.5rem bg-black p:0.5rem fg-white font-size:1.5rem'">Static bound class</div></template>`,
      output: `<template><div :class="'m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white'">Static bound class</div></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `<template><div v-bind:class="{'m:0.5rem bg-black p:0.5rem fg-white font-size:1.5rem': true}">:)...</div></template>`,
      output: `<template><div v-bind:class="{'m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white': true}">:)...</div></template>`,
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: `<template><div :class="ctl(\`m:0.5rem bg-black p:0.5rem fg-white font-size:1.5rem\`)" /></template>`,
      output: `<template><div :class="ctl(\`m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white\`)" /></template>`,
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
            'transition py:1px font-medium',
            {
              'fg-white': variant === 'white',
              'fg-blue-50 fg-blue-40:hover b-blue-50': variant === 'primary',
              'text-decoration:underline|dotted text-underline-offset:10': active
            }
            ]" />
          </template>`,
      output: `
          <template>
            <div v-bind="data" :class="[
            'py:1px font-medium transition',
            {
              'fg-white': variant === 'white',
              'b-blue-50 fg-blue-50 fg-blue-40:hover': variant === 'primary',
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
                ? 'fg:#aaaaaa {content:\\'\\';block;h:100%;w:100%;abs}::after background-color:#ffffff'
                : 'fg:#ffffff'
            ]"/>
          </template>`,
      output: `
          <template>
            <div :class="[
              true
                ? 'background-color:#ffffff fg:#aaaaaa {content:\\'\\';block;h:100%;w:100%;abs}::after'
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
              class="bg-black p:0.5rem fg-white font-size:1.5rem m:0.5rem"
              @blur.prevent="" />
            </template>`,
      output: `<template>
            <input   type="password"
              placeholder="..."
              class="m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white"
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

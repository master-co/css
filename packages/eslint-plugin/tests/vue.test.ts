import rule from '../src/rules/class-order'
import { jsxTester } from './testers'

jsxTester.run('vue class order', rule, {
    valid: [
        { code: `<div class="bg:black fg:white font:24 m:8 p:8">Simple, basic</div>` },
        {
            code: `<template><div :class="[condition && 'm:8 p:8', , null, false]">Sparse array</div></template>`,
            filename: 'test.vue',
            languageOptions: {
                parser: await import('vue-eslint-parser')
            }
        }
    ],
    invalid: [
        {
            code: `<template><div class="m:8 bg:black p:8 fg:white font:24">Enhancing readability</div></template>`,
            output: `<template><div class="bg:black fg:white font:24 m:8 p:8">Enhancing readability</div></template>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.vue',
            languageOptions: {
                parser: await import('vue-eslint-parser')
            }
        },
        {
            code: `<template><div class="m:8 bg:black p:8 fg:white font:24">Classnames will be ordered</div></template>`,
            output: `<template><div class="bg:black fg:white font:24 m:8 p:8">Classnames will be ordered</div></template>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.vue',
            languageOptions: {
                parser: await import('vue-eslint-parser')
            }
        },
        {
            code: `<template><div :class="['m:8 bg:black p:8 fg:white font:24']">Enhancing readability 2</div></template>`,
            output: `<template><div :class="['bg:black fg:white font:24 m:8 p:8']">Enhancing readability 2</div></template>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.vue',
            languageOptions: {
                parser: await import('vue-eslint-parser')
            }
        },
        {
            code: `<template><div v-bind:class="{'m:8 bg:black p:8 fg:white font:24': true}">:)...</div></template>`,
            output: `<template><div v-bind:class="{'bg:black fg:white font:24 m:8 p:8': true}">:)...</div></template>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.vue',
            languageOptions: {
                parser: await import('vue-eslint-parser')
            }
        },
        {
            code: `<template><div :class="ctl(\`m:8 bg:black p:8 fg:white font:24\`)" /></template>`,
            output: `<template><div :class="ctl(\`bg:black fg:white font:24 m:8 p:8\`)" /></template>`,
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
                        'transition py:1.5 font:medium',
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
                        'font:medium py:1.5 transition',
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
                            class="bg:black p:8 fg:white font:24 m:8"
                            @blur.prevent="" />
                        </template>`,
            output: `<template>
                        <input   type="password"
                            placeholder="..."
                            class="bg:black fg:white font:24 m:8 p:8"
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

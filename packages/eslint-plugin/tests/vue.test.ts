import rule from '../src/rules/sort-classes'
import { jsxTester } from './testers'

jsxTester.run('vue sort classes', rule, {
  valid: [
    { code: "<div class=\"margin:0.5rem padding:0.5rem font-size:1.5rem bg-black fg-white\">Simple, basic</div>" },
    {
      code: "<template><div :class=\"[condition && 'margin:0.5rem padding:0.5rem', , null, false]\">Sparse array</div></template>",
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    }
  ],
  invalid: [
    {
      code: "<template><div class=\"margin:0.5rem bg-black padding:0.5rem fg-white font-size:1.5rem\">Enhancing readability</div></template>",
      output: "<template><div class=\"margin:0.5rem padding:0.5rem font-size:1.5rem bg-black fg-white\">Enhancing readability</div></template>",
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: "<template><div class=\"margin:0.5rem bg-black padding:0.5rem fg-white font-size:1.5rem\">Classnames will be ordered</div></template>",
      output: "<template><div class=\"margin:0.5rem padding:0.5rem font-size:1.5rem bg-black fg-white\">Classnames will be ordered</div></template>",
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: "<template><div :class=\"['margin:0.5rem bg-black padding:0.5rem fg-white font-size:1.5rem']\">Enhancing readability 2</div></template>",
      output: "<template><div :class=\"['margin:0.5rem padding:0.5rem font-size:1.5rem bg-black fg-white']\">Enhancing readability 2</div></template>",
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: "<template><div :class=\"'margin:0.5rem bg-black padding:0.5rem fg-white font-size:1.5rem'\">Static bound class</div></template>",
      output: "<template><div :class=\"'margin:0.5rem padding:0.5rem font-size:1.5rem bg-black fg-white'\">Static bound class</div></template>",
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: "<template><div v-bind:class=\"{'margin:0.5rem bg-black padding:0.5rem fg-white font-size:1.5rem': true}\">:)...</div></template>",
      output: "<template><div v-bind:class=\"{'margin:0.5rem padding:0.5rem font-size:1.5rem bg-black fg-white': true}\">:)...</div></template>",
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: "<template><div :class=\"ctl(`margin:0.5rem bg-black padding:0.5rem fg-white font-size:1.5rem`)\" /></template>",
      output: "<template><div :class=\"ctl(`margin:0.5rem padding:0.5rem font-size:1.5rem bg-black fg-white`)\" /></template>",
      errors: [{ messageId: 'invalidClassOrder' }],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: "\n          <template>\n            <div v-bind=\"data\" :class=\"[\n            'transition padding-block:1px font-weight-medium',\n            {\n              'fg-white': variant === 'white',\n              'fg-blue-50 fg-blue-40:hover b-blue-50': variant === 'primary',\n              'text-decoration:underline|dotted text-underline-offset:10': active\n            }\n            ]\" />\n          </template>",
      output: "\n          <template>\n            <div v-bind=\"data\" :class=\"[\n            'padding-block:1px font-weight-medium transition',\n            {\n              'fg-white': variant === 'white',\n              'b-blue-50 fg-blue-50 fg-blue-40:hover': variant === 'primary',\n              'text-decoration:underline|dotted text-underline-offset:10': active\n            }\n            ]\" />\n          </template>",
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
      code: "\n          <template>\n            <div :class=\"[\n              true\n                ? 'color:#aaaaaa {content:\\'\\';block;height:100%;width:100%;abs}::after background-color:#ffffff'\n                : 'color:#ffffff'\n            ]\"/>\n          </template>",
      output: "\n          <template>\n            <div :class=\"[\n              true\n                ? 'background-color:#ffffff color:#aaaaaa {content:\\'\\';block;height:100%;width:100%;abs}::after'\n                : 'color:#ffffff'\n            ]\"/>\n          </template>",
      errors: [
        { messageId: 'invalidClassOrder' }
      ],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    },
    {
      code: "<template>\n            <input   type=\"password\"\n              placeholder=\"...\"\n              class=\"bg-black padding:0.5rem fg-white font-size:1.5rem margin:0.5rem\"\n              @blur.prevent=\"\" />\n            </template>",
      output: "<template>\n            <input   type=\"password\"\n              placeholder=\"...\"\n              class=\"margin:0.5rem padding:0.5rem font-size:1.5rem bg-black fg-white\"\n              @blur.prevent=\"\" />\n            </template>",
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

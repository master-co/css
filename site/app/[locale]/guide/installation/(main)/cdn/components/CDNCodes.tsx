import CodeTabs from 'internal/components/CodeTabs'

export default () => <CodeTabs>{[
    {
        name: 'global',
        lang: 'html',
        code: `
        <!DOCTYPE html>
        <html lang="en" hidden>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="modulepreload" href="https://cdn.master.co/css-runtime@rc">
            <link rel="preload" as="style" href="https://cdn.master.co/css@rc/base.css">
            <link rel="stylesheet" href="https://cdn.master.co/css@rc/base.css">
            <script type="module" src="https://cdn.master.co/css-runtime@rc"></script>
        </head>
        <body>
            <h1 class="italic m:2xl fg:strong font:5xl font:heavy">Hello World</h1>
        </body>
        </html>
    `
    },
    {
        name: 'esm',
        lang: 'html',
        code: `
        <!DOCTYPE html>
        <html lang="en" hidden>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="preload" as="style" href="https://cdn.master.co/css@rc/base.css">
            <link rel="modulepreload" href="https://cdn.master.co/css-runtime@rc/+esm">
            <link rel="stylesheet" href="https://cdn.master.co/css@rc/base.css">
            <script type="module">
                import defaultPlan from 'https://cdn.master.co/css-preset@rc/default-plan.json' with { type: 'json' }
                import { initCSSRuntime } from 'https://cdn.master.co/css-runtime@rc/+esm'
                initCSSRuntime({ plan: defaultPlan })
            </script>
        </head>
        <body>
            <h1 class="italic m:2xl fg:strong font:5xl font:heavy">Hello World</h1>
        </body>
        </html>
    `},
    {
        name: 'esm.sh',
        lang: 'html',
        code: `
        <!DOCTYPE html>
        <html lang="en" hidden>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="preload" as="style" href="https://esm.sh/@master/css@rc/base.css?css">
            <link rel="modulepreload" href="https://esm.sh/@master/css-runtime@rc">
            <link rel="stylesheet" href="https://esm.sh/@master/css@rc/base.css?css">
            <script type="module">
                import defaultPlan from 'https://esm.sh/@master/css-preset@rc/default-plan.json' with { type: 'json' }
                import { initCSSRuntime } from 'https://esm.sh/@master/css-runtime@rc'
                initCSSRuntime({ plan: defaultPlan })
            </script>
        </head>
        <body>
            <h1 class="italic m:2xl fg:strong font:5xl font:heavy">Hello World</h1>
        </body>
        </html>
        `
    }
]}</CodeTabs>

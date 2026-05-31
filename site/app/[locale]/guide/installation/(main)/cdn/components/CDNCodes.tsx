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
            <link rel="preload" as="script" href="https://cdn.master.co/css-runtime@rc">
            <link rel="preload" as="style" href="https://cdn.master.co/css@rc/normal.css">
            <link rel="stylesheet" href="https://cdn.master.co/css@rc/normal.css">
            <script src="https://cdn.master.co/css-runtime@rc"></script>
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
            <link rel="preload" as="style" href="https://cdn.master.co/css@rc/normal.css">
            <link rel="modulepreload" href="https://cdn.master.co/css-runtime@rc/+esm">
            <link rel="stylesheet" href="https://cdn.master.co/css@rc/normal.css">
            <script type="module">
                import { initCSSRuntime } from 'https://cdn.master.co/css-runtime@rc/+esm'
                initCSSRuntime()
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
            <link rel="preload" as="style" href="https://esm.sh/@master/css@rc/normal.css?css">
            <link rel="modulepreload" href="https://esm.sh/@master/css-runtime@rc">
            <link rel="stylesheet" href="https://esm.sh/@master/css@rc/normal.css?css">
            <script type="module">
                import { initCSSRuntime } from 'https://esm.sh/@master/css-runtime@rc'
                initCSSRuntime({
                    variables: [
                        { key: 'primary', value: '#000000' }
                    ]
                })
            </script>
        </head>
        <body>
            <h1 class="italic m:2xl fg:strong font:5xl font:heavy">Hello World</h1>
        </body>
        </html>
        `
    }
]}</CodeTabs>

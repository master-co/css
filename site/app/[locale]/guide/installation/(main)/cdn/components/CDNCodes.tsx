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
            <link rel="preload" as="style" href="https://cdn.master.co/normal.css">
            <link rel="stylesheet" href="https://cdn.master.co/normal.css">
            <script>
                window.masterCSSConfig = {
                    variables: {
                        primary: '#000000'
                    }
                }
            </script>
            <script src="https://cdn.master.co/css-runtime@rc"></script>
        </head>
        <body>
            <h1 class="fg:primary italic m:12x fg:strong font:40 font:heavy">Hello World</h1>
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
            <link rel="preload" as="style" href="https://cdn.master.co/normal.css">
            <link rel="modulepreload" href="https://cdn.master.co/css-runtime@rc/+esm">
            <link rel="stylesheet" href="https://cdn.master.co/normal.css">
            <script type="module">
                import { initCSSRuntime } from 'https://cdn.master.co/css-runtime@rc/+esm'
                initCSSRuntime({
                    variables: {
                        primary: '#000000'
                    }
                })
            </script>
        </head>
        <body>
            <h1 class="fg:primary italic m:12x fg:strong font:40 font:heavy">Hello World</h1>
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
            <link rel="preload" as="style" href="https://esm.sh/@master/normal.css@rc?css">
            <link rel="modulepreload" href="https://esm.sh/@master/css-runtime@rc">
            <link rel="stylesheet" href="https://esm.sh/@master/normal.css@rc?css">
            <script type="module">
                import { initCSSRuntime } from 'https://esm.sh/@master/css-runtime@rc'
                initCSSRuntime({
                    variables: {
                        primary: '#000000'
                    }
                })
            </script>
        </head>
        <body>
            <h1 class="fg:primary italic m:12x fg:strong font:40 font:heavy">Hello World</h1>
        </body>
        </html>
        `
    }
]}</CodeTabs>
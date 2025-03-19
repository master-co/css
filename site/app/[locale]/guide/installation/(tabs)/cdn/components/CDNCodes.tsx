import CodeTabs from 'internal/components/CodeTabs'

export default () => <CodeTabs>{[
    {
        name: 'iife.html',
        lang: 'html',
        code: `
        <!DOCTYPE html>
        <html lang="en" style="display: none">
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
            <script src="https://cdn.master.co/css-runtime@rc"></script><!-- [!code ++] -->
        </head>
        <body>
            <h1 class="fg:primary font:40 font:heavy italic m:12x text:center">Hello World</h1>
        </body>
        </html>
    `
    },
    {
        name: 'esm.html',
        lang: 'html',
        code: `
        <!DOCTYPE html>
        <html lang="en" style="display: none">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="stylesheet" href="https://cdn.master.co/normal.css">
            <link rel="preload" as="style" href="https://cdn.master.co/normal.css">
            <link rel="modulepreload" href="https://cdn.master.co/css-runtime@rc/+esm">
            <script type="module"> // [!code ++]
                import { initCSSRuntime } from 'https://cdn.master.co/css-runtime@rc/+esm' // [!code ++]
                initCSSRuntime({ // [!code ++]
                    variables: { // [!code ++]
                        primary: '#000000' // [!code ++]
                    } // [!code ++]
               }) // [!code ++]
            </script> <!-- [!code ++] -->
        </head>
        <body>
            <h1 class="fg:primary font:40 font:heavy italic m:12x text:center">Hello World</h1>
        </body>
        </html>
    `
    }
]}</CodeTabs>
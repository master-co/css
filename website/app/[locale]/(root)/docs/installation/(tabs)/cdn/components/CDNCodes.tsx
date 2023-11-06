import CodeTabs from 'websites/components/CodeTabs'

export default () => <CodeTabs>
    {[
        {
            name: 'index.html',
            lang: 'html',
            code: `
            <!DOCTYPE html>
            <html lang="en" style="display: none">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="preload" as="script" href="https://cdn.master.co/css@beta">
                <link rel="preload" as="style" href="https://cdn.master.co/normal.css@beta">
                <link rel="stylesheet" href="https://cdn.master.co/normal.css@beta">
                <script>
                    window.masterCSSConfig = {
                        variables: {
                            primary: '#000000'
                        }
                    }
                </script>
            +    <script src="https://cdn.master.co/css@beta"></script>
            </head>
            <body>
                <h1 class="**fg:primary** **font:40** **font:heavy** **italic** **m:50** **text:center**">Hello World</h1>
            </body>
            </html>
        `
        },
        {
            name: 'ESM.html',
            lang: 'html',
            code: `
            <!DOCTYPE html>
            <html lang="en" style="display: none">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="stylesheet" href="https://cdn.master.co/normal.css@beta">
                <link rel="preload" as="style" href="https://cdn.master.co/normal.css@beta">
                <link rel="modulepreload" href="https://cdn.master.co/css@beta/dist/index.mjs">
            +    <script type="module">
            +        import { initRuntime } from 'https://cdn.master.co/css@beta/dist/index.mjs'
            +        initRuntime({
            +            variables: {
            +                primary: '#000000'
            +            }
            +       })
            +    </script>
            </head>
            <body>
                <h1 class="**fg:primary** **font:40** **font:heavy** **italic** **m:50** **text:center**">Hello World</h1>
            </body>
            </html>
        `
        }
    ]}
</CodeTabs>
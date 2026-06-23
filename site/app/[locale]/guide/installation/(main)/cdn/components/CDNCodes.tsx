import CodeTabs from 'internal/components/CodeTabs'

export default () => <CodeTabs>{[
    {
        name: 'cdn',
        lang: 'html',
        code: `
        <!DOCTYPE html>
        <html lang="en" hidden>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="preload" as="style" href="https://cdn.master.co/css@rc/base.css">
            <link rel="preload" as="fetch" type="application/json" crossorigin href="https://cdn.master.co/css-runtime@rc/default-manifest.json">
            <link rel="stylesheet" href="https://cdn.master.co/css@rc/base.css">
            <script src="https://cdn.master.co/css-runtime@rc"></script>
        </head>
        <body>
            <h1 class="italic m:2xl text:neutral font:5xl font:heavy">Hello World</h1>
        </body>
        </html>
    `}
]}</CodeTabs>

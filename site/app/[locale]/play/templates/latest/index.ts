import { nanoid } from 'nanoid'
import dedent from 'ts-dedent'

export default {
    version: process.env.NEXT_PUBLIC_VERSION,
    files: [
        {
            title: 'HTML',
            name: 'index.html',
            language: 'html',
            id: nanoid(),
            content: require('./example.html?raw').default
        },
        {
            title: 'Config',
            name: 'master.css.js',
            language: 'javascript',
            id: nanoid(),
            content: require('./config.js?raw').default,
            priority: 'low'
        }
    ],
    dependencies: {
        styles: [
            { src: 'https://cdn.master.co/normal.css' }
        ],
        scripts: [
            {
                text: dedent`
                let lastScript;
                window.addEventListener('message', function (event) {
                    const { name, content } = event.data;
                    switch (name) {
                        case 'master.css.js':
                            const cssRuntime = window.cssRuntime;
                            if (cssRuntime) {
                                eval(content.replace(/(export default|export const config =)/, 'config ='));
                                cssRuntime.refresh(config);
                            };
                    }
                })
            `},
            { src: 'https://cdn.master.co/css-runtime@' + process.env.NEXT_PUBLIC_VERSION }
        ]
    },
    links: [
        { rel: 'preload', as: 'style', href: 'https://cdn.master.co/normal.css' },
        { rel: 'preload', as: 'script', href: 'https://cdn.master.co/css-runtime@' + process.env.NEXT_PUBLIC_VERSION }
    ]
}
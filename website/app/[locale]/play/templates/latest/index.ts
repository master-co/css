import { nanoid } from 'nanoid'
import latestMasterCSSVersion from '~/version'
import dedent from 'ts-dedent'

export default {
    version: latestMasterCSSVersion,
    files: [
        {
            title: 'HTML',
            name: 'index.html',
            language: 'html',
            id: nanoid(),
            content: require('./example.html?text').default
        },
        {
            title: 'Config',
            name: 'master.css.js',
            language: 'javascript',
            id: nanoid(),
            content: require('./config.js?text').default,
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
                            const runtimeCSS = window.runtimeCSS;
                            if (runtimeCSS) {
                                eval(content.replace(/(export default|export const config =)/, 'config ='));
                                runtimeCSS.refresh(config);
                            };
                    }
                })
            `},
            { src: 'https://cdn.master.co/css-runtime@' + latestMasterCSSVersion }
        ]
    },
    links: [
        { rel: 'preload', as: 'style', href: 'https://cdn.master.co/normal.css@' + latestMasterCSSVersion },
        { rel: 'preload', as: 'script', href: 'https://cdn.master.co/css-runtime@' + latestMasterCSSVersion }
    ]
}
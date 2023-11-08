import { nanoid } from 'nanoid';
import latestMasterCSSVersion from 'websites/version';
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
            { src: '/cdn/normal.css@' + latestMasterCSSVersion }
        ],
        scripts: [
            {
                text: dedent`
                let lastScript;
                window.addEventListener('message', function (event) {
                    const { name, content } = event.data;
                    switch (name) {
                        case 'master.css.js':
                            const RuntimeCSS = window.RuntimeCSS;
                            if (RuntimeCSS) {
                                eval(content.replace(/(export default|export const config =)/, 'config ='));
                                RuntimeCSS.refresh(config);
                            };
                    }
                })
            `},
            { src: '/cdn/css@' + latestMasterCSSVersion }
        ]
    },
    links: [
        { rel: 'preload', as: 'style', href: '/cdn/normal.css@' + latestMasterCSSVersion },
        { rel: 'preload', as: 'script', href: '/cdn/css@' + latestMasterCSSVersion }
    ]
}
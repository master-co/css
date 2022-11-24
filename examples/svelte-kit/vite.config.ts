import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import MasterCSSVitePlugin from '@master/css.vite'
import path from 'path'

const config: UserConfig = {
    plugins: [
        MasterCSSVitePlugin({
            output: {
                name: 'master.css',
                dir: path.join(process.cwd(), 'static')
            }
        }),
        sveltekit()
    ]
};

export default config;

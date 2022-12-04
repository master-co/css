import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import MasterCSSVitePlugin from '@master/css.vite'

const config: UserConfig = {
    plugins: [
        MasterCSSVitePlugin({
            output: {
                dir: 'src/routes'
            }
        }),
        sveltekit()
    ]
};

export default config;

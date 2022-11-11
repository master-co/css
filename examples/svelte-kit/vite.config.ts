import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { MasterCSSVitePlugin } from '@master/css-compiler'

const config: UserConfig = {
    plugins: [
        MasterCSSVitePlugin(),
        sveltekit()
    ]
};

export default config;

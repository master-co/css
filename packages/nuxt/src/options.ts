import { options as defaultPluginOptions, type PluginOptions } from '@master/css.vite'

const options: ModuleOptions = {
    ...defaultPluginOptions,
    mode: 'progressive'
}

export default options

export declare type ModuleOptions = PluginOptions

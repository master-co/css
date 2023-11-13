import plugin from '../plugin';
import config from './config';

export default {
    plugins: {
        '@master/css': plugin
    },
    ...config
}
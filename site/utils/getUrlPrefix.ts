export function getUrlPrefix(host: string) {
    let prefix = '';
    switch (host) {
        case 'css.master.co':
            prefix = '/css';
            break;
    }

    return prefix;
};
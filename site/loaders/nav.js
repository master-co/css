const fs = require('fs');
const path = require('path');

const importLocaleNamespaceRegexp = /import(?:.*?)(?:\{| )localeNamespace(?:\}| )(?:.*?)from ['"]~\/(.*?)['"]/;
const constLocaleNamespaceRegexp = /const +localeNamespace *= *['"](.*?)['"]/;
const keyLocaleNamespaceRegexp = / *localeNamespace: *['"](.*?)['"]/;
const serverSideTranslationsRegexp = /serverSideTranslations\(locale,(.*?)\)/;
const htmlParseTRegexp = /\{htmlParse\((t\(.*?\))\)\}/g;
const tRegexp = /\{(t\(.*?\))\}/g;
const importRegexp = /import\ \{(.*)\}\ from \'\.\/(.*?)\'/gm;
const exportRegexp = /export const ([A-Za-z]*?) = ({(?:.*)})/gms;
const returnRegexp = /return *\(?(?:\r\n|\r|\n| )*<.*?>.*<\/[A-Za-z]*?>(?:\r\n|\r|\n| )*\)?(?:\r\n|\r|\n| )*}/ms;
const tagRegexp = /<([A-Za-z](?:.*?))( |>)/gm;
const titleRegexp = /title: \'(.*?)\'/;
const pRegexp = /<p(?:\ )?(?:.*?)>(.*?)<\/p>/ms;
const toSlug = (str) => {
    return str.toLowerCase().replace(/ /g, '-');
}

const contentsMap = {};
const flatContentsMap = {};

let initializated = false;

const getFilePath = (path) => {
    if (!path.startsWith('./')) {
        path = './' + path;
    }

    return (fs.existsSync(path + '.tsx')
        ? path
        : path + '/index') + '.tsx';
};

module.exports = function navLoader(source, map) {
    this.cacheable();

    if (!initializated) {
        initializated = true;

        const getContent = (filePath) => {
            const name = filePath.slice(0, -3);
            contentsMap[name] = require('../contents/' + filePath);
            flatContentsMap[name] = Object
                .values(contentsMap[name])
                .reduce((a, b) => {
                    if (Array.isArray(b)) {
                        a.push(...b);
                    } else {
                        a.push(b)
                    }
                    return a;
                }, []);
        };

        const filePaths = fs.readdirSync('./contents');
        filePaths
            .forEach(getContent);
    }

    let newSource = source;

    const paths = this.resourcePath.slice(0, -4).split(path.sep);
    const docsIndex = paths.indexOf('docs');
    const unit = paths[docsIndex + 1];
    const contents = flatContentsMap[unit + 'Contents'];
    if (contents) {
        for (let i = docsIndex + 2; i < paths.length; i++) {
            const currentPath = paths[i];
            const contentIndex = contents.findIndex(eachContent =>
                toSlug((typeof eachContent === 'string' ? eachContent : eachContent.path)) === currentPath
            );
            if (contentIndex) {
                const getNavigateInformation = (index) => {
                    const content = contents[index];
                    if (content) {
                        const contentName = typeof content === 'string' ? content : content.path;
                        const contentPath = toSlug(contentName);

                        try {
                            const path = getFilePath(`./pages/docs/${unit}/${contentPath}`);
                            const fileSource = fs.readFileSync(path, 'utf-8');

                            const getDescription = (source) => {
                                returnRegexp.lastIndex = 0;
                                const result = returnRegexp.exec(source);
                                if (result) {
                                    const returnSource = result[0];

                                    tagRegexp.lastIndex = 0;

                                    let results;
                                    while (results = tagRegexp.exec(returnSource)) {
                                        const [_, name] = results;
                                        if (name === 'p') {
                                            pRegexp.lastIndex = results.index;
                                            return pRegexp.exec(returnSource)[1];
                                        } else if (/[A-Z]/.test(name[0])) {
                                            const regexp = new RegExp(`import (?:.*?)${name}(?:.*?) from ['"]~/([^.]*?)['"]`);
                                            const regexpResult = regexp.exec(returnSource);
                                            if (regexpResult) {
                                                const originLastIndex = tagRegexp.lastIndex;
                                                const result = getDescription(fs.readFileSync(getFilePath(regexpResult[1]), { encoding: 'utf-8' }));
                                                if (result)
                                                    return result;

                                                tagRegexp.lastIndex = originLastIndex;
                                            }
                                        }
                                    }
                                }
                            };

                            titleRegexp.lastIndex = 0;

                            let description = getDescription(fileSource);
                            let locale;
                            if (description) {
                                description = description
                                    .replace(htmlParseTRegexp, '$1')
                                    .replace(tRegexp, '$1');

                                locale = (function getLocale(source) {
                                    keyLocaleNamespaceRegexp.lastIndex = 0;
                                    const keyLocaleNamespaceRegexpResult = keyLocaleNamespaceRegexp.exec(source);
                                    if (keyLocaleNamespaceRegexpResult)
                                        return keyLocaleNamespaceRegexpResult[1];

                                    constLocaleNamespaceRegexp.lastIndex = 0;
                                    const constLocaleNamespaceRegexpResult = constLocaleNamespaceRegexp.exec(source);
                                    if (constLocaleNamespaceRegexpResult)
                                        return constLocaleNamespaceRegexpResult[1];

                                    importLocaleNamespaceRegexp.lastIndex = 0;
                                    const importLocaleNamespaceRegexpResult = importLocaleNamespaceRegexp.exec(source);
                                    if (importLocaleNamespaceRegexpResult) {
                                        const locale = getLocale(fs.readFileSync(getFilePath(importLocaleNamespaceRegexpResult[1]), { encoding: 'utf-8' }));
                                        if (locale)
                                            return locale;
                                    }
                                })(fileSource);
                            }

                            return {
                                name: titleRegexp.exec(fileSource)?.[1] ?? contentName,
                                description,
                                locale,
                                path: `/docs/${unit}/${contentPath}`
                            };
                        } catch (err) {
                            console.log(err);
                        }
                    }
                };

                const prevNav = getNavigateInformation(contentIndex - 1);
                const nextNav = getNavigateInformation(contentIndex + 1);
                if (prevNav?.locale || nextNav?.locale) {
                    newSource = newSource.replace(
                        serverSideTranslationsRegexp,
                        (origin, ns) => {
                            const locales = [];
                            prevNav?.locale && locales.push(`\'${prevNav.locale}\'`);
                            nextNav?.locale && locales.push(`\'${nextNav.locale}\'`);

                            ns = ns.trim();
                            let newNs = ns[0] === '['
                                ? ns
                                : `[${ns}]`;
                            return origin.replace(ns, newNs.slice(0, -1) + ',' + locales.join(',') + ']');
                        });
                }

                return this.callback(
                    null,
                    newSource.replace(/\.page = {/m, origin => origin
                        + (prevNav ? 'prevNav:' + JSON.stringify(prevNav) + ',' : '')
                        + (nextNav ? 'nextNav:' + JSON.stringify(nextNav) + ',' : '')),
                    map);
            }
        }
    }

    this.callback(
        null,
        newSource,
        map);
}
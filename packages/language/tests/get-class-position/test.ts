import { test, expect } from 'vitest'
import { ClassPositionCache, getClassPositions, languageSettings, type LanguageSettings } from '../../src'
import createDoc, { languageIdOfExt } from '../helpers/create-doc'

function resolveSettings(settings?: LanguageSettings): LanguageSettings {
    return {
        ...languageSettings,
        ...settings,
        classAttributeBindings: {
            ...languageSettings.classAttributeBindings,
            ...settings?.classAttributeBindings
        }
    }
}

export function getClassPosition(doc: ReturnType<typeof createDoc>, position: Parameters<typeof doc.offsetAt>[0], settings?: LanguageSettings) {
    const resolvedSettings = resolveSettings(settings)
    const classPositionCache = new ClassPositionCache()
    const cachedOxcClassPosition = getClassPositions(doc, resolvedSettings, {
        position,
        includeEmpty: true,
        provider: 'oxc',
        oxcMode: 'cache-only',
        cache: classPositionCache
    })[0]
    if (cachedOxcClassPosition) return cachedOxcClassPosition

    const regexClassPosition = getClassPositions(doc, resolvedSettings, {
        position,
        includeEmpty: true,
        provider: 'regex'
    })[0]
    if (regexClassPosition && !regexClassPosition.raw.includes('${')) {
        return regexClassPosition
    }

    return getClassPositions(doc, resolvedSettings, {
        position,
        includeEmpty: true,
        provider: 'oxc',
        cache: classPositionCache
    })[0] ?? regexClassPosition
}

export const expectClassPosition = (target: string, contents: string[], ext: keyof typeof languageIdOfExt = 'html', settings?: LanguageSettings) => {
    const doc = createDoc(ext, contents.join(''))
    const classPosition = getClassPosition(doc, doc.positionAt(contents[0].length + target.length), settings)
    expect(classPosition).toMatchObject({
        range: {
            start: contents[0].length,
            end: contents[0].length + target.length
        },
        raw: target,
        token: target
            .replace(/\\\\"/g, '"')
            .replace(/\\\\'/g, '\'')
            .replace(/\\\\`/g, '`')
    })
    expect(classPosition?.contextRange.start).toBeLessThanOrEqual(contents[0].length)
    expect(classPosition?.contextRange.end).toBeGreaterThanOrEqual(contents[0].length + target.length)
    return classPosition
}

test.concurrent('empty class with single quotes', () => {
    const target = ''
    const contents = ['<div class=\'', target, '\'></div>']
    expectClassPosition(target, contents)
})

test.concurrent('empty class with double quotes', () => {
    const target = ''
    const contents = ['<div class="', target, '"></div>']
    expectClassPosition(target, contents)
})

test.concurrent('one class', () => {
    const target = 'class-a'
    const contents = ['<div class="', target, '"></div>']
    expectClassPosition(target, contents)
})

test.concurrent('two classes', () => {
    const target = 'class-b'
    const contents = ['<div class="class-a ', target, '"></div>']
    expectClassPosition(target, contents)
})

test.concurrent('valid classes', () => {
    const target = 'bg:black'
    const contents = ['<div class="class-a ', target, '"></div>']
    expectClassPosition(target, contents)
})

test.concurrent('class in CSS @compose', () => {
    const target = 'bg:primary'
    const contents = ['.btn { @compose inline-flex ', target, '; }']
    expectClassPosition(target, contents, 'css')
})

test.concurrent('class in Vue style @compose', () => {
    const target = 'bg:primary'
    const contents = ['<template><button /></template><style>.btn { @compose inline-flex ', target, '; }</style>']
    expectClassPosition(target, contents, 'vue')
})

test.concurrent('ignores quoted CSS @compose classes', () => {
    const doc = createDoc('css', '.btn { @compose "inline-flex bg:primary"; }')

    expect(getClassPosition(doc, doc.positionAt(doc.getText().indexOf('bg:primary')))).toBeUndefined()
})

test.concurrent('quote in class', () => {
    const target = `content:''`
    const contents = ['<div class="class-a ', target, '"></div>']
    expectClassPosition(target, contents)
})

test.concurrent('group syntax', () => {
    const target = '{abs}'
    const contents = ['<div class="class-a ', target, '"></div>']
    expectClassPosition(target, contents)
})

test.concurrent('ignores class attributes inside HTML comments', () => {
    const doc = createDoc('html', '<!-- <div class="fg:red"></div> -->\n<div class="fg:blue"></div>')

    expect(getClassPositions(doc, resolveSettings()).map((classPosition) => classPosition.token)).toEqual([
        'fg:blue'
    ])
    expect(getClassPosition(doc, doc.positionAt(17))).toBeUndefined()
})

test.concurrent('nested strings and literals', () => {
    const target = `content:\\'\\'`
    const contents = [`export default () => <div className={'block `, target, `'}>hello world</div>`]
    expectClassPosition(target, contents, 'tsx')
})

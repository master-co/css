import { test, it, expect, describe } from 'vitest'
import { expectClassPosition } from './test'

describe.concurrent('var', () => {
    test.concurrent('configured class declaration with double quotes', () => {
        const target = 'class-b'
        const contents = ['const classes = "class-a ', target, '"']
        expectClassPosition(target, contents, 'js', { classDeclarations: ['classes'] })
    })

    test.concurrent('configured class declaration with single quotes', () => {
        const target = 'class-b'
        const contents = ['const classes = \'class-a ', target, '\'']
        expectClassPosition(target, contents, 'js', { classDeclarations: ['classes'] })
    })

    test.concurrent('configured class declaration with literals', () => {
        const target = 'class-b'
        const contents = ['const classes = `class-a ', target, '`']
        expectClassPosition(target, contents, 'js', { classDeclarations: ['classes'] })
    })
})

describe.concurrent('object', () => {
    test.concurrent('configured class declaration property with double quotes', () => {
        const target = 'class-b'
        const contents = ['const config = { classes: "class-a ', target, '" }']
        expectClassPosition(target, contents, 'js', { classDeclarations: ['classes'] })
    })
})

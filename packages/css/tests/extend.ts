import extend from '../src/apis/extend'

test('extend', () => {
    expect(
        extend({ a: 1 }, undefined, { b: 2 })
    )
        .toEqual({ a: 1, b: 2 })

    expect(
        extend({ a: 1 }, { a: null })
    )
        .toEqual({ a: null })
})
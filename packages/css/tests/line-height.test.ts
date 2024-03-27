test('line-height', () => {
    expect(new MasterCSS().create('line-h:calc(2-1.5)')?.text).toBe('.line-h\\:calc\\(2-1\\.5\\){line-height:calc(2 - 1.5)}')
})

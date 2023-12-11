test('line-height', () => {
    expect(new MasterCSS().create('lh:calc(2-1.5)')?.text).toBe('.lh\\:calc\\(2-1\\.5\\){line-height:calc(2 - 1.5)}')
})

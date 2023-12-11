test('transition', () => {
    expect(new MasterCSS().create('~transform|.1s|ease-out,width|.1s|ease-out')?.text).toBe('.\\~transform\\|\\.1s\\|ease-out\\,width\\|\\.1s\\|ease-out{transition:transform .1s ease-out,width .1s ease-out}')
})

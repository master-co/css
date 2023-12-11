test('text fill colors', () => {
    expect(new MasterCSS().create('t:blue-60')?.text).toBe('.t\\:blue-60{-webkit-text-fill-color:rgb(107 158 241)}')
    expect(new MasterCSS().create('text-fill-color:blue-60')?.text).toBe('.text-fill-color\\:blue-60{-webkit-text-fill-color:rgb(107 158 241)}')
})

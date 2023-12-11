test('font-family', () => {
    expect(new MasterCSS().create('font:serif')?.text).toBe('.font\\:serif{font-family:ui-serif,Georgia,Cambria,Times New Roman,Times,serif}')
    expect(new MasterCSS().create('font:mono_:where(code,kbd,samp)')?.text).toBe('.font\\:mono_\\:where\\(code\\,kbd\\,samp\\) :where(code,kbd,samp){font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace}')
    expect(new MasterCSS().create('font:serif:hover')?.text).toBe('.font\\:serif\\:hover:hover{font-family:ui-serif,Georgia,Cambria,Times New Roman,Times,serif}')
})
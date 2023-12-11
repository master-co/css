test('backdrop-filter', () => {
    expect(new MasterCSS().create('bd:drop-shadow(0|2|8|slate-80)')?.text).toBe('.bd\\:drop-shadow\\(0\\|2\\|8\\|slate-80\\){backdrop-filter:drop-shadow(0rem 0.125rem 0.5rem rgb(215 218 227));-webkit-backdrop-filter:drop-shadow(0rem 0.125rem 0.5rem rgb(215 218 227))}')
})

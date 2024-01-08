test('backdrop-filter', () => {
    expect(new MasterCSS().create('bd:drop-shadow(0|2|8|black)')?.text).toBe('.bd\\:drop-shadow\\(0\\|2\\|8\\|black\\){backdrop-filter:drop-shadow(0rem 0.125rem 0.5rem rgb(0 0 0));-webkit-backdrop-filter:drop-shadow(0rem 0.125rem 0.5rem rgb(0 0 0))}')
})

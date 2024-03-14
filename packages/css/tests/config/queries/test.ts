test('queries', () => {
    expect(new MasterCSS({
        queries: {
            watch: 'media (max-device-width:42mm) and (min-device-width:38mm)',
        }
    }).add('hide@watch').text)
        .toBe('@media (max-device-width:42mm) and (min-device-width:38mm){.hide\\@watch{display:none}}')
})
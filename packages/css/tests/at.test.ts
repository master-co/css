test('media', () => {
    const css = new MasterCSS().add('font:12@sm&<md')
    expect(css.rules[0].at).toEqual({
        'media': [
            {
                'name': 'min-width',
                'type': 'feature',
                'unit': 'px',
                'value': 834,
                'valueType': 'number',
            },
            {
                'token': '&',
                'type': 'operator',
                'value': 'and',
            },
            {
                'name': 'max-width',
                'type': 'feature',
                'unit': 'px',
                'value': 1023.98,
                'valueType': 'number',
            },
        ],
    })
    expect(css.rules[0].text).toContain('(min-width:834px) and (max-width:1023.98px)')

    // expect(new MasterCSS().generate('font:12@supports(display:grid)')[0].at).toEqual({
    //     'supports': '(display:grid)',
    // })

    // expect(new MasterCSS().generate('font:12@container(min-width:700px)')[0].at).toEqual({
    //     'container': '(min-width:700px)'
    // })

    // expect(new MasterCSS().generate('font:12@sm&<md@supports(display:grid)@container(min-width:700px)')[0].at).toEqual({
    //     'container': '(min-width:700px)',
    //     'media': '(min-width:834px) and (max-width:1023.98px)',
    //     'supports': '(display:grid)',
    // })
})

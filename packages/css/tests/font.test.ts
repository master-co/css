import { variables } from '../src'

it('font', () => {
    expect(new MasterCSS().create('font:italic|1.2rem|sans')?.text).toBe(`.font\\:italic\\|1\\.2rem\\|sans{font:italic 1.2rem ${variables['font-family'].sans.join(',')}}`)
    // expect(new MasterCSS().create('font:italic|semibold|1.2rem|sans')?.text).toBe(`.font\\:italic\\|semibold\\|1\\.2rem\\|sans{font:italic 600 1.2rem ${variables['font-family'].sans.join(',')}}`)
})

import RuntimeLayer from './layer'

export default class RuntimeThemeLayer extends RuntimeLayer {
  resourceText = ''

  get text() {
    return this.resourceText ? `@layer theme{${this.resourceText}}` : ''
  }

  reset() {
    super.reset()
    this.resourceText = ''
  }
}

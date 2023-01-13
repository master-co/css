import MasterCSS from '@master/css'
import config from '../master.css'
import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('hello-world')
export class HelloWorld extends LitElement {

    css?: MasterCSS

    connectedCallback() {
        super.connectedCallback()
        this.css = new MasterCSS({ config, observe: false })
            .observe(this.shadowRoot)
    }

    disconnectedCallback() {
        super.disconnectedCallback()
        this.css?.destroy()
    }

    @property()
    name?: string = 'World'

    render() {
        return html`
            <h1 class="font:40 font:heavy italic m:50 text:center fg:primary">
                Hello ${this.name}
            </h1>
        `
    }
}

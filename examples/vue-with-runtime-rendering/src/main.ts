import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

const app = createApp(App)

app.config.globalProperties.$window = window
app.config.globalProperties.$document = document

app.mount('#app')

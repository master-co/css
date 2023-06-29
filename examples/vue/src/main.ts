import { createApp } from 'vue'
import './style.css'
import 'virtual:master.css' // AOT
import App from './App.vue'

// JIT
// import MasterCSS from '@master/css'
// new MasterCSS()

createApp(App).mount('#app')

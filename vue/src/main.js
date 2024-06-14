import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { useNotification,useDialog } from 'naive-ui'
let app = createApp(App);

// app.use({install:(app)=>{
//     let s = useDialog();
// console.log('dialo ssg',s,useDialog)
//     app.provide('dialog',s);
//     app.provide('notifi',useNotification());
// }})

app.mount('#app')

<script setup>
import Board from './components/board.vue'
import sudoku from './components/sudoku.vue'
import MineSweeper from './components/MineSweeper.vue';
import {NNotificationProvider,NDialogProvider} from 'naive-ui'

import {ref} from 'vue';

const mode = ref(-1);

</script>

<template>
  <n-dialog-provider>
    <n-notification-provider>
      <div>
        <button @click="mode = 0">扫雷</button>
        <button @click="mode = 1">数独</button>

      </div>
      <MineSweeper
          v-if="mode === 0"
          :width="30"
          :height="16"
          :init-mine-count="99"
          class="app-section"
      />
      <sudoku v-else-if="mode === 1"/>
    </n-notification-provider>
  </n-dialog-provider>


  <!-- <Board :size="1000" /> -->
</template>

<style>
/* .logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
} */
body{
  background-color: white;
}
</style>

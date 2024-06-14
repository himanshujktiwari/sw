<template>
  <loading v-if="isConnect" />
  <div class="game-container" v-else>

    <div class="mine-sweeper-container" @contextmenu.prevent>
      <div v-for="i in height" :key="'row-'+i" class="mine-sweeper-row">
        <div v-for="j in width" :key="'col'+j" class="mine-sweeper-item" :i="i" :j="j" :index="(i - 1) * width + (j - 1)"
             :class="mines[(i - 1) * width + (j - 1)] >=0 ? 'is-open':''"
             @click.left="handleLeftClick( (i - 1) * width + (j - 1))"
             @click.right="handleRightClick((i - 1) * width + (j - 1))">
          <span v-if="mines[(i - 1) * width + (j - 1)] === -2" class="iconfont mine">&#xe63a;</span>
          <!-- <span v-else-if="mines[(i - 1) * width + (j - 1)] === -3" class="iconfont flag">问号 &#xe720;</span> -->

          <span v-else-if="mines[(i - 1) * width + (j - 1)] === -3" class="iconfont flag">&#xe778;</span>
          <span v-else-if="mines[(i - 1) * width + (j - 1)] === 0" class="iconfont"></span>
          <span v-else-if="mines[(i - 1) * width + (j - 1)] != -1" class="iconfont number">{{mines[(i - 1) * width + (j - 1)]}}</span>

        </div>
      </div>
    </div>
    <div class="panel-container">
      <div class="panel-data-container">
        <span class="iconfont" style="font-size: 60px">&#xe778;</span>
        <div>{{ selectedMineCount }} / {{ mineCount }}</div>
      </div>
      <input placeholder="雷数量" v-model="mineCount"/>
      <button class="mine-sweeper-button" @click="reStart">
        重开一局
      </button>

    </div>
  </div>
</template>

<script setup>
import loading from './loading.vue';
import { defineProps,  ref, computed, watch, onUnmounted,nextTick } from 'vue';
import { useNotification,useDialog } from 'naive-ui'

import Mine from '../util/mine.js';


const dialog = useDialog();
const notification = useNotification();
const props = defineProps({
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  initMineCount: {
    type: Number,
    required: true,
  },
})
const mineCount = ref(props.initMineCount);
const isConnect = ref(true);
const isEnd = ref(false);
// 一维数组，存储格子状态，-1 默认 0打开无数字，1-8 显示数字，-2雷 -3棋子
const mines = ref([]);
const selectedMineCount = ref(0);
const heartBeat = ref(-1);
const count = ref(1);

let mine = null;




console.log("start");
var ws;
// var ws = new WebSocket("ws://127.0.0.1:22293/ws");
if (process.env.NODE_ENV == 'production') {
  ws = new WebSocket("ws://" + location.host + "/sw");
} else {
  ws = new WebSocket("ws://192.168.150.96:38293/sw");
}
// var ws = new WebSocket("ws://" + location.host + "/sw");

//申请一个WebSocket对象，参数是服务端地址，同http协议使用http://开头一样，WebSocket协议的url使用ws://开头，另外安全的WebSocket协议使用wss://开头
ws.onopen = () => {
  isConnect.value = false;
  //当WebSocket创建成功时，触发onopen事件
  console.log("open");
  ws.send('{"type":"hello"}'); //将消息发送到服务端
  if (mine == null) {
    reStart();
  }
};


ws.onmessage = (e) => {
  //当客户端收到服务端发来的消息时，触发onmessage事件，参数e.data包含server传递过来的数据
  console.log("收到消息", e.data);
  var json = JSON.parse(e.data);
  if (json.type == "init") {
    initReal(json.width, json.height, json.mines);
  } else if (json.type == "handleLeftClick") {
    handleLeftClickReal(json.index);
  } else if (json.type == "handleRightClick") {
    console.log("handleRightClick", json);
    handleRightClickReal(json.index);
  } else if (json.type == 'up') {
    if (count.value != json.count) {// 自己入场不提示
      notification['info']({
        content: "有人入场",
        meta: "当前人数：" + json.count,
        duration: 2500,
        keepAliveOnHover: true
      });
    }
    count.value = json.count;
  } else if (json.type == 'down') {
    notification['info']({
      content: "有人离场",
      meta: "当前人数：" + json.count,
      duration: 2500,
      keepAliveOnHover: true
    });
    count.value = json.count;
  }
};
// 主动关闭
const activeClose = ref(false);

ws.onclose = (e) => {
  console.log("close");
  if(activeClose.value) return;
  //当客户端收到服务端发送的关闭连接请求时，触发onclose事件
  dialog.error({
    title: '连接中断，刷新页面',
    content: '连接中断，刷新页面',
    positiveText: 'ok',
    onPositiveClick: () => {
    }
  })
  clearInterval(heartBeat.value);
  heartBeat.value = -1;
};
ws.onerror = (e) => {
  //如果出现连接、处理、接收、发送数据失败的时候触发onerror事件
  console.log(e);
  dialog.error({
    title: '连接服务器失败',
    content: '连接服务器失败',
    positiveText: 'ok',
    onPositiveClick: () => {
    }
  })
  clearInterval(heartBeat.value);
  heartBeat.value = -1;
};

window.sw = ws;

// heartBeat.value = setInterval(() => {
//     window.sw.send(JSON.stringify({
//         type: "ping",
//     }));
// }, 1000);

function reStart() {
  mines.value = mines.value.map(_=>-1);
  init(props.width, props.height, mineCount.value);
};

function onOpen(index,number){
  console.log('onOpen',index,number);
  mines.value[index ]=number;
}
function onMine(index){
  console.log('onMine',index);
  mines.value[ index ]=-2;
}
function onFlag(index,type){
  console.log('onFlag',index,type);
  if(type === 1){
    selectedMineCount.value--;
    mines.value[ index ] = -3;
  }else{
    selectedMineCount.value++;
    mines.value[ index ] = -1;
  }
}
function onSuccess(){
  isEnd.value = true;
  dialog.error({
    title: 'win',
    content: 'win',
    positiveText: 'ok',
    onPositiveClick: () => {
    }
  })

}
function onFail(){
  isEnd.value = true;
  console.log('onFail')
  dialog.error({
    title: 'fail',
    content: 'fail',
    positiveText: 'ok',
    onPositiveClick: () => {
    }
  })

}
function init(width, height, mineCount) {
  isEnd.value = false;
  if(mine == null){
    mine = new Mine(width,height,mineCount);
    mine.onOpen = onOpen;
    mine.onMine = onMine;
    mine.onFlag = onFlag;
    mine.onSuccess = onSuccess;
    mine.onFail = onFail;
  }
  mine.setMineCount(mineCount);
  mine.init();




  window.sw.send(
      JSON.stringify({
        type: "init",
        width: width,
        height,
        width,
        mines: mine.getMines(),
      })
  );
  console.log("init 开局");

  var r = function RandomNum(Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    var num = Min + Math.floor(Rand * Range); //舍去
    return num;
  };



  // 随机开局

  let m = mine.getMines();
  console.log('ope ran',m,m.length);
  for(;;){
    let ind = r(0,m.length);
    let ran = m[ind];
    console.log('ope ran 2 ',m,m.length,ran);
    if(ran===0){
      handleLeftClick(ind);
      break;
    }
  }


  // handleLeftClick(r(0, width), r(0, height));
  // handleLeftClick(0,0)
};
function initReal(width, height, new_mines) {
  // props.width = json.width;
  // // props.height = json.height;
  // openStatus.value = new Array(width * height).fill(0);
  // markStatus.value = new Array(width * height).fill(0);
  // selectedMineCount.value = 0;
  // console.log("initReal", openStatus.value, markStatus.value);
  if(mine != null){
    mine.build(new_mines);
  }
  for(let i =0 ;i<width * height;i++){
    mines.value.push(-1);
  }
};
function handleLeftClick(index) {
  window.sw.send(JSON.stringify({
    type: "handleLeftClick",index
  }));
};
function handleLeftClickReal(index) {
  if (isEnd.value) {
    return;
  }
  mine.click(index,1);
};
function handleRightClick(index) {
  window.sw.send(JSON.stringify({
    type: "handleRightClick",index
  }));
};
function handleRightClickReal(index) {
  if (isEnd.value) {
    return;
  }
  mine.click(index,2);
};

onUnmounted(()=>{
  if(ws!=null){
    activeClose.value = true;
    ws.close();
  }
});

</script>

<style lang="less">
.game-container {
  /* display: flex; */
  justify-content: space-between;
  padding: 0 15px;

  margin-top: 50px;


  .mine-sweeper-container {
    overflow: hidden;
    width: fit-content;
    margin: 0 auto;
    background-color: #f2f1f0;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  .mine-sweeper-row {
    display: flex;
  }

  .mine-sweeper-item {
    width: 25px;
    height: 25px;
    margin: 2px;
    line-height: 25px;
    font-size: 20px;
    text-align: center;
    background-color: #babdb6;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;

    &.is-open{
      background-color: #dededc;
      cursor: default;
    }
  }


  .panel-container {
    width: 100%;
    margin: 0 auto;
    text-align: center;
    flex-direction: column;
    justify-content: space-between;
    color: black;
  }

  .panel-container>div {
    width: 120px;
    display: inline-block;
  }

  .panel-data-container {
    padding-top: 15px;
    text-align: center;
  }
}

</style>
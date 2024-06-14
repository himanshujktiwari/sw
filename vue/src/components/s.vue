<template>
    <loading v-if="isConnect" />
    <div class="game-container" v-else>

        <div class="mine-sweeper-container" @contextmenu.prevent>
            <div v-for="i in height" :key="i" class="mine-sweeper-row">
                <div v-for="j in width" :key="j" class="mine-sweeper-item"
                    :class="{ 'is-open': openStatus[(i - 1) * width + j - 1] }" @click.left="handleLeftClick(i - 1, j - 1)"
                    @click.right="handleRightClick(i - 1, j - 1)">
                    <span v-if="markStatus[(i - 1) * width + (j - 1)] === 1" class="iconfont">&#xe778;</span>
                    <span v-else-if="markStatus[(i - 1) * width + (j - 1)] === 2" class="iconfont">&#xe720;</span>
                    <template v-else-if="openStatus[(i - 1) * width + (j - 1)]">
                        <span v-if="mines[(i - 1) * width + (j - 1)]" class="iconfont">&#xe63a;</span>
                        <span v-else-if="neighbourMineCount[(i - 1) * width + (j - 1)] > 0">
                            {{ neighbourMineCount[(i - 1) * width + (j - 1)] }}
                        </span>
                    </template>
                </div>
            </div>
        </div>
        <div class="panel-container">
            <div class="panel-data-container">
                <span class="iconfont" style="font-size: 60px">&#xe778;</span>
                <div>{{ selectedMineCount }} / {{ mineCount }}</div>
            </div>

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


function shuffle(mines, start) {
    for (let i = start; i < mines.length; i++) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        const tmp = mines[randomIndex];
        mines[randomIndex] = mines[i];
        mines[i] = tmp;
    }
}

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
    mineCount: {
        type: Number,
        required: true,
    },
})

const isConnect = ref(true);
const isEnd = ref(false);
const mines = ref([]);
const openStatus = ref([]);
const markStatus = ref([]);
const selectedMineCount = ref(0);
const heartBeat = ref(-1);
const count = ref(1);
const firstStart = ref(true);


const neighbourMineCount = computed(() => {
    const result = new Array(props.width * props.height).fill(0);
    for (let i = 0; i < result.length; i++) {
        if (!mines.value[i]) {
            continue;
        }
        const y = i % props.width;
        const x = (i - y) / props.width;
        for (let j = -1; j < 2; j++) {
            const newX = x + j;
            if (newX < 0 || newX === props.height) {
                continue;
            }
            for (let k = -1; k < 2; k++) {
                const newY = y + k;
                if (newY < 0 || newY === props.width) {
                    continue;
                }
                result[newX * props.width + newY]++;
            }
        }
    }
    return result;
})

watch(selectedMineCount, (nv, ov) => {
    if (selectedMineCount.value === props.mineCount) {
        const match = mines.value.every((isMine, index) => {
            if (
                (isMine && markStatus.value[index] === 1) ||
                (!isMine && markStatus.value[index] !== 1)
            ) {
                return true;
            }
            return false;
        });
        if (match) {
            nextTick(() => {
                dialog.error({
                    title: 'win',
                    content: 'win',
                    positiveText: 'ok',
                    onPositiveClick: () => {
                    }
                })
            });
            isEnd.value = true;
        }
    }
})


console.log("start");
var ws;
// var ws = new WebSocket("ws://127.0.0.1:22293/ws");
if (process.env.NODE_ENV == 'production') {
    ws = new WebSocket("ws://" + location.host + "/sw");
} else {
    ws = new WebSocket("ws://192.168.150.96:5895/sw");
}
// var ws = new WebSocket("ws://" + location.host + "/sw");

//申请一个WebSocket对象，参数是服务端地址，同http协议使用http://开头一样，WebSocket协议的url使用ws://开头，另外安全的WebSocket协议使用wss://开头
ws.onopen = () => {
    isConnect.value = false;
    //当WebSocket创建成功时，触发onopen事件
    console.log("open");
    ws.send('{"type":"hello"}'); //将消息发送到服务端
    if (firstStart.value) {
        firstStart.value = false;
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
        handleLeftClickReal(json.x, json.y);
    } else if (json.type == "handleRightClick") {
        console.log("handleRightClick", json);
        handleRightClickReal(json.x, json.y);
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
ws.onclose = (e) => {
    //当客户端收到服务端发送的关闭连接请求时，触发onclose事件
    console.log("close");
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
    init(props.width, props.height, props.mineCount);
};
function init(width, height, mineCount) {
    isEnd.value = false;
    const total = width * height;
    const mines = new Array(total).fill(0);
    for (let i = 0; i < mineCount; i++) {
        mines[i] = 1;
    }
    shuffle(mines, mineCount);
    window.sw.send(
        JSON.stringify({
            type: "init",
            width: width,
            height,
            width,
            mines: mines,
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
    handleLeftClick(r(0, width), r(0, height));
};
function initReal(width, height, new_mines) {
    mines.value = new_mines;
    // props.width = json.width;
    // props.height = json.height;
    openStatus.value = new Array(width * height).fill(0);
    markStatus.value = new Array(width * height).fill(0);
    selectedMineCount.value = 0;
    console.log("initReal", openStatus.value, markStatus.value);
};
function handleLeftClick(x, y) {
    window.sw.send(JSON.stringify({
        type: "handleLeftClick",
        x: x,
        y: y,
    }));
};
function handleLeftClickReal(x, y) {
    if (isEnd.value) {
        return;
    }
    const index = x * props.width + y;
    if (openStatus.value[index] === 1 || markStatus.value[index] === 1) {
        return;
    }

    if (mines.value[index]) {
        openStatus.value.splice(index, 1, 1);
        isEnd.value = true;
        dialog.error({
            title: 'mine',
            content: 'mine',
            positiveText: 'ok',
            onPositiveClick: () => {
            }
        })

        for (var i = 0; i < openStatus.value.length; i++) {
            openStatus.value[i] = 1;
        }

        return;
    }
    if (neighbourMineCount.value[index] > 0) {
        openStatus.value.splice(index, 1, 1);
        return;
    }
    floodfill(x, y);
};
function floodfill(x, y) {
    if (x < 0 || y < 0 || x === props.height || y === props.width) {
        return;
    }
    const index = x * props.width + y;
    if (openStatus.value[index] === 1) {
        return;
    }
    openStatus.value.splice(index, 1, 1);
    if (neighbourMineCount.value[index] > 0) {
        return;
    }
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            floodfill(x + i, y + j);
        }
    }
};
function handleRightClick(x, y) {
    window.sw.send(JSON.stringify({
        type: "handleRightClick",
        x: x,
        y: y,
    }));
};
function handleRightClickReal(x, y) {
    if (isEnd.value) {
        return;
    }
    const index = x * props.width + y;
    if (openStatus.value[index] === 1) {
        return;
    }
    markStatus.value.splice(index, 1, (markStatus.value[index] + 1) % 3);
    if (markStatus.value[index] === 1) {
        selectedMineCount.value++;
    } else if (markStatus.value[index] === 2) {
        selectedMineCount.value--;
    }
};

</script>

<style scoped>
.game-container {
    /* display: flex; */
    justify-content: space-between;
    padding: 0 15px;

    margin-top: 50px;
}

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
    width: 50px;
    height: 50px;
    margin: 2px;
    line-height: 50px;
    font-size: 34px;
    text-align: center;
    background-color: #babdb6;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.mine-sweeper-item.is-open {
    background-color: #dededc;
}

.panel-container {
    width: 100%;
    margin: 0 auto;
    text-align: center;
    flex-direction: column;
    justify-content: space-between;
}

.panel-container>div {
    width: 120px;
    display: inline-block;
}

.panel-data-container {
    padding-top: 15px;
    text-align: center;
}
</style>
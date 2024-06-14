<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  size:800
});
// 计算相关尺寸
// 单个格子大小
const cellSize = props.size / 8;
// 棋子直径
const chessSize = cellSize - 6;
// 容器尺寸，需要留有margin值，方便绘制棋子
const containerWidth = props.size + chessSize ;
// 高度需要再加上一个楚河汉界，暂定为一个格子的高度
const containerHeight = props.size + chessSize + cellSize;



const count = ref(0)

function LineDrawing(ctx, mx, my, lx, ly) {
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(lx, ly);
  ctx.stroke();
}

function drawBoard() {

  let ctx = document.getElementById("board").getContext("2d");
  ctx.lineWidth = 5;
  ctx.strokeStyle = "brown";
  ctx.strokeRect(100, 100, 800, 900);
  // row
  for (var i = 200; i <= 900; i += 100) {
    ctx.beginPath();
    ctx.moveTo(105, i);
    ctx.lineTo(900, i);
    ctx.stroke();
  }
  // col

  for (var i = 200; i <= 800; i += 100) {
    ctx.beginPath();
    ctx.moveTo(i, 105);
    ctx.lineTo(i, 1000);
    ctx.stroke();
  }
  //清除指定的矩形区域
  //this.ctx.clearRect(5, 402,795, 95);
  ctx.clearRect(102.5, 502, 795, 95);
  //斜线
  LineDrawing(ctx, 400, 105, 600, 300);
  LineDrawing(ctx, 400, 805, 600, 1000);
  //反斜线
  LineDrawing(ctx, 600, 105, 400, 300);
  LineDrawing(ctx, 600, 805, 400, 1000);

}


function drawChessItem(ctx,text,x,y,color){
  ctx.beginPath();

  // 背景
  ctx.arc(x,y,44,0,2*Math.PI);
  ctx.fillStyle=color;
  ctx.fill();


  // 文字
  ctx.font='60px "微软雅黑"';
  ctx.textAlign='center'
  ctx.textBaseline="middle"
  ctx.fillStyle='white';
  ctx.fillText(text,x,y);
  // ctx.fill();
}

function drawChess(){
  let ctx = document.getElementById("chess").getContext("2d");

  // 绘制车
  let initX = 105;
  let startX = 5;
  let step = 100;
  let startY = 100;
  let position =[
    {
      color:'black',text:'车',
      x:(startX+=step),y:startY
    },
    {
      color:'black',text:'马',
      x:(startX+=step),y:startY
    },
    {
      color:'black',text:'相',
      x:(startX+=step),y:startY
    },{
      color:'black',text:'士',
      x:(startX+=step),y:startY
    },{
      color:'black',text:'将',
      x:(startX+=step),y:startY
    },{
      color:'black',text:'士',
      x:(startX+=step),y:startY
    },{
      color:'black',text:'相',
      x:(startX+=step),y:startY
    },{
      color:'black',text:'马',
      x:(startX+=step),y:startY
    },{
      color:'black',text:'车',
      x:(startX+=step),y:startY
    },
    // 炮
    {
      color:'black',text:'炮',
      x:(initX+step),y:startY+step*2
    },
    {
      color:'black',text:'炮',
      x:(initX+step * 7),y:startY+step*2
    },
    // 兵
    {
      color:'black',text:'兵',
      x:(startX = initX),y:(startY = startY + step * 3)
    },
    {
      color:'black',text:'兵',
      x:(startX += step * 2),y:(startY)
    },
    {
      color:'black',text:'兵',
      x:(startX += step * 2),y:(startY)
    },{
      color:'black',text:'兵',
      x:(startX += step * 2),y:(startY)
    },{
      color:'black',text:'兵',
      x:(startX += step * 2),y:(startY)
    },

    // 下方
    {
      color:'red',text:'卒',
      x:(startX = initX),y:(startY = startY + step * 3)
    },
    {
      color:'red',text:'卒',
      x:(startX += step * 2),y:(startY)
    },{
      color:'red',text:'卒',
      x:(startX += step * 2),y:(startY)
    },{
      color:'red',text:'卒',
      x:(startX += step * 2),y:(startY)
    },{
      color:'red',text:'卒',
      x:(startX += step * 2),y:(startY)
    },
    // 炮
    {
      color:'red',text:'炮',
      x:(startX = initX + step),y:(startY += step)
    },{
      color:'red',text:'炮',
      x:(startX += step*6),y:(startY)
    },

    {
      color:'red',text:'车',
      x:(startX=initX),y:(startY += step * 2)
    },
    {
      color:'red',text:'马',
      x:(startX+=step),y:startY
    },
    {
      color:'red',text:'象',
      x:(startX+=step),y:startY
    },{
      color:'red',text:'士',
      x:(startX+=step),y:startY
    },{
      color:'red',text:'帅',
      x:(startX+=step),y:startY
    },{
      color:'red',text:'士',
      x:(startX+=step),y:startY
    },{
      color:'red',text:'象',
      x:(startX+=step),y:startY
    },{
      color:'red',text:'马',
      x:(startX+=step),y:startY
    },{
      color:'red',text:'车',
      x:(startX+=step),y:startY
    },
  ]
  console.log(position);

  position.forEach(p=>{
    drawChessItem(ctx,p.text,p.x,p.y,p.color);
  })

  // drawChessItem(ctx,'车',105,100,'black');
  // drawChessItem(ctx,'马',205,100,'black');
  // drawChessItem(ctx,'象',305,100,'black');
  // drawChessItem(ctx,'士',405,100,'black');
  // drawChessItem(ctx,'将',505,100,'black');
  // drawChessItem(ctx,'士',605,100,'black');

  // drawChessItem(ctx,'车',900,100,'black');
  // ctx.fill();
  



}

onMounted(() => {

  drawBoard();

  drawChess();


})

</script>

<template>
  <div class="chess">
    <canvas id="board" width="1005" height="1105">不支持</canvas>
    <canvas id="chess" width="1005" height="1105">不支持</canvas>

  </div>
</template>

<style lang="less">
.chess {
  position: relative;

  #chess {
    position: absolute;
    top:0;
    left:0;
  }
}
</style>

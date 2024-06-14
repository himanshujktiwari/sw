
function addBox(lineArray, item) {

    if (lineArray.length == 0) {
        lineArray.push({begin:item,data:[item],end:item});
    } else {
        let s = lineArray[lineArray.length - 1];
        if(s.end != item - 9){
            lineArray.push({begin:item,data:[item],end:item});
        }else{
            s.end = item;
            s.data.push(item)
        }
        // s.push(item);

    }
}

function addRowBox(lineArray, item) {

    if (lineArray.length == 0) {
        lineArray.push({begin:item,data:[item],end:item});
    } else {
        let s = lineArray[lineArray.length - 1];
        // s.push(item);
        if(s.end != item - 1 ){
            // 没有连着，应该新起
            lineArray.push({begin:item,data:[item],end:item});
        }else{
            s.end = item;
            s.data.push(item)
        }
    }
}

/**
 * 判断指定下标格子是否需要划线
 * @param {*} lineArray 数组
 * @param {*} item index
 */
function hasDashed(lineArray,item){
    for(let i =0 ;i<lineArray.length;i++){
            if(lineArray[i].data.findIndex(s=>s==item) !=-1){
                return true;
            
        }
    }
    return false;
}

function more(lineArray,item,key){
    for(let i =0 ;i<lineArray.length;i++){
        if(lineArray[i].data.findIndex(s=>s==item) !=-1){
            lineArray[i][key] = true;
        
    }
}

}

/**
 * 获取单元格虚线划线数据
 * @param {*} array 数据
 */
export function getDashed(array) {



    let row = [];// 横线
    let col = [];// 竖线

    for (let i = 0; i < 9; i++) {
        row.push({ top: [], bottom: [] });
        col.push({ left: [], right: [] });
    }

    // row[array[0] % 9].push([array[0]]);
    // col[Math.floor(array[0] / 9)].push([array[0]]);

    for (let i = 0; i < array.length; i++) {
        if(array[i-1] != array[i] - 1){
            // 左侧没有格子
            let c = col[array[i] % 9].left;
            addBox(c, array[i]);
        }

        // 判断上侧是否有格子
        if (array.findIndex(s=>s==array[i] - 9)==-1){
            // 上方没有格子
            let a = row[Math.floor(array[i] / 9)].top;// a 是一个二维数组
            addRowBox(a, array[i]);
        }

        if(array[i+1] != array[i] + 1){
            let c = col[array[i] % 9].right;
            addBox(c, array[i]);
        }
        if (array.findIndex(s=>s==array[i] + 9)==-1){
            // 下方没有格子
            let a = row[Math.floor(array[i] / 9)].bottom;// a 是一个二维数组
            addRowBox(a, array[i]);
        }



    }
    for (let i = 0; i < array.length; i++) {
            // 处理位于 (左上，左下，右上，右下 有划线格子) 的格子，这种格子需要划线到内部
        
        // 判断左边格子是否有上边横线
        if(hasDashed(row[Math.floor(array[i] / 9)].top, array[i] - 1)){
            // 判断上边格子是否有左侧竖线
            if(hasDashed(col[array[i] % 9].left,array[i] - 9)){
                // 有，那么左边上横线，和上边左竖线 都需要补充一点长度
                more(row[Math.floor(array[i] / 9)].top, array[i] - 1,'moreRight');
                more(col[array[i] % 9].left,array[i] - 9,'moreBottom')

            }
        }
        // 判断左边格子是否有下边横线
        if(hasDashed(row[Math.floor(array[i] / 9)].bottom, array[i] - 1)){
             // 判断下边格子是否有左侧竖线
             if(hasDashed(col[array[i] % 9].left,array[i] + 9)){
                more(row[Math.floor(array[i] / 9)].bottom, array[i] - 1,'moreRight');
                more(col[array[i] % 9].left,array[i] + 9,'moreTop');
            }
        }

        // 判断右边格子是否有上边横线
        if(hasDashed(row[Math.floor(array[i] / 9)].top, array[i] + 1)){
            // 判断上边格子是否有右侧竖线
            if(hasDashed(col[array[i] % 9].right,array[i] - 9)){
                // 有，那么右边上横线，和上边右竖线 都需要补充一点长度
                more(row[Math.floor(array[i] / 9)].top, array[i] + 1,'moreLeft');
                more(col[array[i] % 9].right,array[i] - 9,'moreBottom')

            }
        }     

        // 判断右边格子是否有下边横线
        if(hasDashed(row[Math.floor(array[i] / 9)].bottom, array[i] + 1)){
            // 判断下边格子是否有右侧竖线
            if(hasDashed(col[array[i] % 9].right,array[i] + 9)){
                // 有，那么右边上横线，和上边右竖线 都需要补充一点长度
                more(row[Math.floor(array[i] / 9)].bottom, array[i] + 1,'moreLeft');
                more(col[array[i] % 9].right,array[i] + 9,'moreTop')

            }
        }     
    }
    return {
        row: row
            .filter(s => s.top.length != 0 || s.bottom.length != 0)
            .map(s => {
                if (s.bottom.length == 0) {
                    return { top: s.top }
                } else if (s.top.length == 0) {
                    return { bottom: s.bottom }
                }
                return s;
            })
            ,
        col: col
            .filter(s => s.left.length != 0 || s.right.length != 0)
            .map(s => {
                if (s.left.length == 0) {
                    return { right: s.right }
                } else if (s.right.length == 0) {
                    return { left: s.left }
                }
                return s;
            })
            ,
    }


}

class Mine {
    constructor(tr, td, mineNum) {
        this.tr = tr; // tr表示 横着一行有多少方块
        this.td = td; // td表示 竖着一列有多少方块
        this.mineNum = mineNum; // mineNum表示雷的数量
        this._count = this.tr * this.td; // 方块总数

        this.squares = []; // 存储所有方块的信息，一维数组，通过下标计算 x 和 y 坐标
        this.surplusMine = mineNum; // 剩余雷的数量
        this.allRight = false; // 右击标注的小红旗是否全部是雷，用来判断用户是否游戏成功


        for (let i = 0; i < this._count; i++) {
            this.squares.push({});
        }

        // 事件

        // 当格子被打开，包括点击的格子
        this.onOpen = function (index, number) {

        }
        // 显示雷
        this.onMine = function (index) {

        }
        // 显示或取消棋子
        this.onFlag = function (index, type) {
            // type = 1 显示
            // type = 0 取消
        }
        // 游戏通过
        this.onSuccess = function () { }
        // 游戏失败
        this.onFail = function () { }
    }
    _getX(index) {
        // x坐标，即 横着过去的下标
        return index % this.tr;
    }
    _getY(index) {
        // y坐标，即 竖着过去的下标
        return Math.floor(index / this.tr);
    }
    setMineCount(count){
        this.mineNum = count;
        this.surplusMine = count;
    }
    // 生成n个不重复的数字
    randomNum() {

        function shuffle(a) {
            for (let i = a.length; i; i--) {
                let j = Math.floor(Math.random() * i);
                [a[i - 1], a[j]] = [a[j], a[i - 1]];
            }
            return a;
        }


        var square = new Array(this.tr * this.td); // 生成一个空数组  长度为格子总数
        for (var i = 0; i < square.length; i++) {
            square[i] = i;
        }
        // 数组乱序
        // square.sort(function () { // 这种乱序非常不合适，不够乱
        //     return 0.5 - Math.random();
        // });

        square = shuffle(square);

        return square.slice(0, this.mineNum);
    }
    getMines() {
        return this.squares.map(s => s.type == 'mine' ? 1 : 0);
    }

    build(mine) {
        let rn = [];
        for (let i = 0; i < mine.length; i++) {
            if (mine[i] == 1) {
                rn.push(i);
            }
        }
        this._init(rn);
    }
    /**
     *
     * @param {*} rn 存储雷的下标
     */
    _init(rn) {
        var n = -1; // 用来找到对应的索引格子
        for (let i = 0; i < this.squares.length; i++) {
            if (rn.findIndex(s => s == i) != -1) {
                // 是雷
                this.squares[i] = {
                    flag: false,
                    check: false,
                    type: 'mine',
                };
            } else {
                this.squares[i] = {
                    flag: false,
                    check: false,
                    type: 'number',
                    value: 0
                };
            }
        }


        this.updateNum();
        this.surplusMine = this.mineNum;

    }
    init() {
        // this.randomNum();
        var rn = this.randomNum(); // 雷在格子里的位置
        this._init(rn);
    }
    // 找某个方格周围的八个格子，不包括雷，只返回是数字的格子
    getAround(index) {

        let result = [
            index - this.tr - 1,// 左上角
            index - this.tr,// 正上方
            index - this.tr + 1,// 右上角
            index - 1, // 左方
            index + 1,// 右方
            index + this.tr - 1,// 左下角
            index + this.tr, // 正下方
            index + this.tr + 1,// 右下方
        ];

        let x = this._getX(index);
        let y = this._getY(index);

        return result.filter(s => s >= 0 && s < this._count && this.squares[s].type == 'number'
            // 要求 周围格子 的x和y不能和中心格子差值不能超过1
            && Math.abs(this._getX(s) - x) <= 1
            && Math.abs(this._getY(s) - y) <= 1

        );
    }
    // 更新所有的数字
    updateNum() {

        for (let i = 0; i < this.squares.length; i++) {
            // 要更新的是雷周围的数字
            if (this.squares[i].type == 'number') {
                continue;
            }
            var num = this.getAround(i); // 获取到每一个雷周围的数字
            for (var k = 0; k < num.length; k++) {
                this.squares[num[k]].value += 1;

            }
        }
    }
    click(index, type) {



        let x = this._getX(index);
        let y = this._getY(index);
        console.log('click', index, this.squares.length, this.squares.length * x + y);
        let This = this;
        if (type == 1) {
            // 点击的是左键
            var curSquare = this.squares[index];
            if (curSquare.flag) {// 已标记
                return;
            }
            // cl 存储className
            if (curSquare.type == 'number') {
                // 用户点击的是数字
                this.onOpen(index, curSquare.value)

                // 点到了数字零
                if (curSquare.value == 0) {
                    /*
                        递归思路：
                        1.显示自己
                        2.查找四周
                            1) 显示四周（如果四周的值不为零，那就显示到这，不需要再找了）
                            2）如果值为零了
                                a.显示自己
                                b.找四周（如果四周的值不为零，那就显示到这，不需要再找了）
                                    I.显示自己
                                    II.找四周（如果四周的值不为零，那就显示到这，不需要再找了）
                                        。。。。。。
                     */

                    function getAllZero(zeroIndex) {
                        var around = This.getAround(zeroIndex); // 找到了周围N个格子
                        for (var i = 0; i < around.length; i++) {

                            // 直接打开，可能是0，不重要
                            This.onOpen(around[i], This.squares[around[i]].value);
                            // This.tds[x][y].className = cl[This.squares[x][y].value];

                            if (This.squares[around[i]].value == 0) {
                                // 如果以某个格子为中心，找到的某个格子为零，那就接着调用（递归）
                                if (!This.squares[around[i]].check) {
                                    // 给对应的td 添加一条属性，如果找过的话，这个值就为true，下一次就不会再找了，防止函数调用栈出问题
                                    This.squares[around[i]].check = true;
                                    getAllZero(around[i]);
                                }

                            } else {
                                // 如果以某个格子为中心找到的四周的值不为零，就把数字显示出来

                                // This.tds[x][y].innerHTML = This.squares[x][y].value;
                            }
                        }

                    }
                    getAllZero(index);
                }

            } else {
                // 用户点击的是雷
                this.gameOver(index);
                this.onFail();
            }
        } else if (type == 2) {
            // 用户点击的是右键
            // 如果右击的是一个数字，就不能点击

            this.squares[index].flag = !this.squares[index].flag; // 切换calss 有无

            if (this.squares[index].type == 'mine') {
                this.allRight = true;
            } else {
                this.allRight = false;
            }

            if (this.squares[index].flag) {
                this.onFlag(index, 1);
                this.surplusMine --;
            } else {
                this.surplusMine++;
                this.onFlag(index, 0);
            }

            if (this.surplusMine == 0) {
                // 剩余的雷的数量为0，表示用户已经标完小红旗了，这时候要判断游戏是成功还是结束
                if (this.allRight == true) {
                    // 这个条件成立，说明用户全部标对了
                    this.onSuccess();

                } else {
                    this.onFail();
                    this.gameOver();
                }
            }
        }

    }
    // 游戏失败函数
    gameOver() {
        /*
            1.显示所有的雷
            2.取消所有格子的点击事件
            3.给点中的格子标红
        */
        for (let i = 0; i < this.squares.length; i++) {
            if (this.squares[i].type == 'mine') {
                this.onMine(i);// 显示雷
            }

        }
        // if (clickTd) {
        //     clickTd.style.backgroundColor = '#f00';
        // }
    }
}







export default Mine;
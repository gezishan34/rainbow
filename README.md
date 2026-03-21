# rainbow绘图库

## 快速入手

准备一个`canvas`元素作为画布：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        *{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        #app{
            width: 100vw;
            height: 100vh;
            display: block;
        }
    </style>
</head>
<body>
    <canvas id="app"></canvas>
    <script type="module" src="./dist/index.js"></script>
</body>
</html>
```

在`JS`代码中初始化：

```ts
import { Rect, MouseDrawType,stage,mouseContext } from "../rainbow/dist/index.js"

try{
    stage.init({
        el: "#app",
        width: window.innerWidth,
        height: window.innerHeight,
    });
}catch(e){
    console.error(e);
}

mouseContext.setState(MouseDrawType.DottedFrame);  //设置鼠标绘制类型为箭头

const rect = new Rect(100, 100, 200, 150, {isDrag: true, isEvent: true});  //构建一个可拖拽的矩形

stage.add(rect);  //将矩形添加到舞台
stage.drawAll();  //绘制舞台上所有图形
```

**代码解析**

+ `stage`是`rainbow`的核心对象，用于描述画布舞台，构建的所有图形要进过`stage.add()`方法添加进舞台后才能绘制。
+ `mouseContext`是鼠标绘制上下文对象，通过`mouseContext.setState()`方法切换不同的鼠标绘制状态，方法接收一个`MouseDrawType`类型的枚举，支持的鼠标绘制行为包括：无任何行为(默认)、拖拽、虚线框、箭头、矩形等。

## 图形



## 鼠标绘制状态

铜鼓`mouseContext`的`setState()`方法切换不同的鼠标绘制状态，设置鼠标绘制行为后，可在画布的空白位置拖拽鼠标实现绘制，方法接收`MouseDrawType`类型的参数，支持的鼠标绘制行为如下：

|      类型       |             描述             |                           详细参数                           |
| :-------------: | :--------------------------: | :----------------------------------------------------------: |
|     `None`      |   默认行为，无任何绘制行为   |                          无任何操作                          |
|     `Drag`      |         拖拽画布行为         |                    画布往鼠标拽动方向移动                    |
|  `DottedFrame`  |        绘制虚线框行为        |                     鼠标松开框线立即消失                     |
|   `FreePath`    |           自由路径           |              自由画笔，根据鼠标移动路径绘制线条              |
|     `Rect`      |    绘制一个矩形添加进舞台    |             以鼠标按下和鼠标抬起位置连线为对角线             |
|    `Square`     |   绘制一个正方形添加进舞台   | 以鼠标按下位置作为顶点，<br>鼠标抬起位置与鼠标按下位置的`X`轴偏移量与y轴偏移量的较小值作为边长 |
|   `Rhomboid`    | 绘制一个平行四边形添加进舞台 |          上下两边与x轴平行，斜边与`X`轴夹角为`PI/4`          |
|   `RoundRect`   |  绘制一个圆角矩形添加进舞台  | 以鼠标按下和鼠标抬起位置连线为圆角矩形的外接矩形的对角线<br>圆角半径为较小边长的`1/8` |
| `RoundHeadRect` |  绘制一个圆头矩形添加进舞台  |   以鼠标按下和鼠标抬起位置连线为圆头矩形的外接矩形的对角线   |
|    `Rhombic`    |    绘制一个菱形添加进舞台    |     以鼠标按下和鼠标抬起位置连线为菱形的外接矩形的对角线     |
|    `Circle`     |     绘制一个圆添加进舞台     | 以鼠标按下和鼠标抬起位置连线中点为原点<br>以鼠标按下和鼠标抬起位置连线长度的直径 |
|    `Elipse`     |    绘制一个椭圆添加进舞台    |     以鼠标按下和鼠标抬起位置连线为椭圆的外接矩形的对角线     |
|   `Triangle`    |   绘制一个三角形添加进舞台   | 设鼠标按下位置为`(x1,y1)`，鼠标抬起位置为`(x2,y2)`<br>三角形`顶点1`坐标为：`((x1+x2)/2,y1)`<br>三角形`顶点2`坐标为：`(x1,y2)`<br/>三角形`顶点1`坐标为：`(x2,y2)`<br/> |
|     `Line`      |    绘制一条直线添加进舞台    |         以鼠标按下位置为起点<br>以鼠标抬起位置为终点         |
|     `Arrow`     |    绘制一条箭头添加进舞台    |        以鼠标按下位置为起点<br/>以鼠标抬起位置为终点         |




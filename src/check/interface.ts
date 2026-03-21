import { AssistLineType, DrawType, ElementType, ExportFormat } from "../enum/draw.js"; 
import { EventType } from "../enum/event.js"
import type { DirectionType, FontStyleType, FontWeight, LineCapType, LineJoinType, TextAlignType, TextBaselineType } from "../enum/style.js";
import type { IController } from "../graphics/controller.js";
/*
* 规范1：所有接口命令均以大写字母 I 开头
* 规范2：所有接口均使用 export type 导出，确保类型信息在编译后被移除，减小代码体积
*/

//全局对象的配置接口
export interface IGlobalConfig{
    el: string,  //canvas元素的选择器
    backgroudColor?: string,  //canvas的背景色，可选，默认 'white'
    backgroundConfig?: IBackgroundConfig,  //舞台的背景配置，可选
    snapshootStr?: string,  //快照序列字符串，可选
}

//基元图形接口
export interface ILeafGraphics {
    drawType: DrawType,  //绘制类型
    data: Path2D,  //路径数据
}

//图形接口（定义组合容器和基元图形都拥有的属性方法）
export interface IGraphics {
    id: string,  //图形的唯一id
    type: ElementType,  //元素类型

    //事件
    isEvent: boolean;  //是否可触发事件
    isDrag: boolean;  //是否可拖拽
    isMouseDown: boolean;  //是否鼠标按下状态
    isMouseMove: boolean;  //是否鼠标移入状态
    isDragging: boolean;  //是否拖拽中状态
    isSelected: boolean;  //是否被选中状态
    callbacks: Map<EventType, Function>;  //<事件，回调>注册表

    //界面显示
    drawType: DrawType,  //绘制类型
    style: IStyle;  //样式
    transform: ITransform;  //变换矩阵
    controller: IController | null;  //可选的外接控制器
    coorPoint: ICoor;  //坐标点
    recordPoint: ICoor;  //记录点
    leftTop: ICoor;  //图形的左上角坐标点
    rightBottom: ICoor;  //图形的右下角坐标点

    isEmpty(): boolean;  //判断是否为空
    updateStyle(style: IStyle): void;  //更新样式
    setStyle(style: IStyle): void;  //设置样式
    setRecordXY(xy: ICoor): void;  //设置记录点
    setXY(coor: ICoor): void;  //设置坐标点
    move(offset: ICoor): void;  //增量移动
    isInterior(e: IMousePos,transform?: ITransform): boolean;  //判断某点是否在图形内部
    updateMeasure(transform?: ITransform): void;  //更新尺寸数据
    updateDrawData(): void;  //更新绘制数据
    nudityDraw(): void;  //裸体绘制方法
    draw(transform?: ITransform, style?: IStyle): void;  //绘制方法
    runEvent(e: IMousePos,eventType: EventType): void;  //执行事件回调 
    addEventListener(eventType: EventType, callback: Function): void;  //注册事件回调
    setShowController(): void;  //设置显示控制器
    setController(): void;  //设置外接控制器
    removeController(): void;  //移除外接控制器
}

//组合容器接口
export interface IContainer extends IGraphics {
    isStable: boolean,  //是否稳定状态
    children: IGraphics[],  //子元素数组
    
    addChild(child: IElement): void,  //添加子元素
    removeChild(child: IElement): void,  //移除子元素
    spilt(): IElement[],  //将容器拆分成多个子容器
}

//图元
export type IElement = IContainer|IGraphics;

//矩形接口
export interface IRect {
    coorPoint: ICoor,  //坐标点
    width: number,
    height: number,
}

//线性接口
export interface ILine {
    coorPoint: ICoor,  //坐标点
    endPoint: ICoor,  //结束点
}

//三角形接口
export interface ITriangle {
    coorPoint: ICoor,  //坐标点
    coorPoint1: ICoor,  //坐标点1
    coorPoint2: ICoor,  //坐标点2
}

//元素快照接口
export interface IElementSnapshoot  {
    args: any[],  //图形构造参数
    type: ElementType,  //图元类型
    config: IGraphicsConfig|IContainerConfig,  //图形配置
    children?: IElementSnapshoot[],  //当type为容器时，包含子元素数组
}

//全局快照接口
export interface ISnapshoot {
    viewport: IViewport,  //视口状态
    elementSnapshoots: IElementSnapshoot[]  //图形元素数组
}

//通用样式配置接口
export interface IGraphicsStyle {
    strokeStyle?: string,  //描边样式
    fillStyle?: string,  //填充样式

    shadowColor?: string  //阴影颜色
    shadowBlur?: number  //阴影模糊度
    shadowOffsetX?: number  //阴影水平偏移量
    shadowOffsetY?: number  // 阴影垂直偏移量

    lineWidth?: number  //线条宽度
    lineCap?: LineCapType  //线帽类型：butt|round|square
    lineJoin?: LineJoinType  //拐角类型：miter|round|bevel

    lineDash?: number[]  //虚线数组：[实线长度，间隙长度，实现长度，间隙长度...]
    lineDashOffset?: number  //虚线偏移量

    globalAlpha?: number,  //全局透明度，0-1之间的数字，默认 1
}

//样式配置接口
export interface IStyle extends IGraphicsStyle {
    fontStyle?: FontStyleType,  //字体样式
    fontWeight?: FontWeight,  //字体粗细
    fontSize?: number,  //字体大小 单位：px
    fontFamily?: string,  //字体族
    direction?: DirectionType,  //文本方向
    textAlign?: TextAlignType,  //文本水平对齐方式
    textBaseline?: TextBaselineType,  //文本基线对齐方式
    letterSpacing?: number,  //字母间距，单位：em
    wordSpacing?: number  //单词间距，单位：em
}

//图形配置接口
export interface IGraphicsConfig {
    id?: string,  //图形的唯一id，可选
    isEvent?: boolean,  //是否需要监听事件，可选 默认 false
    isDrag?: boolean,  //是否可拖拽，可选 默认 false
    drawType?: DrawType,  //绘制类型，可选，默认 DrawType.StrokeAndFill
    style?: IStyle,  //图形的样式配置，可选
}

//容器配置接口
export interface IContainerConfig {
    id?: string,  //图形的唯一id，可选
    isStable?: boolean,  //是否稳定状态，可选 默认false
    isEvent?: boolean,  //是否需要监听事件，可选 默认 false
    isDrag?: boolean,  //是否可拖拽，可选 默认 false
    style?: IStyle,  //图形的样式配置，可选
}

//背景配置接口
export interface IBackgroundConfig {
    isAssetLine?: boolean | undefined,  //是否显示辅助线, 可选 默认 true
    assistLineType?: AssistLineType | undefined,  //辅助线类型
    gridSize?: number | undefined,  //点线间距，可选，默认 50
    isBackground?: boolean | undefined,  //是否显示背景，可选，默认false
    backgroundColor?: string | undefined,  //背景颜色，可选，默认 #ffffff
}

export type IEventInfo = Event | MouseEvent | KeyboardEvent | WheelEvent;

//事件注册信息接口
export interface IEventListener {
    target: EventTarget,  //事件目标对象
    type: EventType,  //事件类型
    handler: (e?: IEventInfo) => void,  //事件处理函数
}

//视口状态接口
export interface IViewport {
    offsetX: number, // 视口X偏移
    offsetY: number, // 视口Y偏移
    scale: number,   // 缩放比例（1=100%，>1放大，<1缩小）
}

//状态转换矩阵
export interface ITransform {
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
}

//缩放配置接口
export interface IZoom {
    minScale: number, // 最小缩放比例
    maxScale: number,   // 最大缩放比例
    moveSpeed: number, // 滚轮平移速度（像素/滚轮步长）
    scaleSpeed: number // 滚轮缩放速度（比例/滚轮步长）
    keyMoveSpeed: number // 键盘平移速度（像素/按键）
} 

//基本坐标接口
export interface ICoor {
    x: number,
    y: number
}

//图形级鼠标坐标接口
export interface IMousePos {
    //x,y: 鼠标的世界坐标
    world: ICoor,
    //screenX,screenY: 鼠标的屏幕坐标
    screen: ICoor,
    //图形变化矩阵下的坐标
    graph?: ICoor,
    //graphX,graphY: 鼠标相对于图形的坐标（变换矩阵坐标系）
     offset?: ICoor,
}

// 导出画面设置接口
export interface IExportImageConfig {
    isSelectedOnly?: boolean | undefined,  //是否仅导出选中内容，默认 false
    isAssistLine?: boolean | undefined,  //是否导出辅助线，默认 false
    isBackground?: boolean | undefined,  //是否包含背景，默认 false
    backgroundColor?: string | undefined,  //背景颜色，默认 #ffffff，若isBackground为false则忽略
}

// 导出配置接口
export interface IExportOption extends IExportImageConfig {
  format: ExportFormat,  //导出格式
  quality?: number,  //JPEG质量
}

//鼠标状态接口
export interface IMouseState{
    MouseDown(coor: IMousePos): void,
    MouseMove(coor: IMousePos): void,
    MouseUp(coor: IMousePos): void,
    MouseLeave(coor: IMousePos): void
}



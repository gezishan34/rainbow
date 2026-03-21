import type { IStyle, ITransform, IZoom } from "../check/interface";

//绘制类型
export enum DrawType {
    Fill,  //填充
    Stroke,  //描边
    StrokeAndFill  //描边并填充
}

//图元类型
export enum ElementType {
    Container = "Container",  //容器元素
    Graphics = "Graphics",  //基本图形元素
    Rect = "Rect",  //矩形
    RoundHeadRect = "RoundHeadRect",  //圆头矩形
    RoundRect = "RoundRect",  //圆角矩形
    Rhomboid = "Rhomboid",  //平行四边形
    Rhombic = "Rhombic",  //菱形
    Elipse = "Elipse",  //椭圆
    Triangle = "Triangle",  //三角形
    FreePath = "FreePath",  //自由路径
    Line = "Line",  //直线
    Arrow = "Arrow",  //箭头
    Text = "Text"  //文本
}

//支持的鼠标绘制类型
export enum MouseDrawType {
    None,  //无任何绘制行为
    Drag,  //拖拽画布行为
    Select,  //选择行为
    FreePath,  //自由路径
    Rect,  //矩形
    Square,  //正方形
    Rhomboid,  //平行四边形
    RoundRect,  //圆角矩形
    RoundHeadRect,  //圆头矩形
    Rhombic,  //菱形
    Circle,  //圆
    Elipse,  //椭圆
    Line,  //直线
    Triangle,  //三角形
    Arrow,  //箭头
    Text,  //文本
}

//支持的辅助线类型
export enum AssistLineType {
    Grid,  //网格辅助线
    Lattice,  //点阵辅助线
}

// 支持的导出文件格式类型
export enum ExportFormat {
    PNG = 'image/png',
    SVG = 'image/svg+xml',
    JPEG = 'image/jpeg',
    JSON = 'json'
}

//支持的鼠标样式类型
export enum MouseStyleType {
    /**
     * 默认鼠标样式
     */
    Default = 'default',  
    /**
     * 手型
     */
    Pointer = 'pointer',  
    /**
     * 张开的手型
     */
    Grab = 'grab', 
    /**
     * 握紧的手型
     */
    Grabbing = 'grabbing',  
    /**
     * 十字线绘图
     */
    Crosshair = 'crosshair',  
    /**
     * 十字箭头移动
     */
    Move = 'move', 
    /**
     * 文本输入
     */
    Text = 'text',  
    /**
     * 帮助
     */
    Help = 'help',  
    /**
     * 画笔
     */
    Pen = 'pen',  
    /**
     * 禁止操作
     */
    NotAllowed = 'not-allowed',  
    /**
     * 西北东南调整大小↖️↘️
     */
    ResizeNwse = 'nwse-resize',
    /**
     * 东北西南调整大小↗️↙️
     */  
    ResizeNeSw = 'nesw-resize',  
    /**
     * 水平调整大小↔️
     */
    ResizeEw = 'ew-resize',  
    /**
     * 垂直调整大小↕️
     */
    ResizeNs = 'ns-resize'
}

//默认的变换矩阵
export const DefTransform: ITransform = Object.freeze({
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0
})

//默认缩放/移动配置
export const DefZoom: IZoom = Object.freeze({
    minScale: 0.1, // 最小缩放比例
    maxScale: 5,   // 最大缩放比例
    moveSpeed: 50, // 滚轮平移速度（像素/滚轮步长）
    scaleSpeed: 0.1, // 滚轮缩放速度（比例/滚轮步长）
    keyMoveSpeed: 1 // 键盘平移速度（像素/按键）
})

//默认的鼠标按下图形样式
export const DefMouseDownStyle: IStyle = Object.freeze({  //改变阴影样式以示反馈
    shadowColor: "red",
    shadowBlur: 10
})

//默认的选中图形样式
export const DefSelectedStyle: IStyle = Object.freeze({  //改变阴影样式以示反馈
    shadowColor: "blue",
    shadowBlur: 10
});

//默认的未选中图形样式
export const DefUnSelectedStyle: IStyle = Object.freeze({  //恢复阴影样式以示反馈
    shadowBlur: 0
});

//默认的控制外接矩形规格
export const DefControllerRectScale = Object.freeze({
    PointD: 12
});
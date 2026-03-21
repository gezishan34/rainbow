//线帽类型
export enum LineCapType {
    Butt = 'butt',  //默认，平直线帽
    Round = 'round',  //圆形线帽
    Square = 'square'  //正方形线帽
}

//连接线之间拐角类型
export enum LineJoinType {
    Miter = 'miter',  //尖角（默认，线段延长线相交形成尖角）
    Round = 'round',  //圆角（拐角为半圆，半径 = 线宽的一半）
    Bevel = 'bevel'  //斜角（拐角被截断，形成平角）
}

//文本方向类型
export enum DirectionType {
    Inherit = 'inherit',  //默认，继承父元素的方向
    Ltr = 'ltr',  //从左到右
    Rtl = 'rtl'  //从右到左
}

//字体样式类型
export enum FontStyleType {
    Normal = 'normal',  //默认，正常字体样式
    Italic = 'italic',  //斜体字体样式
    Oblique = 'oblique',  //倾斜字体样式
}

//字体粗细类型
export enum FontWeightType {
    Normal = 'normal',  //默认，正常字体粗细
    Bold = 'bold',  //加粗字体粗细
}

export type FontWeight = FontWeightType | number;

//文本水平对齐类型
export enum TextAlignType {
    Start = 'start',  //默认，文本从起始位置开始对齐(x坐标为文本起始位置)
    End = 'end',  //文本从结束位置开始对齐(x坐标为文本结束位置)
    Left = 'left',  //文本左对齐(x坐标为文本左边界)
    Right = 'right',  //文本右对齐(x坐标为文本右边界)
    Center = 'center'  //文本居中对齐(x坐标为文本框中心)
}

//文本垂直对齐类型
export enum TextBaselineType {
    Alphabetic = 'alphabetic',  //默认，文本基线对齐(y坐标为文本基线)
    Top = 'top',  //文本顶部对齐(y坐标为文本顶部)
    Hanging = 'hanging',  //悬挂基线对齐(y坐标为悬挂基线)
    Middle = 'middle',  //文本中部对齐(y坐标为文本框中心)
    Ideographic = 'ideographic',  //表意基线对齐(y坐标为表意基线)
    Bottom = 'bottom'  //文本底部对齐(y坐标为文本底部)
}
import type { ICoor, IGraphics, IGraphicsConfig,ILeafGraphics,ILine,IMousePos, IRect, ITransform, ITriangle, IStyle } from "../check/interface.js";
import { DefTransform, DefUnSelectedStyle, DrawType, ElementType, MouseStyleType } from "../enum/draw.js";
import { EventType } from "../enum/event.js";
import Global from "../global.js";
import { IDGenerator, ObjectUtils } from "../independent/utils.js";
import { CoorUtils, DrawUtils, StyleUtils } from "../utils/business.js";
import { Atom } from "../decorator/decorator.js";
import { LineCapType, LineJoinType, TextBaselineType } from "../enum/style.js";
import { ControllerRectType, FreeController, LineController, RectController, ShowController, type IController } from "./controller.js";
import {mouseContext} from "../mouseBehavior/mouseContext.js";
import { Editor } from "../utils/editor.js";
import { stage } from "../app.js";

//基本图形父类
export abstract class Graphics implements ILeafGraphics, IGraphics {
    type: ElementType;
    data: Path2D;  //js原生路径对象
    isEvent: boolean;  //是否参与事件触发
    isDrag: boolean;  //是否可拖拽
    isMouseDown: boolean;  //是否鼠标按下状态
    isMouseMove: boolean;  //是否鼠标移入状态
    isDragging: boolean;  //是否拖拽中状态
    isSelected: boolean;  //是否被选中状态
    callbacks: Map<EventType, Function>;  //<事件，回调>注册表

    drawType: DrawType;  //绘制类型,填充/描边
    id: string;  //图形唯一id
    style: IStyle;  //样式
    transform: ITransform;  //变换矩阵
    controller: IController | null = null;  //可选的外接控制器
    coorPoint: ICoor;  //坐标点
    recordPoint: ICoor;  //记录点
    leftTop: ICoor;  //图形的左上角坐标点
    rightBottom: ICoor;  //图形的右下角坐标点
    constructor(
        x: number,
        y: number,
        config?: IGraphicsConfig
    ){
        this.type = ElementType.Graphics;
        this.data = new Path2D();
        this.isDragging = false;
        this.isSelected = false;
        this.isMouseDown = false;
        this.isMouseMove = false;
        this.callbacks = new Map<EventType, Function>();
        this.coorPoint = {x, y};
        this.recordPoint = {x: 0,y: 0};
        this.leftTop = {x, y};
        this.rightBottom = {x, y};
        
        this.drawType = config?.drawType??DrawType.StrokeAndFill;  //绘制样式：填充&描边
        this.isEvent = config?.isEvent??false;  //是否可触发事件，默认false
        this.isDrag = config?.isDrag??false;  //是否可拖拽，没有指定则为false，需要isEvent为true，可拖拽才生效
        this.id = config?.id??IDGenerator.randomID();  //如果没有指定id,则生成一个唯一id
        this.style = config?.style??{};  //如果没有指定样式,则使用默认样式
        this.transform = {...DefTransform};  //使用默认变换矩阵
        if(this.isDrag){
            this.setEventDrag();
        }
    }
    abstract setController(): void;  //设置图形的控制器

    /**
     * 更新图形的尺寸数据，包括：\
     * 左上角坐标点、右下角坐标点、宽度、高度等
     * @param transform 变换矩阵
     */
    abstract updateMeasure(transform?: ITransform): void;  //更新尺寸数据
    abstract isEmpty(): boolean;  //判断是否为空
    setXY(coor: ICoor): void {
        this.coorPoint.x = coor.x;
        this.coorPoint.y = coor.y;
    }
    setRecordXY(coor: ICoor): void {
        this.recordPoint.x = coor.x;
        this.recordPoint.y = coor.y;
    }
    setStyle(style: IStyle): void {
        this.style = ObjectUtils.getDeepCopy(style);
    }
    setShowController(): void {  //设置显示控制器
        if(this.controller){
            this.controller.destroy();
        }
        this.controller = new ShowController(this);
    }
    updateStyle(style: IStyle): void{
        Object.assign(this.style, style);
    }
    move(offset: ICoor): void {  //增量移动
        CoorUtils.addCoor(this.coorPoint, offset);
        CoorUtils.addCoor(this.leftTop, offset);
        CoorUtils.addCoor(this.rightBottom, offset);
    }
    @Atom isInterior(e: IMousePos, transform: ITransform = this.transform): boolean {  //判断某点是否在图形内部
        CoorUtils.transform(transform);
        const vis = this.drawType === DrawType.Stroke?
        Global.ctx.isPointInStroke(this.data, e.screen.x, e.screen.y):
        Global.ctx.isPointInPath(this.data, e.screen.x, e.screen.y);
        return vis;
    }
    erasure(){  //擦除当前区域
        Global.ctx.save();
        Global.ctx.globalCompositeOperation = 'destination-out';
        Global.ctx.beginPath();
        // 直接使用当前data（已更新为当前位置路径）擦除
        if(this.drawType === DrawType.StrokeAndFill){
            Global.ctx.stroke(this.data);
            Global.ctx.fill(this.data);
        }else if (this.drawType === DrawType.Fill) {
            Global.ctx.fill(this.data);
        } else {
            Global.ctx.stroke(this.data);
        }
        Global.ctx.restore();
    }
    updateDrawData(): void {  //更新绘制数据
        if(this.controller){
            this.controller.updateDrawData();
        }
    }  
    removeController(): void {  //释放控制器
        this.controller?.destroy();
        this.controller = null;
    };
    @Atom nudityDraw(){
        this.updateDrawData();
        StyleUtils.setStyleByGlobal(this.style);
        Global.ctx.beginPath();
        if(this.drawType === DrawType.StrokeAndFill){
            Global.ctx.stroke(this.data);
            Global.ctx.fill(this.data);
        }else if (this.drawType === DrawType.Fill) {
            Global.ctx.fill(this.data);
        } else {
            Global.ctx.stroke(this.data);
        }
        if(this.controller){
            this.controller.draw();
        }
    }  
    @Atom draw(transform: ITransform = this.transform, style: IStyle = this.style): void {
        DrawUtils.setContext(transform, style);  //绘制前设置图形的上下文环境
        this.updateDrawData();
        Global.ctx.beginPath();
        if(this.drawType === DrawType.StrokeAndFill){
            Global.ctx.stroke(this.data);
            Global.ctx.fill(this.data);
        }else if (this.drawType === DrawType.Fill) {
            Global.ctx.fill(this.data);
        } else {
            Global.ctx.stroke(this.data);
        }
        if(this.controller){
            this.controller.draw();
        }  
    }
    runEvent(e: IMousePos,eventType: EventType): void {  //执行事件回调
        const callback = this.callbacks.get(eventType);
        if(callback){
            callback(e);
        }
    }  
    addEventListener(eventType: EventType, callback: Function): void {
        this.callbacks.set(eventType, callback);
    }
    //添加事件的快捷方法
    setEventClick(callback: Function): void {
        this.addEventListener(EventType.Click, callback);
    }
    setEventDblclick(callback: Function): void {
        this.addEventListener(EventType.Dblclick, callback);
    }
    setEventMouseMove(callback: Function): void {
        this.addEventListener(EventType.MouseMove, callback);
    }
    setEventDragMove(callback: Function): void {
        this.addEventListener(EventType.DragMove, callback);
    }
    setEventMouseDown(callback: Function): void {
        this.addEventListener(EventType.MouseDown, callback);
    }
    setEventMouseUp(callback: Function): void {
        this.addEventListener(EventType.MouseUp, callback);
    }
    setEventMouseLeave(callback: Function): void {
        this.addEventListener(EventType.MouseLeave, callback);
    }
    //添加拖拽事件
    private setEventDrag(){

        //设置鼠标移入事件回调
        this.setEventMouseMove((e: IMousePos) => {
            mouseContext.setMouseStyleType(MouseStyleType.Move);
        });

        //设置鼠标按下事件回调
        this.setEventMouseDown((e: IMousePos) => {
            this.setRecordXY(e.world);
        });  

        //设置拖拽移动事件回调
        this.setEventDragMove((e: IMousePos) => {
            // 计算图形移动偏移量
            const offset = {
                x: (e.world.x - this.recordPoint.x)/this.transform.a,   
                y: (e.world.y - this.recordPoint.y)/this.transform.d
            }
            this.setRecordXY(e.world);
            
            //更新坐标
            this.move(offset); 
        });

        //设置鼠标抬起事件回调
        this.setEventMouseUp((e: IMousePos) => {
            this.updateStyle(DefUnSelectedStyle);
        });

        //设置鼠标移开事件回调
        this.setEventMouseLeave((e: IMousePos) => {
            mouseContext.setMouseStyleType(mouseContext.getState().mouseStyleType);
            this.updateStyle(DefUnSelectedStyle);
        })
    }
}

//矩形父类
export abstract class FaRect extends Graphics implements IRect{
    width: number;
    height: number;

    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        config?: IGraphicsConfig,
    ){
        super(x, y, config);
        this.width = width;
        this.height = height;
        this.leftTop = {x: Math.min(x, x + this.width), y: Math.min(y, y + this.height)};
        this.rightBottom = {x: Math.max(x, x + this.width), y: Math.max(y, y + this.height)};
    }
    override isEmpty(): boolean {
        return this.width === 0 || this.height === 0;
    }
    override setController(): void {
        this.controller = new RectController(this);
    }
    override updateMeasure(transform: ITransform = this.transform): void {
        this.coorPoint = CoorUtils.getAbsCoorByTransform(this.coorPoint, transform);
        this.width *= transform.a;
        this.height *= transform.d;
        const {x,y} = this.coorPoint;
        this.leftTop = {x: Math.min(x, x + this.width), y: Math.min(y, y + this.height)};
        this.rightBottom = {x: Math.max(x, x + this.width), y: Math.max(y, y + this.height)};
        
        if(transform === this.transform){
            this.transform = {...DefTransform};
        }
    }
}

//矩形
export class Rect extends FaRect{
    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        config?: IGraphicsConfig
    ){
        super(x, y, width, height, config);
        this.type = ElementType.Rect;
    }
    override updateDrawData(): void {
        // 重置Path2D，清除历史路径
        this.data = new Path2D(); 
        // 添加当前位置的新路径
        this.data.rect(this.coorPoint.x, this.coorPoint.y, this.width, this.height);
        super.updateDrawData();
    }
}

//圆头矩形
export class RoundHeadRect extends FaRect{
    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        config?: IGraphicsConfig
    ){
        super(x, y, width, height, config);
        this.type = ElementType.RoundHeadRect;
    }
    override updateDrawData(): void {
        //支持width或height为负数的情况
        let r = Math.abs(this.height)/2;
        let vis = this.height * this.width < 0;  //判断是否为逆时针方向
        let xd = this.width>0? 1 : -1;
        let yd = this.height>0? 1 : -1;

        const {x,y} = this.coorPoint;
        // 重置Path2D，清除历史路径
        this.data = new Path2D(); 
        this.data.arc(x + xd*r, y + yd*r, r, yd*Math.PI/2, yd*3*Math.PI/2, vis);
        this.data.lineTo(x + this.width - xd*r, y);
        this.data.arc(x + this.width - xd*r, y + yd*r, r, yd*3*Math.PI/2, yd*Math.PI/2, vis);
        this.data.closePath();
        super.updateDrawData();
    }
}

//圆角矩形
export class RoundRect extends FaRect{
    radius: number;  //圆角的弧度
    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,  //圆角的半径
        config?: IGraphicsConfig
    ){
        super(x, y, width, height, config);
        this.type = ElementType.RoundRect;
        this.radius = radius;
    }
    override updateMeasure(transform: ITransform = this.transform): void {
        this.radius *= Math.max(Math.abs(transform.a), Math.abs(transform.d));
        super.updateMeasure(transform);
    }
    override updateDrawData(): void {
        // 重置Path2D，清除历史路径
        this.data = new Path2D(); 
        // 添加当前位置的新路径
        this.data.roundRect(this.coorPoint.x, this.coorPoint.y, this.width, this.height, this.radius);
        super.updateDrawData();
    }
}

//平行四边形
export class Rhomboid extends FaRect{
    angleX: number;  //相对于x轴的夹角
    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        angleX: number,  //相对于x轴的夹角
        config?: IGraphicsConfig
    ){
        super(x, y, width, height, config);
        this.type = ElementType.Rhomboid;
        this.angleX = angleX;
    }
    override updateDrawData(): void {
        // 重置Path2D，绘制平行四边形
        let {x,y} = this.coorPoint;
        let w = this.width, h = this.height;
        let dx = Math.abs(h)/Math.tan(this.angleX);
        dx = w>0? -dx : dx;  //符号与w相反

        //使用指令字符绘制菱形
        this.data = new Path2D(`m${x} ${y},
                                l${w+dx} ${0},
                                l${-dx} ${h},
                                l${-(w+dx)} ${0},z`);   
        super.updateDrawData();
    }
}

//菱形
export class Rhombic extends FaRect{
    constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        config?: IGraphicsConfig
    ){
        super(x, y, width, height, config);
        this.type = ElementType.Rhombic;
    }
    override updateDrawData(): void {
        // 重置Path2D，绘制菱形
        let {x,y} = this.coorPoint;
        let dx = this.width/2, dy = this.height/2;

        //使用指令字符绘制菱形
        this.data = new Path2D(`m${x} ${y + dy},
                                l${dx} ${-dy},
                                l${dx} ${dy},
                                l${-dx} ${dy},z`);  
        super.updateDrawData();
    }
}

//椭圆形
export class Elipse extends FaRect{
    constructor(
        x: number,  //外接圆左上角x坐标
        y: number,  //外接圆左上角y坐标
        width: number,
        height: number,
        config?: IGraphicsConfig
    ){
        super(x, y, width, height, config);
        this.type = ElementType.Elipse;
    }
    override updateDrawData(): void {
        // 重置Path2D，清除历史路径
        this.data = new Path2D();
        this.data.ellipse(this.coorPoint.x + this.width/2, this.coorPoint.y + this.height/2, this.width/2, this.height/2, 0, 0, 2 * Math.PI);
        super.updateDrawData();
    }
}

//三角形
export class Triangle extends Graphics implements ITriangle{
    public coorPoint1: ICoor;
    public coorPoint2: ICoor;
    constructor(
        x: number,
        y: number,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        config?: IGraphicsConfig
    ){
        super(x, y, config);
        this.type = ElementType.Triangle;
        this.coorPoint1 = {x: x1, y: y1};
        this.coorPoint2 = {x: x2, y: y2};
        this.leftTop = {x: Math.min(x, x1, x2), y: Math.min(y, y1, y2)};
        this.rightBottom = {x: Math.max(x, x1, x2), y: Math.max(y, y1, y2)};
    }
    override move(offset: ICoor): void {  //三角形移动
        CoorUtils.addCoor(this.coorPoint1, offset);
        CoorUtils.addCoor(this.coorPoint2, offset);
        super.move(offset);
    }
    override setController(): void {
        const coors: ICoor[] = [this.coorPoint, this.coorPoint1, this.coorPoint2];
        this.controller = new FreeController(this, coors);
    }
    override updateMeasure(transform: ITransform = this.transform): void {
        //使用Object.assign更新坐标，避免直接修改引用
        Object.assign(this.coorPoint, CoorUtils.getAbsCoorByTransform(this.coorPoint, transform));
        Object.assign(this.coorPoint1, CoorUtils.getAbsCoorByTransform(this.coorPoint1, transform));
        Object.assign(this.coorPoint2, CoorUtils.getAbsCoorByTransform(this.coorPoint2, transform));
        const {x, y} = this.coorPoint;
        const {x: x1, y: y1} = this.coorPoint1;
        const {x: x2, y: y2} = this.coorPoint2;
        this.leftTop = {x: Math.min(x, x1, x2), y: Math.min(y, y1, y2)};
        this.rightBottom = {x: Math.max(x, x1, x2), y: Math.max(y, y1, y2)};
    }
    override updateDrawData(): void {
        // 重置Path2D，清除历史路径
        this.data = new Path2D(
            `M ${this.coorPoint.x} ${this.coorPoint.y} 
            L ${this.coorPoint1.x} ${this.coorPoint1.y} 
            L ${this.coorPoint2.x} ${this.coorPoint2.y} Z`
        ); 
        super.updateDrawData();
    }
    override isEmpty(): boolean {
        return CoorUtils.equalCoor(this.coorPoint, this.coorPoint1) || CoorUtils.equalCoor(this.coorPoint, this.coorPoint2);
    }
}

//自由路径曲线
export class FreePath extends Graphics{
    public points: ICoor[] = [];
    
    constructor(
        x: number,
        y: number,
        points: ICoor[] = [],
        config?: IGraphicsConfig
    ) {
        const pathConfig = {
            ...config,
            drawType: DrawType.Stroke,
            style: {
                lineWidth: 5,
                lineJoin: LineJoinType.Round,
                lineCap: LineCapType.Round
            }
        };
        super(x, y, pathConfig);
        this.type = ElementType.FreePath;
        
        // 添加初始点
        if (points.length > 0) {
            this.points = points;
        } else {
            this.points.push({ x, y });
        }
        this.leftTop = {x: Math.min(...this.points.map(p => p.x)), y: Math.min(...this.points.map(p => p.y))};
        this.rightBottom = {x: Math.max(...this.points.map(p => p.x)), y: Math.max(...this.points.map(p => p.y))};
    }
    
    // 添加点到路径
    addPoint(x: number, y: number): void {
        this.points.push({ x, y });
    }
    
    override move(offset: ICoor): void {
        // 更新所有点的坐标
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            if (p) {
                p.x += offset.x;
                p.y += offset.y;
            }
        }
        super.move(offset);
    }
    override setController(): void {
        // this.controllerRect = new ControllerRect(this.x, this.y, 3, 2, this);
    }
    override updateMeasure(transform: ITransform = this.transform): void {
        this.coorPoint = CoorUtils.getAbsCoorByTransform(this.coorPoint, transform);
        this.points = this.points.map(p => CoorUtils.getAbsCoorByTransform(p, transform));
        this.leftTop = {x: Math.min(...this.points.map(p => p.x)), y: Math.min(...this.points.map(p => p.y))};
        this.rightBottom = {x: Math.max(...this.points.map(p => p.x)), y: Math.max(...this.points.map(p => p.y))};
        
    }
    override updateDrawData(): void {
        if (this.points.length < 2) return;
        
        // 重置Path2D，清除历史路径
        this.data = new Path2D();
        
        // 绘制路径
        const start = this.points[0];
        if (!start) return;
        this.data.moveTo(start.x, start.y);
        
        // 使用二次贝塞尔曲线绘制平滑路径
        for (let i = 1; i < this.points.length - 1; i++) {
            const prev = this.points[i];
            const current = this.points[i + 1];
            if (!prev || !current) continue;
            
            // 计算控制点
            const cpx = (prev.x + current.x) / 2;
            const cpy = (prev.y + current.y) / 2;
            
            // 添加二次贝塞尔曲线
            this.data.quadraticCurveTo(prev.x, prev.y, cpx, cpy);
        }
        
        // 添加最后一段直线
        const last = this.points[this.points.length - 1];
        const secondLast = this.points[this.points.length - 2];
        if (last && secondLast) {
            this.data.lineTo(last.x, last.y);
        }
        super.updateDrawData();
    }
    override isEmpty(): boolean {
        return this.points.length < 2;
    }
}

//直线
export class Line extends Graphics implements ILine {
    endPoint: ICoor;
    constructor(
        x: number,
        y: number,
        xTo: number,
        yTo: number,
        config?: IGraphicsConfig
    ) {
        const lineConfig = {
            ...config,
            drawType: DrawType.Stroke,  //绘制类型固定为描边
            style:{
                lineWidth: 3,  //线宽固定为3
            }
        };
        
        super(x,y,lineConfig);
        this.type = ElementType.Line;
        this.endPoint = {
            x: xTo,
            y: yTo,
        }
        this.leftTop = {x: Math.min(x, xTo), y: Math.min(y, yTo)};
        this.rightBottom = {x: Math.max(x, xTo), y: Math.max(y, yTo)};
        this.style = lineConfig.style;
        
    }
    moveStart(offset: ICoor): void {
        super.move(offset);
    }
    moveEnd(offset: ICoor): void {
        this.endPoint.x += offset.x;
        this.endPoint.y += offset.y;
    }
    setEndPoint(coor: ICoor): void {
        this.endPoint = {...coor};
    }
    override move(offset: ICoor): void {
        // 更新终点坐标，保持相对位置不变
        CoorUtils.addCoor(this.endPoint, offset);
        super.move(offset);
    }
    override setController(): void {
        this.controller = new LineController(this);
    }
    override updateMeasure(transform: ITransform = this.transform): void {
        this.coorPoint = CoorUtils.getAbsCoorByTransform(this.coorPoint, transform);
        this.endPoint = CoorUtils.getAbsCoorByTransform(this.endPoint, transform);
        const {x,y} = this.coorPoint;
        const {x: xTo, y: yTo} = this.endPoint;
        this.leftTop = {x: Math.min(x, xTo), y: Math.min(y, yTo)};
        this.rightBottom = {x: Math.max(x, xTo), y: Math.max(y, yTo)};
    }
    override updateDrawData(): void {
        // 重置Path2D，清除历史路径
        this.data = new Path2D(
            `M ${this.coorPoint.x} ${this.coorPoint.y} L ${this.endPoint.x} ${this.endPoint.y}`
        ); 
        super.updateDrawData();
    }
    override isEmpty(): boolean {
        return CoorUtils.equalCoor(this.coorPoint, this.endPoint);
    }
}

//箭头
export class Arrow extends Line {
    constructor(
        x: number,
        y: number,
        xTo: number,
        yTo: number,
        config?: IGraphicsConfig
    ) {
        const lineConfig = {
            ...config,
            drawType: DrawType.Stroke,  //绘制类型固定为描边
            style:{
                lineWidth: 3,  //线宽固定为3
            }
        };
        
        super(x,y,xTo,yTo,lineConfig);
        this.type = ElementType.Arrow;
    }
    override updateDrawData(): void {
        const {x: xTo, y: yTo} = this.endPoint;
        // 重置Path2D，清除历史路径
        super.updateDrawData();  //先绘制直线部分

        // 计算直线与X轴夹角
        const angle = Math.atan2(yTo - this.coorPoint.y, xTo - this.coorPoint.x);
        const arrowLength = 15; // 箭头长度
        const arrowAngle = Math.PI / 5; // 箭头与线的夹角30度 
        // 计算箭头头步端点的坐标
        const x1Arrow = xTo - arrowLength * Math.cos(angle - arrowAngle);
        const y1Arrow = yTo - arrowLength * Math.sin(angle - arrowAngle);
        const x2Arrow = xTo - arrowLength * Math.cos(angle + arrowAngle);
        const y2Arrow = yTo - arrowLength * Math.sin(angle + arrowAngle);
        // 绘制箭头头部
        this.data.moveTo(xTo, yTo);
        this.data.lineTo(x1Arrow, y1Arrow);
        this.data.moveTo(xTo, yTo);
        this.data.lineTo(x2Arrow, y2Arrow);
    }
}

//文本
export class Text extends Graphics implements IRect {
    width: number;  //文本外接矩形的宽度
    height: number;  //文本外接矩形的高度
    constructor(
        x: number,  //文本外接矩形的左上角x坐标
        y: number,  //文本外接矩形的左上角y坐标
        public text: string,  //文本内容
        config?: IGraphicsConfig  //图形配置
    ) {
        const textConfig = {
            ...config,
            drawType: DrawType.Fill,  //绘制类型默认为填充
            style:{
                textBaseline: TextBaselineType.Top,  //文本基线默认为顶部
                fontSize: 30,  //字体大小默认为30px
                fontFamily: "sans-serif",  //字体族默认为sans-serif
                ...config?.style
            },
        };
        
        super(x,y,textConfig);
        this.type = ElementType.Text;
        this.width = Global.ctx.measureText(this.text).width * (textConfig.style.fontSize / 10);  
        this.height = textConfig.style.fontSize*1.1;  
        this.leftTop = {x: Math.min(x, x + this.width), y: Math.min(y, y + this.height)};
        this.rightBottom = {x: Math.max(x, x + this.width), y: Math.max(y, y + this.height)};
        this.style = textConfig.style;
        if(this.isEvent){
            this.setEventDblclick((event: MouseEvent)=>{  //注册双击事件
                if (stage) {
                    stage.isEditing = true;
                }
                const editor = Editor.create(this);
                editor.showInputAtPosition();
            })
        }
    }
    override isEmpty(): boolean {
        return this.text === '';
    }
    override setController(): void {
        this.controller = new RectController(this, ControllerRectType.Corner);
    }
    
    override updateMeasure(transform: ITransform = this.transform): void {
        this.coorPoint = CoorUtils.getAbsCoorByTransform(this.coorPoint, transform);
        this.height *= transform.d;
        this.style.fontSize = this.height / 1.1;
        this.width = Global.ctx.measureText(this.text).width * (this.style.fontSize! / 10);
        const {x,y} = this.coorPoint;
        this.leftTop = {x: Math.min(x, x + this.width), y: Math.min(y, y + this.height)};
        this.rightBottom = {x: Math.max(x, x + this.width), y: Math.max(y, y + this.height)};
        
        if(transform === this.transform){
            this.transform = {...DefTransform};
        }
    }
    override updateDrawData(): void {
        this.data = new Path2D(); 
        this.data.rect(this.coorPoint.x, this.coorPoint.y, this.width, this.height);
        super.updateDrawData(); 
    }
    setText(text: string): void{
        this.text = text;
        this.updateMeasure();  //更新尺寸数据
    }
    @Atom override nudityDraw(): void {
        this.updateDrawData();  //更新绘制数据
        StyleUtils.setStyleByGlobal(this.style);
        Global.ctx.beginPath();
        if (this.drawType === DrawType.Stroke) {
            Global.ctx.stroke(this.data);
            Global.ctx.strokeText(this.text, this.coorPoint.x, this.coorPoint.y);
        } else {
            Global.ctx.globalAlpha = 0;
            Global.ctx.fill(this.data);
            Global.ctx.globalAlpha = 1;
            Global.ctx.fillText(this.text, this.coorPoint.x, this.coorPoint.y);
        } 

        if(this.controller){
            this.controller.draw();
        } 
    }
    @Atom override draw(transform: ITransform = this.transform, style: IStyle = this.style): void {   //重写父类的绘制方法
        DrawUtils.setContext(transform,style);  //绘制前设置图形的上下文环境
        this.updateDrawData();  //更新绘制数据
        Global.ctx.beginPath();
        if (this.drawType === DrawType.Stroke) {
            Global.ctx.stroke(this.data);
            Global.ctx.strokeText(this.text, this.coorPoint.x, this.coorPoint.y);
        } else {
            Global.ctx.globalAlpha = 0;
            Global.ctx.fill(this.data);
            Global.ctx.globalAlpha = 1;
            Global.ctx.fillText(this.text, this.coorPoint.x, this.coorPoint.y);
        } 

        if(this.controller){
            this.controller.draw();
        } 
    }
}
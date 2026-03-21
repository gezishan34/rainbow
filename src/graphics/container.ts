import type { IContainer, ICoor, IElement, IGraphics, IGraphicsConfig, IMousePos, ITransform, IStyle, IContainerConfig } from "../check/interface.js";
import { Atom } from "../decorator/decorator.js";
import { DefTransform, DrawType, ElementType, MouseStyleType } from "../enum/draw.js";
import { EventType } from "../enum/event.js";
import { IDGenerator, ObjectUtils } from "../independent/utils.js";
import { mouseContext } from "../mouseBehavior/mouseContext.js";
import { CoorUtils, DrawUtils, StyleUtils } from "../utils/business.js";
import { ContainerController, ShowController, type IController } from "./controller.js";

export class Container implements IContainer {
    id: string;
    type: ElementType;
    coorPoint: ICoor;
    recordPoint: ICoor;
    transform: ITransform;  //变换矩阵
    controller: IController | null;  //容器的控制器
    children: IElement[];
    leftTop: ICoor;
    rightBottom: ICoor;
    isMouseDown: boolean;  //是否鼠标按下状态
    isMouseMove: boolean;  //是否鼠标移入状态
    isDragging: boolean;  //是否拖拽中状态
    isSelected: boolean;  //是否被选中状态
    drawType: DrawType;  //绘制类型
    
    callbacks: Map<EventType, Function>;  //<事件，回调>注册表
    isStable: boolean;  //是否稳定状态
    isEvent: boolean;  //是否参与事件触发
    isDrag: boolean;  //是否可拖拽
    style: IStyle;  //样式
    constructor(config: IContainerConfig) {
        this.type = ElementType.Container;
        this.isDragging = false;
        this.isSelected = false;
        this.isMouseDown = false;
        this.isMouseMove = false;
        this.callbacks = new Map<EventType, Function>();

        this.drawType = DrawType.StrokeAndFill;  //绘制类型，默认填充&描边
        this.isStable = config?.isStable || false;  //是否稳固组合
        this.isEvent = config?.isEvent || false;  //是否可触发事件，默认false
        this.isDrag = config?.isDrag || false;  //是否可拖拽，没有指定则为false，需要isEvent为true，可拖拽才生效
        this.style = config?.style || {};  //如果没有指定样式,则使用默认样式
        this.id = config?.id || IDGenerator.next("Container");  //如果没有指定id,则生成一个唯一id

        this.children = [];
        this.transform = {...DefTransform};
        this.controller = null;
        this.coorPoint = {x: 0, y: 0};
        this.recordPoint = {x: 0,y: 0};
        this.leftTop = {x: 0, y: 0};
        this.rightBottom = {x: 0, y: 0};
        if(this.isDrag){
            this.setEventDrag();
        }
    }
    addChild(child: IGraphics): void {
        this.children.push(child);
        child.updateStyle(this.style);
        if(this.children.length === 1){  //直接赋值
            this.leftTop = {
                x: child.leftTop.x,
                y: child.leftTop.y,
            };
            this.rightBottom = {
                x: child.rightBottom.x,
                y: child.rightBottom.y,
            };
        }else{  //与历史最值比较后赋值
            this.leftTop = {
                x: Math.min(this.leftTop.x, child.leftTop.x),
                y: Math.min(this.leftTop.y, child.leftTop.y),
            };
            this.rightBottom = {
                x: Math.max(this.rightBottom.x, child.rightBottom.x),
                y: Math.max(this.rightBottom.y, child.rightBottom.y),
            };
        }
    }
    removeChild(child: IGraphics): void {
        this.children = this.children.filter(item => item.id !== child.id);
    }
    spilt(): IElement[] {
        return this.children;
    }
    setXY(coor: ICoor): void {
        this.coorPoint = {...coor};
    }
    setRecordXY(coor: ICoor): void {
        this.recordPoint = {...coor};
    }
    setStyle(style: IStyle): void {
        this.style = ObjectUtils.getDeepCopy(style);
        this.children.forEach(child => child.updateStyle(style));
    }
    updateStyle(style: IStyle): void{
        Object.assign(this.style, style);
        this.children.forEach(child => child.updateStyle(this.style));
    }
    move(offset: ICoor): void {  //增量移动
        this.coorPoint.x += offset.x;
        this.coorPoint.y += offset.y;
        this.children.forEach(child => child.move(offset));
        this.leftTop = {
            x: this.leftTop.x + offset.x,
            y: this.leftTop.y + offset.y,
        };
        this.rightBottom = {
            x: this.rightBottom.x + offset.x,
            y: this.rightBottom.y + offset.y,
        };
    }
    isEmpty(): boolean {
        return this.children.length === 0;
    }
    isInterior(e: IMousePos): boolean {  //判断某点是否在图形内部
        for(let i=0;i<this.children.length;i++){
            if(this.children[i]?.isInterior(e)){
                return true;
            }
        }
        return false;
    }
    setShowController(): void {  //设置显示控制器
        if(this.controller){
            this.controller.destroy();
        }
        this.controller = new ShowController(this);
    }
    setController(): void {
        this.controller = new ContainerController(this);
        if(!this.isStable){
            this.children.forEach(child => child.setShowController());
        }else{
            this.children.forEach(child => child.removeController());
        }
    }
    removeController(): void {
        if(this.controller){
            this.controller.destroy();
            this.children.forEach(child => child.removeController());
        }
        this.controller = null;
    }
    runEvent(e: IMousePos, eventType: EventType): void {  //执行事件回调
        const callback = this.callbacks.get(eventType);
        if(callback){
            callback(this, e);
        }
    }  
    addEventListener(eventType: EventType, callback: Function): void {
        this.callbacks.set(eventType, callback.bind(this));
    }
    updateDrawData(): void {  //更新绘制数据
        if(this.controller){
            this.controller.updateDrawData();
        }
    }  
    updateMeasure(transform: ITransform = this.transform): void {  //更新尺寸数据
        this.coorPoint = CoorUtils.getAbsCoorByTransform(this.coorPoint, transform);
        this.leftTop = CoorUtils.getAbsCoorByTransform(this.leftTop, transform);
        this.rightBottom = CoorUtils.getAbsCoorByTransform(this.rightBottom, transform);
        this.children.forEach(child => child.updateMeasure(transform));
        if(transform === this.transform){
            this.transform = {...DefTransform};
        }
    }
    @Atom nudityDraw(): void{  //裸体绘制方法
        this.updateDrawData();
        StyleUtils.setStyleByGlobal(this.style);
        this.children.forEach(child => child.nudityDraw());
        if(this.controller){
            this.controller.draw();
        }
    }  
    @Atom draw(transform: ITransform = this.transform, style: IStyle = this.style): void {
        DrawUtils.setContext(transform, style);
        this.updateDrawData();
        this.children.forEach(child => child.nudityDraw());
        if(this.controller){
            this.controller.draw();
        }
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
        this.setEventMouseMove(function(target: IGraphics, e: IMousePos) {
            mouseContext.setMouseStyleType(MouseStyleType.Move);
        });

        //设置鼠标按下事件回调
        this.setEventMouseDown(function(target: IGraphics, e: IMousePos) {
            target.setRecordXY({x: e.world.x || 0, y: e.world.y || 0});
        });  

        //设置拖拽移动事件回调
        this.setEventDragMove(function(target: IGraphics, e: IMousePos) {
            // 计算图形移动偏移量
            const offset = {
                x: (e.world.x - target.recordPoint.x)/target.transform.a,   
                y: (e.world.y - target.recordPoint.y)/target.transform.d
            }
            target.setRecordXY(e.world);
            
            //更新坐标
            target.move(offset); 
        });

        //设置鼠标抬起事件回调
        this.setEventMouseUp(function(target: IGraphics, e: IMousePos){
        });

        //设置鼠标移开事件回调
        this.setEventMouseLeave(function(target: IGraphics, e: IMousePos){
            mouseContext.setMouseStyleType(mouseContext.getState().mouseStyleType);
        })
    }
}
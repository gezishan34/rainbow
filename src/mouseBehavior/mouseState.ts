import type { IElement, IGraphics, IMousePos, IMouseState } from "../check/interface.js";
import { DrawType, MouseStyleType } from "../enum/draw.js";
import { Arrow, Elipse, FreePath, Rect, Rhombic, Rhomboid, RoundHeadRect, RoundRect, Text, Triangle } from "../graphics/graphics.js";
import { Line } from "../graphics/graphics.js";
import Global from "../global.js";
import { stage } from "../app.js";
import { CoorUtils } from "../utils/business.js";
import { ObjectUtils } from "../independent/utils.js";
import { Editor } from "../utils/editor.js";
import { mouseContext } from "./mouseContext.js";
import { MementoTitle } from "../memento/StateMemento.js";

export abstract class State implements IMouseState{  //鼠标绘制父类
    mouseStyleType: MouseStyleType = MouseStyleType.Crosshair;
    private isDrawRun: boolean = false;
    abstract graphics: IGraphics | null;  //当前绘制元素

    runMouseDown(coor: IMousePos): void {
        this.isDrawRun = true;  //标记正在绘制
        this.MouseDown(coor);
    }

    runMouseMove(coor: IMousePos): void {
        if(this.isDrawRun){
            this.MouseMove(coor);
        }
    }

    runMouseUp(coor: IMousePos): void {
        if(this.isDrawRun){
            this.isDrawRun = false;  //标记停止绘制
            this.MouseUp(coor);
        }
        
    }

    runMouseLeave(coor: IMousePos): void {
        if(this.isDrawRun){
            this.isDrawRun = false;  //标记停止绘制
            this.MouseLeave(coor);
        }
        
    }

    abstract MouseDown(coor: IMousePos): void;
    abstract MouseMove(coor: IMousePos): void;
    MouseUp(coor: IMousePos): void{
        mouseContext.setMouseStyleType(this.mouseStyleType);
        if(this.graphics){
            if(!this.graphics.isEmpty()){
                stage?.addMemento(MementoTitle.Insert);  //添加备忘录
            }else{
                stage?.remove(this.graphics,false);  //未绘制，回收
            }
        }
        this.graphics?.updateMeasure();
    }
    abstract MouseLeave(coor: IMousePos): void;
}

export class NoneState extends State{  //无任何行为状态
    mouseStyleType: MouseStyleType = MouseStyleType.Default;
    graphics: IGraphics | null = null;  //当前绘制元素
    override MouseDown(coor: IMousePos): void {
        
    }
    override MouseMove(coor: IMousePos): void {
        
    }
    override MouseUp(coor: IMousePos): void {
        
    }
    override MouseLeave(coor: IMousePos): void {
        
    }
}

export class DragState extends State{  //拖拽画布状态
    mouseStyleType: MouseStyleType = MouseStyleType.Grab;
    graphics: IGraphics | null = null;  //当前绘制元素


    private ox: number = 0;
    private oy: number = 0;
    private offsetX: number = 0;
    private offsetY: number = 0;

    override MouseDown(coor: IMousePos): void {
        mouseContext.setMouseStyleType(MouseStyleType.Grabbing);
        this.ox = coor.screen.x;
        this.oy = coor.screen.y;
        this.offsetX = Global.viewport.offsetX;
        this.offsetY = Global.viewport.offsetY;
    }
    override MouseMove(coor: IMousePos): void {
        const screen = coor.screen;
        // 计算鼠标移动差值 → 平移视口（平移，模拟画布移动）
        const dx = (screen.x - this.ox);
        const dy = (screen.y - this.oy);
        Global.viewport.offsetX = this.offsetX + dx;
        Global.viewport.offsetY = this.offsetY + dy;

        CoorUtils.setWorldTransform();  //设置当前世界坐标系 
    }
    override MouseUp(coor: IMousePos): void {
        mouseContext.setMouseStyleType(MouseStyleType.Grab);
    }
    override MouseLeave(coor: IMousePos): void {

    }
}

export class SelectState extends State{  //选择状态
    mouseStyleType: MouseStyleType = MouseStyleType.Default;
    graphics: Rect | null = null;  //当前绘制元素
    constructor(
        
    ){
        super();
    }

    override MouseDown(coor: IMousePos): void {
        mouseContext.setMouseStyleType(this.mouseStyleType);
        const style = {
            lineDash: [5,3]
        }
        this.graphics = new Rect(coor.world.x,coor.world.y,0,0,{
            drawType: DrawType.Stroke,
            style
        });
        stage?.add(this.graphics,false); 
    }
    override MouseMove(coor: IMousePos): void {
        if(this.graphics&&stage){
            this.graphics.width = coor.world.x - this.graphics.coorPoint.x;
            this.graphics.height = coor.world.y - this.graphics.coorPoint.y;
            this.graphics.updateMeasure();
            const {x:x1,y:y1} = this.graphics.leftTop;
            const {x:x2,y:y2} = this.graphics.rightBottom;
            stage.forEachElementInDrawOrder(item=>{
                if(item === this.graphics) return;
                if(item.leftTop.x>=x1&&item.rightBottom.x<=x2&&item.leftTop.y>=y1&&item.rightBottom.y<=y2){
                    item.setShowController();
                }else{
                    item.removeController();
                }
            });
        }
    }
    override MouseUp(coor: IMousePos): void {
        if(this.graphics&&stage){
            stage.remove(this.graphics,false);
            this.graphics.updateMeasure();
            const {x:x1,y:y1} = this.graphics.leftTop;
            const {x:x2,y:y2} = this.graphics.rightBottom;
            
            stage.forEachElementInDrawOrder(item=>{
                if(item === this.graphics) return;
                if(item.leftTop.x>=x1&&item.rightBottom.x<=x2&&item.leftTop.y>=y1&&item.rightBottom.y<=y2){
                    stage?.addSelect(item);
                }
            });

            if(stage.selected) stage.add(stage.selected,false);
        }
        this.graphics = null;
    }
    MouseLeave(coor: IMousePos): void {
        if(this.graphics&&stage){
            stage.remove(this.graphics,false);
            this.graphics.updateMeasure();
            const {x:x1,y:y1} = this.graphics.leftTop;
            const {x:x2,y:y2} = this.graphics.rightBottom;
            
            stage.forEachElementInDrawOrder(item=>{
                if(item === this.graphics) return;
                if(item.leftTop.x>=x1&&item.rightBottom.x<=x2&&item.leftTop.y>=y1&&item.rightBottom.y<=y2){
                    stage?.addSelect(item);
                }
            });
            
            if(stage.selected) stage.add(stage.selected,false);
        }
        this.graphics = null;
    }
    
}

export class RectState extends State{  //绘制矩形状态
    graphics: Rect | null = null;  //当前绘制元素
    constructor(
        
    ){
        super();
    }
    override MouseDown(coor: IMousePos): void {
        mouseContext.setMouseStyleType(this.mouseStyleType);
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        this.graphics = new Rect(coor.world.x,coor.world.y,0,0,{isDrag: true, isEvent: true, style});
        stage?.add(this.graphics,false); 
    }
    override MouseMove(coor: IMousePos): void {
        if(this.graphics){
            this.graphics.width = coor.world.x - this.graphics.coorPoint.x;
            this.graphics.height = coor.world.y - this.graphics.coorPoint.y;
        }
    }
    override MouseLeave(coor: IMousePos): void {
    }
}

export class SquareState extends State{  //绘制正方形状态
    graphics: Rect | null = null;  //当前绘制元素
    constructor(
        
    ){
        super();
    }

    override MouseDown(coor: IMousePos): void {
        mouseContext.setMouseStyleType(this.mouseStyleType);
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        this.graphics = new Rect(coor.world.x,coor.world.y,0,0,{isDrag: true, isEvent: true, style});
        stage?.add(this.graphics,false); 
    }
    override MouseMove(coor: IMousePos): void {
        if(this.graphics){
            let w = coor.world.x - this.graphics.coorPoint.x;
            let h = coor.world.y - this.graphics.coorPoint.y;
            let d = Math.min(Math.abs(w),Math.abs(h));
            this.graphics.width = w>0?d:-d;
            this.graphics.height = h>0?d:-d;
        }
    }
    override MouseLeave(coor: IMousePos): void {
    }
} 

export class RoundRectState extends State{  //绘制圆角矩形状态
    graphics: RoundRect | null = null;  //当前绘制元素
    constructor(
        
    ){
        super();
    }

    override MouseDown(coor: IMousePos): void {
        mouseContext.setMouseStyleType(this.mouseStyleType);
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        this.graphics = new RoundRect(coor.world.x,coor.world.y,0,0,0,{isDrag: true, isEvent: true, style});
        stage?.add(this.graphics,false); 
    }
    override MouseMove(coor: IMousePos): void {
        if(this.graphics){
            this.graphics.width = coor.world.x - this.graphics.coorPoint.x;
            this.graphics.height = coor.world.y - this.graphics.coorPoint.y;
            let d = Math.min(Math.abs(this.graphics.width),Math.abs(this.graphics.height)); 
            this.graphics.radius = d/8;
        }
    }
    override MouseLeave(coor: IMousePos): void {
    }
}

export class RhomboidState extends State{  //绘制平行四边形状态
    graphics: Rhomboid | null = null;  //当前绘制元素
    constructor(
        
    ){
        super();
    }

    override MouseDown(coor: IMousePos): void {
        mouseContext.setMouseStyleType(this.mouseStyleType);
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        this.graphics = new Rhomboid(coor.world.x,coor.world.y,0,0,Math.PI/4,{isDrag: true, isEvent: true, style});
        stage?.add(this.graphics,false); 
    }
    override MouseMove(coor: IMousePos): void {
        if(this.graphics){
            this.graphics.width = coor.world.x - this.graphics.coorPoint.x;
            this.graphics.height = coor.world.y - this.graphics.coorPoint.y;
        }
    }
    override MouseLeave(coor: IMousePos): void {
    }
}

export class CircleState extends State{  //绘制圆状态
    graphics: Elipse | null = null;  //当前绘制元素
    private ox: number = 0;
    private oy: number = 0;
    constructor(
        
    ){
        super();
    }

    override MouseDown(coor: IMousePos): void {
        mouseContext.setMouseStyleType(this.mouseStyleType);
        this.ox = coor.world.x;
        this.oy = coor.world.y;
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        this.graphics = new Elipse(coor.world.x,coor.world.y,0,0,{isDrag: true, isEvent: true, style});
        stage?.add(this.graphics,false); 
    }
    override MouseMove(coor: IMousePos): void {
        const w = coor.world.x - this.ox;
        const h = coor.world.y - this.oy;
        if(this.graphics){
            this.graphics.width = Math.sqrt(w*w + h*h);
            this.graphics.height = Math.sqrt(w*w + h*h);
            const temp = {
                x: (this.ox+coor.world.x)/2 - this.graphics.width/2,
                y: (this.oy+coor.world.y)/2 - this.graphics.height/2
            }
            this.graphics.setXY(temp);
        }
    }
    override MouseLeave(coor: IMousePos): void {
    }
}

export class RoundHeadRectState extends State{  //绘制圆头矩形状态
    graphics: RoundHeadRect | null = null;  //当前绘制元素
    constructor(
        
    ){
        super();
    }

    override MouseDown(coor: IMousePos): void {
        mouseContext.setMouseStyleType(this.mouseStyleType);
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        this.graphics = new RoundHeadRect(coor.world.x,coor.world.y,0,0,{isDrag: true, isEvent: true, style});
        stage?.add(this.graphics,false); 
    }
    override MouseMove(coor: IMousePos): void {
        if(this.graphics){
            this.graphics.width = coor.world.x - this.graphics.coorPoint.x;
            this.graphics.height = coor.world.y - this.graphics.coorPoint.y;
        }
    }
    override MouseLeave(coor: IMousePos): void {
    }
}

export class RhombicState extends State{  //绘制菱形状态
    graphics: Rhombic | null = null;  //当前绘制元素
    constructor(
        
    ){
        super();
    }
    override MouseDown(coor: IMousePos): void {
        mouseContext.setMouseStyleType(this.mouseStyleType);
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        this.graphics = new Rhombic(coor.world.x,coor.world.y,0,0,{isDrag: true, isEvent: true, style});
        stage?.add(this.graphics,false); 
    }
    override MouseMove(coor: IMousePos): void {
        if(this.graphics){
            this.graphics.width = coor.world.x - this.graphics.coorPoint.x;
            this.graphics.height = coor.world.y - this.graphics.coorPoint.y;
        }
    }
    override MouseLeave(coor: IMousePos): void {
    }
}

export class ElipseState extends State{  //绘制椭圆状态
    graphics: Elipse | null = null;  //当前绘制元素
    private ox: number = 0;
    private oy: number = 0;
    constructor(
        
    ){
        super();
    }
    override MouseDown(coor: IMousePos): void {
        this.ox = coor.world.x;
        this.oy = coor.world.y;
        mouseContext.setMouseStyleType(this.mouseStyleType);
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        this.graphics = new Elipse(coor.world.x,coor.world.y,0,0,{isDrag: true, isEvent: true, style});
        stage?.add(this.graphics,false); 
    }
    override MouseMove(coor: IMousePos): void {
        const w = coor.world.x - this.ox;
        const h = coor.world.y - this.oy;
        if(this.graphics){
            this.graphics.width = Math.abs(w);
            this.graphics.height = Math.abs(h);
            const temp = {
                x: (this.ox+coor.world.x)/2 - this.graphics.width/2,
                y: (this.oy+coor.world.y)/2 - this.graphics.height/2
            }
            this.graphics.setXY(temp);
        }
    }
    override MouseLeave(coor: IMousePos): void {
    }
}

export class LineState extends State{  //绘制直线状态
    graphics: Line | null = null;  //当前绘制元素
    constructor(
        
    ){
        super();
    }
    override MouseDown(coor: IMousePos): void {
        mouseContext.setMouseStyleType(this.mouseStyleType);
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        this.graphics = new Line(coor.world.x,coor.world.y,coor.world.x,coor.world.y,{isDrag: true, isEvent: true, style});
        stage?.add(this.graphics,false); 
    }
    override MouseMove(coor: IMousePos): void {
        if(this.graphics){
            this.graphics.setEndPoint(coor.world);
        }
    }
    override MouseLeave(coor: IMousePos): void {
    }
}

export class TriangleState extends State{  //绘制三角形状态
    graphics: Triangle | null = null;  //当前绘制元素
    private ox: number = 0;
    private oy: number = 0;
    constructor(
        
    ){
        super();
    }
    override MouseDown(coor: IMousePos): void {
        const world = coor.world;
        mouseContext.setMouseStyleType(this.mouseStyleType);
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        this.graphics = new Triangle(world.x,world.y,world.x,world.y,world.x,world.y,{isDrag: true, isEvent: true, style});
        this.ox = world.x;
        this.oy = world.y;
        stage?.add(this.graphics,false); 
    }
    override MouseMove(coor: IMousePos): void {
        if(this.graphics){
            this.graphics.coorPoint = {
                x: (this.ox + coor.world.x)/2,
                y: this.oy
            };
            this.graphics.coorPoint1 = {...coor.world};
            this.graphics.coorPoint2 = {x: this.ox, y: coor.world.y};
        }
    }
    override MouseLeave(coor: IMousePos): void {
    }
}

export class ArrowState extends State{  //绘制箭头状态
    graphics: Arrow | null = null;  //当前绘制元素
    constructor(
        
    ){
        super();
    }
    override MouseDown(coor: IMousePos): void {
        mouseContext.setMouseStyleType(this.mouseStyleType);
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        this.graphics = new Arrow(coor.world.x,coor.world.y,coor.world.x,coor.world.y,{isDrag: true, isEvent: true, style});
        stage?.add(this.graphics,false); 
    }
    override MouseMove(coor: IMousePos): void {
        if(this.graphics){
            this.graphics.setEndPoint(coor.world);
        }
    }
    override MouseLeave(coor: IMousePos): void {
    }
}

export class FreePathState extends State{  //绘制自由路径状态
    mouseStyleType: MouseStyleType = MouseStyleType.Pen;
    graphics: FreePath | null = null;  //当前绘制元素
    
    constructor(){
        super();
    }
    
    override MouseDown(coor: IMousePos): void {
        mouseContext.setMouseStyleType(this.mouseStyleType);
        // 创建新的Path对象
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        this.graphics = new FreePath(coor.world.x, coor.world.y, [], { isDrag: true, isEvent: true, style });
        // 添加到舞台
        stage?.add(this.graphics,false);
    }
    
    override MouseMove(coor: IMousePos): void {
        if (this.graphics) {
            // 添加新点到路径
            this.graphics.addPoint(coor.world.x, coor.world.y);
        }
    }
    
    override MouseLeave(coor: IMousePos): void {
    }
}

export class TextState extends State{  //绘制文本状态
    mouseStyleType: MouseStyleType = MouseStyleType.Text;
    graphics: Text | null = null;  //当前绘制元素
    
    constructor(){
        super();
    }
    override MouseDown(coor: IMousePos): void {
        const editor = Editor.create();
        
        mouseContext.setMouseStyleType(this.mouseStyleType);
        const style = ObjectUtils.getDeepCopy(mouseContext.styleConfig);
        
        // 创建Text图形
        this.graphics = new Text(coor.world.x, coor.world.y, "", {isDrag: true, isEvent: true, style});
        stage?.add(this.graphics);
        editor.setGraphics(this.graphics);
        editor.showInputAtPosition();
    }
    
    override MouseMove(coor: IMousePos): void {
        // 文本输入状态下不需要处理鼠标移动
    }
    
    override MouseUp(coor: IMousePos): void {
        // 文本输入状态下不需要处理鼠标抬起
    }
    override MouseLeave(coor: IMousePos): void {
        // 如果鼠标离开时正在编辑，完成编辑
    }
}
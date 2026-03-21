import { stage } from "../app.js";
import type { ICoor, IElement, IGraphics, ILine, IMousePos, IRect, IStyle, ITransform } from "../check/interface.js";
import { Atom } from "../decorator/decorator.js";
import { DefControllerRectScale, DefTransform, DrawType, MouseStyleType } from "../enum/draw.js";
import { mouseContext } from "../mouseBehavior/mouseContext.js";
import { CoorUtils } from "../utils/business.js";
import { Container } from "./container.js";
import { Graphics, Rect } from "./graphics.js";

enum ControllerPointType {  //控制点类型
    LeftTop,  //左上角
    RightTop,  //右上角
    LeftBottom,  //左下角
    RightBottom,  //右下角
    LeftCenter,  //左中
    RightCenter,  //右中
    TopCenter,  //上中
    BottomCenter,  //下中
    FreeMove,  //自由移动
    Rotate,  //旋转
}

class ControllerPoint {  //控制点
    rect: Rect;  //控制点矩形
    coorPoint: ICoor;
    static mouseStyleMap = Object.freeze([  //控制点鼠标样式映射表
        MouseStyleType.ResizeNwse, 
        MouseStyleType.ResizeNeSw, 
        MouseStyleType.ResizeNeSw, 
        MouseStyleType.ResizeNwse, 
        MouseStyleType.ResizeEw,  
        MouseStyleType.ResizeEw,  
        MouseStyleType.ResizeNs,  
        MouseStyleType.ResizeNs,  
        MouseStyleType.Move,  
        MouseStyleType.Pointer
    ]);  
    constructor(
        x: number,  //控制点x坐标（小矩形中心点x坐标）
        y: number,  //控制点y坐标（小矩形中心点y坐标）
        public type: ControllerPointType,  //控制点类型
    ){
        this.coorPoint = {x, y};
        const d = DefControllerRectScale.PointD;
        const config = {
            isEvent: true,
            drawType: DrawType.Fill,  //纯填充
            style: {
                lineWidth: 1,  //线宽固定为1
                fillStyle: "#3092d6",  //填充颜色
                globalAlpha: 1,  //透明度
            }
        }
        this.rect = new Rect(0, 0, d, d, config);
        this.rect.transform = CoorUtils.getReverseWorldTransform();
        this.init();
    }
    private init(){
        stage?.addAssist(this.rect);  //添加图形进辅助图形列表
    }
    setXY(coor: ICoor){
        this.coorPoint = {...coor};
    }
    draw(){
        const absCoor = CoorUtils.getNowAbsCoor(this.coorPoint);
        const coor = {
            x: absCoor.x - DefControllerRectScale.PointD/2,
            y: absCoor.y - DefControllerRectScale.PointD/2,
        }
        this.rect.setXY(coor);
        this.rect.transform = CoorUtils.getReverseTransform();
        this.rect.draw();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
        this.rect.transform = CoorUtils.getReverseWorldTransform();
    }
    destroy(){  //释放资源
        stage?.removeAssist(this.rect);  //将图形从辅助图形列表移除
    }
}

//控制器接口
export interface IController {
    updateDrawData(): void;  //更新绘制数据
    draw(): void;  //绘制
    destroy(): void;  //释放资源
}

export enum ControllerRectType {  //矩形控制器类型
    Default,  //八个控制点：4个角，4个中点
    Corner  //四个控制点：4个角
}

//矩形控制器
export class RectController implements IController {
    private rect: Rect;  //虚线矩形
    private ControllerPointArrays: ControllerPoint[] = [];  //所有控制点数组
    private pointMap;
    constructor(
        private subject: Graphics&IRect,  //被控制主体
        private type: ControllerRectType = ControllerRectType.Default  //矩形控制器类型
    ){
        const {x,y,width,height} = this.getRectData();
        this.rect = new Rect(x, y, width, height, {
            isEvent: false,
            drawType: DrawType.Stroke,  
            style: {
                lineDash: [10, 10],  //虚线样式
                lineWidth: 1,  //线宽固定为1
                strokeStyle: "#3092d6",  //描边颜色
                globalAlpha: 1,  //透明度
            }
        });

        const temp = [  //控制点类型映射表
            {dx: 0, dy: 0},
            {dx: 1, dy: 0},
            {dx: 0, dy: 1},
            {dx: 1, dy: 1},
            {dx: 0, dy: 1/2},
            {dx: 1, dy: 1/2},
            {dx: 1/2, dy: 0},
            {dx: 1/2, dy: 1}
        ];
        if(this.type === ControllerRectType.Corner){
            temp.splice(4,4);
        }
        this.pointMap = Object.freeze(temp);

        this.pointMap.forEach(({dx,dy},index) => {
            this.ControllerPointArrays.push(new ControllerPoint(x + width * dx, y + height * dy, index));
        })
        this.init();
    }
    private getRectData(){
        let {x,y} = this.subject.leftTop;
        let {x:x1,y:y1} = this.subject.rightBottom;
        const width = x1 - x;
        const height = y1 - y;
        return {x,y,width,height};
    }
    updateDrawData(): void{  //更新绘制数据
        const {x,y,width,height} = this.getRectData();
        this.rect.setXY({x, y});
        this.rect.width = width;
        this.rect.height = height;

        this.ControllerPointArrays.forEach(point => {
            const {dx,dy} = this.pointMap[point.type]!;
            point.setXY({x: x + width * dx, y: y + height * dy});
        })
    }  

    getOverTransform(type:ControllerPointType,dx: number,dy: number): ITransform{
        let CX = 0,CY = 0;  //固定缩放中心坐标
        let scaleX = 1, scaleY = 1;
        const {x,y,width,height} = this.getRectData();
                
        switch (type) {
            case ControllerPointType.RightTop: {
                // 右上角：固定左下角为缩放中心
                CX = x;
                CY = y + height;

                //计算X和Y方向的缩放比例
                let scale1 = (dx + width) / width;
                let scale2 = (-dy + height) / height;
                scaleX = scaleY = Math.max(scale1,scale2);
                
                break;
            }
            case ControllerPointType.LeftTop: {
                // 左上角：固定右下角为缩放中心
                CX = x + width;
                CY = y + height;
                
                //计算X和Y方向的缩放比例
                let scale1 = (-dx + width) / width;
                let scale2 = (-dy + height) / height;
                scaleX = scaleY = Math.max(scale1,scale2);
                
                break;
            }
            case ControllerPointType.RightBottom: {
                // 右下角：固定左上角为缩放中心
                CX = x;
                CY = y;
                
                //计算X和Y方向的缩放比例
                let scale1 = (dx + width) / width;
                let scale2 = (dy + height) / height;
                scaleX = scaleY = Math.max(scale1,scale2);

                break;
            }
            case ControllerPointType.LeftBottom: {
                // 左下角：固定右上角为缩放中心
                CX = x + width;
                CY = y;
                
                //计算X和Y方向的缩放比例
                let scale1 = (-dx + width) / width;
                let scale2 = (dy + height) / height;
                scaleX = scaleY = Math.max(scale1,scale2);

                break;
            }
            case ControllerPointType.RightCenter: {
                // 右中：固定左边中点为缩放中心
                CX = x;
                CY = y + height / 2;
                
                // 只在X方向缩放
                scaleX = (dx + width) / width;
                break;
            }
            case ControllerPointType.LeftCenter: {
                // 左中：固定右边中点为缩放中心
                CX= x + width;
                CY= y + height / 2;

                // 只在X方向缩放
                scaleX = (-dx + width) / width;
                break;
            }
            case ControllerPointType.TopCenter: {
                // 上中：固定下边中点为缩放中心
                CX = x + width / 2;
                CY = y + height;
                
                // 只在Y方向缩放
                scaleY = (-dy + height) / height;
                break;
            }
            case ControllerPointType.BottomCenter: {
                // 下中：固定上边中点为缩放中心
                CX = x + width / 2;
                CY = y;
                
                // 只在Y方向缩放
                scaleY = (dy + height) / height;
                break;
            }
        }
        // 计算偏移量
        const offsetX = CX * (1 - scaleX);
        const offsetY = CY * (1 - scaleY);
        
        return{
            a: scaleX,
            b: 0,
            c: 0,
            d: scaleY,
            e: offsetX,
            f: offsetY,
        };
    }
    init(){
        this.ControllerPointArrays.forEach((item) => {
            item.rect.setEventMouseMove((e: IMousePos) =>{
                mouseContext.setMouseStyleType(ControllerPoint.mouseStyleMap[item.type] ?? MouseStyleType.Default);
            });

            item.rect.setEventMouseLeave((e: IMousePos) =>{
                mouseContext.setMouseStyleType(mouseContext.getState().mouseStyleType);
            });

            item.rect.setEventMouseDown((e: IMousePos) =>{
                const coor = {
                    x: e.world.x || 0,
                    y: e.world.y || 0,
                }
                item.rect.setRecordXY(coor);
                (item.rect.style as IStyle).fillStyle = "#909099";
            });

            item.rect.setEventDragMove((e: IMousePos) =>{
                mouseContext.setMouseStyleType(ControllerPoint.mouseStyleMap[item.type] ?? MouseStyleType.Default);
                
                // 计算当前鼠标位置相对于初始位置的偏移
                let dx = e.world.x - item.rect.recordPoint.x;
                let dy = e.world.y - item.rect.recordPoint.y;
                console.log(dx,dy);
                

                const overTransform = this.getOverTransform(item.type,dx,dy);
                const newTransform = CoorUtils.getOverTanasform(DefTransform, overTransform);
                Object.assign(this.subject.transform, newTransform);
            });

            item.rect.setEventMouseUp((e: IMousePos) =>{
                // 重置颜色
                (item.rect.style as IStyle).fillStyle = "#3092d6";

                //更新尺寸
                this.subject.updateMeasure();
            });
        })
    }
    @Atom draw(){
        this.rect.draw();
        this.ControllerPointArrays.forEach((item) => {
            item.draw();
        })
    }
    destroy(){  //释放资源
        this.ControllerPointArrays.forEach((item) => {
            item.destroy();
        })
    }
}

//自由点控制器
export class FreeController implements IController {
    private ControllerPointArrays: ControllerPoint[] = [];
    
    constructor(
        private subject: Graphics,  //被控制主体
        private subjectPoints: ICoor[]  //控制点集
    ){
        subjectPoints.forEach((item) => {
            this.ControllerPointArrays.push(new ControllerPoint(item.x, item.y, ControllerPointType.FreeMove));
        })
        this.init();
    }
    updateDrawData(): void{  //更新绘制数据
        this.ControllerPointArrays.forEach((item, index) => {
            item.setXY(this.subjectPoints[index]!);
        })
    }  
    init(){
        this.ControllerPointArrays.forEach((item, index) => {
            this.setEventByPoint(item, this.subjectPoints[index]!);
        })
    }
    setEventByPoint(item: ControllerPoint, subjectCoor: ICoor){

        item.rect.setEventMouseMove((e: IMousePos) =>{
            mouseContext.setMouseStyleType(ControllerPoint.mouseStyleMap[item.type] ?? MouseStyleType.Default);
        });

        item.rect.setEventMouseLeave((e: IMousePos) =>{
            mouseContext.setMouseStyleType(mouseContext.getState().mouseStyleType);
        });

        item.rect.setEventMouseDown((e: IMousePos) =>{
            const coor = {
                x: e.world.x || 0,
                y: e.world.y || 0,
            }
            item.rect.setRecordXY(coor);
            (item.rect.style as IStyle).fillStyle = "#909099";
        });

        item.rect.setEventDragMove((e: IMousePos) =>{
            mouseContext.setMouseStyleType(ControllerPoint.mouseStyleMap[item.type] ?? MouseStyleType.Default);

            const offset = {
                x: (e.world.x - item.rect.recordPoint.x),   
                y: (e.world.y - item.rect.recordPoint.y)
            }
            item.rect.setRecordXY(e.world);
            
            //更新坐标
            item.rect.move(offset);
            CoorUtils.addCoor(subjectCoor, offset);
        });

        item.rect.setEventMouseUp((e: IMousePos) =>{
            (item.rect.style as IStyle).fillStyle = "#3092d6";
            //更新尺寸
            this.subject.updateMeasure();
        });
    }
    @Atom draw(){
        this.ControllerPointArrays.forEach((item) => {
            item.draw();
        });
    }
    destroy(){  //释放资源
        this.ControllerPointArrays.forEach((item) => {
            item.destroy();
        })
    }
}

//线性控制器
export class LineController implements IController {
    private ControllerPointStart;
    private ControllerPointEnd;
    constructor(
        private subject: Graphics&ILine,  //被控制主体
    ){
        this.ControllerPointStart = new ControllerPoint(this.subject.coorPoint.x, this.subject.coorPoint.y, ControllerPointType.FreeMove);
        this.ControllerPointEnd = new ControllerPoint(this.subject.endPoint.x, this.subject.endPoint.y, ControllerPointType.FreeMove);
        this.init();
    }
    updateDrawData(): void{  //更新绘制数据
        this.ControllerPointStart.setXY(this.subject.coorPoint);
        this.ControllerPointEnd.setXY(this.subject.endPoint);
    }  
    init(){
        this.setEventByPoint(this.ControllerPointStart, this.subject.coorPoint);
        this.setEventByPoint(this.ControllerPointEnd, this.subject.endPoint);
    }
    setEventByPoint(item: ControllerPoint, subjectCoor: ICoor){
        item.rect.setEventMouseMove((e: IMousePos) =>{
            mouseContext.setMouseStyleType(ControllerPoint.mouseStyleMap[item.type] ?? MouseStyleType.Default);
        });

        item.rect.setEventMouseLeave((e: IMousePos) =>{
            mouseContext.setMouseStyleType(mouseContext.getState().mouseStyleType);
        });

        item.rect.setEventMouseDown((e: IMousePos) =>{
            const coor = {
                x: e.world.x || 0,
                y: e.world.y || 0,
            }
            item.rect.setRecordXY(coor);
            (item.rect.style as IStyle).fillStyle = "#909099";
        });

        item.rect.setEventDragMove((e: IMousePos) =>{
            mouseContext.setMouseStyleType(ControllerPoint.mouseStyleMap[item.type] ?? MouseStyleType.Default);

            const offset = {
                x: (e.world.x - item.rect.recordPoint.x),   
                y: (e.world.y - item.rect.recordPoint.y)
            }
            item.rect.setRecordXY(e.world);
            
            //更新坐标
            item.rect.move(offset);
            subjectCoor.x += offset.x;
            subjectCoor.y += offset.y;
        });

        item.rect.setEventMouseUp((e: IMousePos) =>{
            (item.rect.style as IStyle).fillStyle = "#3092d6";
            //更新尺寸
            this.subject.updateMeasure();
        });
    }
    @Atom draw(){
        this.ControllerPointStart.draw();
        this.ControllerPointEnd.draw();
    }
    destroy(){  //释放资源
        this.ControllerPointStart.destroy();
        this.ControllerPointEnd.destroy();
    }
}

//容器控制器
export class ContainerController implements IController {
    private rect: Rect;  //虚线矩形
    private ControllerPointArrays: ControllerPoint[] = [];  //所有控制点数组
    private pointMap;
    private padding: number = 8;  //内边距
    constructor(
        private subject: Container,  //被控制主体
        private type: ControllerRectType = ControllerRectType.Default  //矩形控制器类型
    ){
        const {x,y,width,height} = this.getRectData();

        this.rect = new Rect(x, y, width, height, {
            isEvent: false,
            drawType: DrawType.Stroke,  
            style: {
                lineDash: [10, 10],  //虚线样式
                lineWidth: 1,  //线宽固定为1
                strokeStyle: "#3092d6",  //描边颜色
            }
        });

        const temp = [  //控制点类型映射表
            {dx: 0, dy: 0},
            {dx: 1, dy: 0},
            {dx: 0, dy: 1},
            {dx: 1, dy: 1},
            {dx: 0, dy: 1/2},
            {dx: 1, dy: 1/2},
            {dx: 1/2, dy: 0},
            {dx: 1/2, dy: 1}
        ];
        if(this.type === ControllerRectType.Corner){
            temp.splice(4,4);
        }
        this.pointMap = Object.freeze(temp);

        this.pointMap.forEach(({dx,dy},index) => {
            this.ControllerPointArrays.push(new ControllerPoint(x + width * dx, y + height * dy, index));
        })
        this.init();
    }
    private getRectData(){
        let {x,y} = this.subject.leftTop;
        let {x:x1,y:y1} = this.subject.rightBottom;
        //添加内边距
        x -= this.padding;
        y -= this.padding;
        x1 += this.padding;
        y1 += this.padding;
        const width = x1 - x;
        const height = y1 - y;
        return {x,y,width,height};
    }
    updateDrawData(): void{  //更新绘制数据
        const {x,y,width,height} = this.getRectData();

        this.rect.setXY({x, y});
        this.rect.width = width;
        this.rect.height = height;

        this.ControllerPointArrays.forEach(point => {
            const {dx,dy} = this.pointMap[point.type]!;
            point.setXY({x: x + width * dx, y: y + height * dy});
        })
    }  

    getOverTransform(type:ControllerPointType,dx: number,dy: number): ITransform{
        let CX = 0,CY = 0;  //固定缩放中心坐标
        let scaleX = 1, scaleY = 1;
        const {x,y,width,height} = this.getRectData();
                
        switch (type) {
            case ControllerPointType.RightTop: {
                // 右上角：固定左下角为缩放中心
                CX = x;
                CY = y + height;

                //计算X和Y方向的缩放比例
                let scale1 = (dx + width) / width;
                let scale2 = (-dy + height) / height;
                scaleX = scaleY = Math.max(scale1,scale2);
                
                break;
            }
            case ControllerPointType.LeftTop: {
                // 左上角：固定右下角为缩放中心
                CX = x + width;
                CY = y + height;
                
                //计算X和Y方向的缩放比例
                let scale1 = (-dx + width) / width;
                let scale2 = (-dy + height) / height;
                scaleX = scaleY = Math.max(scale1,scale2);
                
                break;
            }
            case ControllerPointType.RightBottom: {
                // 右下角：固定左上角为缩放中心
                CX = x;
                CY = y;
                
                //计算X和Y方向的缩放比例
                let scale1 = (dx + width) / width;
                let scale2 = (dy + height) / height;
                scaleX = scaleY = Math.max(scale1,scale2);

                break;
            }
            case ControllerPointType.LeftBottom: {
                // 左下角：固定右上角为缩放中心
                CX = x + width;
                CY = y;
                
                //计算X和Y方向的缩放比例
                let scale1 = (-dx + width) / width;
                let scale2 = (dy + height) / height;
                scaleX = scaleY = Math.max(scale1,scale2);

                break;
            }
            case ControllerPointType.RightCenter: {
                // 右中：固定左边中点为缩放中心
                CX = x;
                CY = y + height / 2;
                
                // 只在X方向缩放
                scaleX = (dx + width) / width;
                break;
            }
            case ControllerPointType.LeftCenter: {
                // 左中：固定右边中点为缩放中心
                CX= x + width;
                CY= y + height / 2;

                // 只在X方向缩放
                scaleX = (-dx + width) / width;
                break;
            }
            case ControllerPointType.TopCenter: {
                // 上中：固定下边中点为缩放中心
                CX = x + width / 2;
                CY = y + height;
                
                // 只在Y方向缩放
                scaleY = (-dy + height) / height;
                break;
            }
            case ControllerPointType.BottomCenter: {
                // 下中：固定上边中点为缩放中心
                CX = x + width / 2;
                CY = y;
                
                // 只在Y方向缩放
                scaleY = (dy + height) / height;
                break;
            }
        }
        // 计算偏移量
        const offsetX = CX * (1 - scaleX);
        const offsetY = CY * (1 - scaleY);
        
        return{
            a: scaleX,
            b: 0,
            c: 0,
            d: scaleY,
            e: offsetX,
            f: offsetY,
        };
    }
    init(){
        this.ControllerPointArrays.forEach((item) => {
            item.rect.setEventMouseMove((e: IMousePos) =>{
                mouseContext.setMouseStyleType(ControllerPoint.mouseStyleMap[item.type] ?? MouseStyleType.Default);
            });

            item.rect.setEventMouseLeave((e: IMousePos) =>{
                mouseContext.setMouseStyleType(mouseContext.getState().mouseStyleType);
            });

            item.rect.setEventMouseDown((e: IMousePos) =>{
                const coor = {
                    x: e.world.x || 0,
                    y: e.world.y || 0,
                }
                item.rect.setRecordXY(coor);
                (item.rect.style as IStyle).fillStyle = "#909099";
            });

            item.rect.setEventDragMove((e: IMousePos) => {
                mouseContext.setMouseStyleType(ControllerPoint.mouseStyleMap[item.type] ?? MouseStyleType.Default);
                
                // 计算当前鼠标位置相对于初始位置的偏移
                let dx = e.world.x - item.rect.recordPoint.x;
                let dy = e.world.y - item.rect.recordPoint.y;

                const overTransform = this.getOverTransform(item.type,dx,dy);
                const newTransform = CoorUtils.getOverTanasform(DefTransform, overTransform);
                Object.assign(this.subject.transform, newTransform);
            });

            item.rect.setEventMouseUp((e: IMousePos) => {
                (item.rect.style as IStyle).fillStyle = "#3092d6";
                //更新尺寸
                this.subject.updateMeasure();
            });
        })
    }
    @Atom draw(){
        this.rect.draw();
        this.ControllerPointArrays.forEach((item) => {
            item.draw();
        })
    }
    destroy(){  //释放资源
        this.ControllerPointArrays.forEach((item) => {
            item.destroy();
        })
    }
}

//显示控制器
export class ShowController implements IController {  //显式控制器
    private rect: Rect;  //虚线矩形
    private padding: number = 2;  //内边距
    constructor(
        private subject: IElement,  //被控制主体
    ){
        const {x,y,width,height} = this.getRectData();
        const strokeColor = ("isStable" in this.subject) ? "#e1d528" : "#3092d6";
        this.rect = new Rect(x, y, width, height, {
            isEvent: false,
            drawType: DrawType.Stroke,  
            style: {
                lineWidth: 2,  //线宽固定为1
                strokeStyle: strokeColor,  //描边颜色
                globalAlpha: 1,  //透明度
            }
        });
    }
    private getRectData(){
        let {x,y} = this.subject.leftTop;
        let {x:x1,y:y1} = this.subject.rightBottom;
        // 增加内边距
        x -= this.padding;
        y -= this.padding;
        x1 += this.padding;
        y1 += this.padding;

        const width = x1 - x;
        const height = y1 - y;
        return {x,y,width,height};
    }
    updateDrawData(): void{  //更新绘制数据
        const {x,y,width,height} = this.getRectData();
        this.rect.setXY({x, y});
        this.rect.width = width;
        this.rect.height = height;
    }  
    @Atom draw(){
        this.rect.draw();
    }
    destroy(){  //释放资源
        
    }
}

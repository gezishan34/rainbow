import type { IContainerConfig, IElement, IElementSnapshoot, IGraphics, IGraphicsConfig, ILine, IRect, ISnapshoot, ITriangle } from "../check/interface.js";
import { ElementType } from "../enum/draw.js";
import Global from "../global.js";
import { Container } from "../graphics/container.js";
import { Arrow, Elipse, FreePath, Line, Rect, Rhomboid, RoundHeadRect, RoundRect, Triangle, Text, Rhombic } from "../graphics/graphics.js";
import { IDGenerator, ObjectUtils } from "../independent/utils.js";

export enum MementoTitle {
    Empty = "无描述",
    Init = "初始",
    Move = "移动图形",
    Group = "组合",
    UnGroup = "取消组合",
    Insert = "插入图形",
    Delete = "删除图形",
    UpdateStyle = "更改样式",
    Scaling = "缩放图形",
    Rotate = "旋转图形",
    Import = "导入项目",
}

//备忘录
export class StateMemento {
    public title:string = MementoTitle.Empty;  //备忘录标题
    private elementSnapshoots: IElementSnapshoot[];  //图元快照集合
    static getArgs(element: IElement,type: ElementType): any[]{  //获取图元的构造参数数组
        let args: any[] = [];
        switch(type){
            case ElementType.Container:{
                args = [];
                break;
            }
            case ElementType.Rect:
            case ElementType.RoundHeadRect:
            case ElementType.Rhombic:
            case ElementType.Elipse:{
                args = [
                    element.coorPoint.x,
                    element.coorPoint.y,
                    (element as unknown as IRect).width,
                    (element as unknown as IRect).height
                ];
                break;
            }
            case ElementType.RoundRect:{
                args = [
                    element.coorPoint.x,
                    element.coorPoint.y,
                    (element as unknown as RoundRect).width,
                    (element as unknown as RoundRect).height,
                    (element as unknown as RoundRect).radius
                ];
                break;
            }
            case ElementType.Rhomboid:{
                args = [
                    element.coorPoint.x,
                    element.coorPoint.y,
                    (element as unknown as Rhomboid).width,
                    (element as unknown as Rhomboid).height,
                    (element as unknown as Rhomboid).angleX
                ];
                break;
            }
            case ElementType.FreePath:{
                args = [
                element.coorPoint.x,
                element.coorPoint.y,
                ObjectUtils.getDeepCopy((element as unknown as FreePath).points)
                ];
                break;
            }
            case ElementType.Triangle:{
                args = [element.coorPoint.x,
                        element.coorPoint.y,
                        (element as unknown as ITriangle).coorPoint1.x,
                        (element as unknown as ITriangle).coorPoint1.y,
                        (element as unknown as ITriangle).coorPoint2.x,
                        (element as unknown as ITriangle).coorPoint2.y];
                break;
            }
            case ElementType.Line:
            case ElementType.Arrow:{
                args = [
                element.coorPoint.x,
                element.coorPoint.y,
                (element as unknown as ILine).endPoint.x,
                (element as unknown as ILine).endPoint.y
                ];
                break;
            }
            case ElementType.Text:{
                args = [
                element.coorPoint.x,
                element.coorPoint.y,
                (element as unknown as Text).text
                ];
                break;
            }
        }
        return args;
    }
    static parseSnapshoot(elementSnapshoot: IElementSnapshoot): IElement {  //根据快照解析图元
        const constructorMap: Map<ElementType, (new (...args: any[]) => IElement)> = new Map<ElementType, (new (...args: any[]) => IElement)>([
            [ElementType.Container, Container],  
            [ElementType.Rect, Rect],  
            [ElementType.RoundHeadRect, RoundHeadRect],  
            [ElementType.RoundRect, RoundRect],  
            [ElementType.Rhomboid, Rhomboid],  
            [ElementType.Rhombic, Rhombic],  
            [ElementType.Elipse, Elipse],  
            [ElementType.Triangle, Triangle],  
            [ElementType.FreePath, FreePath],  
            [ElementType.Line, Line],  
            [ElementType.Arrow, Arrow],  
            [ElementType.Text, Text]  
        ]);  //图元构造函数映射数组
        const {args,type,config,children} = elementSnapshoot;
        console.log("解析：",elementSnapshoot);
        const Ctor = constructorMap.get(type)!; //根据类型获取对应的构造函数
        config.id = IDGenerator.randomID();  //生成新的id
        args.push(config);  //将配置对象添加到构造参数数组的最后
        const element = new Ctor(...args);  //根据构造参数创建图元
        if(children && "children" in element){  //如果有子元素，则递归解析子元素
            children.forEach(item => {
                const childElement = this.parseSnapshoot(item);
                (element as Container).addChild(childElement);
            });
        }
        return element;
    }
    static parseSnapshoots(elementSnapshoot: IElementSnapshoot[]): IElement[] {  //根据完整快照解析图元数组
        return elementSnapshoot.map(item => this.parseSnapshoot(item));
    }
    static toSnapshoot(elements: IElement): IElementSnapshoot {  //将图元转换为快照
        let config: IGraphicsConfig|IContainerConfig;
        let args: any[] = [];
        let type: ElementType;
        let children: IElementSnapshoot[] | undefined = undefined;
        if("children" in elements){  //容器元素
            config = {
                id: elements.id,
                isStable: elements.isStable,
                isEvent: elements.isEvent,
                isDrag: elements.isDrag,
                style: ObjectUtils.getDeepCopy(elements.style),
            }
            type = ElementType.Container;
            children = (elements as Container).children.map(child => this.toSnapshoot(child));
        }else{  //普通图形元素
            config = {
                id: elements.id,
                isEvent: elements.isEvent,
                isDrag: elements.isDrag,
                style: ObjectUtils.getDeepCopy(elements.style),
                drawType: elements.drawType,
            }
            type = elements.type;
        }
        args = this.getArgs(elements,type);
        if(children) return { args, type, config, children };
        return { args, type, config };
    }
    static toSnapshoots(elements: IElement[]): IElementSnapshoot[] {  //将图元数组转换为完整快照
        return elements.map(item => this.toSnapshoot(item));
    }
    constructor(elements: Map<string,IElement> | IElement[] | IElementSnapshoot[],title:string = "无描述"){
        if(elements instanceof Map){
            this.elementSnapshoots = StateMemento.toSnapshoots(Array.from(elements.values()));
        }else if(elements[0] && "config" in elements[0]){
            this.elementSnapshoots = elements as IElementSnapshoot[];
        }else{
            this.elementSnapshoots = StateMemento.toSnapshoots(elements as IElement[]);
        }
        this.title = title;
    }

    /**
     * 获取当前备忘录对应的完整快照，当备忘录中图元快照集合为空时，返回null
     * @returns 返回当前备忘录对应的完整快照
     */
    getGlobalSnapshoots(): ISnapshoot|null{
        if(ObjectUtils.isEmptyArray(this.elementSnapshoots)) return null;
        return {
            viewport: Global.viewport,
            elementSnapshoots: this.elementSnapshoots,
        }
    }
    
    //获取图形容器
    getGraphicsMap(): Map<string,IGraphics>{
        return this.getGraphicsData().elementMap;
    }

    //获取图形容器与图层顺序，快照数组顺序即绘制顺序
    getGraphicsData(): {elementMap: Map<string,IGraphics>, elementOrder: string[]}{
        const map = new Map<string,IGraphics>();
        const order: string[] = [];
        StateMemento.parseSnapshoots(this.elementSnapshoots).forEach(item=>{
            map.set(item.id,item);
            order.push(item.id);
        });
        return {elementMap: map, elementOrder: order};
    }
}
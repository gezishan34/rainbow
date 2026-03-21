import mouseStyle from "../assets/mouseStyle.js";
import type {  IMousePos, IStyle } from "../check/interface.js";
import { MouseDrawType, MouseStyleType } from "../enum/draw.js";
import Global from "../global.js";
import { ObjectUtils } from "../independent/utils.js";
import { CircleState, ElipseState, NoneState, RectState, RhombicState, RhomboidState, RoundHeadRectState, RoundRectState, SquareState, State, LineState, DragState, ArrowState, TriangleState, FreePathState, TextState, SelectState } from "./mouseState.js";

//鼠标绘制上下文
export class MouseContext {
    private stateType: MouseDrawType;  //当前鼠标绘制类型
    private state: State;  //当前状态
    private mouseStyleType: MouseStyleType;  //当前鼠标样式类型
    public styleConfig: IStyle;  //鼠标绘制图形的样式配置
    static mouseContext: MouseContext;  //单例实例
    private constructor(){
        this.mouseStyleType = MouseStyleType.Default;
        this.stateType = MouseDrawType.None;
        this.state = new NoneState();
        this.styleConfig = {} as IStyle;
    }
    static create(): MouseContext{
        if(!MouseContext.mouseContext){
            MouseContext.mouseContext = new MouseContext();
        }
        return MouseContext.mouseContext;
    }
    getMouseStyleType(): MouseStyleType {  //获取鼠标样式类型
        return this.mouseStyleType;
    }
    setMouseStyleType(type: MouseStyleType): void {  //设置鼠标样式类型
        this.mouseStyleType = type;
        const arr = [MouseStyleType.Grab, 
                 MouseStyleType.Grabbing, 
                 MouseStyleType.Crosshair,
                 MouseStyleType.Move,
                 MouseStyleType.Text,
                 MouseStyleType.Pen
                ];
        if(arr.includes(type)){
            const suffix = "data:application/octet-stream;base64,";
            const data = mouseStyle[type];
            Global.ctx.canvas.style.cursor = `url('${suffix}${data}'),default`;
        }else{
            Global.ctx.canvas.style.cursor = `${type}`;
        }
    }
    getStateType(): MouseDrawType {  //获取状态
        return this.stateType;
    }
    setState(stateType: MouseDrawType): void {  //设置状态
        this.stateType = stateType;
        switch(this.stateType){
            case MouseDrawType.None:{
                this.state = new NoneState();
                break;
            }
            case MouseDrawType.Select:{
                this.state = new SelectState();
                break;
            }
            case MouseDrawType.Rect:{
                this.state = new RectState();
                break;
            }
            case MouseDrawType.Square:{
                this.state = new SquareState();
                break;
            }
            case MouseDrawType.Rhomboid:{
                this.state = new RhomboidState();
                break;
            }
            case MouseDrawType.RoundRect:{
                this.state = new RoundRectState();
                break;
            }
            case MouseDrawType.Circle:{
                this.state = new CircleState();
                break;
            }
            case MouseDrawType.RoundHeadRect:{
                this.state = new RoundHeadRectState();
                break;
            }
            case MouseDrawType.Rhombic:{
                this.state = new RhombicState();
                break;
            }
            case MouseDrawType.Elipse:{
                this.state = new ElipseState();
                break;
            }
            case MouseDrawType.Line:{
                this.state = new LineState();
                break;
            }
            case MouseDrawType.Drag:{
                this.state = new DragState();
                break;
            }
            case MouseDrawType.Triangle:{
                this.state = new TriangleState();
                break;
            }
            case MouseDrawType.Arrow:{
                this.state = new ArrowState();
                break;
            }
            case MouseDrawType.FreePath:{
                this.state = new FreePathState();
                break;
            }
            case MouseDrawType.Text:{
                this.state = new TextState();
                break;
            }
        }
        this.setMouseStyleType(this.state.mouseStyleType);
    }
    getState(): State {  //获取当前状态
        return this.state;
    }
    setStyle(style: IStyle): void {  //设置绘制样式
        this.styleConfig = ObjectUtils.getDeepCopy(style);
    }
    runMouseDown(coor: IMousePos): void {  //鼠标按下行为
        this.state.runMouseDown(coor);
    }
    runMouseMove(coor: IMousePos): void {  //鼠标移动行为
        this.state.runMouseMove(coor);
    }
    runMouseUp(coor: IMousePos): void {  //鼠标松开行为
        this.state.runMouseUp(coor);
    }
    runMouseLeave(coor: IMousePos): void {  //鼠标移开行为
        this.state.runMouseLeave(coor);
    }
    destroy(): void {  //销毁鼠标上下文
        this.mouseStyleType = MouseStyleType.Default;
        this.stateType = MouseDrawType.None;
        this.state = new NoneState();
        this.styleConfig = {} as IStyle;
    }
}

export const mouseContext = MouseContext.create();

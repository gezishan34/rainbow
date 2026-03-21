import type { IGlobalConfig, IViewport } from "./check/interface.js";
import { CoorUtils } from "./utils/business.js";



/*
全局对象
*/
export default class Global {
    static canvas: HTMLCanvasElement;  //全局canvasDOM元素
    static ctx: CanvasRenderingContext2D;  //全局canvas2D画笔
    static viewport: IViewport = {  //全局视口状态
        offsetX: 0, // 视口X偏移
        offsetY: 0, // 视口Y偏移
        scale: 1,   // 缩放比例（1=100%，>1放大，<1缩小）
    };
    static setViewport(viewport: IViewport) {
        Object.assign(Global.viewport, viewport);
        CoorUtils.setWorldTransform();
    }
    static init(config: IGlobalConfig) {
        const myEl = document.querySelector(config.el);
        if (myEl instanceof HTMLCanvasElement) {
            Global.canvas = myEl;
            Global.ctx = Global.canvas.getContext('2d') as CanvasRenderingContext2D;
        } else {
            throw Error(`CSS选择器：${config.el}不能匹配到canvas元素`);
        }
        
        Global.resizeCanvas();
        const dpr = window.devicePixelRatio || 1;
        Global.ctx.scale(dpr, dpr);
    }
    // 适配屏幕大小（监听窗口resize）
    static resizeCanvas() {
        // 设置Canvas绘图缓冲区尺寸（适配高清屏）
        Global.canvas.width = window.innerWidth;
        Global.canvas.height = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        Global.canvas.width *= dpr;
        Global.canvas.height *= dpr;
    }
    // 销毁
    static destroy(){
        
    }
}

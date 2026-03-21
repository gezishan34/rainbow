import type { IElement, IGraphics } from "../check/interface.js";
import Global from "../global.js";
import { ObjectUtils } from "../independent/utils.js";
import { CoorUtils } from "../utils/business.js";
import { StateMemento } from "./StateMemento.js";

//粘贴板
class Clipboard {
    private data: IElement | null = null;
    static clipboard: Clipboard;  //粘贴板实例
    private constructor(){}
    //创建粘贴板实例
    static create(): Clipboard {
        if(!this.clipboard){
            this.clipboard = new Clipboard();
        }
        return this.clipboard;
    }
    //获取粘贴板数据
    paste(): IElement | null {  //粘贴数据
        if(this.data){
            const screen ={
                x: Global.canvas.width/2,
                y: Global.canvas.height/2
            }
            const pos = CoorUtils.getWorldByScreen(screen);
            const offset = {
                x: pos.x - Math.abs(this.data.leftTop.x-this.data.rightBottom.x)/2 - this.data.coorPoint.x,
                y: pos.y - Math.abs(this.data.leftTop.y-this.data.rightBottom.y)/2 - this.data.coorPoint.y
            }
            this.data.move(offset);  //将图形移动到画布中心
        }
        return this.data;
    }
    //设置粘贴板数据
    set(data: IGraphics): void {  //设置粘贴板数据
        const snapshoot = StateMemento.toSnapshoot(data);
        this.data = StateMemento.parseSnapshoot(snapshoot);
    }
    //销毁粘贴板
    destroy(): void {
        this.data = null;
    }
}
export const clipboard = Clipboard.create();

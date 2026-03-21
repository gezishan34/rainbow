import type { StateMemento } from "./StateMemento";

//备忘录管理器
class StateCaretaker {
    private now: number = -1;  //当前备忘录索引
    private mementos: StateMemento[] = [];
    static readonly MAX: number = 100;  //最大存储备忘录条目数量
    static mementoAdim: StateCaretaker;  //单例实例

    private constructor(){

    }
    
    /**
     * 单例访问入口
     * @returns 返回单例实例
     */
    static create(): StateCaretaker {
        if(!StateCaretaker.mementoAdim) {
            StateCaretaker.mementoAdim = new StateCaretaker();
        }
        return StateCaretaker.mementoAdim;
    }

    /**
     * 添加一个备忘录条目，若超过最大限度，遗忘第一个备忘录条目
     * @param memento 要添加的备忘录条目
     */
    public addMemento(memento: StateMemento): void {
        this.mementos.splice(++this.now);  //往后截断，保留当前索引之前的备忘录
        if(this.now >= StateCaretaker.MAX) {
            this.now = StateCaretaker.MAX - 1;
            this.mementos.shift();  //遗忘第一个备忘录
        }
        this.mementos.push(memento);  //添加新的备忘录
    }

    /**
     * 
     * @returns 返回当前备忘录，如果当前备忘录为空，返回null
     */
    public getNowMemento(): StateMemento | null {
        if (this.now >= 0) {
            return this.mementos[this.now]!;
        }
        return null;
    }

    /**
     * 
     * @returns 返回下一个备忘录条目，如果已经是最后一个，返回null
     */
    public nextMemento(): StateMemento | null {
        if (this.now < this.mementos.length - 1) {
            return this.mementos[++this.now]!;
        }
        return null;
    }

    /**
     * 
     * @returns 返回上一个备忘录条目，若已经是第一个，返回null
     */
    public lastMemento(): StateMemento | null {
        if (this.now >= 0) {
            return this.mementos[--this.now]!;
        }
        return null;
    }

    public destroy(): void {
        this.now = -1;
        this.mementos.length = 0;
    }
}

export const mementoAdim = StateCaretaker.create();
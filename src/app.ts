import Global from "./global.js";
import type { IBackgroundConfig, IContainer, ICoor, IElement, IEventInfo, IEventListener, IExportImageConfig, IExportOption, IGlobalConfig, ISnapshoot } from "./check/interface.js";
import { EventType } from "./enum/event.js";
import { DrawUtils } from "./utils/business.js";
import { DefZoom } from "./enum/draw.js";
import { mouseContext } from "./mouseBehavior/mouseContext.js";
import { CoorUtils, EventUtils, ViewUtils } from "./utils/business.js";
import { MementoTitle, StateMemento } from "./memento/StateMemento.js";
import { mementoAdim } from "./memento/StateCaretaker.js";
import { Editor } from "./utils/editor.js";
import { clipboard } from "./memento/clipboard.js";
import { Container } from "./graphics/container.js";
import { Log } from "./independent/utils.js";
import { CommandController } from "./command/keyboardController.js";

export let stage: Stage | null = null;

/**
 * 舞台类（单例由 `Stage.init` 创建）。
 */
export class Stage {
    elementMap: Map<string,IElement>;  //图形对象Map，key为图形id，value为图形对象
    elementOrder: string[];  //图层顺序，数组前端为底层，数组末端为顶层
    assistMap: Map<string,IElement>;  //辅助图形对象Map，key为辅助图形id，value为辅助图形对象
    selected: IElement|null;  //当前选中的图形对象或容器对象，初始为null
    backgroundConfig: IBackgroundConfig;  //背景配置
    isEditing: boolean;  //是否正在编辑状态
    recordPoint: ICoor = {x:0,y:0};  //记录鼠标按下位置
    eventHandlers: IEventListener[] = [];  //存储所有事件处理函数，用于销毁时移除事件监听
    commandController: CommandController;  //命令控制器
    private saveCallback: ((saveStr: string) => void)|null = null;  //保存回调函数，初始为null
    private exportCallback: ((blob: Blob|null) => void)|null = null;  //导出回调函数，初始为null
    
    private constructor(){
        this.elementMap = new Map();
        this.elementOrder = [];
        this.assistMap = new Map();
        this.selected = null;
        this.backgroundConfig = {};
        this.isEditing = false;
        //取消鼠标默认行为
        this.cancelDefaultEvent();

        //设置窗口变化事件
        this.setResize();

        // 键位 → CommandId → CommandBus → Stage 既有 API；
        this.commandController = new CommandController(this);
        this,this.commandController.attach(this.eventHandlers);

        //设置鼠标滚动事件
        this.setMouseWheel();

        //设置点击事件
        this.setEventClick();

        //设置双击事件
        this.setEventDblclick();

        //设置鼠标按下事件
        this.setEventMouseDown();

        //设置鼠标移动事件
        this.setEventMouseMove();

        //设置鼠标释放事件
        this.setEventMouseUp();

        //设置鼠标移出事件
        this.setEventMouseLeave();

        //统一注册事件
        this.eventHandlers.forEach(item => {
            const {target, type, handler} = item;
            EventUtils.bindEvent(target, type, handler);
        });

        //设置世界坐标
        CoorUtils.setWorldTransform();  //设置当前世界坐标系
    }

    static init(config: IGlobalConfig): Stage|null {
        try{
            Global.init(config);
            stage = new Stage();
            if(config.snapshootStr){
                const memento: ISnapshoot = JSON.parse(config.snapshootStr);
                Global.setViewport(memento.viewport);
                const initMemento = new StateMemento(memento.elementSnapshoots,MementoTitle.Init);
                stage.restoreFromMemento(initMemento);
                mementoAdim.addMemento(initMemento);  //添加初始状态备忘录
            }else{
                mementoAdim.addMemento(new StateMemento([],MementoTitle.Init));  //添加初始状态备忘录
            }
            stage.refresh();
            return stage;
        }
        catch(err){
            console.error("初始化失败",err);
            return null;
        }
        
    }

    /**
     * 从备忘录中恢复图元表和图层顺序
     * @param memento 备忘录
     */
    private restoreFromMemento(memento: StateMemento): void {
        const {elementMap, elementOrder} = memento.getGraphicsData();
        this.elementMap = elementMap;
        this.elementOrder = elementOrder;  
    }

    /**
     * 按图层绘制顺序获取图元，数组前端先绘制
     * @returns
     */
    getElementsInDrawOrder(): IElement[] {
        return this.elementOrder.map(id => this.elementMap.get(id)) as IElement[];
    }

    getElementsInHitOrder(): IElement[] {  //按命中检测顺序获取图元，顶层图元优先响应事件
        return [...this.getElementsInDrawOrder()].reverse();
    }

    forEachElementInDrawOrder(callback: (element: IElement) => void): void {  //按绘制顺序遍历图元
        this.getElementsInDrawOrder().forEach(callback);
    }

    forEachElementInHitOrder(callback: (element: IElement) => void): void {  //按事件命中顺序遍历图元
        this.getElementsInHitOrder().forEach(callback);
    }

    private removeElementOrder(id: string): void {  //从图层顺序中移除指定图元id
        this.elementOrder = this.elementOrder.filter(item => item !== id);
    }

    private insertElementOrder(id: string, index?: number): void {  //将图元id插入指定层级，默认置于顶层
        this.removeElementOrder(id);
        if(index === undefined || index < 0 || index >= this.elementOrder.length){
            this.elementOrder.push(id);
            return;
        }
        this.elementOrder.splice(index, 0, id);
    }

    private getMaxLayerIndex(elements: IElement[]): number | undefined {  //获取一组图元中最高的现有层级索引
        let maxIndex = -1;
        elements.forEach(element => {
            const index = this.elementOrder.indexOf(element.id);
            if(index > maxIndex) maxIndex = index;
        });
        return maxIndex === -1 ? undefined : maxIndex;
    }

    private getLayerInsertIndex(previousOrder: string[], layerIndex?: number, insertedId?: string): number | undefined {  //根据删除前顺序换算当前可用的插入索引
        if(layerIndex === undefined) return undefined;
        return this.elementOrder.filter(id => {
            if(id === insertedId) return false;
            const previousIndex = previousOrder.indexOf(id);
            return previousIndex !== -1 && previousIndex <= layerIndex;
        }).length;
    }

    private cancelDefaultEvent(){
        Global.canvas.addEventListener(EventType.Wheel, (e) => e.preventDefault()); // 取消滚动默认行为
        Global.canvas.addEventListener(EventType.MouseDown, (e) => e.preventDefault()); // 取消鼠标按下默认行为
        Global.canvas.addEventListener(EventType.MouseMove, (e) => e.preventDefault()); // 取消鼠标移动默认行为
        Global.canvas.addEventListener(EventType.Contextmenu, (e) => e.preventDefault()); // 取消右键默认行为
    }

    private setResize(){  //注册窗口变化事件
        this.eventHandlers.push({
            target: window, 
            type: EventType.Resize, 
            handler: () => {
                Global.resizeCanvas();
                this.refresh();
            }
        });
    }

    private setMouseWheel(): void {  //注册画布的鼠标滚动事件
        this.eventHandlers.push({
            target: Global.canvas,
            type: EventType.Wheel,
            handler: (e?: IEventInfo) => {
                if (!(e instanceof WheelEvent)) return;

                if(this.isEditing) return;  //输入状态禁止鼠标滚动事件
                const mousePos = CoorUtils.getMousePos(e);
                // e.deltaY > 0 向下滚动，e.deltaY < 0 向上滚动
                const delta = e.deltaY > 0 ? -1 : 1;

                if (e.ctrlKey) {  // Ctrl+滚轮：以鼠标为中心缩放
                    ViewUtils.scaleAtMouse(mousePos, delta);
                } else if (e.shiftKey) {  // Shift+滚轮：左右移动
                    Global.viewport.offsetX += delta * DefZoom.moveSpeed / Global.viewport.scale;
                } else {  // 普通滚轮：上下移动
                    Global.viewport.offsetY += delta * DefZoom.moveSpeed / Global.viewport.scale;
                }
                CoorUtils.setWorldTransform();  //设置当前世界坐标系
                this.refresh();  // 帧刷新画布
            }
        });
    }

    private setEventClick(): void {  //注册画布的鼠标点击事件
        this.eventHandlers.push({
            target: Global.canvas,
            type: EventType.Click,
            handler: (e?: IEventInfo) => {
                if (!(e instanceof MouseEvent)) return;

                let vis = false;
                this.forEachElementInHitOrder(item => {
                    if(!item.isEvent||vis) return;
                    const mousePos = CoorUtils.getMousePos(e,item);
                    if(EventUtils.runMouseClick(mousePos,item)){
                        vis = true;  //标记选中图形
                    } 
                });

                this.assistMap.forEach(item => {
                    if(!item.isEvent) return;
                    const mousePos = CoorUtils.getMousePos(e,item);
                    EventUtils.runMouseClick(mousePos,item);  
                });

                this.refresh();  //刷新
            }
        });
    }

    private setEventMouseDown(): void {  //注册画布的鼠标按下事件
        this.eventHandlers.push({
            target: Global.canvas,
            type: EventType.MouseDown,
            handler: (e?: IEventInfo) => {
                if (!(e instanceof MouseEvent)) return;

                const editor = Editor.create();
                // 如果正在编辑，先完成当前编辑
                if (editor.isEditing) {
                    editor.finishEditing();
                }
                if(e.button) return;

                let vis = false;
                this.assistMap.forEach(item => {
                    if(!item.isEvent||vis) return;
                    const mousePos = CoorUtils.getMousePos(e,item);
                    if(EventUtils.runMouseDown(mousePos,item)){
                        vis = true;
                        this.recordPoint = mousePos.world;  //记录鼠标按下位置
                    }  
                });

                this.forEachElementInHitOrder(item => {
                    if(!item.isEvent||vis) return;
                    const mousePos = CoorUtils.getMousePos(e,item);
                    if(EventUtils.runMouseDown(mousePos,item)){
                        vis = true;  //标记点中图形
                        this.recordPoint = mousePos.world;  //记录鼠标按下位置
                        if(e.shiftKey){
                            this.addSelect(item);
                        }else{
                            this.cutSelect(item);
                        }
                        if(this.selected) this.add(this.selected,false);
                    }
                });

                if(!vis){
                    this.removeSelect();
                    mouseContext.runMouseDown(CoorUtils.getMousePos(e));
                }
                
                this.refresh();  //刷新
            }
        });
    }

    private setEventMouseMove(): void {  //注册画布的鼠标移动事件
        this.eventHandlers.push({
            target: document,
            type: EventType.MouseMove,
            handler: (e?: IEventInfo) => {
                if (!(e instanceof MouseEvent)) return;

                if(e.buttons === 1){  //鼠标左键按下
                    let vis = false;
                    this.assistMap.forEach(item => {
                        if(!item.isEvent||vis) return;
                        const mousePos = CoorUtils.getMousePos(e,item);
                        if(item.isMouseDown){
                            vis = true;
                            EventUtils.runDragMove(mousePos,item);
                        }
                    });
                    this.forEachElementInHitOrder(item => {
                        if(!item.isEvent||vis) return;
                        if(item.isMouseDown){
                            vis = true;
                            const mousePos = CoorUtils.getMousePos(e,item);
                            EventUtils.runDragMove(mousePos, item);
                        }
                    });
                    mouseContext.runMouseMove(CoorUtils.getMousePos(e));
                }else if(e.buttons === 0){  //无任何键按下
                    this.forEachElementInHitOrder(item=>{
                        if(!item.isEvent) return;
                        const mousePos = CoorUtils.getMousePos(e,item);
                        if(EventUtils.runMouseMove(mousePos,item)){
                            item.isMouseMove = true;
                        }else if(item.isMouseMove){  //触发图形的鼠标移开事件
                            item.isMouseMove = false;
                            EventUtils.runMouseLeave(mousePos,item);
                        }  
                    })
                    this.assistMap.forEach(item => {
                        if(!item.isEvent) return;
                        const mousePos = CoorUtils.getMousePos(e,item);
                        if(EventUtils.runMouseMove(mousePos,item)){
                            item.isMouseMove = true;
                        }else if(item.isMouseMove){  //触发图形的鼠标移开事件
                            item.isMouseMove = false;
                            EventUtils.runMouseLeave(mousePos,item);
                        }  
                    });
                }
                
                this.refresh();  //刷新
            }
        });
        
        document.addEventListener(EventType.MouseMove, (e: MouseEvent) => {
            
        });
    }

    private setEventMouseUp(): void {  //注册画布的鼠标松开事件
        this.eventHandlers.push({
            target: document,
            type: EventType.MouseUp,
            handler: (e?: IEventInfo) => {
                if (!(e instanceof MouseEvent)) return;

                if(e.button) return;
                let vis = false;
                this.forEachElementInHitOrder(item => {
                    if(!item.isEvent||vis) return;
                    const mousePos = CoorUtils.getMousePos(e,item);
                    if(EventUtils.runMouseUp(mousePos,item)){
                        vis = true;  //标记停止拖拽
                        if(!CoorUtils.equalCoor(this.recordPoint, mousePos.world)){  //移动过，记录历史
                            this.addMemento(MementoTitle.Move);  //添加状态备忘录快照——移动图形
                        }
                    }
                });

                this.assistMap.forEach(item => {
                    if(!item.isEvent||vis) return;
                    const mousePos = CoorUtils.getMousePos(e,item);
                    if(EventUtils.runMouseUp(mousePos,item)){
                        vis = true;  //标记停止拖拽
                        if(!CoorUtils.equalCoor(this.recordPoint, mousePos.world)){  //移动过，记录历史
                            this.addMemento(MementoTitle.Scaling);  //添加状态备忘录快照——缩放图形
                        }
                    }
                });

                mouseContext.runMouseUp(CoorUtils.getMousePos(e));
                this.refresh();  //刷新
            }
        });
    }

    private setEventMouseLeave(): void {  //注册画布的鼠标移开事件
        this.eventHandlers.push({
            target: document,
            type: EventType.MouseLeave,
            handler: (e?: IEventInfo) => {
                if (!(e instanceof MouseEvent)) return;

                this.forEachElementInDrawOrder(item => {
                    if(!item.isEvent) return;
                    const mousePos = CoorUtils.getMousePos(e,item);
                    EventUtils.runMouseLeave(mousePos,item);
                });
                mouseContext.runMouseLeave(CoorUtils.getMousePos(e));
                this.refresh();  //刷新
            }
        });
    }

    private setEventDblclick(): void {  //注册画布的双击事件
        this.eventHandlers.push({
            target: Global.canvas,
            type: EventType.Dblclick,
            handler: (e?: IEventInfo) => {
                if (!(e instanceof MouseEvent)) return;

                if(e.button) return;
                let vis = false;
                this.forEachElementInHitOrder(item => {
                    if(!item.isEvent||vis) return;
                    const mousePos = CoorUtils.getMousePos(e,item);
                    if(EventUtils.runDblclick(mousePos,item)){
                        vis = true;  //标记在图形范围内松下鼠标
                    }
                });
            }
        });
    }

    setSaveCallback(callback: (saveStr: string) => void): void {  //设置保存回调函数
        this.saveCallback = callback;
    }

    setExportCallback(callback: (blob: Blob|null) => void): void {  //设置导出回调函数
        this.exportCallback = callback;
    }

    last(): void{  //上一步：Ctrl+Z
        const memento = mementoAdim.lastMemento();
        Log.info(`撤回到：${memento}`);
        if(!memento) return;
        this.restoreFromMemento(memento);

        this.assistMap.clear();  
        this.refresh();  
    }

    next(): void{  //下一步：Ctrl+Y
        const memento = mementoAdim.nextMemento();
        Log.info(`还原到：${memento}`);
        if(!memento) return;
        this.restoreFromMemento(memento);

        this.assistMap.clear();  
        this.refresh();  
    }

    group(): void{  //组合：Ctrl+G
        if(this.selected&&'isStable' in this.selected){
            this.selected.isStable = true;
            this.selected.setController();
            this.addMemento(MementoTitle.Group);  //添加状态备忘录快照——组合
        }
    }

    unGroup(): void{  //解除组合：Ctrl+Shift+G
        if(this.selected&&'isStable' in this.selected){
            this.selected.isStable = false;
            this.selected.setController();
            this.addMemento(MementoTitle.UnGroup);  //添加状态备忘录快照——取消组合
        }
    }

    selectAll(): void{  //全选：Ctrl+A
        this.getElementsInDrawOrder().forEach(item=>{
            this.addSelect(item);
        });
        if(this.selected) this.add(this.selected,false);
    }

    /**
     * 保存/获取当前画布状态
     * @param isCallBack 是否执行保存事件的回调
     * @returns 
     */
    save(): void {  //保存：Ctrl+S
        const nowMemento = mementoAdim.getNowMemento()?.getGlobalSnapshoots();
        const saveStr: string = nowMemento ? JSON.stringify(nowMemento) : '';
        Log.info(`save字符串：${saveStr}`);
        if(this.saveCallback) this.saveCallback(saveStr);  //执行保存事件的回调
    }

    copy(): void {  //复制选中图形：Ctrl+C
        if(this.selected){
            clipboard.set(this.selected);
        }
    }

    shear(): void {  //剪切选中图形：Ctrl+X
        if(this.selected){
            clipboard.set(this.selected);
            this.remove(this.selected);
            this.selected = null;
        }
    }

    paste(): void {  //粘贴剪切板中的图形：Ctrl+V
        const data = clipboard.paste();
        if(data){
            this.add(data);
            this.cutSelect(data);
        }
    }

    delete(): void {  //删除选中图形：Backspace/Delete
        if(this.selected){
            this.remove(this.selected);
            this.selected = null;
        }
    }

    reset(): void {  //清空画布：Ctrl+L
        this.removeAll();
        this.refresh();
    }

    exportFile(option: IExportOption): void {  //执行导出文件
        if(this.exportCallback){
            const {
                isSelectedOnly,
                isAssistLine,
                isBackground,
                backgroundColor
            } = option;
            const imgConfig: IExportImageConfig = {
                isSelectedOnly: isSelectedOnly, 
                isAssistLine: isAssistLine,
                isBackground: isBackground, 
                backgroundColor: backgroundColor
            };
            this.fixedStage(imgConfig);
            
            Global.canvas.toBlob(this.exportCallback,option.format,option.quality);
            if(this.selected) this.selected.setController();
            this.refresh();
        }
    }

    importJsonStr(jsonStr: string): void {  //执行导入文件(传入一个代表项目数据的json字符串)
        if(!jsonStr) return;
        try{
            const memento: ISnapshoot = JSON.parse(jsonStr);
            Global.setViewport(memento.viewport);
            const initMemento = new StateMemento(memento.elementSnapshoots,MementoTitle.Import);
            this.restoreFromMemento(initMemento);
            mementoAdim.addMemento(initMemento);  //添加初始状态备忘录
            this.refresh();
        }catch(err){
            throw new Error(`JSON解析错误: ${err}`);
        }
    }

    cutSelect(element: IElement): void {  //切换选择
        if(this.selected !== element){
            this.removeSelect();  //先移除当前选择
            this.selected = element;
            this.selected.setController();
        }
    }

    addSelect(element: IElement): void {  //添加选择
        if(!this.selected) this.selected = element;
        else{
            const previousOrder = [...this.elementOrder];
            const layerIndex = this.getMaxLayerIndex([this.selected, element]);
            if("addChild" in this.selected&&!this.selected.isStable){  //是松容器
                this.selected.addChild(element);
            }else{  
                const temp = this.selected;
                temp.removeController();
                this.remove(temp,false);
                this.selected = new Container({isEvent: true, isDrag: true});
                if("addChild" in this.selected){ 
                    this.selected.addChild(temp);
                    this.selected.addChild(element);
                }
            }
            this.remove(element,false);
            if(this.selected){
                const insertIndex = this.getLayerInsertIndex(previousOrder, layerIndex, this.selected.id);
                if(this.elementMap.has(this.selected.id)){
                    this.insertElementOrder(this.selected.id, insertIndex);
                }else{
                    this.add(this.selected,false,insertIndex);
                }
            }
        }
        this.selected.setController();
    }

    removeSelect(): void {  //移除选择
        if(this.selected){
            if("spilt" in this.selected&&!this.selected.isStable){
                const previousOrder = [...this.elementOrder];
                const layerIndex = this.elementOrder.indexOf(this.selected.id);
                const children = this.selected.spilt();
                this.remove(this.selected,false);
                const insertIndex = this.getLayerInsertIndex(previousOrder, layerIndex);
                children.forEach((child, index) => {
                    this.add(child,false,insertIndex === undefined ? undefined : insertIndex + index);
                });
            }
            this.selected.removeController();
            this.selected = null;  //清空选中项
        } 
    }

    addMemento(title: string = MementoTitle.Empty){
        mementoAdim.addMemento(new StateMemento(this.getElementsInDrawOrder(),title));  //将当前画布快照状态添加进备忘录
    }

    /**
     * 设置顶层图元的绘制顺序（elementOrder：数组前端为底层，末端为顶层）
     * @param newOrder 与当前顶层 id 集合一致的新顺序
     */
    setRootElementOrder(newOrder: string[]): void {
        const expected = new Set(this.elementOrder);
        if(newOrder.length !== expected.size){
            return;
        }
        for(const id of newOrder){
            if(!expected.has(id)){
                return;
            }
        }
        this.elementOrder = [...newOrder];
        this.addMemento(MementoTitle.LayerOrder);
        this.refresh();
    }

    /**
     * 设置组合容器内子图元的绘制顺序（children：数组前端为底层，末端为顶层）
     */
    setContainerChildrenOrder(containerId: string, orderedChildIds: string[]): void {
        const parent = this.elementMap.get(containerId) as IContainer | undefined;
        if(!parent?.children){
            return;
        }
        const children = parent.children;
        if(orderedChildIds.length !== children.length){
            return;
        }
        const byId = new Map(children.map(c => [c.id, c] as const));
        for(const id of orderedChildIds){
            if(!byId.has(id)){
                return;
            }
        }
        children.length = 0;
        for(const id of orderedChildIds){
            children.push(byId.get(id)!);
        }
        this.addMemento(MementoTitle.LayerOrder);
        this.refresh();
    }

    /**
     * 将指定图形元素添加进显示图形集合，可指定是否严格模式\
     * 严格模式：图形元素id是否已存在，若存在则抛出错误；若图形id不存在，则添加成功且创建快照\
     * 非严格模式：若id已存在，不进行任何操作；若id不存在，则添加成功但不创建快照
     * @param graphics 要添加的图形元素
     * @param isStrict 是否严格模式，默认true
     */
    add(element: IElement, isStrict: boolean = true, orderIndex?: number): void { 
        if(this.elementMap.has(element.id)){
            if(isStrict) throw Error(`id为：${element.id}的图形已存在`);
        }else{
            this.elementMap.set(element.id,element);
            this.insertElementOrder(element.id,orderIndex);
            if(isStrict) this.addMemento(MementoTitle.Insert);  //添加备忘录
        }
    }

    /**
     * 将指定图形元素添加进辅助图形集合，可指定是否严格模式\
     * 严格模式：若图形元素id是否已存在，若存在则抛出错误\
     * 非严格模式：若id已存在，不进行任何操作
     * @param graphics 要添加的辅助图形元素
     * @param isStrict 是否严格模式，默认true
     */
    addAssist(assist: IElement, isStrict: boolean = true): void { 
        if(this.assistMap.has(assist.id)){
            if(isStrict) throw Error(`id为：${assist.id}的辅助图形已存在`);
        }else{
            this.assistMap.set(assist.id,assist);
        }
    }

    /**
     * 去除指定图元
     * @param graphics 要删除的图形元素
     * @param isStrict 是否添加备忘录
     */
    remove(graphics: IElement, isStrict: boolean = true): void {
        this.elementMap.delete(graphics.id);
        this.removeElementOrder(graphics.id);
        if(isStrict) this.addMemento(MementoTitle.Delete);  //添加备忘录
    }

    /**
     * 根据id删除指定图元
     * @param id 要删除的图形元素id
     * @param isStrict 是否添加备忘录
     */
    removeById(id: string, isStrict: boolean = true): void {
        this.elementMap.delete(id);
        this.removeElementOrder(id);
        if(isStrict) this.addMemento(MementoTitle.Delete);  //添加备忘录
    }

    removeAssist(assist: IElement): void {
        this.assistMap.delete(assist.id);
    }

    removeAssistById(id: string): void {
        this.assistMap.delete(id);
    }

    removeAll(): void {  //删除所有图形
        this.elementMap.clear();
        this.elementOrder = [];
    }

    removeAllAssist(): void {  //删除所有辅助图形
        this.assistMap.clear();
    }

    clear(): void {  //清空画布   
        DrawUtils.clear();
    }

    /**
     * 重绘所有图形
     * @param isAssistLine 是否包含辅助线，默认true
     * @param isBackground 是否包含背景，默认true
     */
    drawAll(backgroundConfig: IBackgroundConfig = this.backgroundConfig): void {
        DrawUtils.drawStageBackgroud(backgroundConfig);  //绘制舞台背景
        DrawUtils.drawAll(this.getElementsInDrawOrder());
    }

    fixedStage(imgConfig: IExportImageConfig){  //根据导出配置固定舞台
        this.clear();  
        const bgConfig: IBackgroundConfig = {
            isAssetLine: imgConfig.isAssistLine,
            assistLineType: this.backgroundConfig.assistLineType,
            isBackground: imgConfig.isBackground,
            backgroundColor: imgConfig.backgroundColor
        };
        DrawUtils.drawStageBackgroud(bgConfig);  //绘制舞台背景
        this.selected?.removeController();  //移除控制器
        if(imgConfig.isSelectedOnly&&this.selected){
            this.selected.draw();
        }else{
            DrawUtils.drawAll(this.getElementsInDrawOrder());
        }
    }

    refresh(): void {  //帧刷新画布
        this.clear();
        this.drawAll();
    }

    destroy(): void {  //销毁画布
        this.elementMap.clear();  //清空图形集合
        this.elementOrder = [];  //清空图层顺序
        this.assistMap.clear();  //清空辅助图形集合
        this.selected = null;
        
        mouseContext.destroy();  //销毁鼠标上下文
        mementoAdim.destroy();  //销毁备忘录管理器
        clipboard.destroy();  //销毁粘贴板
        Editor.destroy();  //销毁编辑器
        

        this.eventHandlers.forEach(item => {  //移除事件监听
            const {target, type, handler} = item;
            EventUtils.removeEvent(target, type, handler);
        });
    }
}
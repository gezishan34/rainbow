import type { IBackgroundConfig, ICoor, IGraphics,IMousePos, ITransform, IStyle } from "../check/interface.js";
import Global from "../global.js";
import { AssistLineType, DefTransform, DefZoom } from "../enum/draw.js";
import { Atom } from "../decorator/decorator.js";
import { EventType } from "../enum/event.js";
import { IDGenerator } from "../independent/utils.js";

//坐标工具
export class CoorUtils{
  static getMousePos(e: MouseEvent, target?: IGraphics): Required<IMousePos> {
    const canvas = Global.canvas;
    const rect = canvas.getBoundingClientRect();
    
    // 计算canvas元素的实际缩放比例
    const scaleX = canvas.width / rect.width;   // 水平方向缩放比例
    const scaleY = canvas.height / rect.height; // 垂直方向缩放比例

    // 计算屏幕坐标系坐标
    const screen: ICoor = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
    
    // 将屏幕坐标转换为世界坐标
    const world: ICoor = CoorUtils.getWorldByScreen(screen);

    // 计算变换矩阵作用下的坐标
    const graph: ICoor = CoorUtils.getCoorByTransform(world, target?.transform || DefTransform);

    // 计算相对于目标图形的偏移量
    const offset = {
      x: target ? world.x - target.coorPoint.x : 0,
      y: target ? world.y - target.coorPoint.y : 0
    }

    return { world, screen, graph, offset };
  }
  static getWorldByScreen(screen: ICoor): ICoor {  //将屏幕坐标系坐标转换为世界坐标系坐标
    const x = (screen.x - Global.viewport.offsetX) / Global.viewport.scale;
    const y = (screen.y - Global.viewport.offsetY) / Global.viewport.scale;
    return {x,y};
  }
  static getScreenByWorld(world: ICoor): ICoor {  //将世界坐标系坐标转换为屏幕坐标系坐标
    const x = world.x * Global.viewport.scale + Global.viewport.offsetX;
    const y = world.y * Global.viewport.scale + Global.viewport.offsetY;
    return {x,y};
  }
  static getAbsCoorByTransform(coor: ICoor, transform: ITransform): ICoor {  //根据指定变换矩阵作用下的坐标获取绝对坐标
    const {a,b,c,d,e,f} = transform;
    const x = coor.x * a + coor.y * b + e;
    const y = coor.x * c + coor.y * d + f;
    return {x,y};
  }
  static getCoorByTransform(absCoor: ICoor, transform: ITransform): ICoor {  //根据绝对坐标获取指定变换矩阵作用下的坐标
    const {a,b,c,d,e,f} = transform;
    const x = (d*absCoor.x - d*e - c*absCoor.y + c*f) / (a*d - b*c);
    const y = (a*absCoor.y - a*f - b*absCoor.x + b*e) / (a*d - b*c);
    return {x,y};
  }
  static getNowAbsCoor(coor: ICoor): ICoor {  //根据当前变换矩阵作用下的坐标获取绝对坐标
    const transform = CoorUtils.nowTransform();
    return CoorUtils.getAbsCoorByTransform(coor, transform);
  }
  static getCoorSum(coor1: ICoor, coor2: ICoor): ICoor {  //获取两个坐标的和
    return {
      x: coor1.x + coor2.x,
      y: coor1.y + coor2.y,
    }
  }
  static addCoor(coor: ICoor, addCoor: ICoor): void {  //坐标相加
    coor.x += addCoor.x;
    coor.y += addCoor.y;
  }
  static equalCoor(coor1: ICoor, coor2: ICoor): boolean {  //判断两个坐标是否相等
    return coor1.x === coor2.x && coor1.y === coor2.y;
  }

  //获取当前的变换矩阵
  static nowTransform(): ITransform{
    return Global.ctx.getTransform();
  }
  //获取指定变换矩阵（不指定则为当前变换矩阵）的反转矩阵（若a矩阵乘b矩阵得到初始矩阵，则称b矩阵是a的反转矩阵）
  static getReverseTransform(transform: ITransform = CoorUtils.nowTransform()): ITransform {  //获取指定变换矩阵的反转矩阵
    const {a,b,c,d,e,f} = transform;
    const det = a*d - b*c;
    return {
      a: d / det,
      b: -b / det,
      c: -c / det,
      d: a / det,
      e: (c*f - d*e) / det,
      f: (b*e - a*f) / det,
    }
  }
  //获取当前世界坐标系的转换矩阵
  static getWorldTransform(): ITransform {  //获取当前世界坐标系的转换矩阵
    const {offsetX,offsetY,scale} = Global.viewport;
    return {a:scale,b:0,c:0,d:scale,e:offsetX,f:offsetY};
  }
  //获取当前世界坐标系的反转矩阵
  static getReverseWorldTransform(): ITransform {  //获取当前世界坐标系的反转矩阵
    return CoorUtils.getReverseTransform(CoorUtils.getWorldTransform());
  }
  static getOverTanasform(transformA:ITransform,transformB:ITransform): ITransform{  //叠加变换矩阵
    const {a,b,c,d,e,f} = transformA;
    const {a:a1,b:b1,c:c1,d:d1,e:e1,f:f1} = transformB;
    return {
      a: a*a1 + b*c1,
      b: a*b1 + b*d1,
      c: c*a1 + d*c1,
      d: c*b1 + d*d1,
      e: e*a1 + f*c1 + e1,
      f: e*b1 + f*d1 + f1,
    }
  }
  //设置绘图变换矩阵
  static setTransform(transform: ITransform): void{
    const { a, b, c, d, e, f } = transform;
    Global.ctx.setTransform(a, b, c, d, e, f);
  }
  //设置当前世界坐标系的绘图变换矩阵
  static setWorldTransform(): void{  //设置当前世界坐标系
    CoorUtils.setTransform(CoorUtils.getWorldTransform());
  }
  //叠加变换矩阵
  static transform(transform: ITransform): void{
    const { a, b, c, d, e, f } = transform;
    Global.ctx.transform(a, b, c, d, e, f);
  }
  
}

//样式工具
export class StyleUtils{
  static setStyleByGlobal(config: IStyle){  //设置底层画笔样式
    //ObjectUtils.assignOfCommonProps(Global.ctx, config);  //将配置对象的所有属性值赋给ctx的所有相同属性
    Object.assign(Global.ctx,config);
    if(config.hasOwnProperty("lineDash")){
      Global.ctx.setLineDash(config.lineDash??[]);
    }
    
    let font = `${config.fontStyle??""} ${config.fontWeight??""} ${config.fontSize??""}px ${config.fontFamily??""}`;
    if(font.trim() != "px"){
      Global.ctx.font = font.trim();
    }
  }
  static setStyleByGraphics(target: IGraphics,config: IStyle): void{  //设置图形样式
    // 如果传入的是字符串，按颜色简化处理；否则把对象的属性赋给 ctx
    if (typeof config === "string") {
      target.style = config;
    }else{
      Object.assign(target.style,config);
    }
  }
  static setStyleByIds(selecteds: string[], graphicsMap: Map<string,IGraphics>, style: IStyle): void{  //设置选中图形样式
    selecteds.forEach(id => {
      const item = graphicsMap.get(id);
      if(item){
        this.setStyleByGraphics(item,style); 
      }
    });
  }
  
}

//绘制工具
export class DrawUtils{
  //清空画布
  @Atom static clear(): void{
    CoorUtils.setTransform(DefTransform);  //变换矩阵状态改为默认状态
    Global.ctx.clearRect(0, 0, Global.canvas.width, Global.canvas.height);
  }
  static setContext(transform: ITransform,style: IStyle){  //设置图形的上下文环境
    CoorUtils.transform(transform);
    StyleUtils.setStyleByGlobal(style);
  }
  //绘制所有图形
  static drawAll(graphics : Map<string,IGraphics>): void{
    graphics.forEach(item => {
        item.draw();
    });
  }
  //绘制无限网格线
  static drawInfiniteGrid(gridSize: number = 50) {
    gridSize *= Global.viewport.scale;
    const ctx = Global.ctx;
    const canvas = Global.canvas;

    const cX = canvas.width / 2;  //中心点x坐标
    const cY = canvas.height / 2;  //中心点y坐标

    const startX = cX - Math.floor(cX/gridSize) * gridSize;  //垂直线的x开始坐标
    const endX = cX + Math.floor(cX/gridSize) * gridSize;  //垂直线的x结束坐标
    const startY = cY - Math.floor(cY/gridSize) * gridSize;  //水平线的y开始坐标
    const endY = cY + Math.floor(cY/gridSize) * gridSize;  //水平线的y结束坐标  

    
    ctx.strokeStyle = '#e0e0e0';

    //绘制水平线
    for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    //绘制垂直线
    for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
  }
  @Atom static drawStageBackgroud(config: IBackgroundConfig){  //绘制舞台背景
    CoorUtils.setTransform(DefTransform);  //变换矩阵状态改为默认状态
    if(config.isBackground){
      Global.ctx.fillStyle = config.backgroundColor ?? "#ffffff";
      Global.ctx.fillRect(0, 0, Global.canvas.width, Global.canvas.height);
    }
    if(config.isAssetLine===undefined || config.isAssetLine){
      if(config.assistLineType === undefined || config.assistLineType === AssistLineType.Grid){
        DrawUtils.drawInfiniteGrid(config.gridSize);
      }
    }
  }
}

//事件工具
export class EventUtils{
  /**
   * 为指定事件目标对象注册指定的事件处理函数
   * @param target 事件目标对象
   * @param type 事件类型
   * @param handler 事件处理函数
   */
  static bindEvent(target: EventTarget, type: EventType, handler: (e?: Event) => void) {
    target.addEventListener(type, handler);
  }
  /**
   * 移除指定事件目标对象的指定事件处理函数
   * @param target 事件目标对象
   * @param type 事件类型
   * @param handler 事件处理函数
   */
  static removeEvent(target: EventTarget, type: EventType, handler: (e?: Event) => void) {
    target.removeEventListener(type, handler);
  }
  /**
   * 运行指定图元的鼠标点击事件
   * @param e 鼠标点击事件对象
   * @param target 图形元素
   * @returns 
   */
  static runMouseClick(e: IMousePos, target: IGraphics): boolean {
    let vis = false;  //标记是否点中图形元素
    if (target.isInterior(e)) {
      vis = true;  //标记点中图形元素
      target.runEvent(e, EventType.Click);
    }
    return vis;
  }
  /**
   * 运行指定图元的鼠标双击事件
   * @param e 鼠标双击事件对象
   * @param target 图形元素
   * @returns 
   */
  static runDblclick(e: IMousePos, target: IGraphics): boolean {
    let vis = false;  //标记是否点中图形元素
    if (target.isInterior(e)) {
      vis = true;  //标记点中图形元素
      target.runEvent(e, EventType.Dblclick);
    }
    return vis;
  }
  /**
   * 运行指定图元的鼠标按下事件
   * @param e 鼠标按下事件对象
   * @param target 图形元素
   * @returns 
   */
  static runMouseDown(e: IMousePos, target: IGraphics): boolean {
    let vis = false;  //标记是否点中图形元素 
    if (target.isInterior(e)) {
      vis = true;  //标记点中图形元素
      target.isMouseDown = true;  //标记为鼠标按下状态
      target.isDragging = true;  //标记为拖拽中
      target.runEvent(e, EventType.MouseDown);
    }
    return vis;
  }
  /**
   * 运行指定图元的鼠标拖拽移动事件
   * @param e 鼠标拖拽移动事件对象
   * @param target 图形元素
   * @returns 
   */
  static runDragMove(e: IMousePos, target: IGraphics): void {
    target.runEvent(e, EventType.DragMove);  //更改target的坐标
  }
  /**
   * 运行指定图元的鼠标移动事件
   * @param e 鼠标移动事件对象
   * @param target 图形元素
   * @returns 
   */
  static runMouseMove(e: IMousePos, target: IGraphics): boolean {
    let vis = false;  //标记是否在图形元素内部松开鼠标

    if (target.isInterior(e)) {
      vis = true;  //标记在图形元素内部松开鼠标
      target.isMouseDown = false;  //标记为鼠标松开状态
      target.isDragging = false;  //标记为未选中
      target.runEvent(e, EventType.MouseMove);
    }
    return vis;
  }
  /**
   * 运行指定图元的鼠标松开事件
   * @param e 鼠标松开事件对象
   * @param target 图形元素
   * @returns 
   */
  static runMouseUp(e: IMousePos, target: IGraphics): boolean {
    let vis = target.isDragging;  //标记是否拖拽中

    if(vis){
      target.isMouseDown = false;  //标记为鼠标松开状态
      target.isDragging = false;  //标记为未拖拽
      target.runEvent(e, EventType.MouseUp);
    }
    return vis;
  }
  /**
   * 运行指定图元的鼠标移出事件
   * @param e 鼠标移出事件对象
   * @param target 图形元素
   */
  static runMouseLeave(e: IMousePos, target: IGraphics): void {
    target.isMouseDown = false;  //标记为鼠标松开状态
    target.isDragging = false;  //鼠标移出画布后，标记为未选中
    target.runEvent(e, EventType.MouseLeave);
  }
}

//视图工具
export class ViewUtils{
  static scaleAtMouse(mousePos: IMousePos, delta: number) {  //根据鼠标位置和滚轮程度缩放画布
    const viewport = Global.viewport;
    
    // 3. 计算新的缩放比例
    const newScale = Math.max(
        DefZoom.minScale,
        Math.min(DefZoom.maxScale, viewport.scale + delta * DefZoom.scaleSpeed)
    );
    
    // 4. 计算新的偏移量，使鼠标指向的世界坐标点保持在同一屏幕位置
    // screen = world * scale + offset  =>  offset = screen - world * scale
    viewport.offsetX = mousePos.screen.x - mousePos.world.x * newScale;
    viewport.offsetY = mousePos.screen.y - mousePos.world.y * newScale;
    
    // 5. 更新缩放比例
    viewport.scale = newScale;
  }
}

//代理工具
export class ProxyUtils{
  
}
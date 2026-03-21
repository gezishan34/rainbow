//事件类型
export enum EventType {
    //官方事件
    Resize = 'resize',  //窗口大小改变
    Click = 'click',  //点击
    Dblclick = 'dblclick',  //双击
    MouseDown = 'mousedown',  //鼠标按下
    MouseMove = 'mousemove',  //鼠标移动
    MouseUp = 'mouseup',  //鼠标释放
    MouseLeave = 'mouseleave',  //鼠标移出
    Contextmenu = 'contextmenu',  //右键菜单
    Wheel = 'wheel',  //滚轮滚动
    KeyDown = 'keydown',  //键盘按下
    KeyUp = 'keyup',  //键盘释放

    //自定义事件
    DragMove = 'dragmove',  //拖拽移动
}

export enum KeyType {
    Shift = 'Shift',
    Ctrl = 'Control',
    Alt = 'Alt',
    Backspace = 'Backspace',
    Delete = 'Delete',
    Up = 'ArrowUp',
    Down = 'ArrowDown',
    Left = 'ArrowLeft',
    Right = 'ArrowRight',
    
}

/**
 * 事件类型
 */
export enum EventType {
    //官方事件
    /**
     * 窗口大小改变
     */
    Resize = 'resize',

    /**
     * 点击
     */
    Click = 'click',  

    /**
     * 双击
     */
    Dblclick = 'dblclick', 

    /**
     * 鼠标按下
     */
    MouseDown = 'mousedown',  

    /**
     * 鼠标移动
     */
    MouseMove = 'mousemove',  

    /**
     * 鼠标释放
     */
    MouseUp = 'mouseup',  

    /**
     * 鼠标移出
     */
    MouseLeave = 'mouseleave',  

    /**
     * 右键菜单
     */
    Contextmenu = 'contextmenu',  

    /**
     * 滚轮滚动
     */
    Wheel = 'wheel', 

    /**
     * 键盘按下
     */
    KeyDown = 'keydown',  

    /**
     * 键盘释放
     */
    KeyUp = 'keyup',  

    //自定义事件
    /**
     * 拖拽移动
     */
    DragMove = 'dragmove', 
}

/**
 * 键值类型
 */
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

/**
 * 命令类型
 */
export enum CommandType {
    /**
     * 全选：Ctrl+A
     */
    SelectAll,

    /**
     * 上一步：Ctrl+Z
     */
    Last,

    /**
     * 下一步：Ctrl+Y
     */
    Next,

    /**
     * 组合：Ctrl+G
     */
    Group,

    /**
     * 解组合：Ctrl+Shift+G
     */
    UnGroup,

    /**
     * 保存：Ctrl+S
     */
    Save,

    /**
     * 复制：Ctrl+C
     */
    Copy,

    /**
     * 剪切：Ctrl+X
     */
    Shear,

    /**
     * 粘贴：Ctrl+V
     */
    Paste,

    /**
     * 删除：Backspace/Delete
     */
    Delete,

    /**
     * 清空：Ctrl+L
     */
    Reset,
}

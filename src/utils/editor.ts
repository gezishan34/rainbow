import { stage } from "../app.js";
import type { ICoor } from "../check/interface.js";
import type { Text } from "../graphics/graphics.js";
import { CoorUtils } from "./business.js";

//文本编辑器
export class Editor {
    private inputElement: HTMLInputElement | null = null;  //输入框元素
    private graphics: Text | null = null;
    isEditing: boolean = false;  //是否正在编辑
    static editor: Editor | null = null;
    private constructor() {
        // 设置输入框样式，仅保留输入功能，显示功能由画布完成
        this.inputElement = document.createElement('input');
        this.inputElement.type = 'text';
        this.initStyle();
        
        // 添加事件监听器
        this.inputElement.addEventListener('input', () => this.inputChange());
        this.inputElement.addEventListener('blur', () => this.finishEditing());  
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.finishEditing();
            }
        });
        
        document.body.appendChild(this.inputElement);
    }
    public setGraphics(graphics: Text): void {  //设置要编辑的文本图元
        this.graphics = graphics;
        this.inputElement!.value = this.graphics.text;
    }
    private initStyle(): void {  //初始化输入框样式
        if(!this.inputElement) return;
        const config = {
            position: 'absolute',  //设置绝对定位
            border: 'none',  //设置边框无样式
            background: 'transparent',  //设置背景透明
            padding: '0',  //无内边距
            margin: '0',  //无外边距
            fontSize: '20px',  //字体大小
            color: 'transparent',  //字体颜色透明
            caretColor: '#000',  //设置光标颜色为黑色
            outline: 'none',  //取消获得焦点的轮廓线
            resize: 'none',  //禁用调整大小功能
            minWidth: '30px',  //固定输入框最小宽度
            overflow: 'hidden',  //隐藏溢出内容
            zIndex: '1000',  //设置较高的图层顺序，确保在其他元素之上
            display: 'none'  //初始时隐藏输入框
        }
        Object.assign(this.inputElement.style, config);
    }
    static create(graphics?: Text): Editor {  //创建编辑器
        if(!Editor.editor){
            Editor.editor = new Editor();
        }
        if(graphics){
            Editor.editor.setGraphics(graphics);
        }
        return Editor.editor;
    }
    static destroy(): void {  //销毁资源
        if (Editor.editor?.inputElement) {
            document.body.removeChild(Editor.editor.inputElement);
            Editor.editor.inputElement = null;
        }
    }
    public showInputAtPosition(screenPos?: ICoor): void {  //显示输入框
        if (!this.inputElement) return;
        const dpr = window.devicePixelRatio || 1;
        const pos = screenPos || CoorUtils.getScreenByWorld(this.graphics?.coorPoint || {x: 0, y: 0});
        
        // 直接使用鼠标事件的clientX和clientY坐标
        this.inputElement.style.left = `${pos.x/dpr}px`;
        this.inputElement.style.top = `${pos.y/dpr}px`;
        this.inputElement.style.display = 'block';
        this.inputElement.value = this.graphics?.text || '';
        this.inputElement.focus();
        
        this.isEditing = true;
        if (stage) {  //开启舞台的编辑状态
            stage.isEditing = true;
        }
    }
    private inputChange(): void {  //更新文本内容
        if (!this.inputElement || !this.graphics) return;
        // 设置文本内容
        this.graphics.setText(this.inputElement.value);
        stage?.refresh();
    }
    public finishEditing(): void {  //完成编辑
        if (!this.inputElement || !this.graphics) return;
        
        const text = this.inputElement.value;
        if (text) {
            // 设置文本内容
            this.graphics.setText(text);
        } else {
            // 如果文本为空，移除图形
            stage?.remove(this.graphics);
            this.graphics = null;
        }
        
        this.hideInput();
        if (stage) {  //关闭舞台的编辑状态
            stage.isEditing = false;
        }
    }
    private hideInput(): void {
        if (this.inputElement) {
            this.inputElement.style.display = 'none';
            this.isEditing = false;
        }
    }
    
}
import type { IEventInfo, IEventListener } from '../check/interface.js'
import { EventType, KeyType } from '../enum/event.js'
import { MouseDrawType } from '../enum/draw.js'
import { mouseContext } from '../mouseBehavior/mouseContext.js'
import { CommandBus } from './commandBus.js'
import { type ICommandTarget, CommandId } from './commandCheck.js'
import { MementoTitle } from '../memento/StateMemento.js'

/**
 * 命令控制器
 * 将浏览器键盘事件翻译为 {@link CommandId} 并经由 {@link CommandBus} 派发。
 */
export class CommandController {
    public readonly bus: CommandBus

    private isSpaceDown = false
    private isADown = false
    private isZDown = false
    private isYDown = false

    /** 记录按下空格前的鼠标工具状态，以便在 keyup 时还原。 */
    private nowDrawState: MouseDrawType

    constructor(private readonly stage: ICommandTarget) {
        this.bus = new CommandBus(stage)
        this.bus.registerAllDefaults()
        this.nowDrawState = mouseContext.getStateType()
    }

    /**
     * 向Stage的`eventHandlers`追加事件注册信息；
     */
    attach(eventHandlers: IEventListener[]): void {
        eventHandlers.push({
            target: window,
            type: EventType.KeyDown,
            handler: (e?: IEventInfo) => {
                this.onKeyDown(e)
            },
        })
        eventHandlers.push({
            target: window,
            type: EventType.KeyUp,
            handler: (e?: IEventInfo) => {
                this.onKeyUp(e)
            },
        })
    }

    /** 平台友好的「主修饰键」：Windows/Linux Ctrl，macOS 常用 Cmd */
    private isMod(e: KeyboardEvent): boolean {
        return e.ctrlKey || e.metaKey
    }

    private onKeyDown(e?: IEventInfo): void {
        if (!(e instanceof KeyboardEvent)) {
            return
        }
        if (this.stage.isEditing) {
            return
        }

        switch (e.key) {
            case KeyType.Backspace:
            case KeyType.Delete: {
                this.bus.dispatch(CommandId.Delete)
                break
            }
            case KeyType.Up: {
                this.bus.dispatch(CommandId.NudgeUp)
                break
            }
            case KeyType.Down: {
                this.bus.dispatch(CommandId.NudgeDown)
                break
            }
            case KeyType.Left: {
                this.bus.dispatch(CommandId.NudgeLeft)
                break
            }
            case KeyType.Right: {
                this.bus.dispatch(CommandId.NudgeRight)
                break
            }
            case ' ': {
                if (!this.isSpaceDown) {
                    this.nowDrawState = mouseContext.getStateType()
                    if (this.nowDrawState !== MouseDrawType.Drag) {
                        mouseContext.setState(MouseDrawType.Drag)
                    }
                    this.isSpaceDown = true
                }
                break
            }
            case 'a': {
                if (!this.isADown && this.isMod(e)) {
                    e.preventDefault()
                    this.bus.dispatch(CommandId.SelectAll)
                    this.isADown = true
                }
                break
            }
            case 'g': {
                if (this.isMod(e) && !e.shiftKey) {
                    e.preventDefault()
                    this.bus.dispatch(CommandId.Group)
                }
                break
            }
            case 'G': {
                if (this.isMod(e) && e.shiftKey) {
                    e.preventDefault()
                    this.bus.dispatch(CommandId.UnGroup)
                }
                break
            }
            case 'z': {
                if (this.isMod(e) && !this.isZDown) {
                    this.isZDown = true
                    this.bus.dispatch(CommandId.Last)
                }
                break
            }
            case 'y': {
                if (this.isMod(e) && !this.isYDown) {
                    this.isYDown = true
                    this.bus.dispatch(CommandId.Next)
                }
                break
            }
            case 'c': {
                if (this.isMod(e)) {
                    this.bus.dispatch(CommandId.Copy)
                }
                break
            }
            case 'x': {
                if (this.isMod(e)) {
                    this.bus.dispatch(CommandId.Cut)
                }
                break
            }
            case 'v': {
                if (this.isMod(e)) {
                    this.bus.dispatch(CommandId.Paste)
                }
                break
            }
            case 's': {
                if (this.isMod(e)) {
                    e.preventDefault()
                    this.bus.dispatch(CommandId.Save)
                }
                break
            }
            case 'l': {
                if (this.isMod(e)) {
                    e.preventDefault()
                    this.bus.dispatch(CommandId.Reset)
                }
                break
            }
            default:
                break
        }
    }

    private onKeyUp(e?: IEventInfo): void {
        if (!(e instanceof KeyboardEvent)) {
            return
        }

        switch (e.key) {
            case ' ': {
                mouseContext.setState(this.nowDrawState);
                this.isSpaceDown = false;
                break
            }
            case 'a': {
                this.isADown = false;
                break
            }
            case 'z': {
                this.isZDown = false;
                break
            }
            case 'y': {
                this.isYDown = false;
                break
            }
            case KeyType.Up:
            case KeyType.Down:
            case KeyType.Left:
            case KeyType.Right: {
                if (!this.stage.isEditing) {
                    this.stage.addMemento(MementoTitle.Move);
                }
                break
            }
            default:
                break
        }
    }
}

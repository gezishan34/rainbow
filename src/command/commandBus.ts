import { DefZoom } from '../enum/draw.js'
import { type ICommandTarget, CommandId } from './commandCheck.js'

/**
 * 命令总线
 *
 * 职责：
 * - 维护「命令 ID → 无参执行函数」的注册表；
 * - `dispatch` 执行命令；
 * - 不在此层自动 `refresh`：由调用方（键盘控制器）在合适的时机统一刷新，避免重复绘制。
 */
export class CommandBus {
    private readonly handlers = new Map<CommandId, () => void>()

    constructor(private readonly target: ICommandTarget) {}

    /**
     * 注册单条命令；重复注册同 ID 时后写覆盖先写。
     */
    register(id: CommandId, handler: () => void): void {
        this.handlers.set(id, handler);
    }

    /**
     * 执行指定命令：若当前处于编辑态，或该 命令ID 未注册，则静默。
     */
    dispatch(id: CommandId): void {
        if (this.target.isEditing) return;
        const callback = this.handlers.get(id);
        if (callback) {
            callback();
            this.target.refresh();
        }
    }

    /**
     * 将当前工程内全部默认快捷键行为绑定到 Stage 已有方法。
     */
    registerAllDefaults(): void {
        const s = this.target

        this.register(CommandId.Delete, () => {
            s.delete()
        })

        this.register(CommandId.SelectAll, () => {
            s.selectAll()
        })

        this.register(CommandId.Group, () => {
            s.group()
        })

        this.register(CommandId.UnGroup, () => {
            s.unGroup()
        })

        this.register(CommandId.Last, () => {
            s.last()
        })

        this.register(CommandId.Next, () => {
            s.next()
        })

        this.register(CommandId.Copy, () => {
            s.copy()
        })

        this.register(CommandId.Cut, () => {
            s.shear()
        })

        this.register(CommandId.Paste, () => {
            s.paste()
        })

        this.register(CommandId.Save, () => {
            s.save()
        })

        this.register(CommandId.Reset, () => {
            s.reset()
        })

        const nudge = (dx: number, dy: number) => () => {
            s.selected?.move({ x: dx, y: dy })
        }

        this.register(CommandId.NudgeUp, nudge(0, -DefZoom.keyMoveSpeed))
        this.register(CommandId.NudgeDown, nudge(0, DefZoom.keyMoveSpeed))
        this.register(CommandId.NudgeLeft, nudge(-DefZoom.keyMoveSpeed, 0))
        this.register(CommandId.NudgeRight, nudge(DefZoom.keyMoveSpeed, 0))
    }
}

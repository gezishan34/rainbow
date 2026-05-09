import type { IElement } from '../check/interface.js'

/**
 * 可编排命令的标识（方案 C：命令总线派发用）。
 *
 * 与「快捷键」的关系：键位解析得到某个 {@link CommandId} 后，交由 {@link CommandBus}
 * 统一派发；具体实现仍委托给 Stage 现有方法，备忘录语义保持与改造前一致（策略 C1）。
 *
 * 使用字符串枚举便于日志、未来做用户自定义键位配置与持久化。
 */
export enum CommandId {
    // 方向键：上移选中图元（微移，单次 keydown 不记备忘录；keyup 记 Move） 
    NudgeUp = 'nudgeUp',
    NudgeDown = 'nudgeDown',
    NudgeLeft = 'nudgeLeft',
    NudgeRight = 'nudgeRight',

    /** Backspace / Delete */
    Delete = 'delete',

    /** 全选：Ctrl+A */
    SelectAll = 'selectAll',

    /** 组合：Ctrl+G */
    Group = 'group',

    /** 取消组合：Ctrl+Shift+G */
    UnGroup = 'unGroup',

    /** 撤销：Ctrl+Z */
    Last = 'last',

    /** 还原：Ctrl+Y */
    Next = 'next',

    /** 复制：Ctrl+C */
    Copy = 'copy',

    /** 剪切：Ctrl+X */
    Cut = 'cut',

    /** 粘贴：Ctrl+V */
    Paste = 'paste',

    /** 保存：Ctrl+S */
    Save = 'save',

    /** 清空画布：Ctrl+L */
    Reset = 'reset',

    /** 置于顶层：Ctrl+] */
    BringToFront = 'bringToFront',

    /** 置于底层：Ctrl+[ */
    SendToBack = 'sendToBack',

    /** 上移一层：Ctrl+Shift+] */
    BringForward = 'bringForward',

    /** 下移一层：Ctrl+Shift+[ */
    SendBackward = 'sendBackward',
}

/**
 * 「命令层」所需stage的最小能力面；实现者为 {@link Stage}（结构化兼容即可）。
 *
 * - 避免 command 子模块 import `app.ts` 中的 Stage 类产生循环依赖；
 * - 约束命令实现仅能调用明确列出的 API，便于单测与后续替换实现。
 */
export interface ICommandTarget {
    /** 是否处于编辑状态 */
    isEditing: boolean

    /** 当前选中图元 */
    selected: IElement | null

    delete(): void
    last(): void
    next(): void
    group(): void
    unGroup(): void
    selectAll(): void
    copy(): void
    shear(): void
    paste(): void
    save(): void

    reset(): void

    /** 将选中图元置于当前父级内的最顶层 */
    bringToFront(): void

    /** 将选中图元置于当前父级内的最底层 */
    sendToBack(): void

    /** 与上一层（更靠近顶层）交换顺序 */
    bringForward(): void

    /** 与下一层（更靠近底层）交换顺序 */
    sendBackward(): void

    refresh(): void

    /**
     * 记录备忘录快照；方向键在 keyup 时补记 Move，与改造前一致。
     */
    addMemento(title: string): void
}


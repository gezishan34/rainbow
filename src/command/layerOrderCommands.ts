import type { CommandBus } from './commandBus.js'
import type { ICommandTarget } from './commandCheck.js'
import { CommandId } from './commandCheck.js'

/**
 * 注册图层顺序相关命令（置于顶/底、上移一层、下移一层）。
 * 实现委托给 {@link ICommandTarget}，由 Stage 提供具体逻辑。
 */
export function registerLayerOrderCommands(bus: CommandBus, target: ICommandTarget): void {
    bus.register(CommandId.BringToFront, () => {
        target.bringToFront()
    })
    bus.register(CommandId.SendToBack, () => {
        target.sendToBack()
    })
    bus.register(CommandId.BringForward, () => {
        target.bringForward()
    })
    bus.register(CommandId.SendBackward, () => {
        target.sendBackward()
    })
}

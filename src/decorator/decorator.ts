import Global from "../global.js";
import type { Graphics } from "../graphics/graphics.js";

export function Atom(target: any, propertyKey: string, descriptor: PropertyDescriptor){
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]){
        Global.ctx.save();
        const result = originalMethod.apply(this, args);
        Global.ctx.restore();
        return result;
    }
}
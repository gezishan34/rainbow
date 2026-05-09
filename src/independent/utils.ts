import type { GenericObject } from "./type.js"
//通用的工具类,任何场景都可使用，不依赖与其他业务模块，只依赖一个类型的别名模块

//对象工具
export class ObjectUtils{
    //使用source中的属性修改target中存在的相同的属性
    /**
     * 用源对象上与目标对象的「共有属性的值」修改目标对象的「对应属性」
     * 👉 核心特性：
     * 1.源对象可包含任意额外属性，仅修改与目标对象的共有属性
     * 2.目标对象不得为空（null/undefined）、非对象类型
     * @param target 目标对象（接收值，仅修改已有属性）
     * @param source 源对象（提供值，可包含任意额外属性）
     * @returns 赋值后的目标对象（便于链式调用）
     * @throws 若目标对象为 null/undefined 或非对象类型，抛出明确错误
     */
    static assignOfCommonProps(target: any,source: any): any {
        // 边界校验：目标对象必须是有效非空对象
        if (target === null || target === undefined) {
            throw new TypeError('目标对象不能为 null 或 undefined');
        }
        if (typeof target !== 'object') {
            throw new TypeError('目标对象必须是对象类型（普通对象/类实例）');
        }

        // 边界校验：源对象为 null/undefined/{} 时直接返回目标对象（无操作）
        if (source == null || ObjectUtils.isEmptyObject(source)) {
            return target;
        }

        // 1. 获取目标对象的「所有自有属性名」（含不可枚举属性）
        const targetKeys = Object.getOwnPropertyNames(target);

        // 2. 遍历目标属性，仅赋值「源对象也拥有的自有属性」
        targetKeys.forEach((key) => {
            // 跳过目标对象的原型链属性（仅处理自有属性）
            if (!Object.prototype.hasOwnProperty.call(target, key)) return;

            // 仅当源对象有该「自有属性」时才赋值（避免覆盖为 undefined）
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                // 类型断言：确保源属性值类型与目标属性匹配（TS 类型安全）
                const sourceValue = source[key];
                target[key] = sourceValue;
            }
        });

        return target;
    }

    /**
     * 判断是否空对象{}
     * @param obj 
     * @returns 
     */
    static isEmptyObject(obj: any) {
        if (
            obj === null ||
            obj === undefined ||
            typeof obj !== 'object' ||
            Array.isArray(obj) ||
            obj instanceof Date || // 排除日期对象
            obj instanceof RegExp  // 排除正则对象
        ) {
            return false;
        }

        // 检查是否有任何自身属性（可枚举 + 不可枚举）
        if (Object.getOwnPropertyNames(obj).length || Object.getOwnPropertySymbols(obj).length) {
        return false;
        }

        // 验证原型链（确保是普通对象，排除 Object.create(null)）
        return Object.getPrototypeOf(obj) === Object.prototype;
    }

    /**
     * 判断是否空数组[]
     * @param val 
     * @returns 
     */
    static isEmptyArray(val: any){
        return Array.isArray(val)&&val.length===0;
    }

    /**
     * 深拷贝对象
     * @param obj 
     * @returns 
     */
    static getDeepCopy<T>(obj: T): T {
        // 使用WeakMap来跟踪已经处理过的对象，避免循环引用
        const seen = new WeakMap<object, any>();
        return this._getDeepCopy(obj, seen);
    }

    /**
     * 内部深拷贝方法，支持循环引用检测
     * @param obj 
     * @param seen 已处理对象的映射
     * @returns 
     */
    private static _getDeepCopy<T>(obj: T, seen: WeakMap<object, any>): T {
        if (obj === null || typeof obj !== 'object') {
            return obj; // 基础类型或 null/undefined
        }

        // 检查是否已经处理过该对象（避免循环引用）
        if (seen.has(obj as object)) {
            return seen.get(obj as object);
        }

        //处理数组
        if (Array.isArray(obj)) {
            const copy: any[] = [];
            seen.set(obj as object, copy); // 先记录引用，避免循环引用
            for (let i = 0; i < obj.length; i++) {
                copy[i] = this._getDeepCopy(obj[i], seen);
            }
            return copy as T;
        }

        // 处理Map对象
        if (obj instanceof Map) {
            const copy = new Map();
            seen.set(obj as object, copy); // 先记录引用，避免循环引用
            for (const [key, value] of obj) {
                copy.set(key, this._getDeepCopy(value, seen)); // 递归复制键值对
            }
            return copy as T;
        }

        // 处理普通对象
        const copy: any = {};
        seen.set(obj as object, copy); // 先记录引用，避免循环引用
        
        // 复制原型链
        copy.__proto__ = Object.getPrototypeOf(obj);
        
        // 复制所有自有属性
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                copy[key] = this._getDeepCopy(obj[key], seen); // 递归属性值
            }
        }
        return copy;
    }
}

//ID生成器
export class IDGenerator {
  private static counters: Map<string, number> = new Map();

  static next(prefix: string = 'id'): string {
    const count = (this.counters.get(prefix) || 0) + 1;
    this.counters.set(prefix, count);
    return `${prefix}-${count}`;
  }

  static randomID(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  static getCounters(): Map<string, number> {
    return this.counters;
  }
}

//日志工具
export class Log {
    static env: "dev"|"prod" = "dev";

    static info(msg: string): void{
        if(Log.env === "dev") console.log(msg);
    }

    static warn(msg: string): void{
        if(Log.env === "dev") console.warn(msg);
    }

    static error(msg: string|Error): void{
        if(Log.env === "dev") console.error(msg);
    }
    
}
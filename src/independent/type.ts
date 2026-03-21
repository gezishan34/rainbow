/**
 * 通用对象类型
 * 键类型 `string | number | symbol` 符合所有JS的合法键类型
 * 值类型 unknown 表示值可以是任意的，它比any更安全
 */
type GenericObject = Record<string | number | symbol, unknown>

/**
 * 可构造类型
 * new 表示：该类型可以用new操作符调用
 * ...args 表示：构造器可以接受【任意数量】的参数
 * any[] 表示：构造器可以接受【任意类型】的参数
 * {} 表示：返回类型是对象（非null,非undefined的对象）
 */
type Constructor = new (...args:any[]) => {};

export type { GenericObject, Constructor} 
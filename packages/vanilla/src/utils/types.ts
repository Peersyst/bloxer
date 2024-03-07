/**
 * If E inherits from T, return T & E, else return T
 */
export type Inherited<T, E> = E extends T ? T & E : T;

/**
 * Instance of a constructor
 */
export type InstanceOf<T extends { new (...params: any[]): any }> = T extends { new (...params: any[]): infer I } ? I : never;

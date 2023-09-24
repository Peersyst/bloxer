/**
 * Difference between A and B
 */
export type Difference<A, B> = Omit<A, keyof B>;

/**
 * Omit required properties from T
 */
export type OmitRequired<T extends AnyObject> = {
    [K in keyof T as Pick<T, K> extends Pick<Required<T>, K> ? never : K]: T[K];
};

/**
 * Omit optional properties from T
 */
export type OmitOptional<T> = {
    [K in keyof T as Pick<T, K> extends Pick<Required<T>, K> ? K : never]: T[K];
};

/**
 * All possible iterations for a recursive type
 */
export type MaxRecursiveIterations = 10;
// prettier-ignore
export type Iterations = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export type AnyObject = Record<string | symbol | number, any>;

/**
 * Get nested keys from T in the form of key1.key2...
 */
export type NestedKeys<T extends AnyObject> = CoreNestedKeys<T>;
export type CoreNestedKeys<T extends AnyObject, I extends number = MaxRecursiveIterations> = I extends 0
    ? never
    : {
          [Key in keyof T]: T[Key] extends AnyObject
              ? `${Exclude<Key, symbol>}` | `${Exclude<Key, symbol>}.${CoreNestedKeys<T[Key], Iterations[I]>}`
              : Key;
      }[Extract<keyof T, string>];

/**
 * Pick K types from T with keys in the form of key1.key2...
 */
export type DeepPick<T extends AnyObject, K extends NestedKeys<T>> = CoreDeepPick<T, K>;
export type CoreDeepPick<T extends AnyObject, K extends string, I extends number = MaxRecursiveIterations> = I extends 0
    ? never
    : K extends `${infer FirstKey}.${infer RestKey}`
    ? CoreDeepPick<T[FirstKey], RestKey, Iterations[I]>
    : T[K];

/**
 * If E inherits from T, return T & E, else return T
 */
export type Inherited<T, E> = E extends T ? T & E : T;

/**
 * Makes all properties, included nested ones, partial
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[] ? DeepPartial<U>[] : T[P] extends object ? DeepPartial<T[P]> : T[P];
};

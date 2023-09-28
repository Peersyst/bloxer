import { DeepPick, NestedKeys } from "./utils.types";

/**
 * Executes a function with retries
 * @param fn The function to execute
 * @param maxRetries The maximum number of retries
 * @param timeout The timeout between retries
 * @param onRetry The callback to execute on retry
 * @returns The result of the function
 */
export async function withRetries<T>(
    fn: () => T,
    maxRetries: number,
    timeout: number,
    onRetry?: (error: any) => void,
): Promise<Awaited<T>> {
    let retries = 0;

    while (true) {
        try {
            return await Promise.resolve(fn());
        } catch (error) {
            if (retries >= maxRetries) {
                throw error;
            }
            onRetry?.(error);
            retries++;
            await new Promise((resolve) => setTimeout(resolve, timeout));
        }
    }
}

/**
 * Checks if an item is a plain object
 * @param item The item to check
 * @returns Whether the item is a plain object
 */
export function isPlainObject(item: unknown): item is Record<keyof any, unknown> {
    return item !== null && typeof item === "object" && item?.constructor === Object;
}

export interface DeepmergeOptions {
    clone?: boolean;
}

/**
 * Deepmerges two objects
 * @param target The target object
 * @param source The source object
 * @param options Options
 * @returns The merged object
 */
export function deepmerge<T, Q>(target: T, source: Q, options: DeepmergeOptions = { clone: true }): T & Q {
    const output = (options.clone ? { ...target } : target) as T & Q;

    if (isPlainObject(target) && isPlainObject(source)) {
        Object.keys(source).forEach((key) => {
            // Avoid prototype pollution
            if (key === "__proto__") {
                return;
            }

            if (isPlainObject(source[key]) && key in target && isPlainObject(target[key])) {
                // Since `output` is a clone of `target` and we have narrowed `target` in this block we can cast to the same type.
                (output as Record<keyof any, unknown>)[key] = deepmerge(target[key], source[key], options);
            } else {
                (output as Record<keyof any, unknown>)[key] = source[key];
            }
        });
    }

    return output;
}

/**
 * Gets a nested property from an object
 * @param obj The object
 * @param key The nested key
 * @returns The nested property
 */
// @ts-ignore Not excessively deep (max 10 levels)
export function getAttribute<T extends object, K extends NestedKeys<T>>(
    obj: T,
    key: K,
    // @ts-ignore Not excessively deep (max 10 levels)
): DeepPick<T, K> {
    const [firstKey, ...restKeys] = key.split(".");

    // @ts-ignore
    return restKeys.reduce((prev, curr) => prev[curr], obj[firstKey as keyof T]);
}

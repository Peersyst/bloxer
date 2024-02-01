/**
 * Error thrown when a promise times out.
 */
export class TimeoutPromiseError extends Error {
    constructor() {
        super("Promise timeout");
    }
}

/**
 * Throws a TimeoutPromiseError if the promise does not resolve within the specified time.
 * @param promise The promise.
 * @param ms The timeout in milliseconds.
 */
export default async function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeout;
    const rejectedPromise = new Promise<T>((_, reject) => {
        timeout = setTimeout(() => {
            reject(new TimeoutPromiseError());
        }, ms);
    });

    const res = await Promise.race([promise, rejectedPromise]);
    clearTimeout(timeout);
    return res;
}

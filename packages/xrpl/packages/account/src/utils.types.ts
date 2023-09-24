/**
 * Difference between A and B
 */
export type Difference<A, B> = Omit<A, keyof B>;

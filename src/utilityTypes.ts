export type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

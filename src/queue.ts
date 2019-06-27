export interface Queue<T> {
    getCapacity() : number;
    all() : T[];
    push(value: T): void;
    shift(): T;
    peek(): T | null;
    isEmpty(): boolean;
    length(): number;
}

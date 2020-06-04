export default interface Cache {
    get(): string|null;
    put(value: string|null): void;
}

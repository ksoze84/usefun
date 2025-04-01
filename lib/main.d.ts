type funObject<T, Q, N> = {
    state: () => T;
    setState: Q;
    noSet?: N;
};
export declare function useFun<T, const Q extends Record<string, any>, const N extends Record<string, any>>(fun: funObject<T, Q, N>): Readonly<[T, Q & N]>;
export {};

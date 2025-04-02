export type funObject<T, Q, N> = {
    state: () => T;
    setState: Q;
    noSet?: N;
};
/**
 * Return signal to cancel a state update.
 *
 * Useful for functions that should not update the state.
 *
 * This does NOT UNDO the function's executed instructions.
 *
 */
export declare const cancelFun: <P>(returnValue?: P) => P;
export declare function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>(fun: funObject<T, Q, N>): Readonly<[T, Q & N]>;
export declare function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>(fun: funObject<T, Q, N>, select: (state: T) => S): Readonly<[S, Q & N]>;

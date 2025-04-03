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
/**
 * Hook that takes a funObject and returns a state and an actions object.
 *
 * The state is a value returned by the state function of the funObject.
 */
export declare function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>(fun: funObject<T, Q, N> | (() => funObject<T, Q, N>)): Readonly<[T, Q & N]>;
/**
 * Hook that takes a funObject and optionally a selector and returns a state and an actions object.
 *
 * The state is a value returned by the state function [selector applied] of the funObject.
 */
export declare function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>(fun: funObject<T, Q, N> | (() => funObject<T, Q, N>), select: (state: T) => S): Readonly<[S, Q & N]>;

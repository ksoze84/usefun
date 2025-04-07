declare const listeners: unique symbol;
type FunObj<T> = {
    state: () => T;
    [listeners]?: Set<(next: T, prev: T) => void>;
};
type FunObject<T, Q extends Record<string, any>> = FunObj<T> & Q;
/**
 * Return signal to cancel a state update.
 *
 * This does NOT UNDO the function's executed instructions.
 *
 */
export declare const noUp: <P>(returnValue?: P) => P;
export declare const fun: <T, Q extends Record<string, any>>(funObj: FunObject<T, Q>) => FunObject<T, Q>;
/**
 * Hook that takes a funObject and returns a state and an actions object.
 *
 * The state is a value returned by the state function of the funObject.
 */
export declare function useFun<T, Q extends Record<string, any>>(fun: FunObject<T, Q>): Readonly<[T, Omit<Q, 'state'>]>;
export declare function useFun<T, Q extends Record<string, any>>(fun: () => FunObject<T, Q>): Readonly<[T, Omit<Q, 'state'>]>;
/**
 * Hook that takes a funObject and optionally a selector and returns a state and an actions object.
 *
 * The state is a value returned by the state function [selector applied] of the funObject.
 */
export declare function useFun<T, S, Q extends Record<string, any>>(fun: FunObject<T, Q>, select: (state: T) => S): Readonly<[S, Omit<Q, 'state'>]>;
export declare function useFun<T, S, Q extends Record<string, any>>(fun: () => FunObject<T, Q>, select: (state: T) => S): Readonly<[S, Omit<Q, 'state'>]>;
export {};

declare const getSt: unique symbol;
declare const listeners: unique symbol;
export type UpdateFun = <P>(returnValue?: P) => (P | void);
export type funObject<T, Q, N> = {
    [listeners]: Set<(next: T, prev: T) => void>;
    [getSt]: () => T;
} & N & Q;
type funAB<Q> = Q | ((up: UpdateFun) => Q);
type funObj<T, Q> = {
    [listeners]: Set<(next: T, prev: T) => void>;
    [getSt]: () => T;
} & Q;
interface Fun {
    <T, Q extends Record<string, any>, N extends Record<string, any>>(fn: () => T, funA: funAB<Q>, funB: funAB<N>): funObject<T, Q, N>;
    <T, Q extends Record<string, any>>(fn: () => T, funA: funAB<Q>): funObj<T, Q>;
}
export declare const fun: Fun;
/**
 * Hook that takes a funObject and returns a state and an actions object.
 *
 * The state is a value returned by the state function of the funObject.
 */
export declare function useFun<T, const Q extends Record<string, any>>(fun: funObj<T, Q> | (() => funObj<T, Q>)): Readonly<[T, Q]>;
/**
 * Hook that takes a funObject and optionally a selector and returns a state and an actions object.
 *
 * The state is a value returned by the state function [selector applied] of the funObject.
 */
export declare function useFun<T, S, const Q extends Record<string, any>>(fun: funObj<T, Q> | (() => funObj<T, Q>), select: (state: T) => S): Readonly<[S, Q]>;
/**
 * Hook that takes a funObject and returns a state and an actions object.
 *
 * The state is a value returned by the state function of the funObject.
 */
export declare function useFun<T, const Q extends Record<string, any>, const N extends Record<string, any>>(fun: funObject<T, Q, N> | (() => funObject<T, Q, N>)): Readonly<[T, Q & N]>;
/**
 * Hook that takes a funObject and optionally a selector and returns a state and an actions object.
 *
 * The state is a value returned by the state function [selector applied] of the funObject.
 */
export declare function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>(fun: funObject<T, Q, N> | (() => funObject<T, Q, N>), select: (state: T) => S): Readonly<[S, Q & N]>;
export {};

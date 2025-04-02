export type funObject<T, Q, N> = {
    state: () => T;
    setState: Q;
    noSet?: N;
};
declare const cancel: unique symbol;
/**
 * Return a signal to cancel a state update.
 *
 * Useful for functions that should not update the state.
 *
 * @param {P} [returnValue] - Value to return when state update is canceled.
 * @returns {Object} - Object with property [cancel] set to true and property returnValue with the given value.
 */
export declare const cancelFun: <P>(returnValue?: P) => {
    [cancel]: boolean;
    returnValue: P | undefined;
};
/**
 * Hook that takes a funObject and returns a state and an actions object.
 *
 * The state is a value returned by the state function of the funObject.
 *
 *
 * @param {funObject<T, Q, N>} fun - The funObject with the state and actions.
 * @returns {Readonly<[ T, Q & N ]>} - A Readonly array with the state and actions.
 */
export declare function useFun<T, const Q extends Record<string, any>, const N extends Record<string, any>>(fun: funObject<T, Q, N>): Readonly<[T, Q & N]>;
export {};

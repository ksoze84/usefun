/* 
MIT License

Copyright (c) 2025 Felipe Rodriguez Herrera

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

import React, { useEffect, useMemo, useState } from "react";

export type funObject<T, Q, N> = {
  state : () => T,
  setState : Q,
  noSet? : N
}

const listeners = Symbol("listeners");
const cancel = Symbol("cancel");

/**
 * Return a signal to cancel a state update.
 * 
 * Useful for functions that should not update the state.
 * 
 * @param {P} [returnValue] - Value to return when state update is canceled.
 * @returns {Object} - Object with property [cancel] set to true and property returnValue with the given value.
 */
export const cancelFun = <P>( returnValue? : P ) => ({
    [cancel] : true,
    returnValue
});

const enableSet = <T, Q extends Record<string, any>,N >( fun : funObject<T, Q, N> & { [listeners]? : Set<React.Dispatch<React.SetStateAction<T>>> }) => 
  new Proxy( fun.setState , {
    get(target: any, thisArg: any) {
      const func = target[thisArg];
      if( func instanceof Function )
        return (...argumentsList: Parameters<typeof func>) => {
          const res = func(...argumentsList);
          if(res?.[cancel]) return res?.returnValue;
          fun[listeners]?.forEach( (l : React.Dispatch<React.SetStateAction<T>>) => l( fun.state() ) );
          return res;
        }
      return func;
    }
  });

const initFun = <T, Q extends Record<string, any>, const N extends Record<string, any>>(fun : funObject<T, Q, N> & { [listeners]? : Set<React.Dispatch<React.SetStateAction<T>>> }) : Readonly<[ T, Q & N ]> => {
  if( !fun[listeners] ){
    fun[listeners] = new Set<React.Dispatch<React.SetStateAction<T>>>();
    fun.setState = enableSet( fun );
  }
  
  return [fun.state(), { ...fun.noSet, ...fun.setState } as Q & N ]
} 

const mounting = <T, Q, N>(fun : funObject<T, Q, N>, setState : React.Dispatch<React.SetStateAction<T>>) => {
  (fun as any)[listeners]?.add( setState );
  return () => (fun as any)[listeners]?.delete( setState );
}

  /**
   * Hook that takes a funObject and returns a state and an actions object.  
   * 
   * The state is a value returned by the state function of the funObject.  
   * 
   * 
   * @param {funObject<T, Q, N>} fun - The funObject with the state and actions.
   * @returns {Readonly<[ T, Q & N ]>} - A Readonly array with the state and actions.
   */
export function useFun<T, const Q extends Record<string, any>, const N extends Record<string, any>>( fun : funObject<T, Q, N>  ) : Readonly<[ T, Q & N ]> {
  const [stateFun, funActions] = useMemo( () => initFun( fun ), []);
  const [state, setState] = useState( stateFun );

  useEffect( () => mounting( fun, setState ), [] );

  return [ state, funActions ] as const
  
}

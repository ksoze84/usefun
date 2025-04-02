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
 * Return signal to cancel a state update.
 * 
 * Useful for functions that should not update the state.
 * 
 * This does NOT UNDO the function's executed instructions.
 * 
 */
export const cancelFun = <P>( returnValue? : P ) => ({
    [cancel] : true,
    returnValue
}) as P;

const enableSet = <T, Q extends Record<string, any>,N >( fun : funObject<T, Q, N> & { [listeners]? : Set<(next : T, prev : T) => void> }) => {
  fun[listeners] = new Set<(next : T, prev : T) => void>();
  return new Proxy( fun.setState , {
    get(target: any, thisArg: any) {
      const func = target[thisArg];
      if( func instanceof Function )
        return async (...argumentsList: Parameters<typeof func>) => {
          const old = fun.state();
          const res = await func(...argumentsList);
          if(res?.[cancel]) return res?.returnValue;
          fun[listeners]?.forEach( l => l( fun.state(), old ) );
          return res;
        }
      return func;
    }
  });
}
const initFun = <T, Q extends Record<string, any>, const N extends Record<string, any>>(fun : funObject<T, Q, N> & { [listeners]? : Set<(next : T, prev : T) => void> }) : Readonly<[ T, Q & N ]> => {
  if( !fun[listeners] ){
    
    fun.setState = enableSet( fun );
  }
  
  return [fun.state(), { ...fun.noSet, ...fun.setState } as Q & N ]
} 


const makeSelectDispatcher = <T, S>( select : ( state : T ) => S, setState : React.Dispatch<React.SetStateAction<T>> ) => 
  (next : T, prev: T) => {
    const oldSelector = select( prev );  
    const newSelector = select( next );
    if( (newSelector === undefined) !== (oldSelector === undefined)  )
      setState( next );
    else if( newSelector instanceof Object )
      for( const key in newSelector ){
        if( ! Object.is( (oldSelector as Record<any, unknown>)[key], (newSelector as Record<any, unknown>)[key] ) ) 
          setState( next );
        }
    else if( ! Object.is ( newSelector, oldSelector) )
      setState( next );
  }

const mounting = <T, S, Q, N>(fun : funObject<T, Q, N>, setState : React.Dispatch<React.SetStateAction<T>>, select?: ( state : T ) => S ) => {
  const sst = select ? makeSelectDispatcher( select, setState ) : setState; 
  (fun as any)[listeners]?.add( sst );
  return () => (fun as any)[listeners]?.delete( sst );
}

export function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>( fun : funObject<T, Q, N>  ) : Readonly<[ T, Q & N ]>
export function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>( fun : funObject<T, Q, N>, select: ( state : T ) => S  ) : Readonly<[ S, Q & N ]>

  /**
   * Hook that takes a funObject and returns a state and an actions object.  
   * 
   * The state is a value returned by the state function of the funObject.  
   * 
   * 
   */
export function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>( fun : funObject<T, Q, N>, select?: ( state : T ) => S  ) : Readonly<[ T | S, Q & N ]> {
  const [stateFun, funActions] = useMemo( () => initFun( fun ), []);
  const [state, setState] = useState( stateFun );

  useEffect( () => mounting( fun, setState, select ), [] );

  return [ select ? select( state ) : state, funActions ] as const
  
}


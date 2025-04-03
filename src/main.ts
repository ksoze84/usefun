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
  get : () => T,
  set : Q,
  read? : N
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
  Object.getOwnPropertyNames( fun.set ).forEach( key => {
    if( fun.set[key] instanceof Function ){
      const func = fun.set[key];
      (fun.set as any)[key] = async (...args : unknown[]) => {
        const old = fun.get();
          let res = func(...args);
          if ( res instanceof Promise)
            res = await res;
          if(res?.[cancel]) return res?.returnValue;
          fun[listeners]?.forEach( l => l( fun.get(), old ) );
          return res;
      }
    }
  })
}

/**
 * Store a Fun object. This function is useful when you want to share the same Fun object between components.
 * 
 */
const init = <T, S, Q extends Record<string, any>, N extends Record<string, any>>( fun : funObject<T, Q, N> & { [listeners]? : Set<(next : T, prev : T) => void> }, select?: ( state : T ) => S ) : [T | S, funObject<T, Q, N> ,Q & N ]=> {
  if(!fun[listeners]) enableSet( fun );
  return [select ? select( fun.get() ) : fun.get(), fun, {...fun.read, ...fun.set} as Q & N]
}

const change = ( a : any, b : any ) : true | void => {
  if( b instanceof Object )
    for( const key in b ){
      if( ! Object.is( (a as Record<any, unknown>)[key], (b as Record<any, unknown>)[key] ) ) 
        return true;
      }
  else if( ! Object.is ( b, a) )
    return true;
}

const makeSelectDispatcher = <T, S>( select : ( state : T ) => S, setState : React.Dispatch<React.SetStateAction<T|S>> ) => 
  (next : T, prev: T) => {
    const oldSelector = select( prev );  
    const newSelector = select( next );
    if( (newSelector === undefined) !== (oldSelector === undefined) || change( newSelector, oldSelector ) )
      setState( newSelector );
  }

const mounting = <T, S, Q, N>(fun : funObject<T, Q, N>, setState : React.Dispatch<React.SetStateAction<T|S>>, select?: ( state : T ) => S ) => {
  const sst = select ? makeSelectDispatcher( select, setState ) : setState; 
  (fun as any)[listeners]?.add( sst );
  return () => (fun as any)[listeners]?.delete( sst );
}


/**
 * Hook that takes a funObject and returns a state and an actions object.  
 * 
 * The state is a value returned by the state function of the funObject.  
 */
export function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>( fun : funObject<T, Q, N> | ( () => funObject<T, Q, N> ) ) : Readonly<[ T, Q & N ]>
/**
 * Hook that takes a funObject and optionally a selector and returns a state and an actions object.  
 * 
 * The state is a value returned by the state function [selector applied] of the funObject.  
 */
export function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>( fun : funObject<T, Q, N> | ( () => funObject<T, Q, N> ), select: ( state : T ) => S  ) : Readonly<[ S, Q & N ]>


export function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>( funT : funObject<T, Q, N> | ( () => funObject<T, Q, N> ), select?: ( state : T ) => S  ) : Readonly<[ T | S, Q & N ]> {
  const [ initialState, fun, set ] = useMemo( () => init( funT instanceof Function ? funT() : funT, select ), [] );
  const [ state, setState ] = useState<T|S>( initialState )

  useEffect( () => mounting( fun, setState, select ), [] );

  return [ state, set ] as const
}

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

const listeners = Symbol("listeners");
const cancel = Symbol("cancel");

type FunObj<T> = {
  state : () => T;
  [listeners]? : Set<(next : T, prev : T) => void>;
}

type FunObject<T, Q extends Record<string, any>> = FunObj<T> & Q;


/**
 * Return signal to cancel a state update.
 * 
 * This does NOT UNDO the function's executed instructions.
 * 
 */
export const noSet = <P>( returnValue? : P ) => ({
  [cancel] : true,
  returnValue
}) as P;

const dispatch = <T>( next : T, prev: T, listeners? : Set<(next : T, prev : T) => void> ) =>
  listeners?.forEach( l => l( next, prev ) );

export const fun = <T, Q extends Record<string, any>>( funObj : FunObject<T, Q> ) : FunObject<T, Q> => {
  let prev = funObj.state();

  funObj[listeners] = new Set<(next : T, prev : T) => void>();

  const handlePromise = ( promise : Promise<any>  ) => {
    promise.then( () => {
      const next = funObj.state();
      if ( change( prev, next ) ){
        dispatch( next, prev, funObj[listeners] );
        prev = next;
      }
    })
  };

  Object.getOwnPropertyNames( funObj ).forEach( key => {
    if( funObj[key] instanceof Function && key !== "state" && !key.endsWith('_') ){
      const func = funObj[key];
      (funObj as any)[key] = (...args : any[]) => {
        const res = func(...args);
        const next = funObj.state();
        if( res instanceof Promise ){
          handlePromise(res);
          if ( !change( prev, next ) )
              return res;
        }
        if(res?.[cancel]) return res?.returnValue;
        dispatch( next, prev, funObj[listeners] );
        prev = next;
        return res;
      }
    }
  })

  return funObj;
}


const init = <T, S>( funT : FunObj<T> | (() => FunObj<T>), select?: ( state : T ) => S ) : [T | S, FunObj<T> ]=> {
  const fun = funT instanceof Function ? funT() : funT;
  return [select ? select( fun.state() ) : fun.state(), fun]
}

const change = ( a : any, b : any ) : true | void => {
  if( b instanceof Object )
    for( const key in b ){
      if( ! Object.is( (a as Record<any, any>)[key], (b as Record<any, any>)[key] ) ) 
        return true;
      }
  else if( ! Object.is ( b, a) )
    return true;
}

const makeSelectDispatcher = <T, S>( select : ( state : T ) => S, setState : React.Dispatch<React.SetStateAction<T|S>> ) => 
  (next : T, prev: T) => {
    const oldSelector = select( prev );  
    const newSelector = select( next );
    if( change( newSelector, oldSelector ) )
      setState( newSelector );
  }

const mounting = <T, S>(fun : FunObj<T>, setState : React.Dispatch<React.SetStateAction<T|S>>, select?: ( state : T ) => S ) => {
  const sst = select ? makeSelectDispatcher( select, setState ) : setState; 
  (fun as any)[listeners]?.add( sst );
  return () => (fun as any)[listeners]?.delete( sst );
}


/**
 * Hook that takes a funObject and returns a state and an actions object.  
 * 
 * The state is a value returned by the state function of the funObject.  
 */
export function useFun<T, Q extends Record<string, any>>( fun : FunObject<T, Q> | ( () => FunObject<T, Q> ) ) : Readonly<[ T, Omit<Q, 'state'> ]>

/**
 * Hook that takes a funObject and optionally a selector and returns a state and an actions object.  
 * 
 * The state is a value returned by the state function [selector applied] of the funObject.  
 */
export function useFun<T, S, Q extends Record<string, any>>( fun : FunObject<T, Q> | ( () => FunObject<T, Q> ), select: ( state : T ) => S  ) : Readonly<[ S, Omit<Q, 'state'> ]>


export function useFun<T, S>( funT : FunObj<T> | ( () => FunObj<T> ), select?: ( state : T ) => S  ) : Readonly<[ T | S, FunObj<T> ]> {
  const [ initialState, fun ] = useMemo( () => init( funT, select ), [] );
  const [ state, setState ] = useState<T|S>( initialState )

  useEffect( () => mounting( fun, setState, select ), [] );

  return [ state, fun ] as const
}

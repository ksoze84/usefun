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

const getSt = Symbol('getState');
const listeners = Symbol("listeners");

export type UpdateFun = <P>( returnValue? : P ) => (P | void);

export type funObject<T, Q, N> = {
  [listeners] : Set<(next : T, prev : T) => void>;
  [getSt] : () => T;
} & N & Q

type preFunObject<T> = {
  [listeners]? : Set<(next : T, prev : T) => void>
  [getSt]? : () => T

}

type funAB<Q> = Q |  ( (up : UpdateFun) => Q ) 

type funObj<T, Q> = {
  [listeners] : Set<(next : T, prev : T) => void>;
  [getSt] : () => T;
} & Q


const dispatch = <T>( next : T, prev: T, listeners : Set<(next : T, prev : T) => void> ) =>
  listeners.forEach( l => l( next, prev ) );

interface Fun {
  <T, Q extends Record<string, any>, N extends Record<string, any>>( fn : () => T, funA : funAB<Q>, funB : funAB<N> ) : funObject<T, Q, N>
  <T, Q extends Record<string, any>>( fn : () => T, funA : funAB<Q> ) : funObj<T, Q>
}

export const fun : Fun = <T, Q extends Record<string, any>, N extends Record<string, any>>( fn : () => T, funA : funAB<Q>, funB? : funAB<N> ) => {
  let prev = fn();

  const fun : preFunObject<T> = {
    [getSt] : fn,
    [listeners] : new Set<(next : T, prev : T) => void>()

  }

  const set : UpdateFun = ( returnValue? ) => {
    const next = fn();
    dispatch( next, prev, fun[listeners]! );
    prev = next;
    if ( returnValue )
      return returnValue;
    return void 0;
  }

  const mutate = ( obj : Record<string, any> ) => {
    Object.getOwnPropertyNames( obj ).forEach( key => {
      if( obj[key] instanceof Function ){
        const func = obj[key];
        (obj as any)[key] = (...args : any[]) => {
          const res = func(...args);
          const next = fn(); 
          dispatch( next, prev, fun[listeners]! );
          prev = next;
          return res;
        }
      }
    })
    return obj;  }

  Object.assign( fun, funA instanceof Function ? funA( set ) : mutate( funA ) );

  if( funB )
    Object.assign( fun, funB instanceof Function ? funB( set ) : mutate( funB ) );

  return fun as funObject<T, Q, N>;
  
}




/**
 * Store a Fun object. This function is useful when you want to share the same Fun object between components.
 * 
 */
const init = <T, S, Q extends Record<string, any>, N extends Record<string, any>>( funT : funObject<T, Q, N> | (() => funObject<T, Q, N>), select?: ( state : T ) => S ) : [T | S, funObject<T, Q, N>  ]=> {
  const fun = funT instanceof Function ? funT() : funT
  return [select ? select( fun[getSt]() ) : fun[getSt](), fun]
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
export function useFun<T, const Q extends Record<string, any>>( fun : funObj<T, Q> | ( () => funObj<T, Q> ) ) : Readonly<[ T, Q ]>

/**
 * Hook that takes a funObject and optionally a selector and returns a state and an actions object.  
 * 
 * The state is a value returned by the state function [selector applied] of the funObject.  
 */
export function useFun<T, S, const Q extends Record<string, any>>( fun : funObj<T, Q> | ( () => funObj<T, Q> ), select: ( state : T ) => S  ) : Readonly<[ S, Q ]>

/**
 * Hook that takes a funObject and returns a state and an actions object.  
 * 
 * The state is a value returned by the state function of the funObject.  
 */
export function useFun<T, const Q extends Record<string, any>, const N extends Record<string, any>>( fun : funObject<T, Q, N> | ( () => funObject<T, Q, N> ) ) : Readonly<[ T, Q & N ]>
/**
 * Hook that takes a funObject and optionally a selector and returns a state and an actions object.  
 * 
 * The state is a value returned by the state function [selector applied] of the funObject.  
 */
export function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>( fun : funObject<T, Q, N> | ( () => funObject<T, Q, N> ), select: ( state : T ) => S  ) : Readonly<[ S, Q & N ]>


export function useFun<T, S, const Q extends Record<string, any>, const N extends Record<string, any>>( funT : funObject<T, Q, N> | ( () => funObject<T, Q, N> ), select?: ( state : T ) => S  ) : Readonly<[ T | S, Q & N ]> {
  const [ initialState, fun ] = useMemo( () => init( funT, select ), [] );
  const [ state, setState ] = useState<T|S>( initialState )

  useEffect( () => mounting( fun, setState, select ), [] );

  return [ state, fun ] as const
}

/* 
MIT License

Copyright (c) 2021 Felipe Rodriguez Herrera

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


import React, { useEffect } from "react";
import { _koreDispatcher, Kore, Koreko, setInitialValue } from "./Kore";
import { CompareFunction } from "./partial";

function initSimpleKore<T, S, H extends (Kore<T, S> | Koreko<T, S>), J extends T>(koreClass : new ( s?:T ) => H, setState: React.Dispatch<React.SetStateAction<T>>, initial_value? : J | (() => J), compare?: CompareFunction<T>){
  const kore = new koreClass();
  setInitialValue(kore, initial_value);
  (kore as any)[_koreDispatcher] = compare ? (prevState : T, newState : T) => ( compare(prevState, newState) && setState(newState) ) : ((_ :T, s : T) => setState(s) ) ;
  return kore;
}

function basicMountLogic<T, S, H extends (Kore<T, S> | Koreko<T, S>)>(kore: H) {
  kore["instanceCreated"]?.();
  return () => kore["instanceDeleted"]?.();
}

function useKore<T, S, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreClass : new ( s?:T ) => H, initial_value : J | (() => J)) : Readonly<[T, H]>
function useKore<T, S, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreClass : new ( s?:T ) => H, initial_value? : J | (() => J)) : Readonly<[ H extends Koreko<T, S> ? T : T | undefined, H]>

/**
 * 
 * Hook to manage state with a kore class. The kore class must extend `Kore<T>`.  
 * Standalone hook, doesn't persist nor share state with other hooks.
 *
 * @template T - The type of the state.
 * @template S - The type of the setState.
 * @template H - The type of the kore class, which extends `Kore<T>`
 * 
 * @param koreClass - The class of the kore to be used for managing state.
 * @param initial_value - Optional. The initial value of the state, which can be a value of type `T` or a function that returns a value of type `T`.
 * 
 * @returns A readonly tuple containing the current state and the kore instance.
 */
function useKore<T, S, H extends (Kore<T, S>|Koreko<T, S>)>( koreClass : new ( s?:T ) => H, initial_value: T | (() => T), compare? : CompareFunction<T>) : Readonly<[T | undefined, H]>  {
  const [kore, ]                      = React.useState<H>( () => initSimpleKore(koreClass, (v) => set_state(v), initial_value, compare) );
  const [_state, set_state]             = React.useState<T>( kore.state as T );    
  
  useEffect(() => basicMountLogic(kore as any), []);

  return [ kore.state, kore ];
}

function useKoreCompare<T, S, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreDefinition : new ( s?:T ) => H, compare : CompareFunction<T> ,initial_value : J | (() => J)) : Readonly<[T, H]>
function useKoreCompare<T, S, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreDefinition : new ( s?:T ) => H, compare : CompareFunction<T> ,initial_value? : J | (() => J)) : Readonly<[ H extends Koreko<T, S> ? T : T | undefined, H]>

/**
 * 
 * `useKore.should` add a compare function as second parameter to the useSokore hook.  
 * If this compare function returns true, the state will updated in the component, triggering a re-render.  
 *
 * @template T - The type of the state.
 * @template S - The type of the setState.
 * @template H - The type of the kore class, which extends `Kore<T>`
 * 
 * @param koreClass - The class of the kore to be used for managing state.
 * @param compare - A function that takes the current state and the new state and returns true if the new state is different from the current state.
 * @param initial_value - Optional. The initial value of the state, which can be a value of type `T` or a function that returns a value of type `T`.
 * 
 * @returns A readonly tuple containing the current state and the kore instance.
 */
function useKoreCompare<T, S, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreDefinition : new ( s?:T ) => H, compare : CompareFunction<T> ,initial_value : J | (() => J)) : Readonly<[T|undefined, H]> {
  return (useKore as any)( koreDefinition, initial_value, compare );
}

useKore.should = useKoreCompare;

export { useKore };



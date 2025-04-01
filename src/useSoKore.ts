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
import { Kore, Koreko } from "./Kore";
import { initKore } from "./storage";
import { mountLogic } from "./mountLogic";
import { checkDepsSetter, CompareFunction, SelectorFunction } from "./partial";


export function mountLogicAssign<T, S, F, H extends (Kore<T, S>|Koreko<T, S>)>( dispatcher: React.Dispatch<React.SetStateAction<T>>, kore : H,  selector? : SelectorFunction<T, F>, compare? : CompareFunction<T> | true) : () => void {
  if ((selector || compare) && compare !== true)
    return mountLogic( checkDepsSetter( dispatcher, selector, compare ) as (p : T, n: T) => void, dispatcher, kore );
  else
    return mountLogic( (_f : T , n : T) => dispatcher(n), dispatcher, kore );
}

function useSoKore<T, S, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreClass : new ( s?:T ) => H, initial_value : J | (() => J)) : Readonly<[T, H]>
function useSoKore<T, S, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreClass : new ( s?:T ) => H, initial_value? : J | (() => J)) : Readonly<[ H extends Koreko<T, S> ? T : T | undefined, H]>



/**
 * 
 * Hook to manage state with a kore class. The handler class must extend `Kore<T>`.  
 * This hook will maintain only one instance of the class per application at a time and will be stored and shared.
 *
 * @template T - The type of the state.
 * @template S - The type of the setState.
 * @template H - The type of the handler class, which extends `Kore<T>`
 * 
 * @param koreClass - The class of the handler to be used for managing state.
 * @param initial_value - Optional. The initial value of the state, which can be a value of type `T` or a function that returns a value of type `T`.
 * 
 * @returns A readonly tuple containing the current state and the handler instance.
 */
function useSoKore<T, S, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreClass : new ( s?:T ) => H, initial_value?: J | (() => J), compare? : CompareFunction<T>  )  :  Readonly<[ (T | undefined), H]> {
  const kore                        = initKore<T, S, H>( koreClass, initial_value );
  const [_state, set_state]         = React.useState<T>( kore.state as T );    

  useEffect( () => mountLogicAssign( set_state, kore, undefined, compare ), [kore] );

  return [ kore.state, kore ] ;
}


function useSoKoreSelector<T, S, F, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreClass : new ( s?:T ) => H, selector : SelectorFunction<T, F>, initial_value : J | (() => J)) : Readonly<[F , H]>
function useSoKoreSelector<T, S, F, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreClass : new ( s?:T ) => H, selector : SelectorFunction<T, F>, initial_value? : J | (() => J)) : H extends Koreko<T, S> ? Readonly<[F , H]> : Readonly<[(F | undefined), H]>



/**
 * 
 * `useSoKore.select` add a selector function as a second parameter to the useSokore hook.	
 * A selector function takes the current state and returns something of type `F`.  
 * Triggers a re-render only if the selector returns a different value than the previous one.
 *
 * @template T - The type of the state.
 * @template F - The return type of the selector.
 * @template S - The type of the setState.
 * @template H - The type of the handler class, which extends `StateHandler<T>`
 * 
 * @param koreClass - The class of the handler to be used for managing state.
 * @param selector - A function that takes the current state and returns something of type `F`.
 * @param initial_value - Optional. The initial value of the state, which can be a value of type `T` or a function that returns a value of type `T`.
 * 
 * @returns A readonly tuple containing the current `selector(state)` and the handler instance.
 */
function useSoKoreSelector<T, S, F, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreClass : new ( s?:T ) => H, selector : SelectorFunction<T, F>, initial_value: J | (() => J), compare? : CompareFunction<T> | true )  :  Readonly<[ (T | F | undefined), H]> {
  const kore                        = initKore<T, S, H>( koreClass, initial_value );
  const [_state, set_state]         = React.useState<T>( kore.state as T );    

  useEffect( () => mountLogicAssign( set_state, kore, selector, compare ), [kore] );

  return [ selector(kore.state as T), kore ] ;

}

useSoKore.select = useSoKoreSelector;


function useSoKoreCompare<T, S, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreDefinition : new ( s?:T ) => H, compare : CompareFunction<T> ,initial_value : J | (() => J)) : Readonly<[T, H]>
function useSoKoreCompare<T, S, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreDefinition : new ( s?:T ) => H, compare : CompareFunction<T> ,initial_value? : J | (() => J)) : Readonly<[ H extends Koreko<T, S> ? T : T | undefined, H]>

/**
 * 
 * `useSoKore.should` add a compare function as a second parameter to the useSokore hook.  
 * If this compare function returns true, the state will updated in the component, triggering a re-render.
 *
 * @template T - The type of the state.
 * @template S - The type of the setState.
 * @template H - The type of the handler class, which extends `Kore<T>`
 * 
 * @param koreClass - The class of the handler to be used for managing state.
 * @param compare - A function that takes the current state and the new state and returns true if the new state is different from the current state.
 * @param initial_value - Optional. The initial value of the state, which can be a value of type `T` or a function that returns a value of type `T`.
 * 
 * @returns A readonly tuple containing the current state and the handler instance.
 */
function useSoKoreCompare<T, S, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreDefinition : new ( s?:T ) => H, compare : CompareFunction<T> ,initial_value : J | (() => J)) : Readonly<[T|undefined, H]> {
  return (useSoKore as any)( koreDefinition, initial_value, compare );
}

useSoKore.should = useSoKoreCompare;


function useSokoreSelectCompare<T, S, F, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreDefinition : new ( s?:T ) => H, selector : SelectorFunction<T, F>, compare : CompareFunction<T> | true, initial_value : J | (() => J)) : Readonly<[F, H]>
function useSokoreSelectCompare<T, S, F, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreDefinition : new ( s?:T ) => H, selector : SelectorFunction<T, F>, compare? : CompareFunction<T> | true, initial_value? : J | (() => J)) : Readonly<[ H extends Koreko<T, S> ? F : F | undefined, H]>

/**
 * 
 * `useSokore.selectShould` add a selector function parameter and a compare function parameter to the useSokore hook.  
 * A selector function takes the current state and returns something of type `F`.  
 * If the compare function returns true, the state will updated in the component, triggering a re-render.
 *
 * @template T - The type of the state.
 * @template F - The return type of the selector.
 * @template S - The type of the setState.
 * @template H - The type of the handler class, which extends `StateHandler<T>`
 * 
 * @param koreClass - The class of the handler to be used for managing state.
 * @param selector - A function that takes the current state and returns something of type `F`.
 * @param compare - A function that takes the current state and the new state and returns true if the new state is different from the current state.
 * @param initial_value - Optional. The initial value of the state, which can be a value of type `T` or a function that returns a value of type `T`.
 * 
 * @returns A readonly tuple containing the current `selector(state)` and the handler instance.
 */
function useSokoreSelectCompare<T, S, F, H extends (Kore<T, S>|Koreko<T, S>), J extends T>( koreDefinition : new ( s?:T ) => H, selector : SelectorFunction<T, F>, compare : CompareFunction<T> | true = true, initial_value? : J | (() => J)) : Readonly<[F|undefined, H]>{
  return (useSoKoreSelector as any)( koreDefinition, selector, initial_value, compare ?? true );
}

useSoKore.selectShould = useSokoreSelectCompare;

export { useSoKore };
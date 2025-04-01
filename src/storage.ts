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


import { _koreDispatcher, Kore, Koreko, setInitialValue } from "./Kore";
import { callSubscriptors } from "./subscriptions";

export const storage = new Map<string, {kore : Kore<any, any>, listeners? : Map<Function, ( p : any, n : any )=>void>}>();
export const _properInitdKoreko = Symbol( "properInitdKoreko" );

export function initKore<T, S, H extends (Kore<T, S>|Koreko<T, S>)>( koreClass : new ( s?:T ) => H , initial_value? : T | (() => T) ) : H {
  if ( !storage.has( koreClass.name ) ) {
    const kore = new koreClass();
    setInitialValue( kore, initial_value );
    
    storage.set( koreClass.name, {kore} );

    (kore as any)[_koreDispatcher] = (p: T, n : T) => {
      storage.get( koreClass.name )?.listeners?.forEach( l => l( p, n ) );
      callSubscriptors(kore);
    };
    (kore as any).destroyInstance = (force? : boolean) => destroyInstance( kore, force );
    
    callSubscriptors(kore);
    
    return kore;
  }
  else{
    const kore = storage.get( koreClass.name )?.kore as H;
    if((kore as any)[_properInitdKoreko] === false){ 
      setInitialValue( kore, initial_value );
      delete (kore as any)[_properInitdKoreko];
      callSubscriptors(kore);
    }
    return kore;
  }
}

function destroyInstance<T, S>( kore : Kore<T, S>|Koreko<T, S>, force? : boolean ) {
  if (force === true || ( storage.get(kore.constructor.name)?.listeners?.size ?? 0) === 0) {
    storage.delete(kore.constructor.name);
    kore["instanceDeleted"]?.();
  }
}






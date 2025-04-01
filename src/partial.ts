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


import React from "react";

export type SelectorFunction <T, F> = ( s : T ) => F;
export type CompareFunction <T> = ( prevSTate : T, nextState : T ) => boolean ;

export function checkDepsSetter<T, F>( dispatcher: React.Dispatch<React.SetStateAction<T>>, selector?: SelectorFunction<T, F>, compare? : CompareFunction<T>) : void | ((p : T, n: T) => void) {
  if(compare)
    return ( oldState : T, newState : T ) => compare( oldState, newState ) && dispatcher(newState);
  else if (selector)
    return ( oldState : T, newState : T, ) => {
      const oldSelector = selector( oldState );  
      const newSelector = selector( newState );
      if( (newSelector === undefined) !== (oldSelector === undefined)  )
        dispatcher(newState);
      else if( newSelector instanceof Object )
        for( const key in newSelector ){
          if((oldSelector as Record<any, unknown>)[key] !== (newSelector as Record<any, unknown>)[key]) 
            dispatcher(newState);
          }
      else if( newSelector !== oldSelector )
        dispatcher(newState);
    }    
}
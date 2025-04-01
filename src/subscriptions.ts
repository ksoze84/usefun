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
const subscriptions = new Map<string, ((updatedKore : any) => any)[]>();

export const pushSubscription = ( koreName : string, subscription : (updatedKore : any) => any ) => 
  subscriptions.set( koreName, [...(subscriptions.get( koreName ) ?? []), subscription] );

export const unsubscribe = ( object : any, koreName : string ) => {
  const array = subscriptions.get( koreName );
  let index = array?.indexOf( object ) ?? -1;
  if ( index !== -1 )
    array!.splice( index, 1 );
}

export const callSubscriptors = ( kore : any ) => 
  subscriptions.get( kore.constructor.name )?.forEach( l => l( kore ) );
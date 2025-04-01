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


export type SetStateType<T> = (value: T | Partial<T> | ((prevState: T) => T | Partial<T>)) => void;

export function setInitialValue <T,S>(kore : Kore<T,S>, initial_value? : T | (() => T)) {
  kore.state = initial_value instanceof Function ? initial_value() : (initial_value ?? kore.state);
}

export const _koreDispatcher = Symbol("koreDispatcher");



/**
 * Abstract class representing a "Kore" that have a state and a setState method.  
 * This class should be extended to create a custom "kore" with actions.  
 * The extended class must be passed to the useSoKore or useKore hook to work with React.  
 * When a new instance of the class is created, the instanceCreated() method is called.
 *
 * @template T - The type of the state.
 * @template S - The type of the setState method. Defaults to SetStateType<T>.
 */
export abstract class Kore<T, S = SetStateType<T>> {


  /**
   * Configuration object for the Kore.
   * 
   * @property {boolean} merge - Indicates whether to merge the state.
   * @property {boolean} destroyOnUnmount - Indicates whether to destroy the state on unmount.
   * @protected
   * @readonly
   */
  protected readonly _koreConfig : {merge? : boolean, destroyOnUnmount? : boolean} = { };

  /**
   * The current state. Do not set this property directly. Use the setState method instead.  
   */
  public state?: T;

  /**
   * Optional callback function that is called only once when an instance is created.  
   * This Method is called by the useSoKore or useKore hook the first time a component in the application using the hook is effectively mounted and when the instance is "newly created".  
   * Prefer this mehtod over the constructor to execute initial code.  
   * This method has NOT the same behavior as mount callback a component in React.  
   * The only way this method is called again by the hook is destroying the instance first with destroyInstance().
   */
  protected instanceCreated?: () => void;


  /**
   * Optional callback function that is invoked when an instance is deleted with destroyInstance().  
   * This method has NOT the same behavior as unmount callback a component in React.
   */
  protected instanceDeleted?: () => void;

  /**
   * Sets the state and notifies all listeners.  
   * 
   * @param value - The new state or a function that returns the new state based on the previous state.
   */
  protected readonly _setState : SetStateType<T> = (value: T | Partial<T> | ((prevState: T) => T | Partial<T>)) => {
    const oldState = this.state as T;
    const newState = value instanceof Function ? value(oldState) : value;
    this.state = (this._koreConfig.merge ? { ...oldState, ...newState } : newState) as T;
    this[_koreDispatcher](oldState, this.state);
  };


  private readonly [_koreDispatcher] : (p: T, n : T) => void = undefined as any;



  /**
   * Sets the state and notifies all listeners. (wrapper for the actual _setState)
   * 
   */
  protected setState : S = this._setState as S


  /**
   * Destroys the instance if there are no active listeners.  
   * Use this method to delete the instance **on the unmount callback** of the component using it.  
   * 
   * @param force - If true, the instance is deleted even if there are active listeners.
   */
  public destroyInstance : (_force? : boolean) => void = undefined as any;

  /**
   * Constructs a new instance of the Kore class.  
   * Prefer use the method instanceCreated() instead of the constructor.  
   * Constructor code of the class and its inherited instances constructors are not part of the mounting/unmounting logic of react. Listeners may or may not be ready.  
   * 
   * @param state - The initial state.
   */
  constructor(state?: T) {
    this.state = state;
  }

}

export abstract class Koreko<T, S = SetStateType<T>> extends Kore<T, S> {
  abstract state    : T;
}
# SoKore

Simple class based hook and state manager for React.


```tsx
class CounterKore extends Kore {
  add      = () => this.setState( s => s + 1 );
  subtract = () => this.setState( s => s - 1 );
}

function Counter() {
  const [count, {add, subtract}] = useKore(CounterKore, 0);

  return (
    <div>
      <span>{count}</span>
      <button onClick={add}>+</button>
      <button onClick={subtract}>-</button>
    </div>
  );
}
```

KeyPoints: 
* Keep the React paradigm. If you are familiar with class components, you will be familiar with this as well.
* Work with "Kore" extended classes; a kore class has a state and a setState method; write into it all state actions you need.
* Heavy functions are not instantiated in every render. Minimize overhead by avoiding useCallback, useReducer, useMemo, and dependency arrays.
* There is a basic standalone hook that doesn't store nor share the instance: useKore.
* And a hook to store and share your kore instance and its state: useSoKore. 
  * The hook maintains a unique instance and its state across your application. 
  * Share the state and actions to update it between components.
  * Some options to avoid unnecessary re-renders on related components.
* Minimal and simple code. Small footprint and low impact in React's cycles. ( ~ 3kB mini / ~ 1kb gzip ).

This readme [looks better in gitHub](https://github.com/ksoze84/sokore?tab=readme-ov-file#sokore)


## Table of contents


- [Table of contents](#table-of-contents)
- [Basics](#basics)
  - [Installation](#installation)
  - [How to use](#how-to-use)
  - [Rules](#rules)
- [The no-store hook: useKore](#the-no-store-hook-usekore)
  - [Example](#example)
  - [useKore should update](#usekore-should-update)
- [Storing and sharing : useSoKore and getSoKore](#storing-and-sharing--usesokore-and-getsokore)
  - [useSoKore](#usesokore)
  - [Get the instance with getSoKore](#get-the-instance-with-getsokore)
  - [useSoKore selector](#usesokore-selector)
  - [useSoKore should update](#usesokore-should-update)
  - [useSoKore selector and should update](#usesokore-selector-and-should-update)
  - [Example of useSoKore hook with select and should.](#example-of-usesokore-hook-with-select-and-should)
  - [Subscribe to state changes](#subscribe-to-state-changes)
- [The kore object](#the-kore-object)
  - [State initialization](#state-initialization)
  - [instanceCreated() function](#instancecreated-function)
  - [Destroying the instance](#destroying-the-instance)
  - [kore object configuration](#kore-object-configuration)
    - [Merging the state](#merging-the-state)
    - [destroyOnUnmount option](#destroyonunmount-option)
  - [Reutilizing classes](#reutilizing-classes)
  - [Extendibility and Inheritance](#extendibility-and-inheritance)
  - [Working with data loaders](#working-with-data-loaders)
  - [Your own setState function](#your-own-setstate-function)
    - [Example with immer:](#example-with-immer)
    - [Or may be you just want to change the setState() accessibility modifier](#or-may-be-you-just-want-to-change-the-setstate-accessibility-modifier)
  - [Constructor](#constructor)


## Basics

### Installation

```
npm add sokore
```

### How to use

1. Create a class that extends the Kore< StateType > class. Extending this class gives a state and a setState to the child class "kore class". 
1. Add all the state update methods ( actions ) you want to this kore class.
1. Use the no-store useKore( Kore Class, initial_value ) hook or the store-based useSoKore( Kore Class, initial_value ) hook in your components. These hooks return [ state, kore ]. 
2. This "kore" object is the instance of the class you wrote with the actions you need to use in your component. This kore object is stable, so it's safe to exclude from React's dependency arrays.

### Rules

* Never set the kore object state directly.
* You may save another data in the object besides the state, but be aware that the components will not react to changes to this data automatically.
* Do not manipulate state directly in the constructor.
* The kore class name is used as key for storing/sharing the kore instance. Never use the same name for different kore classes, even if they are declared in different scopes.


## The no-store hook: useKore
```js
function useKore( koreClass, iniVal? ) 
  returns [ state, kore ];
```

This is a simple, classic-behavior custom hook that:
* Creates and uses an instance that is not stored/shared.
* **This hook does not work alongside useSoKore nor getSoKore, because these store the instance.**
* More performant than these other hooks.
* But have the same advantages:
  * Work with classes.
  * Option to merge the state instead of replace it.
  * Your own setState ( _setState() wrapper ).
  * You can control when trigger a re-render
  * instanceCreated and instanceDeleted optional methods; in this case are equivalent to mount/unmount the component.

### Example
```tsx
import { Kore, useKore } from "SoKore";

class CounterKore extends Kore<number> {
  state = 0;
  public add      = () => this.setState( s => s + 1 );
  public subtract = () => this.setState( s => s - 1 );
  public reset    = () => this.setState( 0 );
}

function Counter() {
  const [count, {add, subtract}] = useKore(CounterKore);

  return (
    <div>
      <span>{count}</span>
      <button onClick={add}>+</button>
      <button onClick={subtract}>-</button>
    </div>
  );
}
```

### useKore should update

```js
function useKore.should( koreClass, ( prev, next ) => boolean , iniVal? ) 
  returns [ state, kore ];
```

You can use the function property **should**, that add a compare function parameter to the useKore hook.

The component will trigger re-renders only if this function returns **true**. Parameters are previous state and next state.
```tsx
// re-renders only if counter is pair
function Counter() {
  const [count, {add, subtract}] 
    = useKore.should(CounterKore, (_, n) => n % 2 == 0 );

  return (
    <div>
      <span>{count}</span>
      <button onClick={add}>+</button>
      <button onClick={subtract}>-</button>
    </div>
  );
}
```


## Storing and sharing : useSoKore and getSoKore

The useSoKore hook and the getSoKore utility method, create, use, store, and share a unique instance of your kore class across the application, at global scope. Either can update the state between components, but getSoKore is not a hook, so never trigger a re-render in the component.

To bind the components using the useSoKore hook and/or the getSoKore method together, just use the same kore class.


### useSoKore

```js
function useSoKore( koreClass, iniVal? ) 
  returns [ state, kore ];
```

This hook is equal to useKore, but store, or use an already stored, instance of your kore class and its state.

```tsx
import { Kore, useSoKore } from "SoKore";

class CounterKore extends Kore<number> {
  state = 0;
  public add      = () => this.setState( s => s + 1 );
  public subtract = () => this.setState( s => s - 1 );
  public reset    = () => this.setState( 0 );
}

function Counter() {
  const [count, {add, subtract}] = useSoKore(CounterKore);

  return (
    <div>
      <span>{count}</span>
      <button onClick={add}>+</button>
      <button onClick={subtract}>-</button>
    </div>
  );
}
```

### Get the instance with getSoKore

```js
function getSoKore( koreClass ) 
  returns kore;
```

Get the instance of your kore using the getSoKore utility method. This method is not a hook, so it never triggers a new render. 

You can use this method mainly for two things:
* To use your kore object actions without triggering re-renders in "control-only" components
* To use your kore object outside react

```tsx
class CounterKore extends Kore<number> {
  state = 0;

  public add      = () => this.setState( s => s + 1 );
  public subtract = () => this.setState( s => s - 1 );
  public reset    = () => this.setState( 0 );
}

function Controls() {
  const {add, subtract} = getSoKore(CounterKore);

  return (
    <div className="buttons">
      <button onClick={add}>+</button>
      <button onClick={subtract}>-</button>
    </div>
  );
}

function Counter() {
  const [count] = useSoKore(CounterKore);

  return (
    <div>
      <span>{count}</span>
    </div>
  );
}

export function App() {
  return (
    <div>
      <Controls />
      <Counter />
    </div>
  );
}
```

### useSoKore selector
```js
function useSoKore.select( koreClass, s => f(s), iniVal? ) 
  returns [ f(s), kore ];
```

This function property adds a "selector" function parameter to the useSoKore hook. This will perform a shallow comparison for the selector results with the prev and next states and will trigger a re-render only if these results are different. 

The selector must be a function that takes the state and transforms it in an array, an object, or a value. The result type must remain stable, except for undefined. The hook will return the selector result as first element.

**Use only if you have performance problems; this hook avoids some unnecessary re-renders but introduces a dependency array of comparisons. Always prefer useSoKore( koreClass ) no selector and the getSoKore method first.**


### useSoKore should update

```js
function useSoKore.should( koreClass, ( prev, next ) => boolean , iniVal? ) 
  returns [ state, kore ]
```

You can use the function property **should**, that add a compare function parameter to the useSoKore hook. Parameters are previous state and next state.

The component will trigger re-renders only if this function returns **true**


### useSoKore selector and should update

```js
function useSoKore.selectShould(kClass, s => f(s), (p, n) => bool, iniVal?) 
  returns [ f(s), kore ];
```

You can use the function property **selector** and **should** together, that adds a selector and a compare function parameter to the useSoKore hook.

In this case the component will trigger re-renders only if the compare function returns **true**, **regardless of the selector function.**

If you don't pass a compare function, it defaults to true, meaning always trigger re-render for any part of the state changed, with the selector is applied. This can result in better performance than using select or should function alone.


### Example of useSoKore hook with select and should.

```tsx
class CounterKore extends Kore<{chairs:number, tables:number, rooms:number}> {
  state = {
    chairs: 0,
    tables : 0,
    rooms : 10
  }

  _koreConfig = { merge : true }

  addChairs = () => this.setState( c =>( { chairs: c.chairs + 1 }) );
  subtractChairs = () => this.setState( c => ({chairs : c.chairs - 1}) );

  addTables = () => this.setState( t => ({tables: t.tables + 1}) );
  subtractTables = () => this.setState( t => ({tables: t.tables - 1}) );

  setRooms = (n:number) => this.setState( {rooms : n} ), 
}

function Chairs() {
  // This component re-renders only if the compare function(prevState, nextState) returns true
  const [{chairs},{addChairs,subtractChairs}] 
    = useSoKore.should( CounterKore, (p, n) => p.chairs !== n.chairs ); 

  return <>
    <span>Chairs: {chairs}</span>
    <button onClick={addChairs}>+</button>
    <button onClick={subtractChairs}>-</button>
  </> 
}

function Tables() {
  // This component re-renders only if tables.toString() changes
  // Here tables is a string
  const [tables, {addTables, subtractTables}] 
    = useSoKore.select( CounterKore, s => s.tables.toString() ); 

  return <>
    <span>Tables: {tables}</span>
    <button onClick={addTables}>+</button>
    <button onClick={subtractTables}>-</button>
  </>
}
```


### Subscribe to state changes
```js
function getSoKore( koreClass, ( koreUpdatedInstance ) => any ) 
  returns unsubscribe();
```

You can use the getsokore method to suscribe a function to state changes instead of get the instance directly.

This example shows how to suscribe and unsubscribe a function that logs counter changes : 
```ts
useEffect( () => getSoKore(SimpleCounterKore, s => console.log("Counter: ", s.state) ) , [] )
```

## The kore object

The kore object is an instance of a class you wrote with actions and that extends the abstract Kore class of this package. Extending the Kore class gives to the child a state property and a setState method, among others.

This instance is created by the hook with the kore class you wrote that is passed as argument.

### State initialization

```tsx
class CounterKore extends Kore<{chairs:number, tables:number, rooms:number}> {
  state = { chairs: 0, tables : 0, rooms : 10  }
  ...

// OR 
function Counter() {
  const [counters] = useSoKore(CounterKore, { chairs: 0, tables : 0, rooms : 10 });
  ...

```

You can set an initial state in the class definition or pass an initial value on the hook. You should not initialize the state with both methods, but if you do, the initial value on the hook has priority.

Prefer setting the state in the class definition for easier readability.

**Code you wrote in instanceCreated() method will update the initial state.**


### instanceCreated() function

```tsx
class CounterKore extends Kore<{chairs:number, tables:number, rooms:number}> {
  state = {
    chairs: 0,
    tables : 0,
    rooms : 0
  }

  instanceCreated = () => {
    fetch('https://myapi.com/counters')
      .then( r => r.json() ).then( r => this.setState(r) );
  }
}
```

Optional method that is called only once when an instance is created. If exists in the instance, this method is called by the useSoKore or useKore hook the first time a component in the application using the hook is effectively mounted and when the instance is "newly created".  

This method has NOT the same behavior as mount callback of a component in React when using useSoKore. The only way this method is called again by the hook is by destroying the instance first with destroyInstance().

### Destroying the instance

```tsx
kore.destroyInstance(force?: boolean) => void
```

You may destroy the stored instance when needed using the **destroyInstance(force?)** method. This method should be called **on the unmount callback** of the component using it, or before loading a new component.  
This method first checks if there are active state hook listeners active. If there isn't, the instance reference is deleted, and the **instanceDeleted()** method is called if exists. If **force** parameter is true, deletes the instance without checking anything (force destroy with caution).

If you implement **instanceDeleted()**, remember that it is not the equivalent of an unmount component callback.


```tsx
export function App() {

  const [ {data}, {load, destroyInstance} ] = useSoKore( CounterKore );

  useEffect( () => {
    load();
    return () => destroyInstance(); // instanceDeleted() would be called
  }, [] );

 ...
}
```

### kore object configuration

```tsx
//default:
 _koreConfig = { merge : false, destroyOnUnmount : false }
```

You may configure your kore object by setting the optional property _koreConfig in your kore class. It has two boolean options:
* merge : The state is overwritten by default with setState. Change this to true to merge.
* destroyOnUnmount : Tries to delete the instance in each unmount of each component. Is successfully deleted if there are no active listeners.

#### Merging the state

```tsx
class CounterKore extends Kore<{chairs:number, tables:number, rooms:number}> {
  state = {
    chairs: 0,
    tables : 0,
    rooms : 10
  }

  _koreConfig = { merge : true }

  addChairs = () => this.setState( c => ( { chairs: c.chairs + 1 }) );
  subtractChairs = () => this.setState( c => ({chairs : c.chairs - 1}) );

  addTables = () => this.setState( t => ({ tables: t.tables + 1 }) );
  subtractTables = () => this.setState( t => ({tables: t.tables - 1}) );

  resetAll = () => this.setState( { chairs: 0, tables : 0 } );
}

function Chairs() {
  const [{chairs},{addChairs, subtractChairs}] = useSoKore(CounterKore);

  return <>
    <span>Chairs: {chairs}</span>
    <button onClick={addChairs}>+</button>
    <button onClick={subtractChairs}>-</button>
  </> 
}

function Tables() {
  const [{tables},{addTables, subtractTables}] = useSoKore(CounterKore);

  return <>
    <span>Tables: {tables}</span>
    <button onClick={addTables}>+</button>
    <button onClick={subtractTables}>-</button>
  </>
}
```

Replacing the state is the default mode for a kore object setState, but you can configure your kore setState to merge it. This can be useful to refactor old class components.

**Note that the useSoKore hook will trigger re-render for any part of the state changed. In the example above, Tables component will re-render if the chairs value is changed. This behavior can be optimized using select or should "subHooks"**  

**Merging mode is only for an object-like state, and there is no check of any kind for this before doing it, so its on you to guarantee an initial and always state object.**


#### destroyOnUnmount option

Tries to delete the instance in each unmount of each component. Is successfully deleted if there are no active listeners (other components using it).

This can be useful if you need to "restart" your components on unmount that are using a stored kore object and it is not clear which related component will unmount last.

with destroyOnUnmount enabled, SoKore will behave similarly to a context, with fresh instances on remount components. 

### Reutilizing classes

The instance creation is managed by the hook, so you can't create new instances from your class. 
One way to use your class again with this hook without duplicating code is to extend it:

```ts
class BetaCounterKore extends CounterKore {};
```

### Extendibility and Inheritance

Extending a generic class with Kore lets you encapsulate common functionality:

MyGenericApiKore.ts : A generic kore for my API
```ts
type ApiData = {
  data?: Record<string, any>[];
  isLoading: boolean;
}

export abstract class MyGenericApiKore extends Kore<ApiData>{

  state : ApiData = {
    data: undefined,
    isLoading: false
  }

  protected _koreConfig = { merge: true };

  abstract readonly loadUri : string; // making loadUri property obligatory to define in inherited class
  readonly saveUri? : string = undefined;

  public load = ( params? : string ) => {
    this.setState({isLoading: true});
    return fetch( this.loadUri + ( params ?? '' ) )
            .then( r => r.json() )
            .then( resp => this.setState({ data : resp?.data ?? [] , isLoading: false}) )
  }

  public modify = ( item : Record<string, any>, changes : Record<string, any> ) => 
    this.setState( s => ({ data : s.data?.map( i => i === item ? { ...i, ...changes } : i ) }) )

  public delete = ( item : Record<string, any> ) => 
    this.setState( s => ({ data : s.data?.filter( i => i !== item ) )} )

  public append = ( item : Record<string, any> ) =>
    this.setState( s => ({ data : s.data?.concat( item ) }) )

  public save = ( params? : Record<string, any> ) => {
    this.setState({isLoading: true});
    return fetch( this.saveUri ?? '', { method: 'POST', body : JSON.stringify(params)} )
            .then( r => r.json() )
            .then( () => this.setState({ isLoading: false }) )
  }

}
```

MyComponent.tsx

```tsx
import { MyGenericApiKore } from "./MyApiHandler";

class SpecificApiKore extends MyGenericApiKore { 
  loadUri = 'https://myapi/specific' 
}

export function MyComponent() {

  const [{data, isLoading}, {load, formModify, save} ] 
    = useSoKore( SpecificApiKore );

  useEffect( () => { load() }, [] );

  return ( ... );
}
```

### Working with data loaders

If you work with some framework data loader, like Remix loaders, you can use the getSoKore method to preload data, then useSoKore as usual in your component. **But it is important to not set an initial state; otherwise, this initial state will override loader data**.

```tsx
export async function loader() {
  await getSoKore( koreClass ).load();
  return;
}

export default function App() {
  // state already have data here:
  const [ {data} ] = useSoKore( koreClass ); 

  return (...)
}
```

### Your own setState function

setState() is just a wrapper for the actual _setState() function that comes in your kore object. In Javascript you can directly modify it; in Typescript you need to define the setState type as a second generic type of your kore class.

#### Example with immer:
```tsx
import { produce, WritableDraft } from "immer";

type CountState = {chairs:number, tables:number, rooms:number};
type MySetStateType = ( recipe : (draft: WritableDraft<CountState>) => void ) => void;

export class CounterKore extends Kore<CountState, MySetStateType> {
  state = {
    chairs: 0,
    tables : 0,
    rooms : 10
  }

  public setState : MySetStateType = ( recipe ) => this._setState( s => produce(s, recipe) )

}

function Chairs() {
  const [{chairs}, {setState}] = useSoKore(CounterKore);
  return <>
    <span>Chairs: {chairs}</span>
    <button onClick={() => setState( s => { s.chairs++ } )}>+</button>
    <button onClick={() => setState( s => { s.chairs-- } )}>-</button>
  </>
}

function Tables() {
  const [{tables}, {setState}] = useSoKore(CounterKore);
  return <>
    <span>Tables: {tables}</span>
    <button onClick={() => setState( s => { s.tables++ } )}>+</button>
    <button onClick={() => setState( s => { s.tables-- } )}>-</button>
  </>
}
```


#### Or may be you just want to change the setState() accessibility modifier
```tsx
public setState = this._setState
```

### Constructor

You may define a constructor in your kore class. But is not necessary

**Prefer defining an instanceCreated() method on the kore over the constructor to execute initial code.** 

```tsx
constructor( initialState? : T ) {
  super(initialState);
  //your code
}
```

Constructor code constructors are not part of the mounting/unmounting logic of React. Hook state listeners may or may not be ready when the code executes. 

It is safe to write code that does not involve changing the state directly.


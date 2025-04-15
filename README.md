# use-Fun

Simple hook and state manager for React using [**Fun**]ctions.


```jsx
const counter = ( count = 0 ) => ({ 
  state : () => count, 
  add: () => count++,
  subtract: () => count--
})

function Counter() {
  const [count, {add, subtract}] = useFun( counter );
  return <>
    <span>{count}</span>
    <button onClick={add}>+</button>
    <button onClick={subtract}>-</button>
  </>
}
```

KeyPoints: 
* Work with a "Fun" collection made of actions functions.
* This collection can be stored and shared between components.
* Update a state variable just by assigning it. After an action executes, a re-render will be triggered.
* Heavy functions are not instantiated in every render. Minimize overhead by avoiding useCallback, useReducer, useMemo, and dependency arrays.
* Minimal and simple code. Small footprint and low impact in React's cycles. ( ~ 1kB mini / ~ 500B gzip ).

This readme [looks better in gitHub](https://github.com/ksoze84/usefun?tab=readme-ov-file#use-fun)

This package is similar to [SoKore](https://github.com/ksoze84/sokore?tab=readme-ov-file#sokore)

## Table of contents


- [Table of contents](#table-of-contents)
- [Basics](#basics)
  - [Installation](#installation)
  - [General Rules](#general-rules)
- [Storing and sharing](#storing-and-sharing)
- [Cancel a state update : noUp()](#cancel-a-state-update--noup)
- [Actions and promises](#actions-and-promises)
- [Selector](#selector)
- [Initialization](#initialization)
- [Using a stored Fun outside react](#using-a-stored-fun-outside-react)
  - [Enabling the Fun collection is necessary when:](#enabling-the-fun-collection-is-necessary-when)
- [Extending a Fun collection](#extending-a-fun-collection)


## Basics

### Installation

```
npm add use-fun
```

### General Rules

* All actions you define in the collection call a state update at end, **unless its name ends with underscore**. If you need a action that is not deterministic on set or not set the state, use the [noUp](#cancel-a-state-update--noup) function. 
* **INFINITE LOOP WARNING**. If you use an action on render, such as deriving state values, this action must be read-only so as not to invoke state changes on render; this can be achieved with a name ending in an underscore or by using the get syntax.
* Values must change to trigger re-renders. You should create new objects or arrays if you want to change their properties or elements.
* You can return anything in the state function, but arrays will mix up the types (union) of all the elements for each element, so **avoid arrays**, or use [ ... ] **as const** if you are using Typescript.  
* Keep in mind that a Fun collection is enabled when it reaches a hook or by calling the fun() method on it. This mutates the object for trapping its function calls, binding them to the collection, and calling an update after they execute.


```tsx
const counterLog = ( ) => { 
  let count = 0;
  let log : string[] = [];

  return {
    state : 
      () => [count, log] as const,
    add: () => {
      count ++;
      log = ["Adds 1 : " + count.toString(), ...log] },
    subtract: () => {
      count --;
      log = ["Subtracts 1 : " + count.toString(), ...log] }, 
    getLastLog_: () => log[ log.length - 1 ] 
  }
}

function Counter() {
  const [[count, log], {add, subtract, getLastLog_}] 
    = useFun( () => counterLog() );

  return <>
    <span>{count}</span>
    <button onClick={add}>+</button>
    <button onClick={subtract}>-</button>
    <ul>
      {log.map( (l, i) => <li key={i}>{l}</li> )}
    </ul>
  </>
}
```

## Storing and sharing
```tsx
function counterFun() {
  let chairs = 0;
  let tables = 0;

  return {
    state : () => ({chairs, tables}),
    addChairs: () => chairs++,
    subtractChairs: () => chairs--,
    addTables: () => tables++,
    subtractTables: () => tables--,
    resetAll: () => { chairs = 0; tables = 0 }
  }
}

// Storing the Fun object ---------------->
const CounterFun = counterFun();

function Chairs() {
  const [{chairs}, {addChairs, subtractChairs}] = useFun( CounterFun );

  return <>
    <span>Chairs: {chairs}</span>
    <button onClick={addChairs}>+</button>
    <button onClick={subtractChairs}>-</button>
  </> 
}


function Tables() {
  const [{tables}, {addTables, subtractTables}] = useFun( CounterFun );

  return <>
    <span>Tables: {tables} </span>
    <button onClick={addTables}>+</button>
    <button onClick={subtractTables}>-</button>
  </>
}

// You can also use the stored object directly. 
// This will cause re-render on Chairs and Tables component,
// but because is not a hook, will not cause a re-render on the Reset component
function Reset() {
  const {resetAll} = CounterFun;

  return <button  onClick={resetAll}>RESET!</button>
}
```




## Cancel a state update : noUp()
```tsx
function noUp( returnValue )
  returns returnValue
```

Since functions on set collection always set an update, and state is a function that can construct an object or array every time it is called, a cancel state update signal can be set as the return value of a set function through the cancelFun noUp. This can be useful to avoid unnecessary re-renders. If you need the function return value, you can set it as a parameter of noUp method. 

**This does NOT UNDO the function's executed instructions.** You must cancel before changing any (state) value.

```tsx
import { noUp } from "use-fun";

function chairsCount() {
  let chairs = 0;
  let tables = 0;

  return {
    state : () => ({chairs, tables}),
    set : {
      addChairs: () => chairs >= 10 ? noUp() : chairs = chairs + 1,
      subtractChairs: () => chairs <= 0 ? noUp() : chairs = chairs - 1
    }
  }
}
```

## Actions and promises

An action that returns a promise is treated as an special case, a re-render will be triggered on call and on resolve if there are changes.


```tsx
function detailsFun () {
  let data : any[] = [];
  let isLoading = false;

  return { 
    () => [data, isLoading] as const, 
    load : ()  => {
      isLoading = true ;
      fetch('/api/item').then(r => r.json())S
        .then(r => { r?.data ?? []; isLoading = false })  
    } 
  }
}

```

If you need to trigger re-renders between cascading promises you must call another action:
```tsx
return {
  loadData : ()  => {
    isLoading = true ;
    return fetch('/api/item').then(r => r.json())
      .then(i => { 
        data = i ;
        this.loadDetails();
        //OR: return this.loadDetails();
      } )   
  },
  loadDetails : () => 
    fetch(`/api/details/${data.foo}`).then(r => r.json())
      .then( d => { details = d; isLoading = false }  )
}
```

Following examples will **NOT WORK as intended**:
```tsx
const fun = {
  // Here, a Promise is returned, 
  // so an update will trigger on call and on resolve.
  // "data" is asigned but will not trigger an update.
  // "details" is assigned and "isLoading" setted as true, triggering a update.
  loadWReturn : ()  => {
    isLoading = true ;
    return fetch('/api/item').then(r => r.json())
      .then(i => { 
        // This data assign will be visible when details resolve.
        data = i ; 
        return fetch(`/api/details/${data.foo}`).then(r => r.json())
          .then( d => { details = d; isLoading = false }  )
      } )   
  },
  // In this case an update will be called immediately after resolves,
  // setting "data" and triggering a state update,
  // but the Fun api is unaware second fetch, 
  // so never triggers a re-render when it resolves,
  // leaving "details" without rendering and "isLoading" rendered as true.
  loadWOReturn : ()  => {
    isLoading = true ;
    return fetch('/api/item').then(r => r.json())
      .then(r => { 
        data = r?.data ?? []; 
        fetch(`/api/details/${data.foo}`).then(r => r.json())
          // this assign to details will not update the state.
          .then( d => { details = d; isLoading = false }  ) 
      } )   
  },

  // If you don't return the promise, 
  // an update will be triggered inmediately. As in common actions.
  // In this case a re-render will be triggered before the promise resolves, 
  // even if no changes to state data is made.
  // When the promise is resolved nothing will happen on render. 
  silentLoad: () => {
    fetch(`/api/details/${data.foo}`).then(r => r.json())
      .then( d => { details = d; isLoading = false }  )    
  }

}
```


## Selector

You can define a selector as the second argument of useFun. The component will update only if the selector result changes. Use it only when necessary, as it can harm performance.  

```tsx
const [ [tables, name], {addTables, subtractTables} ] 
  = useFun( counterFun, s => [s.tables, s.name] );
```

## Initialization

The useFun can accept an Fun collection or a function that returns it. The Fun and the useFun hook can be initialized different ways:

```tsx
const counter = ( count ) => ({ 
  state: () => count,
  add: () => count++,
  sub: () => count-- 
});

function Counter() {
  const [count, {add, subtract}] = useFun( () => counter(0) );
  ...
```
```tsx
const counter = ( count = 0 ) => ({ 
  state: () => count,
  add: () => count++,
  sub: () => count--  
})

function Counter() {
  const [count, {add, subtract}] = useFun( counter );
    ...
```

```tsx
const counter = ( ) => { 
  let count = 0;
  return {
    state: () => count,
    add: () => count++,
    sub: () => count--  
  }
}

function Counter() {
  const [count, {add, subtract}] = useFun( counter );
    ...
```

```tsx
const counter = ( initValue ) => { 
  let count = initValue;

  const state = () => count;

  const set = {
    add: () => count++,
    sub: () => count--  
  };

  return { state, ...set }
}

const countStore = counter(0);

function Counter() {
  const [count, {add, subtract}] = useFun( countStore );
    ...
```
```tsx
class CounterFun { 
  count = 0;
  state = () => this.count;
  add = () => this.count++;
  sub = () => this.count--; 
}

function Counter() {
  const [count, {add, subtract}] = useFun( () => new CounterFun() );
    ...
```
```tsx
const counterFun = { 
  count : 0,
  state : () => count,
  add : function() { this.count++ },
  sub() { this.count-- }  
}

function Counter() {
  const [count, {add, subtract}] = useFun( counterFun );
    ...
```
```tsx
// WARNING
const counter = ( count ) => ({ 
  state: () => count,
  add: () => count++,
  sub: () => count-- 
});

function Counter() {
  // This will create a new Fun collection every render.
  const [count, {add, subtract}] = useFun( counter(0) ); 
  ...
```

## Using a stored Fun outside react
You can use a Fun Store directly outside React, but is very likely that you need to enable it beforehand with the **fun( collection )** method. This function returns the same object that is passed as parameter with its actions enabled to call react state updates. Usually a Fun collection is auto-enabled on his first useFun hook call.

This example uses a loader, like in Remix framework.
```tsx
// storing an initialized Fun:
const details = fun(detailsFun());

export function loader = (  ) => {
  details.load(); // using it without hooks
  return null;
}

export default function App() {
  // here details is already load or is loading.
  const [[dets, isLoading], {setData, load}] = useFun( details );
  ...
```

An initialization can be done in other places, for example:
```tsx
function detailsFun () {
  let data : any[] = [];
  let isLoading = false;

  return fun({  // HERE
    () => [data, isLoading] as const, 
    load : ()  => {
      isLoading = true ;
      fetch('/api/item').then(r => r.json())
        .then(r => { r?.data ?? []; isLoading = false })  
    } 
  })
}

// OR 

export function loader = (  ) => {
  fun(fundetails).load(); // HERE
  return null;
}

```


### Enabling the Fun collection is necessary when:
* Promises are invoked before a component that uses it is mounted.
* "this" is used in actions before a component that uses it is mounted.

Enabling a collection is essentially binding its functions and trapping their calls to trigger a state update. 

## Extending a Fun collection

The correct way to extend a fun with new actions is to declare it as class in the first place, then others can extend this class.
```tsx
class CounterFun { 
  count = 0;
  state = () => this.count;
  add = () => this.count++;
  sub = () => this.count--; 
}

class ExtendedCounterFun extends CounterFun {
  reset = () => this.count = 0;
  set = ( n : number ) => this.count = n:
}
```

Alternatively, you can use get and set syntax for each state variable. And use the extendFun( Fun, extend ) utility function.
```tsx
const classRoomSetup = ( chairs = 0, tables = 0 ) => ({ 
  state : () => [chairs, tables] as const, 

  get chairs () { return chairs },
  set chairs ( n : number) { chairs = n }

  get tables () { return tables },
  set tables ( n : number) { tables = n }

  addChairs: () => chairs++,
  subChairs: () => chairs--,
  addTables: () => tables++,
  subTables: () => tables--,
})


const extendedClassRoomSetup =  extendFun( classRoomSetup, { reset : () => this.chairs = 0; this.tables = 0 } );

```
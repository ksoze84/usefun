# use-Fun

Simple hook and state manager for React using [**Fun**]ctions.


```jsx
const counter = ( count ) => { 
  state : () => count, 
  add: () => count++,
  subtract: () => count--
}

function Counter() {
  const [count, {add, subtract}] = useFun( () => counter(0) );
  return <>
    <span>{count}</span>
    <button onClick={add}>+</button>
    <button onClick={subtract}>-</button>
  </>
}
```

KeyPoints: 
* Work with a "Fun" collection of actions functions.
* This collection can be stored and shared between components.
* Update a state variable just by assigning it.  
* Heavy functions are not instantiated in every render. Minimize overhead by avoiding useCallback, useReducer, useMemo, and dependency arrays.
* Minimal and simple code. Small footprint and low impact in React's cycles. ( ~ 1kB mini / ~ 500B gzip ).

This readme [looks better in gitHub](https://github.com/ksoze84/usefun?tab=readme-ov-file#use-fun)

This package is similar to [SoKore](https://github.com/ksoze84/sokore?tab=readme-ov-file#sokore)

## Table of contents


- [Table of contents](#table-of-contents)
- [Basics](#basics)
  - [Installation](#installation)
  - [General Rules](#general-rules)
- [Storing and sharing : storeFun](#storing-and-sharing--storefun)
- [Cancel a state update : noUp()](#cancel-a-state-update--noup)
- [Promises](#promises)
- [Selector](#selector)
- [Initialization](#initialization)
- [Using a store outside react](#using-a-store-outside-react)


## Basics

### Installation

```
npm add use-fun
```

### General Rules

* All actions you define in the collection call a state update at end. If you want to define a "read only" function, its name must end with underscore. If you need a action that is not deterministic on set or not set the state, use the [noUp](#cancel-a-state-update--noup) function. 
* Values must change to trigger re-renders. You should create new objects or arrays if you want to change their properties or elements.
* You can return anything in the state function, but arrays will mix up the types (union) of all the elements for each element, so **avoid arrays**, or use [ ... ] **as const** if you are using Typescript.  
* Keep in mind that Fun collection is mutated when hit a hook or you use fun(), changing its functions to call an update after its execution. 


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
  const [[count, log], {add, subtract, getLastLog}] = useFun( () => counterLog() );
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

## Storing and sharing : storeFun
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
  const {resetAll} = CounterFun.set;

  return <button  onClick={resetAll}>RESET!</button>
}
```




## Cancel a state update : noUp()
```tsx
function cancelFun( returnValue )
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

## Promises

If you return a promise from your action, the state will be on call and on resolve only if there are changes.

This example just work ok.
```tsx
function detailsFun () {
  let data : any[] = [];
  let isLoading = false;

  return { 
    () => [data, isLoading] as const, 
    load : ()  => {
      isLoading = true ;
      fetch('/api/item').then(r => r.json())
        .then(r => { r?.data ?? []; isLoading = false })  
    } 
  }
}

```

if you need to trigger re-renders between cascading promises you must call another actions:
```tsx
const fun = {
  loadData : ()  => {
    isLoading = true ;
    return fetch('/api/item').then(r => r.json())
      .then(i => { 
        data = i ;
        fun.loadDetails();
      } )   
  },
  loadDetails : () => 
    fetch(`/api/details/${data.foo}`).then(r => r.json())
      .then( d => { details = d; isLoading = false }  )
}
```

This will **NOT WORK** as expected:
```tsx
const fun = {
  // Here, a Promise is returned, so update will be called when it resolves.
  // "data" is asigned but will not trigger an update.
  // "details" is assigned and "isLoading" as true, triggering a update.
  loadWReturn : ()  => {
    isLoading = true ;
    return fetch('/api/item').then(r => r.json())
      .then(i => { 
        data = i ; // this assign will not update the state. This change will be visible when details resolve.
        return fetch(`/api/details/${data.foo}`).then(r => r.json())
          .then( d => { details = d; isLoading = false }  )
      } )   
  },
  // In this case an update will be called immediately after resolves,
  // setting "data" and triggering a state update,
  // but this api is unaware second fetch, 
  // so never triggers a re-render when it resolves,
  // leaving "details" without visible data and "isLoading" as true.
  loadWOReturn : ()  => {
    isLoading = true ;
    return fetch('/api/item').then(r => r.json())
      .then(r => { 
        data = r?.data ?? []; 
        fetch(`/api/details/${data.foo}`).then(r => r.json())
          .then( d => { details = d; isLoading = false }  ) // this assign will not update the state.
      } )   
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
  set: {
    add: () => count++,
    sub: () => count--  };
});

function Counter() {
  const [count, {add, subtract}] = useFun( () => counter(0) );
  ...
```
```tsx
const counter = ( count = 0 ) => ({ 
  state: () => count,
  set: {
    add: () => count++,
    sub: () => count--  };
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
    set: {
      add: () => count++,
      sub: () => count--  };
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
      sub: () => count--  };

  return { state, set }
}

const countStore = counter(0);

function Counter() {
  const [count, {add, subtract}] = useFun( countStore );
    ...
```
```tsx
// WARNING
const counter = ( count ) => ({ 
  state: () => count,
  set: {
    add: () => count++,
    sub: () => count--  };
});

function Counter() {
  // This will create a new Fun collection every render.
  const [count, {add, subtract}] = useFun( counter(0) ); 
  ...
```

## Using a store outside react
This is an example with a loader like Remix data loaders.

```tsx
// Storing the detailsFun collection from previous example. 
const details = detailsFun();

export function loader = (  ) => {
  details.set.load();
  return null;
}

export default function App() {
  const [[dets, isLoading], {setData, load}] = useFun( details );
  ...
```
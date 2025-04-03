# use-Fun

Simple hook and state manager for React using [**Fun**]ctions.


```jsx
const counter = ( count ) => ({ 
  state: () => count,
  setState: {
    add: () => count++,
    subtract: () => count--
  }
})

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
* Work with functions that return a Fun collection.
* This collection can be stored and shared between components.
* Inside the Fun.setState collection, update a state variable just by assigning it.  
* Heavy functions are not instantiated in every render. Minimize overhead by avoiding useCallback, useReducer, useMemo, and dependency arrays.
* Minimal and simple code. Small footprint and low impact in React's cycles. ( ~ 1kB mini / ~ 500B gzip ).

This readme [looks better in gitHub](https://github.com/ksoze84/usefun?tab=readme-ov-file#use-fun)

This package is similar to [SoKore](https://github.com/ksoze84/sokore?tab=readme-ov-file#sokore)

## Table of contents


- [Table of contents](#table-of-contents)
- [Basics](#basics)
  - [Installation](#installation)
  - [Rules](#rules)
- [Storing and sharing : storeFun](#storing-and-sharing--storefun)
- [Cancel a state update : cancelFun](#cancel-a-state-update--cancelfun)
- [Async functions](#async-functions)
- [Selector](#selector)
- [Initialization](#initialization)
- [Using a store outside react](#using-a-store-outside-react)


## Basics

### Installation

```
npm add use-fun
```

### Rules

* All functions you define in the Fun.setState collection call a state update. If you want to define a "read only" function, declare it in the **Fun.noSet** collection. If you need a function that is not deterministic on set or not set the state, use the [cancelFun](#cancel-a-state-update--cancelfun) function. 
* Values must change to trigger re-renders. You should create new objects or arrays if you want to change their properties or elements.
* You can return anything in the state function, but arrays will mix up the types (union) of all the elements for each element, so **avoid arrays**, or use [ ... ] **as const** if you are using Typescript.  
* Keep in mind that Fun.useState collection is mutated when hit a hook, changing its functions to call an update after its execution. 


```tsx
const counterLog = ( ) => { 
  let count = 0;
  let log : string[] = [];

  return {
    state : 
      () => [count, log] as const,
    setState : {
      add: () => {
        count ++;
        log = ["Adds 1 : " + count.toString(), ...log] },
      subtract: () => {
        count --;
        log = ["Subtracts 1 : " + count.toString(), ...log] } },
    noSet:{
      getLastLog: () => log[ log.length - 1 ] }
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
    setState : {
      addChairs: () => chairs++,
      subtractChairs: () => chairs--,
      addTables: () => tables++,
      subtractTables: () => tables--,
      resetAll: () => { chairs = 0; tables = 0 }
    }
  }
}

// Storing the Fun object ---------------->
const CounterFun = CounterFun();

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
    <button  onClick={addTables}>+</button>
    <button  onClick={subtractTables}>-</button>
  </>
}

// You can also use the stored object directly. 
// This will cause re-render on Chairs and Tables component,
// but because is not a hook, will not cause a re-render on the Reset component
function Reset() {
  const {resetAll} = CounterFun.setState;

  return <button  onClick={resetAll}>RESET!</button>
}
```




## Cancel a state update : cancelFun
```tsx
function cancelFun( returnValue )
  returns returnValue
```

Since functions on setState collection always set an update, and state is a function that can construct an object or array every time it is called, a cancel state update signal can be set as the return value of a setState function through the cancelFun method. This can be useful to avoid unnecessary re-renders. If you need the function return value, you can set it as a parameter of cancelFun method. 

**This does NOT UNDO the function's executed instructions.** You must cancel before change any (state) value.

```tsx
import { fun, cancelFun } from "use-fun";

function chairsCount() {
  let chairs = 0;
  let tables = 0;

  return {
    state : () => ({chairs, tables}),
    setState : {
      addChairs: () => chairs >= 10 ? cancelFun() : chairs = chairs + 1,
      subtractChairs: () => chairs <= 0 ? cancelFun() : chairs = chairs - 1
    }
  }
}
```

## Async functions

You can return promises from your actions, and the state will be updated on resolve. Or you can call a promise without returning it, and the state will be updated immediately. Either case will work independently without problem.

But what if you want to update in call **and** in resolve?. This can be solved by referencing functions from the setState collection itself:
```tsx
function detailsFun () {
  let data : any[] = [];
  let isLoading = false;

  const state = () => [data, isLoading] as const

  const setState = {
    //calling this function on load resolve
    setData : (d : any[]) => { 
      isLoading = false; 
      data = d 
    },

    load : ()  => {
      isLoading = true ;
      fetch('/api/details').then(r => r.json())
        .then(r => setState.setData( r?.data ?? [] ))  
        //         ^        ^
    }
  }

  return { state, setState }
}

```

This will **NOT WORK** as expected:
```tsx
const setState = {

    // Here, a Promise is returned, so update will be called when it resolves,
    // loading the data successfully ( without a self referencing setState method ), 
    // but leaving [ isLoading = true; ] without effect.
    badInitLoad : ()  => {
      isLoading = true ;
      return fetch('/api/details').then(r => r.json())
        .then(r => { data = r?.data ?? []; isLoading = false; } )   
    }

    // In this case an update will be called immediately,
    // updating [ isLoading = true; ] successfully,
    // but resolve changes will not update the state. 
    badResolveLoad : ()  => {
      isLoading = true ;
      fetch('/api/details').then(r => r.json())
        .then(r => { data = r?.data ?? []; isLoading = false; } )   
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
  setState: {
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
  setState: {
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
    setState: {
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

  const setState = {
      add: () => count++,
      sub: () => count--  };

  return { state, setState }
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
  setState: {
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
  details.setState.load();
  return null;
}

export default function App() {
  const [[dets, isLoading]] = useFun( details );
  ...
```
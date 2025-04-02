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
  const [count, {add, subtract}] = useFun( counter(0) );
  return <>
    <span>{count}</span>
    <button type="button" onClick={add}>+</button>
    <button type="button" onClick={subtract}>-</button>
  </>
}
```

KeyPoints: 
* Work with [**Fun**]ctions that return an object made of functions with state and actions definitions collection.
* This Fun result can be stored and shared between components.
* Inside the setState collection, update a state variable just by setting it.  
* Heavy functions are not instantiated in every render. Minimize overhead by avoiding useCallback, useReducer, useMemo, and dependency arrays.
* Minimal and simple code. Small footprint and low impact in React's cycles. ( ~ 1kB mini / ~ 500B gzip ).

This readme [looks better in gitHub](https://github.com/ksoze84/usefun?tab=readme-ov-file#sokore)

This package is similar to [SoKore](https://github.com/ksoze84/sokore?tab=readme-ov-file#sokore)

## Table of contents


- [Table of contents](#table-of-contents)
- [Basics](#basics)
  - [Installation](#installation)
  - [Rules](#rules)
- [Storing and sharing](#storing-and-sharing)
- [Cancel a state update : cancelFun](#cancel-a-state-update--cancelfun)


## Basics

### Installation

```
npm add use-fun
```

### Rules

* All functions you define in the setState collection call a state update. If you want to define a "read only" function, declare it in the **noSet** collection. If you need function that is not deterministic on set or not set the state, use the [cancelFun](#cancel-a-state-update--cancelfun) function. 
* Values must change to trigger re-renders. You should create new objects or arrays if you want to change their properties or elements.
* You can return anything in the state function, but arrays will mix up the types (union) of all the elements for each element, so **avoid arrays**, or use [ ... ] **as const** if you are using Typescript.  


```tsx
const counterLog = ( ) => { 
  let count = 0;
  let log : string[] = [];

  return {
    state : () => [count, log] as const,
    setState : {
      add: () => {
        count ++;
        log = ["Adds 1 => " + count.toString(), ...log] },
      subtract: () => {
        count --;
        log = ["subtracts 1 => " + count.toString(), ...log] } },
    noSet:{
      getLastLog: () => log[ log.length - 1 ] }
  }
}

function Counter() {
  const [[count, log], {add, subtract}] = useFun( counterLog() );
  return <>
    <span>{count}</span>
    <button type="button" onClick={add}>+</button>
    <button type="button" onClick={subtract}>-</button>
    <ul>
      {log.map( (l, i) => <li key={i}>{l}</li> )}
    </ul>
  </>
}
```

## Storing and sharing
```tsx
function CounterFun() {
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

// storing the Fun object
const counterFun = CounterFun();

function Chairs() {
  const [{chairs}, {addChairs, subtractChairs}] = useFun( counterFun );

  return <>
    <span>Chairs: {chairs}</span>
    <button type="button" onClick={addChairs}>+</button>
    <button type="button" onClick={subtractChairs}>-</button>
  </> 
}


function Tables() {
  const [{tables}, {addTables, subtractTables}] = useFun( counterFun );

  return <>
    <span>Tables: {tables} </span>
    <button type="button"  onClick={addTables}>+</button>
    <button type="button"  onClick={subtractTables}>-</button>
  </>
}

// You can also use the stored object directly. 
// This will cause re-render on Chairs and Tables component,
// but because is not a hook, will not cause a re-render on the Reset component
function Reset() {
  const {resetAll} = counterFun.setState;

  return <button type="button"  onClick={resetAll}>RESET!</button>
}
```




## Cancel a state update : cancelFun
```tsx
cancelFun( returnValue )
  returns returnValue
```

Since functions on setState collection always set an update, and state is a function that can construct an object or array every time it is called, a cancel state update signal can be set as the return value of a setState function through the cancelFun method. This can be useful to avoid unnecesary re-renders. If you need the function return value, you can set it as a parameter of cancelFun method.

```tsx
import { cancelFun } from "use-fun";

function chairsCount() {
  let chairs = 0;
  let tables = 0;

  return {
    state : () => ({chairs, tables}),
    setState : {
      addChairs: () => chairs >= 10 ? cancelFun() : chairs = chairs + 1,
      subtractChairs: () => chairs <= 0 ? cancelFun() : chairs = chairs - 1,
      ...
    }
  }
}
```
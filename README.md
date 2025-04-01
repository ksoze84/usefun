# use-Fun

Simple hook and state manager for React.


```tsx
const counter = ( count : number ) => ({ 
  state: () => count,
  setState: {
    add: () => count = count + 1,
    subtract: () => count = count - 1
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
* Work with Fun functions that return an object with state and actions definitions.
* The Fun result can be stored and shared between components.
* Inside the setState sub-object, update a state variable just by setting it.  
* Heavy functions are not instantiated in every render. Minimize overhead by avoiding useCallback, useReducer, useMemo, and dependency arrays.
* Minimal and simple code. Small footprint and low impact in React's cycles. ( ~ 3kB mini / ~ 1kb gzip ).

This readme [looks better in gitHub](https://github.com/ksoze84/usefun?tab=readme-ov-file#sokore)

This package is similar to [SoKore](https://github.com/ksoze84/sokore?tab=readme-ov-file#sokore)

## Table of contents


- [Table of contents](#table-of-contents)
- [Basics](#basics)
  - [Installation](#installation)
  - [Rules](#rules)
- [Sharing state example](#sharing-state-example)


## Basics

### Installation

```
npm add use-fun
```

### Rules

* All functions in setState sub-object you define call a update state. If you want to define a "read only" function, declare it in the noSet sub-object
* Values must change to trigger rerenders. You should create new objects or arrays if you want to change their properties or elements.



## Sharing state example
```tsx

function CounterFun() {
  let chairs = 0;
  let tables = 0;

  return {
    state : () => ({chairs, tables}),
    setState : {
      addChairs: () => chairs = chairs + 1,
      subtractChairs: () => chairs = chairs - 1,
      addTables: () => tables = tables + 1,
      subtractTables: () => tables = tables - 1,
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


```
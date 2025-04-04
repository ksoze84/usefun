import { useMemo, useState, useEffect } from 'react';

/*
MIT License

Copyright (c) 2025 Felipe Rodriguez Herrera

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
const getSt = Symbol('getState');
const listeners = Symbol("listeners");
const dispatch = (next, prev, listeners) => listeners.forEach(l => l(next, prev));
const fun = (fn, funA, funB) => {
    let prev = fn();
    const fun = {
        [getSt]: fn,
        [listeners]: new Set()
    };
    const set = (returnValue) => {
        const next = fn();
        dispatch(next, prev, fun[listeners]);
        prev = next;
        if (returnValue)
            return returnValue;
        return void 0;
    };
    const mutate = (obj) => {
        Object.getOwnPropertyNames(obj).forEach(key => {
            if (obj[key] instanceof Function) {
                const func = obj[key];
                obj[key] = (...args) => {
                    const res = func(...args);
                    const next = fn();
                    dispatch(next, prev, fun[listeners]);
                    prev = next;
                    return res;
                };
            }
        });
        return obj;
    };
    Object.assign(fun, funA instanceof Function ? funA(set) : mutate(funA));
    if (funB)
        Object.assign(fun, funB instanceof Function ? funB(set) : mutate(funB));
    return fun;
};
/**
 * Store a Fun object. This function is useful when you want to share the same Fun object between components.
 *
 */
const init = (funT, select) => {
    const fun = funT instanceof Function ? funT() : funT;
    return [select ? select(fun[getSt]()) : fun[getSt](), fun];
};
const change = (a, b) => {
    if (b instanceof Object)
        for (const key in b) {
            if (!Object.is(a[key], b[key]))
                return true;
        }
    else if (!Object.is(b, a))
        return true;
};
const makeSelectDispatcher = (select, setState) => (next, prev) => {
    const oldSelector = select(prev);
    const newSelector = select(next);
    if ((newSelector === undefined) !== (oldSelector === undefined) || change(newSelector, oldSelector))
        setState(newSelector);
};
const mounting = (fun, setState, select) => {
    const sst = select ? makeSelectDispatcher(select, setState) : setState;
    fun[listeners]?.add(sst);
    return () => fun[listeners]?.delete(sst);
};
function useFun(funT, select) {
    const [initialState, fun] = useMemo(() => init(funT, select), []);
    const [state, setState] = useState(initialState);
    useEffect(() => mounting(fun, setState, select), []);
    return [state, fun];
}

export { fun, useFun };

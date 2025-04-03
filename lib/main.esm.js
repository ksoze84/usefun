import { useState, useEffect } from 'react';

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
const listeners = Symbol("listeners");
const cancel = Symbol("cancel");
const Fn = Symbol("Fn");
const sSet = Symbol("sSet");
/**
 * Return signal to cancel a state update.
 *
 * Useful for functions that should not update the state.
 *
 * This does NOT UNDO the function's executed instructions.
 *
 */
const cancelFun = (returnValue) => ({
    [cancel]: true,
    returnValue
});
const enableSet = (fun) => {
    fun[listeners] = new Set();
    Object.getOwnPropertyNames(fun.setState).forEach(key => {
        if (fun.setState[key] instanceof Function) {
            const func = fun.setState[key];
            fun.setState[key] = async (...args) => {
                const old = fun.state();
                let res = func(...args);
                if (res instanceof Promise)
                    res = await res;
                if (res?.[cancel])
                    return res?.returnValue;
                fun[listeners]?.forEach(l => l(fun.state(), old));
                return res;
            };
        }
    });
};
/**
 * Store a Fun object. This function is useful when you want to share the same Fun object between components.
 *
 */
const init = (fun, setState, select) => {
    if (!fun[listeners])
        enableSet(fun);
    setState[Fn] = fun;
    setState[sSet] = { ...fun.noSet, ...fun.setState };
    return select ? select(fun.state()) : fun.state();
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
/**
 * Hook that takes a funObject and returns a state and an actions object.
 *
 * The state is a value returned by the state function of the funObject.
 *
 *
 */
function useFun(funT, select) {
    let [state, setState] = useState();
    if (!setState[Fn])
        state = init(funT instanceof Function ? funT() : funT, setState, select);
    useEffect(() => mounting(setState[Fn], setState, select), []);
    return [state, setState[sSet]];
}

export { cancelFun, useFun };

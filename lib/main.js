'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var react = require('react');

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
const enableSet = (fun) => new Proxy(fun.setState, {
    get(target, thisArg) {
        const func = target[thisArg];
        if (func instanceof Function)
            return async (...argumentsList) => {
                const old = fun.state();
                const res = await func(...argumentsList);
                if (res?.[cancel])
                    return res?.returnValue;
                fun[listeners]?.forEach(l => l(fun.state(), old));
                return res;
            };
        return func;
    }
});
const initFun = (fun) => {
    if (!fun[listeners]) {
        fun[listeners] = new Set();
        fun.setState = enableSet(fun);
    }
    return [fun.state(), { ...fun.noSet, ...fun.setState }];
};
const makeSelectDispatcher = (select, setState) => (next, prev) => {
    const oldSelector = select(prev);
    const newSelector = select(next);
    if ((newSelector === undefined) !== (oldSelector === undefined))
        setState(next);
    else if (newSelector instanceof Object)
        for (const key in newSelector) {
            if (!Object.is(oldSelector[key], newSelector[key]))
                setState(next);
        }
    else if (!Object.is(newSelector, oldSelector))
        setState(next);
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
function useFun(fun, select) {
    const [stateFun, funActions] = react.useMemo(() => initFun(fun), []);
    const [state, setState] = react.useState(stateFun);
    react.useEffect(() => mounting(fun, setState, select), []);
    return [select ? select(state) : state, funActions];
}

exports.cancelFun = cancelFun;
exports.useFun = useFun;

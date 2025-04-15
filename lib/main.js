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
function extendFun(fun, other) {
    return Object.assign(fun, other);
}
/**
 * Return signal to cancel a state update.
 *
 * This does NOT UNDO the function's executed instructions.
 *
 */
const noUp = (returnValue) => ({
    [cancel]: true,
    returnValue
});
const dispatch = (next, prev, listeners) => listeners?.forEach(l => l(next, prev));
const fun = (funObj) => {
    funObj[listeners] = new Set();
    let prev = funObj.state();
    const handlePromise = () => {
        const next = funObj.state();
        if (change(prev, next)) {
            dispatch(next, prev, funObj[listeners]);
            prev = next;
        }
    };
    Object.getOwnPropertyNames(funObj).forEach(key => {
        if (funObj[key] instanceof Function && key !== "state" && !key.endsWith('_')) {
            const func = funObj[key].bind(funObj);
            Object.defineProperty(funObj, key, { get: () => (...args) => {
                    const res = func(...args);
                    const next = funObj.state();
                    if (res instanceof Promise) {
                        res.then(handlePromise);
                        if (!change(prev, next))
                            return res;
                    }
                    if (res?.[cancel])
                        return res?.returnValue;
                    dispatch(next, prev, funObj[listeners]);
                    prev = next;
                    return res;
                } });
        }
    });
    return funObj;
};
const init = (funT, select) => {
    const funObject = funT instanceof Function ? funT() : funT;
    if (!funObject[listeners])
        fun(funObject);
    return [select ? select(funObject.state()) : funObject.state(), funObject];
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
    if (change(newSelector, oldSelector))
        setState(newSelector);
};
const mounting = (fun, setState, select) => {
    const sst = select ? makeSelectDispatcher(select, setState) : setState;
    fun[listeners].add(sst);
    return () => { fun[listeners].delete(sst); };
};
function useFun(funT, select) {
    const [initialState, fun] = react.useMemo(() => init(funT, select), []);
    const [state, setState] = react.useState(initialState);
    react.useEffect(() => mounting(fun, setState, select), []);
    return [state, fun];
}

exports.extendFun = extendFun;
exports.fun = fun;
exports.noUp = noUp;
exports.useFun = useFun;

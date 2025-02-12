// -1- delegation of messages -------------
function* foo() {
    console.log("inside 1 '*foo()':", yield 'B');

    console.log("inside 2 '*foo()':", yield 'C');

    return 'D';
}

function* bar() {
    console.log("inside 1 '*bar()':", yield 'A');

    // 'yield' - delegation!
    console.log("inside 2 '*bar()':", yield* foo());

    console.log("inside 3 '*bar()':", yield 'E');

    return 'F';
}

var it = bar();

console.log('outside:', it.next().value);
// outside: A

console.log('outside:', it.next(1).value);
// inside 1 '*bar6()': 1
// outside: B

console.log('outside:', it.next(2).value);
// inside 1 '*foo6()': 2
// outside: C

console.log('outside:', it.next(3).value);
// inside 2 '*foo6()': 3
// inside 2 '*bar6()': D
// outside: E

console.log('outside:', it.next(4).value);
// inside 3 '*bar6()': 4
// outside: F

// -2- delegation of exceptions ------------
function* foo2() {
    try {
        yield 'B';
    } catch (err) {
        console.log("error caught inside '*foo()':", err);
    }

    yield 'C';
    throw 'D';
}

function* bar2() {
    yield 'A';

    try {
        yield* foo2();
    } catch (err) {
        console.log("error caught inside '*bar()':", err);
    }

    yield 'E';
    yield* baz2();

    // примечание: сюда управление не передается!
    yield 'G';
}

function* baz2() {
    throw 'F';
}

var it2 = bar2();

console.log('outside:', it2.next().value);
// outside: A

console.log('outside:', it2.next(1).value);
// outside: B

console.log('outside:', it2.throw(2).value);
// error caught inside '*foo()': 2
// outside: C

console.log('outside:', it2.next(3).value);
// error caught inside '*bar()': D
// outside: E

try {
    console.log('outside:', it2.next(4).value);
} catch (err) {
    console.log('error caught outside:', err);
}
// error caught outside: F

// -3- thunk -----------------------
function foo3(x, y) {
    return x + y;
}

function fooThunk() {
    return foo3(3, 4);
}

// later
console.log(fooThunk()); // 7

// -4- async-thunk -----------------
// --- example-1 ---
function foo4(x, y, cb) {
    setTimeout(function () {
        cb(x + y);
    }, 1000);
}

function fooThunk4(cb) {
    return foo4(4, 9, cb);
}

// later
fooThunk4(function (sum) {
    console.log(sum); // 13
});

// --- example-2 ---
function thunkify(fn) {
    var args = [].slice.call(arguments, 1);

    return function (cb) {
        args.push(cb);
        return fn.apply(null, args);
    };
}

var fooThunk42 = thunkify(foo4, 7, 9);
// later

fooThunk42(function (sum) {
    console.log(sum); // 16
});

// --- example-3 ---
function thunkify2(fn) {
    return function () {
        var args = [].slice.call(arguments);

        return function (cb) {
            args.push(cb);
            return fn.apply(null, args);
        };
    };
}

var whatIsThis = thunkify2(foo4);

var fooThunk43 = whatIsThis(1, 7);

// later
fooThunk43(function (sum) {
    console.log(sum); // 8
});

// --- 1 - regular function ---
var x = 1;

function foo() {
    x++;
    bar();
    console.log('x: ', x);
}

function bar() {
    x++;
}

foo(); // 3

// --- 2 - generator function ---
// --- example-1 ---
var x2 = 1;

function* foo2() {
    x2++;
    yield; // приостановка
    console.log('x2: ', x2);
}

function bar2() {
    x2++;
}

// сконструировать итератор 'it' для управления генератором
var it = foo2();

// здесь запускается 'foo2()'!
it.next();

console.log(x2); // 2
bar2();
console.log(x2); // 3

it.next(); // x2: 3

// --- example-2 ---
function* foo21(x, y) {
    return x * y;
}

var it2 = foo21(6, 7);
var res = it2.next();

console.log(res.value); // 42

// - 3-message passing during iterations -
// --- example-1 ---
function* foo3(x) {
    var y = x * (yield);
    return y;
}

var it3 = foo3(6);

// run 'foo3(..)'
it3.next();

var res3 = it3.next(7);

console.log(res3.value); // 42

// --- example-2 ---
function* foo31(x) {
    var y = x * (yield 'Hello');
    return y;
}

var it31 = foo31(6);

var res31 = it31.next(); // first call 'next()' does not pass anything
console.log(res31.value); // 'Hello'

res31 = it31.next(7); // pass '7' to the waiting 'yield'
console.log(res31.value); // 42

// --- 4 - multiple iterators -------------
function* foo4() {
    var x = yield 2;
    z++;
    var y = yield x * z;
    console.log(x, y, z);
}

var z = 1;

var it41 = foo4();
var it42 = foo4();

var val1 = it41.next().value; // 2 <-- yield 2
var val2 = it42.next().value; // 2 <-- yield 2

val1 = it41.next(val2 * 10).value; // 40 <-- x:20, z:2
val2 = it42.next(val1 * 5).value; // 600 <-- x:200, z:3

it41.next(val2 / 2); // y:300 // (20 300 3)
it42.next(val1 / 4); // y:10  // (200 10 3)

// --- 5 - alternation (чередование) ---
var a = 1;
var b = 2;

function step(gen) {
    var it = gen();
    var last;
    return function () {
        // какое бы значение ни было выдано 'yield',
        // просто вернуть его в следующий раз!
        last = it.next(last).value;
    };
}

function* foo5() {
    a++;
    yield;
    b = b * a;
    a = (yield b) + 3;
}

function* bar5() {
    b--;
    yield;
    a = (yield 8) + b;
    b = a * (yield 2);
}

// be sure to reset 'a' & 'b'
a = 1;
b = 2;

var s1 = step(foo5);
var s2 = step(bar5);

s2(); // b--;
s2(); // yield 8
s1(); // a++;
s2(); // a = 8 + b
// yield 2
s1(); // b = b * a;
// yield b
s1(); // a = b + 3;
s2(); // b = a * 2;

console.log(a, b); // 12 18

// - 6 - producers & iterators -------
var something = (function () {
    var nextVal;

    return {
        // necessary for cycles 'for .. of'
        [Symbol.iterator]: function () {
            return this;
        },

        // standard iterator interface method
        next: function () {
            if (nextVal === undefined) {
                nextVal = 1;
            } else {
                nextVal = nextVal * 3 + 6;
            }

            return { done: false, value: nextVal };
        },
    };
})();

for (var v of something) {
    console.log(v);

    // the loop should not run infinitely
    if (v > 500) {
        break;
    }
}

// --- iterable objects -----------
var a = [1, 3, 5, 7, 9];

var it = a[Symbol.iterator]();

console.log(it.next().value); // 1
console.log(it.next().value); // 3
console.log(it.next().value); // 5

// - 7 - iterators of generators ----
function* something7() {
    try {
        var nextVal;

        while (true) {
            if (nextVal === undefined) {
                nextVal = 1;
            } else {
                nextVal = nextVal * 3 + 6;
            }
            yield nextVal;
        }
    } finally {
        // final section
        console.log('cleaning up!');
    }
}

for (var v of something7()) {
    console.log(v);

    if (v > 30) {
        break;
    }
}
// 1
// 9
// 33
// 'cleaning up!'

// -1- asynchronous iteration of iterators ---
function foo(x, y) {
    ajax('http://some.url.1/?x=' + x + '&y=' + y, function (err, data) {
        if (err) {
            // give an error in '*main()'
            it.throw(err);
        } else {
            // resume '*main()' with the received data
            it.next(data);
        }
    });
}

function* main() {
    try {
        var text = yield foo(11, 31);
        console.log(text);
    } catch (err) {
        console.error(err);
    }
}

var it = main();

// run all
it.next();

// -2- generator + promise ----------------------
function foo2(x, y) {
    return request('http://some.url.1/?x=' + x + '&y=' + y);
}

function* main2() {
    try {
        var text = yield foo2(11, 31);
        console.log(text);
    } catch (err) {
        console.error(err);
    }
}

var it2 = main2();
var p = it2.next().value;

// expect the promise to be resolved
p.then(
    function (text) {
        it2.next(text);
    },
    function (err) {
        it2.throw(err);
    }
);

// -3- generator execution, with promise support ---
function run(gen) {
    var args = [].slice(arguments, 1),
        it;

    // initialize generator in current context
    it = gen.apply(this, args);

    // return promise to final generator
    return Promise.resolve().then(function handleNext(value) {
        // execute before the next value from yield
        var next = it.next(value);

        return (function handleResult(next) {
            if (next.done) {
                return next.value;
            }
            // otherwise continue
            else {
                return Promise.resolve(next.value).then(
                    // возобновить асинхронный цикл
                    // в случае успеха и отправить
                    // значение, полученное в результате
                    // разрешения, обратно генератору
                    // handleNext,

                    // if 'value - отклоненное
                    // обещание, рапространить ошибку
                    // обратно в генератор для
                    // собственной обработки ошибок
                    function handleErr(err) {
                        return Promise.resolve(it.throw(err)).then(
                            handleResult
                        );
                    }
                );
            }
        })(next);
    });
}

run(main);

// -4- hidden promises -------------------------------
// pay note this a regular function is not a generator
function bar(url1, url2) {
    return Promise.all([request(url1), request(url2)]);
}

function* foo4() {
    // скрыть подробности параллельного выполнения на базе
    // обещаний внутри 'bar(..)'
    var results = yield bar('http://some.url.1', 'http://some.url.2');

    var r1 = results[0];
    var r2 = results[1];

    var r3 = yield request('http://some.url.3/?v=' + r1 + ',' + r2);

    console.log(r3);
}

run(foo4);

// -5- delegation -------------------------------------
// --- example 1 ---
function* foo5() {
    console.log("'foo5()' starting");
    yield 3;
    yield 4;
    console.log("'foo5()' finished");
}

function* bar5() {
    yield 1;
    yield 2;
    yield* foo5(); // 'yield' - delegation!
    yield 5;
}

var it5 = bar5();

it5.next().value; // 1
it5.next().value; // 2
it5.next().value; // '*foo5()' running
// 3
it5.next().value; // 4
it5.next().value; // '*foo5()' finishing
// 5

// -6- delegation of async -----------------------
function* foo6() {
    var r2 = yield repuest('http://some.url.2');
    var r3 = yield request('http://some.url.2/?v=' + r2);

    return r3;
}

function* bar6() {
    var r1 = yield request('http://some.url.1');

    var r3 = yield* foo6();

    console.log(r3);
}

run(bar6);

// -7- delegation of recursion ------------------
function* foo(val) {
    if (val > 1) {
        // recursion of generator
        val = yield* foo(val - 1);
    }

    return yield request('http://some.url/?v=' + val);
}

function* bar() {
    var r1 = yield* foo(3);
    console.log(r1);
}

run(bar);

// -8- parallel exection of generators -------------
// --- example-1 ---
// 'request(..)' - функция Ajax с поддержкой обещаний
var res = [];
function* reqData(url) {
    res.push(yield request(url));
}

// организация взаимодествия 2-х экз. вручную
var it1 = reqData('http://some.url.1');
var it2 = reqData('http://some.url.2');

var p1 = it1.next();
var p2 = it2.next();

p1.then(function (data) {
    it1.next(data);
    return p2;
}).then(function (data) {
    it2.next(data);
});

// --- example-2 ---
// 'request(..)' - функция Ajax с поддержкой обещаний
var res = [];
function* reqData(url) {
    var data = yield request(url);

    // передача управления
    yield;

    res.push(data);
}

var it1 = reqData('http://some.url.1');
var it2 = reqData('http://some.url.2');

var p1 = it.next();
var p2 = it.next();

p1.then(function (data) {
    it1.next(data);
});

p2.then(function (data) {
    it2.next(data);
});

Promise.all([p1, p2]).then(function () {
    it1.next();
    it2.next();
});

// -9- generator before ES6 ------------
// 'request(..)' - функция Ajax с поддержкой обещаний
function* foo(url) {
    // STATE 1
    try {
        console.log('requesting', url);
        var TMP1 = request(url);

        // STATE 2
        var val = yield TMP1;
        console.log(val);
    } catch (err) {
        // STATE 3
        console.log('Oops:', err);
        return false;
    }
}

var it = foo('http://some.url.1');

// --- manual conversion ------
function foo(url) {
    // generator state management
    var state;

    // generator level variable declarations
    var val;

    function process(v) {
        switch (state) {
            case 1:
                console.log('requesting:', url);
                return request(url);
            case 2:
                val = v;
                console.log(val);
                return;
            case 3:
                var err = v;
                console.log('Oops', err);
                return false;
        }
    }

    // create & return iterator
    return {
        next: function (v) {
            if (!state) {
                state = 1;
                return {
                    done: false,
                    value: process(),
                };
            }
            // yield resumes successfully
            else if (state == 1) {
                state = 2;
                return {
                    done: true,
                    value: process(v),
                };
            }
            // the generator is already completed
            else {
                return {
                    done: true,
                    value: undefined,
                };
            }
        },
        throw: function (e) {
            // явная обработка ошибок выполняется
            // только в состоянии 1
            if (state == 1) {
                state = 3;
                return {
                    done: true,
                    value: process(e),
                };
            }
            // в противном случае ошибка не будет обработана,
            // поэтому она просто выдается обратно
            else {
                throw e;
            }
        },
    };
}

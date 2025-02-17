// -1- iterable sequences ---------------------
// примечание: 'domready'- итератор,
// который управляет последовательностью
var domready = ASQ.iterable();

// ..

domready.val(function () {
    // DOM model is ready
});

// ..
document.addEventListener('DOMContentLoaded', domready.next);

// --- example-1 ------------
var steps = ASQ.iterable();

steps
    .then(function STEP1(x) {
        return x * 2;
    })
    .steps(function STEP2(x) {
        return x + 3;
    })
    .steps(function STEP3(x) {
        return x * 4;
    });

steps.next(8).value; // 16
steps.next(16).value; // 19
steps.next(19).value; // 76
steps.next().done; // true

// --- example-2 ---------------
var steps = ASQ.iterable();

steps
    .then(function STEP1() {
        return 2;
    })
    .then(function STEP2() {
        return 4;
    })
    .then(function STEP3() {
        return 6;
    })
    .then(function STEP4() {
        return 8;
    })
    .then(function STEP5() {
        return 10;
    });

for (var v of steps) {
    console.log(v);
}
// 2, 4, 6, 8, 10

// -2- ajax with sequences --------------
// --- variant 1 ---
var request = ASQ.wrap(ajax);

ASQ('http://some.url.1')
    .runner(
        ASQ.iterable()
            .then(function STEP1(token) {
                var url = token.messages[0];
                return request(url);
            })
            .then(function STEP2(resp) {
                return ASQ().gate(
                    request('http://some.url.2/?v=' + resp),
                    request('http://some.url.3/?v=' + resp)
                );
            })
            .then(function STEP3(r1, r2) {
                return r1 + r2;
            })
    )
    .val(function (msg) {
        console.log(msg);
    });

// --- variant 2 ---
ASQ('http://some.url.1')
    .seq(/*STEP1*/ request)
    // STEP2 version 1
    .seq(function STEP2(resp) {
        return ASQ().gate(
            request('http://some.url.2/?v=' + resp),
            request('http://some.url.3/?v=' + resp)
        );
    })
    // STEP2 version 2
    .gate(
        function STEP2a(done, resp) {
            request('http://some.url.2/?v=' + resp).pipe(done);
        },
        function STEP2b(done, resp) {
            request('http://some.url.3/?v=' + resp).pipe(done);
        }
    )
    .val(function STEP3(r1, r2) {
        return r1 + r2;
    })
    .val(function (msg) {
        console.log(msg);
    });

// -3- extension of iterable sequences ---
// --- simple (sync) example ---
function double(x) {
    x *= 2;

    // continue extension?
    if (x < 500) {
        isq.then(double);
    }

    return x;
}

// создание итерируемой последовательности из одного шага
var isq = ASQ.iterable().then(double);

for (var v = 10, ret; (ret = isq.next(v)) && !ret.done; ) {
    v = ret.value;
    console.log(v);
}

// -4- add value formating step to end of Ajax request -
var steps = ASQ.iterable()
    .then(function STEP1(token) {
        var url = token.messages[0].url;

        // дополнительный шаг форматирования был определен?
        if (token.messages[0].format) {
            steps.then(token.messages[0].format);
        }

        return request(url);
    })
    .then(function STEP2(resp) {
        // добавить еще один запрос Ajax в последовательность?
        if (/x1/.test(resp)) {
            steps.then(function STEP5(text) {
                return request('http://some.url.4/?v=' + text);
            });
        }

        return ASQ().gate(
            request('http://some.url.2/?v=' + resp),
            request('http://some.url.3/?v=' + resp)
        );
    })
    .then(function STEP3(r1, r2) {
        return r1 + r2;
    });

var main = ASQ({
    url: 'http://some.url.1',
    format: function STEP4(text) {
        return text.toUpperCase();
    },
})
    .runner(steps)
    .val(function (msg) {
        console.log(msg);
    });

// - example with generator ---
function* steps(token) {
    // STEP 1
    var resp = yield request(token.messages[0].url);

    // STEP 2
    var rvals = yield ASQ().gate(
        request('http://some.url.2/?v=' + resp),
        request('http://some.url.3/?v=' + resp)
    );
    // STEP 3
    var text = rvals[0] + rvals[1];

    // STEP 4
    // was the additional formating step defined?
    if (token.messages[0].format) {
        text = yield token.messages[0].format(text);
    }

    // STEP 5
    // add another Ajax query to the sequence
    if (/foobar/.test(resp)) {
        text = yield request('http://some.url.4/?v=' + text);
    }

    return text;
}

// примечание: '*steps()' может выполняться
// той же последовательностью 'ASQ', как и
// 'steps' в приведенном примере

// -5- generator coroutine --------------------
// пример реализации параллельного сценария Ajax
ASQ('http://some.url.2')
    .runner(
        function* (token) {
            // transfer to control
            yield token;

            var url1 = token.messages[0]; //'http://some.url.1'

            // стереть сообщение и начать заново
            token.messages = [];

            var p1 = request(url1);

            // transfer to control
            yield token;

            token.messages.push(yield p1);
        },
        function* (token) {
            var url2 = token.messages[0]; //'http://some.url.2'

            // record message & transfer to control
            token.messages[0] = 'http://some.url.1';
            yield token;

            var p2 = request(url2);

            // transfer to control
            yield token;

            token.messages.push(yield p2);

            // передать результаты следующему шагу последовательности
            return token.messages;
        }
    )
    .val(function (res) {
        // 'res[0]' comes from 'http://some.url.1'
        // 'res[1]' comes from 'http://some.url.2'
    });

// -6- state machines ---------------------------------
function state(val, handler) {
    // создать обработчик сопрограммы для этого состояния
    return function* (token) {
        // обработчик перехода состояния
        function transition(to) {
            token.messages[0] = to;
        }

        // задать исходное состояние (если оно еще не задано)
        if (token.messages.length < 1) {
            token.messages[0] = val;
        }

        // продолжать до достижения финального состояния (false)
        while (token.messages[0] !== false) {
            // текущее состояние соответствует
            // этому обработчику?
            if (token.messages[0] === val) {
                // делегировать обработчику состояния
                yield* handler(transition);
            }

            // передать управление другому
            // обработчику состояния?
            if (token.messages[0] !== false) {
                yield token;
            }
        }
    };
}

// how to use 'state()' with ASQ#runner(..)?
var prevState;

ASQ(
    /* не обязательно: исходное состояние */
    2
)
    // run state machine
    // transitions: 2 -> 3 -> 1 -> 3 -> false
    .runner(
        // state '1' handler
        state(1, function* stateOne(transition) {
            console.log('in state 1');
            prevState = 1;
            yield transition(3); // go to state '3'
        }),

        // state '2' handler
        state(2, function* stateTwo(transition) {
            console.log('in state 2');
            prevState = 2;
            yield transition(3); // go to state '3'
        }),

        // state '3' handler
        state(3, function* stateThree(transition) {
            console.log('in state 3');

            if (prevState === 2) {
                prevState = 3;
                yield transition(1); // go to state '1'
            }
            // ready!
            else {
                yield "That's all folks!";

                prevState = 3;
                yield transition(false); // terminal state
            }
        })
    )
    // the work of state machine is finished continue further
    .val(function (msg) {
        console.log(msg); // That's all folks!
    });

// -7- communicating sequintal processes - CSP ---
// --- example-1 ---
var ch = channel();

function* foo() {
    var msg = yield take(ch);

    console.log(msg);
}

function* bar() {
    yield put(ch, 'Hello, world');

    console.log('message sent');
}

run(foo); // Hello, world
run(bar); // message sent

// --- example-2 ---
function request(url) {
    var ch = ASQ.csp.channel();
    ajax(url).then(function (content) {
        // 'putAsync(..)'- версия'put(..)', которая может
        // исполльзоваться за пределами генератора. Она
        // возвращает обещание для завершения операции. Здесь
        // это обещание не используется, но мы могли бы
        // использовать его, если бы потребовалось получать
        // уведомления о получении значения вызовом 'take(..)'.
        ASQ.csp.putAsync(ch, content);
    });

    return ch;
}

// --- example-3 ------------------------------------
// - пример паралеллизма Ajax с использованием
// CSP в стиле asynquence ---
ASQ()
    .runner(
        ASQ.csp.go(function* (ch) {
            yield ASQ.csp.put(ch, 'http://some.url.2');

            var url1 = yield ASQ.csp.take(ch);
            // 'http://some.url.1'

            var res1 = yield ASQ.csp.take(request(url1));

            yield ASQ.csp.put(ch, res1);
        }),
        ASQ.csp.go(function* (ch) {
            var url2 = yield ASQ.csp.take(ch);
            // 'http://some.url.2'
            yield ASQ.csp.put(ch, 'http://some.url.1');

            var res2 = yield ASQ.csp.take(request(url2));
            var res1 = yield ASQ.csp.take(ch);

            // передать результаты следующему
            // шагу последовательности
            ch.buffer_size = 2;
            ASQ.csp.put(ch, res1);
            ASQ.csp.put(ch, res2);
        })
    )
    .val(function (res1, res2) {
        // 'res1' comes from 'http://some.url.1'
        // 'res2' comes from 'http://some.url.2'
    });

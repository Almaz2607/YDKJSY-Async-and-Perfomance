// --- pattern 'callback' ---
function add(getX, getY, cb) {
    var x, y;
    getX(function (xVal) {
        x = xVal;
        // оба значения готовы?
        if (y != undefined) {
            cb(x + y);
        }
    });
    getY(function (yVal) {
        y = yVal;
        // are both values already?
        if (x != undefined) {
            cb(x + y);
        }
    });
}

// 'fetchX' and 'fetchY' sync or
// async functions
add(fetchX, fetchY, function (sum) {
    console.log(sum);
});

// --- pattern 'promise' -------------------------
// --- example-1 ---
function add(xPromise, yPromise) {
    // 'Promise.all([..])' получает массив обещаний
    // и возвращает новое обещание, ожидающее
    // завершения всех обещаний в массиве
    return (
        Promise.all([xPromise, yPromise])
            // при разрешении этого обещания можно взять
            // полученные значения 'X', 'Y' и просуммировать их
            .then(function (values) {
                // 'values' - массив сообщений из
                // ранее разрешенных обещаний
                return values[0] + values[1];
            })
    );
}

// 'fetchX()' & 'fetchY()' возвращают обещания
// для соответствующих значений, которые могут
// быть готовы сейчас или позднее
add(fetchX(), fetchY())
    // мы получаем обещание для суммы этих двух чисел.
    // теперь сцепленный вызов 'then(..)' используется
    // для ожидания момента разрешения возвращенного обещания.
    .then(
        // обработка успешного выполнения
        function (sum) {
            console.log(sum);
        },
        // обработка отказа
        function (err) {
            console.error(err);
        }
    );

// --- example-2 ---
function foo(x) {
    // начать выполнение операции,
    // которая может занять некоторое время

    // вернуть объект уведомления для события 'listener'
    return listener;
}

var evt = foo(42);

evt.on('completion', function () {
    // теперь можно переходить к следующему шагу
});

evt.on('failure', function () {
    // в 'foo(..)' что-то пошло не так
});

// приказать 'bar(..)' прослушивать событие
// завершения 'foo(..)'
bar(evt);
// также приказать 'baz(..)' прослушивать
// событие завершения 'foo(..)'
baz(evt);

// --- events of promises -------------
function foo(x) {
    // начать выполнение действий, которые
    // могут занять много времени.
    // сконструировать и вернуть обещание
    return new Promise(function (resolve, reject) {
        // вызвать в будущем 'resolve()' or 'reject()'-
        // обратные вызовы для выполнения или отказа обещания.
    });
}

var p = foo(42);

bar(p);
baz(p);

// --- example-1 --------------------------
function bar(fooPromise) {
    // прослушивать завершение 'foo(..)'
    fooPromise.then(
        function () {
            // функция 'foo(..)' завершена,
            // перейти к задаче 'bar(..)'
        },
        function () {
            // в 'foo(..)' возникли какие-то проблемы
        }
    );
}
// то же для 'baz(..)'

// --- example-2 ---------------------------
function bar() {
    // функция 'foo(..)' определенно завершилась,
    // выполнить задачу 'bar(..)'
}

function oopsBar() {
    // в 'foo(..)' возникли какие-то проблемы,
    // поэтому 'bar(..)' не запускается
}

// same for 'baz()' & 'oopsBaz()'
var p = foo(42);

p.then(bar, oopsBar);
p.then(baz, oopsBaz);

// --- planning promises -------------------
var p3 = new Promise(function (resolve, reject) {
    resolve('B');
});

var p1 = new Promise(function (resolve, reject) {
    resolve(p3);
});

var p2 = new Promise(function (resolve, reject) {
    resolve('A');
});

p1.then(function (v) {
    console.log(v);
});

p2.then(function (v) {
    console.log(v);
});
// A -> B but not B -> A

// --- pattern time out ---
function timeoutPromise(delay) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            reject('Timeout!');
        }, delay);
    });
}

// --- setting up a timeout for foo() ---
Promise.race([foo(), timeoutPromise(3000)]).then(
    function () {
        // 'foo()' was completed on time
    },
    function (err) {
        // 'foo()' либо столкнулась с отказом, либо
        // просто не завершилась вовремя; проанализировать
        // 'err' для определения причины
    }
);

// --- error absorption ------------------------
// --- example-1 ---
var p = new Promise(function (resolve, reject) {
    foo.bar(); // 'foo' undefined, error!
    resolve(42); // в эту точку управление не передается :(
});

p.then(
    function fulfilled() {
        // в эту точку управление не передается :(
    },
    function rejected(err) {
        // здесь 'err' будет объектом исключения
        // 'TypeError' из строки 'foo.bar()'
    }
);

// --- example-2 ---
var p = new Promise(function (resolve, reject) {
    resolve(42);
});

p.then(
    function fulfilled(msg) {
        foo.bar();
        console.log(msg); // в эту точку управление
        // не передается :(
    },
    function rejected(err) {
        // и сюда тоже :(
    }
);

// --- clutch -------------------------
var p = Promise.resolve(21);

// --- variant 1 ---------------
var p2 = p.then(function (v) {
    console.log(v); // 21

    // выполнение 'p2' со значением '42'
    return v * 2;
});

// clutch 'p2'
p2.then(function (v) {
    console.log(v); // 42
});

// --- variant 2 ----------------
p.then(function (v) {
    console.log(v); // 21

    // выполнение сцепленного обещания со значение '42'
    return v * 2;
})
    // сцепленное обещание
    .then(function (v) {
        console.log(v); // 42
    });

// --- variant 3 --------------
p.then(function (v) {
    console.log(v); // 21

    // create a promise and return it
    return new Promise(function (resolve, reject) {
        // execute with value 42
        resolve(v * 2);
    });
}).then(function (v) {
    console.log(v); // 42
});

// --- variant 4 with timeout ---
p.then(function (v) {
    console.log(v); // 21

    // create a promise and return it
    return new Promise(function (resolve, reject) {
        // introduce asynchrony!
        setTimeout(function () {
            // execute with value 42
            resolve(v * 2);
        }, 100);
    });
}).then(function (v) {
    // executed after 100-millisecond
    // delay in the previous step
    console.log(v); // 42
});

// --- creating a deferred promise ---
function delay(time) {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, time);
    });
}

delay(100) // step 1
    .then(function step2() {
        console.log('step 2 (after 100ms)');
        return delay(200);
    })
    .then(function step3() {
        console.log('step 3 (after another 200ms)');
    })
    .then(function step4() {
        console.log('step 4 (next Job)');
        return delay(50);
    })
    .then(function step5() {
        console.log('step 5 (after another 50ms)');
    });

// --- for example - create Ajax request ---
// предполагает существование
// функции 'ajax({url}, {callback})'

// ajax с поддержкой обещаний
function request(url) {
    return new Promise(function (resolve, reject) {
        // обратный вызов 'ajax(..)' должен быть
        // функцией 'resolve(..)' нашего обещания
        ajax(url, resolve);
    });
}

request('http://some.url.1')
    .then(function (response1) {
        return request('http://some.url.2/?v=' + response1);
    })
    .then(function (response2) {
        console.log(response2);
    });

// --- error interception ---
// step 1
request('http://some.url.1')
    // step 2
    .then(function (response1) {
        foo.bar(); // undefined, error!

        // сюда управление не передается
        return request('http://some.url.2/?v=' + response1);
    })

    // step 3
    .then(
        function fulfilled(response2) {
            // сюда управление не передается
        },
        // обработчик отказа для перехвата ошибки
        function rejected(err) {
            console.log(err);
            // error 'TypeError' from 'foo.bar()'
            return 42;
        }
    )

    // step 4
    .then(function (msg) {
        console.log(msg); // 42
    });

// --- error handling (обработка ошибок) ---
// --- 1 with callback ---
function foo(cb) {
    setTimeout(function () {
        try {
            var x = bar.baz();
            cb(null, x); // success!
        } catch (err) {
            cb(err);
        }
    }, 100);
}

foo(function (err, val) {
    if (err) {
        console.error(err); // failure :(
    } else {
        console.log(val);
    }
});

// callbacks splitting (расщепление обратных вызовов) ---
var p = Promise.reject('Oops');

p.then(
    function fulfilled() {
        // сюда управление не передается
    },
    function rejected(err) {
        console.log(err); // 'Oops
    }
);

// --- бездна успеха ------------------
var p = Promise.reject('Oops').defer();

// 'foo(..)' with support promises
foo(42).then(
    function fulfilled() {
        return p;
    },
    function rejected(err) {
        // handle error 'foo(..)'
    }
);

// 'request(..)' - функция Ajax с поддержкой обещаний
// вроде той, что мы определили ранее в той главе
var p1 = request('http://some.url.1/');
var p2 = request('http://some.url.2/');

// --- promise all ---
Promise.all([p1, p2])
    .then(function (msgs) {
        // обе переменные 'p1' & 'p2' выполняются
        // и передают свои сообщения
        return request('http://some.url.3/?v=' + msgs.join(','));
    })
    .then(function (msg) {
        console.log(msg);
    });

// --- promise race ---
Promise.race([p1, p2])
    .then(function (msg) {
        // 'p1' or 'p2' the win of race
        return request('http://some.url.3/?v=' + msg);
    })
    .then(function (msg) {
        console.log(msg);
    });

// --- constructor new Promise -----
var p = new Promise(function (resolve, reject) {
    // 'resolve(..)' for executing promise
    // 'reject(..)' for refusal (отказа)
});

// promise.resolve() & promise.reject() ---
var fulfilledTh = {
    then: function (cb) {
        cb(42);
    },
};

var rejectedTh = {
    then: function (cb, errCb) {
        errCb('Oops');
    },
};

var p1 = Promise.resolve(fulfilledTh);
var p2 = Promise.reject(rejectedTh);
// 'p1' will be fulfilled promise
// 'p2' will be rejected promise

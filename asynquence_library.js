ASQ(
    // step 1
    function (done) {
        setTimeout(function () {
            done('Hello');
        }, 100);
    },
    // step 2
    function (done, greeting) {
        setTimeout(function () {
            done(greeting + 'World');
        }, 100);
    }
)
    // step 3
    .then(function (done, msg) {
        setTimeout(function () {
            done(msg.toUpperCase());
        }, 100);
    })
    // step 4
    .then(function (done, msg) {
        console.log(msg); // HELLO WORLD
    });

// --- example-2 ------------------
// step 1 (async)
ASQ(function (done) {
    done('Hello'); // manual sync
})
    // step 2 (sync)
    .val(function (greeting) {
        return greeting + ' World';
    })
    .then(function (done, msg) {
        setTimeout(function () {
            done(msg.toUpperCase());
        }, 100);
    })
    .val(function (msg) {
        console.log(msg);
    });

// --- errors -------------------------
// --- example-1 ---
var sq = ASQ(function (done) {
    setTimeout(function () {
        done.fail('Oops');
    }, 100);
})
    .then(function (done) {
        // control isn't transferred to here
        // управление сюда не передается
    })
    .or(function (err) {
        console.log(err); // Oops
    })
    .then(function (done) {
        // сюда тоже не передается
    });
// later
sq.or(function (err) {
    console.log(err); // Oops
});

// --- example-2 ---
var sq1 = ASQ(function (done) {
    doesnt.Exist(); // выдаст исключение в консоль
});

var sq2 = ASQ(function (done) {
    doesnt.Exist(); // выдаст только
    // ошибку последовательности
});
// вывести из режима уведомлений об ошибках .defer()
setTimeout(function () {
    sq1.or(function (err) {
        console.log(err); // ReferenceError
    });
    sq2.or(function (err) {
        console.log(err); // ReferenceError
    });
}, 100);

// ReferenceError (from sq1)

// --- example-3 ---
ASQ(function (done) {
    setTimeout(done, 100);
})
    .gate(
        function (done) {
            setTimeout(function () {
                done('Hello');
            }, 100);
        },
        function (done) {
            setTimeout(function () {
                done('World', '!');
            }, 100);
        }
    )

    .val(function (msg1, msg2) {
        console.log(msg1); // Hello
        console.log(msg2); // ['World', '!']
    });

// - this example based on promises -
new Promise(function (resolve, reject) {
    setTimeout(resolve, 100);
})
    .then(function () {
        return Promise.all([
            new Promise(function (resolve, reject) {
                setTimeout(function () {
                    return resolve('Hello');
                }, 100);
            }),
            new Promise(function (resolve, reject) {
                setTimeout(function () {
                    return resolve(['World', '!']);
                }, 100);
            }),
        ]);
    })
    .then(function (msgs) {
        console.log(msgs[0]); // Hello
        console.log(msgs[1]); // ['World','!']
    });

// --- types of steps -----------------------
function success1(done) {
    setTimeout(function () {
        done(1);
    }, 100);
}

function success2(done) {
    setTimeout(function () {
        done(2);
    }, 100);
}

function failure3(done) {
    setTimeout(function () {
        done.fail(3);
    }, 100);
}

function output(msg) {
    console.log(msg);
}

// теперь продемонстрируем разновидности шагов gate(..)
ASQ().race(failure3, success1).or(output); // 3

ASQ()
    .any(success1, failure3, success2)
    .val(function () {
        var args = [].slice.call(arguments);
        console.log(
            args // [1,undefined, 2]
        );
    });

ASQ().first(failure3, success1, success2).val(output); // 1

ASQ().last(failure3, success1, success2).val(output); // 2

ASQ()
    .none(failure3)
    .val(output) // 3
    .none(failure3, success1)
    .or(output); // 1

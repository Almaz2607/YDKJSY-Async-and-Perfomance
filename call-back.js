// --- nested / chained callbacks ---
listen('click', function handler(evt) {
    setTimeout(function request() {
        ajax('http://some.url.1', function response(text) {
            if (text == 'hello') {
                handler();
            } else if (text == 'world') {
                request();
            }
        });
    }, 500);
});

// --- without nested callbacks ---
listen('click', handler);

function handler() {
    setTimeout(request, 500);
}

function request() {
    ajax('http://some.url.1', response);
}

function response(text) {
    if (text == 'hello') {
        handler();
    } else if (text == 'world') {
        request();
    }
}

// --- trust issues ---
function sum(x, y) {
    x = Number(x);
    y = Number(y);

    return x + y;
}

console.log(sum(11, 21)); // 32
console.log(sum(11, '21')); // 32

// --- callback splitting ---
function success(data) {
    console.logd(data);
}

function failure(data) {
    console.error(data);
}

ajax('http://some.url.1', success, failure);

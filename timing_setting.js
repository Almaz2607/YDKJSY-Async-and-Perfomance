function factorial1(n) {
    if (n < 2) return 1;

    return n * factorial1(n - 1);
}

console.log(factorial1(5)); // 120

function fact(n) {
    if (n < 2) return 1;

    var res = 1;
    for (var i = n; i > 1; i--) {
        res = res * i;
    }

    return res;
}

console.log(fact(5)); // 120

// - TCO (оптимизация хвостовых вызовов) -
// --- example-1 ---
function foo(x) {
    return x;
}

function bar(y) {
    return foo(y + 1); // tail call
}

function baz() {
    return 1 + bar(40); // not a tail call
}

console.log(baz()); // 42

// --- example-2 ---
function factorial(n) {
    function fact(n, res) {
        if (n < 2) return res;

        return fact(n - 1, n * res);
    }

    return fact(n, 1);
}

console.log(factorial(3)); // 6

function f(x) {
    return x * 5;
}

function s(x: number) {
    return f(f(f(x)));
}

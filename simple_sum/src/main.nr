fn main(x: Field, y: pub Field) {
    let z = x + y;
    assert(z == 8);
}

#[test]
fn test_main() {
    main(3, 5);

    // Uncomment to make test fail
    // main(1, 1);
}

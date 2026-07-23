fn main() {
    napi_build::setup();
    println!(
        "cargo:rustc-env=MASTER_CSS_TARGET={}",
        std::env::var("TARGET").expect("Cargo provides TARGET")
    );
}

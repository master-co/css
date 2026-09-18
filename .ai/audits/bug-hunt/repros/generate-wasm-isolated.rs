fn main() {
    let args = std::env::args().collect::<Vec<_>>();
    assert_eq!(
        args.len(),
        3,
        "Usage: generate-wasm-isolated <input.wasm> <output-directory>"
    );
    let mut bindgen = wasm_bindgen_cli_support::Bindgen::new();
    bindgen
        .input_path(&args[1])
        .out_name("mastercss_binding_wasm_compiler")
        .typescript(true)
        .web(true)
        .expect("web target")
        .generate(&args[2])
        .expect("isolated compiler bindings");
}

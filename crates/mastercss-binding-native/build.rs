#[path = "windows_resource.rs"]
mod windows_resource;

fn main() {
    napi_build::setup();
    println!(
        "cargo:rustc-env=MASTER_CSS_TARGET={}",
        std::env::var("TARGET").expect("Cargo provides TARGET")
    );
    windows_resource::embed("Master CSS native binding for Node.js", "mastercss.node");
}

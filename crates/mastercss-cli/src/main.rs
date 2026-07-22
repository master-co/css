#![forbid(unsafe_code)]

use mastercss_engine::EngineSession;
use serde::Serialize;
use std::env;
use std::process::ExitCode;

const BINDING_ABI_VERSION: u32 = 1;
const SELF_TEST_MANIFEST: &str = r#"{
  "version":1,
  "utilities":[{
    "id":"display-block",
    "name":"block",
    "type":-2,
    "emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},
    "matchers":[{"type":"static","name":"block"}]
  }]
}"#;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BinaryInfo<'a> {
    binding_abi_version: u32,
    package_version: &'a str,
    manifest_version: u32,
    hydration_manifest_version: u32,
    target: &'a str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SelfTest<'a> {
    version: u32,
    binary: BinaryInfo<'a>,
    css: String,
}

fn binary_info() -> BinaryInfo<'static> {
    BinaryInfo {
        binding_abi_version: BINDING_ABI_VERSION,
        package_version: env!("CARGO_PKG_VERSION"),
        manifest_version: mastercss_schema::MANIFEST_VERSION,
        hydration_manifest_version: mastercss_schema::HYDRATION_MANIFEST_VERSION,
        target: env!("MASTER_CSS_TARGET"),
    }
}

fn print_json(value: &impl Serialize) -> Result<(), String> {
    println!(
        "{}",
        serde_json::to_string(value).map_err(|error| error.to_string())?
    );
    Ok(())
}

fn self_test() -> Result<(), String> {
    let mut engine =
        EngineSession::create(SELF_TEST_MANIFEST).map_err(|error| error.to_string())?;
    engine
        .ensure_class_rules(["block"])
        .map_err(|error| error.to_string())?;
    let css = engine.css_text();
    if css != "@layer utilities{.block{display:block}}" {
        return Err(format!("Unexpected self-test CSS: {css}"));
    }
    print_json(&SelfTest {
        version: 1,
        binary: binary_info(),
        css,
    })
}

fn print_help() {
    println!(
        "mcss {}\n\nUsage: mcss [OPTIONS] [source paths...]\n\nMigration diagnostics:\n  --binding-info  Print native ABI and schema versions\n  --self-test     Run an engine/load smoke test\n  -V, --version   Print version\n  -h, --help      Print help",
        env!("CARGO_PKG_VERSION")
    );
}

fn run() -> Result<(), String> {
    let args = env::args().skip(1).collect::<Vec<_>>();
    match args.as_slice() {
        [] => {
            print_help();
            Ok(())
        }
        [flag] if flag == "--help" || flag == "-h" => {
            print_help();
            Ok(())
        }
        [flag] if flag == "--version" || flag == "-V" => {
            println!("mcss {}", env!("CARGO_PKG_VERSION"));
            Ok(())
        }
        [flag] if flag == "--binding-info" => print_json(&binary_info()),
        [flag] if flag == "--self-test" => self_test(),
        _ => Err(
            "Native CLI command parity is not complete. Use the @master/css-cli Node host during migration."
                .into(),
        ),
    }
}

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(message) => {
            eprintln!(
                "{}",
                serde_json::json!({
                    "code": "CLI_COMMAND_UNAVAILABLE",
                    "message": message
                })
            );
            ExitCode::from(2)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn self_test_engine_contract_is_stable() {
        let mut engine = EngineSession::create(SELF_TEST_MANIFEST).unwrap();
        engine.ensure_class_rules(["block"]).unwrap();
        assert_eq!(engine.css_text(), "@layer utilities{.block{display:block}}");
    }
}

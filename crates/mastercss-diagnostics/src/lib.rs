#![forbid(unsafe_code)]

use mastercss_schema::{DIAGNOSTICS_REPORT_VERSION, Diagnostic, ErrorCode};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::{HashMap, HashSet};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DiagnosticsError {
    #[error("invalid diagnostics report input: {0}")]
    InvalidInput(#[from] serde_json::Error),
    #[error("unsupported diagnostics report input version {0}")]
    UnsupportedVersion(u32),
}

impl DiagnosticsError {
    pub fn diagnostic(&self) -> Diagnostic {
        Diagnostic {
            code: ErrorCode::InvalidInput,
            message: self.to_string(),
            source: None,
            range: None,
            notes: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticsReportInput {
    pub version: u32,
    pub cwd: String,
    pub patterns: Vec<String>,
    pub files: Vec<SourceInspection>,
    pub classes: Vec<String>,
    pub scanner: ScannerInspectionInput,
    pub stylesheets: StylesheetInspectionInput,
    pub css: CssInspectionInput,
    #[serde(default)]
    pub first_source_by_class: HashMap<String, String>,
    #[serde(default)]
    pub fatal_error: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerInspectionInput {
    #[serde(default)]
    pub latent: Vec<String>,
    #[serde(default)]
    pub valid: Vec<String>,
    #[serde(default)]
    pub invalid: Vec<String>,
    #[serde(default)]
    pub native: Vec<String>,
    #[serde(default)]
    pub used_native: Vec<String>,
    #[serde(default)]
    pub safelist: Vec<String>,
    #[serde(default)]
    pub blocklist: Vec<String>,
    #[serde(default)]
    pub blocked_classes: Vec<String>,
    #[serde(default)]
    pub safelist_count: usize,
    #[serde(default)]
    pub blocklist_count: usize,
    #[serde(default)]
    pub reset_dependencies: Vec<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StylesheetInspectionInput {
    #[serde(default)]
    pub entries: Vec<StylesheetInspection>,
    #[serde(default)]
    pub warnings: Vec<String>,
    #[serde(default)]
    pub errors: Vec<StylesheetError>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssInspectionInput {
    #[serde(default)]
    pub text: String,
    #[serde(default)]
    pub included: bool,
    #[serde(default)]
    pub variables: Vec<String>,
    #[serde(default)]
    pub animations: Vec<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredClasses {
    #[serde(default)]
    pub latent: Vec<String>,
    #[serde(default)]
    pub valid: Vec<String>,
    #[serde(default)]
    pub invalid: Vec<String>,
    #[serde(default)]
    pub used_native: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceInspection {
    pub file_path: String,
    pub source: String,
    pub scanned: bool,
    pub changed: bool,
    pub discovered: DiscoveredClasses,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StylesheetInspection {
    pub file_path: String,
    #[serde(rename = "masterCSS")]
    pub master_css: bool,
    #[serde(rename = "pruneNativeCSS")]
    pub prune_native_css: bool,
    #[serde(default)]
    pub dependencies: Vec<String>,
    #[serde(default)]
    pub source_dependencies: Vec<String>,
    #[serde(default)]
    pub warnings: Vec<String>,
    #[serde(default)]
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StylesheetError {
    pub file_path: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectionDiagnostic {
    pub code: String,
    pub severity: String,
    pub message: String,
    pub source: String,
    pub source_kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MissingCssResult {
    pub class_name: String,
    pub status: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectionReport {
    pub version: u32,
    pub cwd: String,
    pub inputs: Value,
    pub scanner: Value,
    pub stylesheets: Value,
    pub css: Value,
    #[serde(rename = "missingCSS")]
    pub missing_css: Value,
    pub files: Vec<SourceInspection>,
    pub diagnostics: Vec<InspectionDiagnostic>,
    pub summary: Value,
}

pub fn create_inspection_report_json(source: &str) -> Result<String, DiagnosticsError> {
    let input = serde_json::from_str::<DiagnosticsReportInput>(source)?;
    serde_json::to_string(&create_inspection_report(input)?).map_err(DiagnosticsError::InvalidInput)
}

pub fn create_inspection_report(
    mut input: DiagnosticsReportInput,
) -> Result<InspectionReport, DiagnosticsError> {
    if input.version != DIAGNOSTICS_REPORT_VERSION {
        return Err(DiagnosticsError::UnsupportedVersion(input.version));
    }

    for file in &mut input.files {
        file.discovered.latent = sorted_values(&file.discovered.latent);
        file.discovered.valid = sorted_values(&file.discovered.valid);
        file.discovered.invalid = sorted_values(&file.discovered.invalid);
        file.discovered.used_native = sorted_values(&file.discovered.used_native);
    }
    for entry in &mut input.stylesheets.entries {
        entry.dependencies = sorted_values(&entry.dependencies);
        entry.source_dependencies = sorted_values(&entry.source_dependencies);
    }

    let latent = sorted_values(&input.scanner.latent);
    let valid = sorted_values(&input.scanner.valid);
    let invalid = sorted_values(&input.scanner.invalid);
    let native = sorted_values(&input.scanner.native);
    let used_native = sorted_values(&input.scanner.used_native);
    let safelist = sorted_values(&input.scanner.safelist);
    let blocklist = input.scanner.blocklist.clone();
    let reset_dependencies = sorted_values(&input.scanner.reset_dependencies);
    let valid_set = value_set(&valid);
    let invalid_set = value_set(&invalid);
    let used_native_set = value_set(&used_native);
    let safelist_set = value_set(&safelist);
    let blocked_set = value_set(&input.scanner.blocked_classes);

    let missing_results = input
        .classes
        .iter()
        .map(|class_name| {
            classify_missing_css(
                class_name,
                &valid_set,
                &used_native_set,
                &safelist_set,
                &invalid_set,
                &blocked_set,
            )
        })
        .collect::<Vec<_>>();
    let present = missing_results
        .iter()
        .filter(|result| result.status == "present")
        .cloned()
        .collect::<Vec<_>>();
    let missing = missing_results
        .iter()
        .filter(|result| result.status == "missing")
        .cloned()
        .collect::<Vec<_>>();

    let mut diagnostics = Vec::new();
    if let Some(message) = input.fatal_error {
        diagnostics.push(InspectionDiagnostic {
            code: "scanner-error".into(),
            severity: "error".into(),
            message,
            source: "Master CSS".into(),
            source_kind: "scanner".into(),
            file_path: None,
            data: Some(json!({ "cwd": input.cwd })),
        });
    } else {
        for entry in &input.stylesheets.entries {
            for warning in &entry.warnings {
                diagnostics.push(InspectionDiagnostic {
                    code: "stylesheet-warning".into(),
                    severity: "warning".into(),
                    message: warning.clone(),
                    source: "Master CSS".into(),
                    source_kind: "stylesheet".into(),
                    file_path: Some(entry.file_path.clone()),
                    data: None,
                });
            }
        }
        for error in &input.stylesheets.errors {
            diagnostics.push(InspectionDiagnostic {
                code: "stylesheet-error".into(),
                severity: "error".into(),
                message: error.message.clone(),
                source: "Master CSS".into(),
                source_kind: "stylesheet".into(),
                file_path: Some(error.file_path.clone()),
                data: None,
            });
        }
        for class_name in &invalid {
            diagnostics.push(InspectionDiagnostic {
                code: "invalid-scanner-class".into(),
                severity: "warning".into(),
                message: format!(
                    "Scanner candidate \"{class_name}\" did not generate Master CSS rules."
                ),
                source: "Master CSS".into(),
                source_kind: "scanner".into(),
                file_path: input.first_source_by_class.get(class_name).cloned(),
                data: Some(json!({ "className": class_name })),
            });
        }
        for result in &missing {
            diagnostics.push(InspectionDiagnostic {
                code: "missing-css".into(),
                severity: "error".into(),
                message: format!(
                    "No generated CSS found for \"{}\" ({}).",
                    result.class_name, result.reason
                ),
                source: "Master CSS".into(),
                source_kind: "missing-css".into(),
                file_path: None,
                data: Some(serde_json::to_value(result).expect("missing CSS result serializes")),
            });
        }
    }

    let scanner_counts = json!({
        "latent": latent.len(),
        "valid": valid.len(),
        "invalid": invalid.len(),
        "native": native.len(),
        "usedNative": used_native.len(),
        "safelist": input.scanner.safelist_count,
        "blocklist": input.scanner.blocklist_count
    });
    let stylesheet_warnings = sorted_values(&input.stylesheets.warnings);
    let stylesheet_dependencies = sorted_values(
        &input
            .stylesheets
            .entries
            .iter()
            .flat_map(|entry| entry.dependencies.iter().cloned())
            .collect::<Vec<_>>(),
    );
    let css_bytes = input.css.text.encode_utf16().count();
    let error_count = diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.severity == "error")
        .count();
    let warning_count = diagnostics.len() - error_count;
    let file_count = input.files.len();
    let stylesheet_count = input.stylesheets.entries.len();
    let css = if input.css.included {
        json!({
            "bytes": css_bytes,
            "included": true,
            "text": input.css.text,
            "emittedGlobals": {
                "variables": value_set(&input.css.variables).len(),
                "animations": value_set(&input.css.animations).len()
            }
        })
    } else {
        json!({
            "bytes": css_bytes,
            "included": false,
            "emittedGlobals": {
                "variables": value_set(&input.css.variables).len(),
                "animations": value_set(&input.css.animations).len()
            }
        })
    };

    Ok(InspectionReport {
        version: DIAGNOSTICS_REPORT_VERSION,
        cwd: input.cwd,
        inputs: json!({
            "patterns": input.patterns,
            "files": input.files.iter().map(|file| &file.file_path).collect::<Vec<_>>(),
            "classes": input.classes
        }),
        scanner: json!({
            "counts": scanner_counts,
            "classes": {
                "latent": latent,
                "valid": valid,
                "invalid": invalid,
                "native": native,
                "usedNative": used_native,
                "safelist": safelist,
                "blocklist": blocklist
            },
            "resetDependencies": reset_dependencies
        }),
        stylesheets: json!({
            "entries": input.stylesheets.entries,
            "dependencies": stylesheet_dependencies,
            "warnings": stylesheet_warnings,
            "errors": input.stylesheets.errors
        }),
        css,
        missing_css: json!({
            "checked": input.classes,
            "present": present,
            "missing": missing
        }),
        files: input.files,
        summary: json!({
            "files": file_count,
            "stylesheets": stylesheet_count,
            "diagnostics": diagnostics.len(),
            "errors": error_count,
            "warnings": warning_count,
            "missingCSS": missing.len(),
            "invalidClasses": invalid_set.len()
        }),
        diagnostics,
    })
}

fn sorted_values(values: &[String]) -> Vec<String> {
    let mut values = values
        .iter()
        .cloned()
        .collect::<HashSet<_>>()
        .into_iter()
        .collect::<Vec<_>>();
    values.sort();
    values
}

fn value_set(values: &[String]) -> HashSet<&str> {
    values.iter().map(String::as_str).collect()
}

fn classify_missing_css(
    class_name: &str,
    valid: &HashSet<&str>,
    used_native: &HashSet<&str>,
    safelist: &HashSet<&str>,
    invalid: &HashSet<&str>,
    blocked: &HashSet<&str>,
) -> MissingCssResult {
    let (status, reason) = if valid.contains(class_name) {
        ("present", "generated")
    } else if used_native.contains(class_name) {
        ("present", "native-css")
    } else if safelist.contains(class_name) {
        ("present", "safelist")
    } else if invalid.contains(class_name) {
        ("missing", "invalid")
    } else if blocked.contains(class_name) {
        ("missing", "blocklisted")
    } else {
        ("missing", "not-detected")
    };
    MissingCssResult {
        class_name: class_name.to_owned(),
        status: status.into(),
        reason: reason.into(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input() -> DiagnosticsReportInput {
        DiagnosticsReportInput {
            version: 1,
            cwd: "/project".into(),
            patterns: vec!["index.html".into()],
            files: vec![SourceInspection {
                file_path: "/project/index.html".into(),
                source: "index.html".into(),
                scanned: true,
                changed: true,
                discovered: DiscoveredClasses {
                    valid: vec!["block".into()],
                    invalid: vec!["bad".into()],
                    ..Default::default()
                },
            }],
            classes: vec!["block".into(), "missing".into()],
            scanner: ScannerInspectionInput {
                valid: vec!["block".into()],
                invalid: vec!["bad".into()],
                ..Default::default()
            },
            stylesheets: StylesheetInspectionInput::default(),
            css: CssInspectionInput {
                text: "😀".into(),
                ..Default::default()
            },
            first_source_by_class: HashMap::from([("bad".into(), "/project/index.html".into())]),
            fatal_error: None,
        }
    }

    #[test]
    fn composes_stable_reports_and_utf16_css_sizes() {
        let report = create_inspection_report(input()).unwrap();
        assert_eq!(report.version, 1);
        assert_eq!(report.css["bytes"], 2);
        assert_eq!(report.summary["errors"], 1);
        assert_eq!(report.summary["warnings"], 1);
        assert_eq!(
            report.diagnostics[0].file_path.as_deref(),
            Some("/project/index.html")
        );
        assert_eq!(report.missing_css["missing"][0]["reason"], "not-detected");
    }

    #[test]
    fn classifies_missing_css_in_observable_precedence_order() {
        let mut input = input();
        input.classes = vec!["all".into()];
        input.scanner.valid = vec!["all".into()];
        input.scanner.used_native = vec!["all".into()];
        input.scanner.safelist = vec!["all".into()];
        input.scanner.invalid = vec!["all".into()];
        input.scanner.blocked_classes = vec!["all".into()];
        let report = create_inspection_report(input).unwrap();
        assert_eq!(report.missing_css["present"][0]["reason"], "generated");
    }

    #[test]
    fn creates_empty_scanner_error_reports() {
        let mut input = input();
        input.files.clear();
        input.scanner = ScannerInspectionInput::default();
        input.stylesheets = StylesheetInspectionInput::default();
        input.css = CssInspectionInput::default();
        input.fatal_error = Some("boom".into());
        let report = create_inspection_report(input).unwrap();
        assert_eq!(report.diagnostics[0].code, "scanner-error");
        assert_eq!(report.summary["errors"], 1);
    }

    #[test]
    fn reports_version_mismatches_as_structured_invalid_input() {
        let mut input = input();
        input.version = 2;
        let error = create_inspection_report(input).unwrap_err();
        assert_eq!(error.diagnostic().code, ErrorCode::InvalidInput);
    }
}

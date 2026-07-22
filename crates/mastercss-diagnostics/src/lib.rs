#![forbid(unsafe_code)]

use mastercss_schema::{
    CssDirectiveBlocklistEntry, DIAGNOSTICS_REPORT_VERSION, Diagnostic, ErrorCode,
    is_css_class_blocklisted,
};
use serde::{Deserialize, Serialize};
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
    pub blocklist: Vec<CssDirectiveBlocklistEntry>,
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
    pub code: InspectionDiagnosticCode,
    pub severity: InspectionDiagnosticSeverity,
    pub message: String,
    pub source: String,
    pub source_kind: InspectionDiagnosticSourceKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<InspectionDiagnosticData>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum InspectionDiagnosticCode {
    InvalidScannerClass,
    MissingCss,
    StylesheetError,
    StylesheetWarning,
    ScannerError,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum InspectionDiagnosticSeverity {
    Error,
    Warning,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum InspectionDiagnosticSourceKind {
    Scanner,
    Stylesheet,
    MissingCss,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum InspectionDiagnosticData {
    Cwd {
        cwd: String,
    },
    ClassName {
        #[serde(rename = "className")]
        class_name: String,
    },
    MissingCss(MissingCssResult),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MissingCssStatus {
    Present,
    Missing,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum MissingCssReason {
    Generated,
    NativeCss,
    Safelist,
    Invalid,
    Blocklisted,
    NotDetected,
}

impl MissingCssReason {
    const fn as_str(self) -> &'static str {
        match self {
            Self::Generated => "generated",
            Self::NativeCss => "native-css",
            Self::Safelist => "safelist",
            Self::Invalid => "invalid",
            Self::Blocklisted => "blocklisted",
            Self::NotDetected => "not-detected",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MissingCssResult {
    pub class_name: String,
    pub status: MissingCssStatus,
    pub reason: MissingCssReason,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectionInputs {
    pub patterns: Vec<String>,
    pub files: Vec<String>,
    pub classes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerCounts {
    pub latent: usize,
    pub valid: usize,
    pub invalid: usize,
    pub native: usize,
    pub used_native: usize,
    pub safelist: usize,
    pub blocklist: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerClasses {
    pub latent: Vec<String>,
    pub valid: Vec<String>,
    pub invalid: Vec<String>,
    pub native: Vec<String>,
    pub used_native: Vec<String>,
    pub safelist: Vec<String>,
    pub blocklist: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannerInspectionReport {
    pub counts: ScannerCounts,
    pub classes: ScannerClasses,
    pub reset_dependencies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StylesheetInspectionReport {
    pub entries: Vec<StylesheetInspection>,
    pub dependencies: Vec<String>,
    pub warnings: Vec<String>,
    pub errors: Vec<StylesheetError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssEmittedGlobalsReport {
    pub variables: usize,
    pub animations: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssInspectionReport {
    pub bytes: usize,
    pub included: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    pub emitted_globals: CssEmittedGlobalsReport,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MissingCssInspectionReport {
    pub checked: Vec<String>,
    pub present: Vec<MissingCssResult>,
    pub missing: Vec<MissingCssResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectionSummary {
    pub files: usize,
    pub stylesheets: usize,
    pub diagnostics: usize,
    pub errors: usize,
    pub warnings: usize,
    #[serde(rename = "missingCSS")]
    pub missing_css: usize,
    pub invalid_classes: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InspectionReport {
    pub version: u32,
    pub cwd: String,
    pub inputs: InspectionInputs,
    pub scanner: ScannerInspectionReport,
    pub stylesheets: StylesheetInspectionReport,
    pub css: CssInspectionReport,
    #[serde(rename = "missingCSS")]
    pub missing_css: MissingCssInspectionReport,
    pub files: Vec<SourceInspection>,
    pub diagnostics: Vec<InspectionDiagnostic>,
    pub summary: InspectionSummary,
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
    let blocklist = input
        .scanner
        .blocklist
        .iter()
        .map(format_blocklist_entry)
        .collect::<Vec<_>>();
    let reset_dependencies = sorted_values(&input.scanner.reset_dependencies);
    let valid_set = value_set(&valid);
    let invalid_set = value_set(&invalid);
    let used_native_set = value_set(&used_native);
    let safelist_set = value_set(&safelist);

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
                &input.scanner.blocklist,
            )
        })
        .collect::<Vec<_>>();
    let present = missing_results
        .iter()
        .filter(|result| result.status == MissingCssStatus::Present)
        .cloned()
        .collect::<Vec<_>>();
    let missing = missing_results
        .iter()
        .filter(|result| result.status == MissingCssStatus::Missing)
        .cloned()
        .collect::<Vec<_>>();

    let mut diagnostics = Vec::new();
    if let Some(message) = input.fatal_error {
        diagnostics.push(InspectionDiagnostic {
            code: InspectionDiagnosticCode::ScannerError,
            severity: InspectionDiagnosticSeverity::Error,
            message,
            source: "Master CSS".into(),
            source_kind: InspectionDiagnosticSourceKind::Scanner,
            file_path: None,
            data: Some(InspectionDiagnosticData::Cwd {
                cwd: input.cwd.clone(),
            }),
        });
    } else {
        for entry in &input.stylesheets.entries {
            for warning in &entry.warnings {
                diagnostics.push(InspectionDiagnostic {
                    code: InspectionDiagnosticCode::StylesheetWarning,
                    severity: InspectionDiagnosticSeverity::Warning,
                    message: warning.clone(),
                    source: "Master CSS".into(),
                    source_kind: InspectionDiagnosticSourceKind::Stylesheet,
                    file_path: Some(entry.file_path.clone()),
                    data: None,
                });
            }
        }
        for error in &input.stylesheets.errors {
            diagnostics.push(InspectionDiagnostic {
                code: InspectionDiagnosticCode::StylesheetError,
                severity: InspectionDiagnosticSeverity::Error,
                message: error.message.clone(),
                source: "Master CSS".into(),
                source_kind: InspectionDiagnosticSourceKind::Stylesheet,
                file_path: Some(error.file_path.clone()),
                data: None,
            });
        }
        for class_name in &invalid {
            diagnostics.push(InspectionDiagnostic {
                code: InspectionDiagnosticCode::InvalidScannerClass,
                severity: InspectionDiagnosticSeverity::Warning,
                message: format!(
                    "Scanner candidate \"{class_name}\" did not generate Master CSS rules."
                ),
                source: "Master CSS".into(),
                source_kind: InspectionDiagnosticSourceKind::Scanner,
                file_path: input.first_source_by_class.get(class_name).cloned(),
                data: Some(InspectionDiagnosticData::ClassName {
                    class_name: class_name.clone(),
                }),
            });
        }
        for result in &missing {
            diagnostics.push(InspectionDiagnostic {
                code: InspectionDiagnosticCode::MissingCss,
                severity: InspectionDiagnosticSeverity::Error,
                message: format!(
                    "No generated CSS found for \"{}\" ({}).",
                    result.class_name,
                    result.reason.as_str()
                ),
                source: "Master CSS".into(),
                source_kind: InspectionDiagnosticSourceKind::MissingCss,
                file_path: None,
                data: Some(InspectionDiagnosticData::MissingCss(result.clone())),
            });
        }
    }

    let scanner_counts = ScannerCounts {
        latent: latent.len(),
        valid: valid.len(),
        invalid: invalid.len(),
        native: native.len(),
        used_native: used_native.len(),
        safelist: safelist.len(),
        blocklist: blocklist.len(),
    };
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
        .filter(|diagnostic| diagnostic.severity == InspectionDiagnosticSeverity::Error)
        .count();
    let warning_count = diagnostics.len() - error_count;
    let file_count = input.files.len();
    let stylesheet_count = input.stylesheets.entries.len();
    let invalid_class_count = invalid_set.len();
    let css = CssInspectionReport {
        bytes: css_bytes,
        included: input.css.included,
        text: input.css.included.then_some(input.css.text),
        emitted_globals: CssEmittedGlobalsReport {
            variables: value_set(&input.css.variables).len(),
            animations: value_set(&input.css.animations).len(),
        },
    };

    Ok(InspectionReport {
        version: DIAGNOSTICS_REPORT_VERSION,
        cwd: input.cwd,
        inputs: InspectionInputs {
            patterns: input.patterns,
            files: input
                .files
                .iter()
                .map(|file| file.file_path.clone())
                .collect(),
            classes: input.classes.clone(),
        },
        scanner: ScannerInspectionReport {
            counts: scanner_counts,
            classes: ScannerClasses {
                latent,
                valid,
                invalid,
                native,
                used_native,
                safelist,
                blocklist,
            },
            reset_dependencies,
        },
        stylesheets: StylesheetInspectionReport {
            entries: input.stylesheets.entries,
            dependencies: stylesheet_dependencies,
            warnings: stylesheet_warnings,
            errors: input.stylesheets.errors,
        },
        css,
        missing_css: MissingCssInspectionReport {
            checked: input.classes,
            present,
            missing: missing.clone(),
        },
        files: input.files,
        summary: InspectionSummary {
            files: file_count,
            stylesheets: stylesheet_count,
            diagnostics: diagnostics.len(),
            errors: error_count,
            warnings: warning_count,
            missing_css: missing.len(),
            invalid_classes: invalid_class_count,
        },
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

fn format_blocklist_entry(entry: &CssDirectiveBlocklistEntry) -> String {
    match entry {
        CssDirectiveBlocklistEntry::Exact(value) => value.clone(),
        CssDirectiveBlocklistEntry::Pattern { source, flags } => {
            format!("/{source}/{flags}")
        }
    }
}

fn classify_missing_css(
    class_name: &str,
    valid: &HashSet<&str>,
    used_native: &HashSet<&str>,
    safelist: &HashSet<&str>,
    invalid: &HashSet<&str>,
    blocklist: &[CssDirectiveBlocklistEntry],
) -> MissingCssResult {
    let (status, reason) = if valid.contains(class_name) {
        (MissingCssStatus::Present, MissingCssReason::Generated)
    } else if used_native.contains(class_name) {
        (MissingCssStatus::Present, MissingCssReason::NativeCss)
    } else if safelist.contains(class_name) {
        (MissingCssStatus::Present, MissingCssReason::Safelist)
    } else if invalid.contains(class_name) {
        (MissingCssStatus::Missing, MissingCssReason::Invalid)
    } else if is_css_class_blocklisted(class_name, blocklist) {
        (MissingCssStatus::Missing, MissingCssReason::Blocklisted)
    } else {
        (MissingCssStatus::Missing, MissingCssReason::NotDetected)
    };
    MissingCssResult {
        class_name: class_name.to_owned(),
        status,
        reason,
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
        assert_eq!(report.css.bytes, 2);
        assert_eq!(report.summary.errors, 1);
        assert_eq!(report.summary.warnings, 1);
        assert_eq!(
            report.diagnostics[0].file_path.as_deref(),
            Some("/project/index.html")
        );
        assert_eq!(
            report.missing_css.missing[0].reason,
            MissingCssReason::NotDetected
        );
    }

    #[test]
    fn classifies_missing_css_in_observable_precedence_order() {
        let mut input = input();
        input.classes = vec!["all".into()];
        input.scanner.valid = vec!["all".into()];
        input.scanner.used_native = vec!["all".into()];
        input.scanner.safelist = vec!["all".into()];
        input.scanner.invalid = vec!["all".into()];
        input.scanner.blocklist = vec![CssDirectiveBlocklistEntry::Exact("all".into())];
        let report = create_inspection_report(input).unwrap();
        assert_eq!(
            report.missing_css.present[0].reason,
            MissingCssReason::Generated
        );
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
        assert_eq!(
            report.diagnostics[0].code,
            InspectionDiagnosticCode::ScannerError
        );
        assert_eq!(report.summary.errors, 1);
    }

    #[test]
    fn reports_version_mismatches_as_structured_invalid_input() {
        let mut input = input();
        input.version = 2;
        let error = create_inspection_report(input).unwrap_err();
        assert_eq!(error.diagnostic().code, ErrorCode::InvalidInput);
    }
}

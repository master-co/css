use super::*;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceRange {
    pub start: u32,
    pub end: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceLocation {
    pub line: u32,
    pub column: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceLocationRange {
    pub start: SourceLocation,
    pub end: SourceLocation,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDirectiveSourceReference {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    pub range: SourceRange,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loc: Option<SourceLocationRange>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDirectiveReferenceStatement {
    pub start: u32,
    pub end: u32,
    pub statement: String,
    pub source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum CssDirectiveConditionPathEntry {
    Condition { value: String },
    Variant { token: String },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(
    tag = "type",
    rename_all = "lowercase",
    rename_all_fields = "camelCase"
)]
pub enum CssDirectiveStyleDefinition {
    Native {
        order: u32,
        selector: String,
        declarations: Map<String, Value>,
        #[serde(skip_serializing_if = "Option::is_none")]
        source: Option<CssDirectiveSourceReference>,
        #[serde(skip_serializing_if = "Option::is_none")]
        selector_source: Option<CssDirectiveSourceReference>,
        #[serde(skip_serializing_if = "Option::is_none")]
        conditions: Option<Vec<String>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition_path: Option<Vec<CssDirectiveConditionPathEntry>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        layer: Option<UtilityLayerName>,
        #[serde(skip_serializing_if = "Option::is_none")]
        name: Option<String>,
    },
    Compose {
        order: u32,
        class_name: String,
        selector: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        source: Option<CssDirectiveSourceReference>,
        #[serde(skip_serializing_if = "Option::is_none")]
        directive_source: Option<CssDirectiveSourceReference>,
        #[serde(skip_serializing_if = "Option::is_none")]
        selector_source: Option<CssDirectiveSourceReference>,
        #[serde(skip_serializing_if = "Option::is_none")]
        conditions: Option<Vec<String>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        condition_path: Option<Vec<CssDirectiveConditionPathEntry>>,
        #[serde(skip_serializing_if = "Option::is_none")]
        layer: Option<UtilityLayerName>,
        #[serde(skip_serializing_if = "Option::is_none")]
        name: Option<String>,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    InvalidManifest,
    UnsupportedManifestVersion,
    InvalidHydrationManifest,
    NativeUnavailable,
    NativeLoadFailed,
    WasmLoadFailed,
    RuntimeStartupTimeout,
    CssParseError,
    CssPrintError,
    CssDirectiveError,
    #[serde(rename = "invalid-compose-class")]
    InvalidComposeClass,
    #[serde(rename = "compose-quoted-syntax")]
    ComposeQuotedSyntax,
    #[serde(rename = "compose-group-syntax")]
    ComposeGroupSyntax,
    CssImportError,
    SessionDisposed,
    InvalidInput,
    Internal,
}

impl ErrorCode {
    pub const ALL: [Self; 17] = [
        Self::InvalidManifest,
        Self::UnsupportedManifestVersion,
        Self::InvalidHydrationManifest,
        Self::NativeUnavailable,
        Self::NativeLoadFailed,
        Self::WasmLoadFailed,
        Self::RuntimeStartupTimeout,
        Self::CssParseError,
        Self::CssPrintError,
        Self::CssDirectiveError,
        Self::InvalidComposeClass,
        Self::ComposeQuotedSyntax,
        Self::ComposeGroupSyntax,
        Self::CssImportError,
        Self::SessionDisposed,
        Self::InvalidInput,
        Self::Internal,
    ];

    pub const fn as_wire_code(self) -> &'static str {
        match self {
            Self::InvalidManifest => "INVALID_MANIFEST",
            Self::UnsupportedManifestVersion => "UNSUPPORTED_MANIFEST_VERSION",
            Self::InvalidHydrationManifest => "INVALID_HYDRATION_MANIFEST",
            Self::NativeUnavailable => "NATIVE_UNAVAILABLE",
            Self::NativeLoadFailed => "NATIVE_LOAD_FAILED",
            Self::WasmLoadFailed => "WASM_LOAD_FAILED",
            Self::RuntimeStartupTimeout => "RUNTIME_STARTUP_TIMEOUT",
            Self::CssParseError => "CSS_PARSE_ERROR",
            Self::CssPrintError => "CSS_PRINT_ERROR",
            Self::CssDirectiveError => "CSS_DIRECTIVE_ERROR",
            Self::InvalidComposeClass => "invalid-compose-class",
            Self::ComposeQuotedSyntax => "compose-quoted-syntax",
            Self::ComposeGroupSyntax => "compose-group-syntax",
            Self::CssImportError => "CSS_IMPORT_ERROR",
            Self::SessionDisposed => "SESSION_DISPOSED",
            Self::InvalidInput => "INVALID_INPUT",
            Self::Internal => "INTERNAL",
        }
    }
}

/// Canonical Rust representation of the CSS-directive manifest input wire shape.
///
/// Fields that have not moved into a domain crate yet stay as order-preserving JSON
/// values. This lets schema/codegen stabilize the cross-language contract without
/// coupling the directive parser to engine implementation details.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDirectiveManifestInput {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variants: Option<Vec<Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variables: Option<Vec<CssDirectiveVariableDefinition>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub utilities: Option<Vec<Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub root_size: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_unit: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_mode: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scope: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub important: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub animations: Option<Map<String, Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub animation_options: Option<Map<String, Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modes: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode_trigger: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDirectiveVariableDefinition {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub value: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inline: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r#static: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub namespace: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDirectiveExtractionPolicy {
    pub include: Vec<String>,
    pub exclude: Vec<String>,
    pub safelist: Vec<String>,
    pub blocklist: Vec<CssDirectiveBlocklistEntry>,
    pub preserve_native: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum CssDirectiveBlocklistEntry {
    Exact(String),
    Pattern {
        source: String,
        #[serde(default)]
        flags: String,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum CssBlocklistPatternToken {
    Literal(u16),
    Any,
    Many,
}

/// Applies the dependency-free extraction-policy pattern contract used by all
/// native and Wasm semantic surfaces.
pub fn is_css_class_blocklisted(
    class_name: &str,
    blocklist: &[CssDirectiveBlocklistEntry],
) -> bool {
    blocklist.iter().any(|entry| match entry {
        CssDirectiveBlocklistEntry::Exact(value) => value == class_name,
        CssDirectiveBlocklistEntry::Pattern { source, flags } => {
            if !flags
                .chars()
                .all(|flag| matches!(flag, 'g' | 'i' | 'm' | 's' | 'u' | 'y'))
            {
                return false;
            }
            if flags.contains('i') {
                css_blocklist_pattern_matches(&source.to_lowercase(), &class_name.to_lowercase())
            } else {
                css_blocklist_pattern_matches(source, class_name)
            }
        }
    })
}

pub fn filter_css_extraction_candidates<I, S>(
    candidates: I,
    blocklist: &[CssDirectiveBlocklistEntry],
) -> Vec<String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    candidates
        .into_iter()
        .filter_map(|candidate| {
            let candidate = candidate.as_ref();
            (!is_css_class_blocklisted(candidate, blocklist)).then(|| candidate.to_owned())
        })
        .collect()
}

fn css_blocklist_pattern_matches(source: &str, value: &str) -> bool {
    let anchored_start = source.starts_with('^');
    let anchored_end = source.ends_with('$') && !source.ends_with("\\$");
    let source = source.strip_prefix('^').unwrap_or(source);
    let source = source.strip_suffix('$').unwrap_or(source);
    let mut tokens = Vec::new();
    let mut characters = source.chars().peekable();
    while let Some(character) = characters.next() {
        if character == '\\' {
            let Some(literal) = characters.next() else {
                return false;
            };
            tokens.extend(
                literal
                    .encode_utf16(&mut [0; 2])
                    .iter()
                    .copied()
                    .map(CssBlocklistPatternToken::Literal),
            );
        } else if character == '.' && characters.peek() == Some(&'*') {
            characters.next();
            tokens.push(CssBlocklistPatternToken::Many);
        } else if character == '.' {
            tokens.push(CssBlocklistPatternToken::Any);
        } else {
            tokens.extend(
                character
                    .encode_utf16(&mut [0; 2])
                    .iter()
                    .copied()
                    .map(CssBlocklistPatternToken::Literal),
            );
        }
    }
    let value = value.encode_utf16().collect::<Vec<_>>();
    fn matches(
        tokens: &[CssBlocklistPatternToken],
        value: &[u16],
        token_index: usize,
        value_index: usize,
        anchored_end: bool,
        matched: &mut [Vec<Option<bool>>],
    ) -> bool {
        if let Some(result) = matched[token_index][value_index] {
            return result;
        }
        let result = match tokens.get(token_index) {
            None => !anchored_end || value_index == value.len(),
            Some(CssBlocklistPatternToken::Literal(expected)) => {
                value
                    .get(value_index)
                    .is_some_and(|actual| actual == expected)
                    && matches(
                        tokens,
                        value,
                        token_index + 1,
                        value_index + 1,
                        anchored_end,
                        matched,
                    )
            }
            Some(CssBlocklistPatternToken::Any) => {
                value_index < value.len()
                    && matches(
                        tokens,
                        value,
                        token_index + 1,
                        value_index + 1,
                        anchored_end,
                        matched,
                    )
            }
            Some(CssBlocklistPatternToken::Many) => {
                matches(
                    tokens,
                    value,
                    token_index + 1,
                    value_index,
                    anchored_end,
                    matched,
                ) || (value_index < value.len()
                    && matches(
                        tokens,
                        value,
                        token_index,
                        value_index + 1,
                        anchored_end,
                        matched,
                    ))
            }
        };
        matched[token_index][value_index] = Some(result);
        result
    }
    if anchored_start {
        let mut matched = vec![vec![None; value.len() + 1]; tokens.len() + 1];
        matches(&tokens, &value, 0, 0, anchored_end, &mut matched)
    } else {
        (0..=value.len()).any(|value_index| {
            let mut matched = vec![vec![None; value.len() + 1]; tokens.len() + 1];
            matches(&tokens, &value, 0, value_index, anchored_end, &mut matched)
        })
    }
}

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

/// A generated UTF-16 offset anchored to an original authoring source.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssOutputMapping {
    pub generated_start: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub generated_end: Option<u32>,
    pub source: CssDirectiveSourceReference,
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
#[serde(rename_all = "camelCase")]
pub struct CssDeclaration {
    pub property: String,
    pub value: Value,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<CssDirectiveSourceReference>,
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
        declarations: Vec<CssDeclaration>,
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
    CssValueInvalid,
    CssValueUnknown,
    CssParseError,
    CssPrintError,
    CssDirectiveError,
    #[serde(rename = "invalid-compose-class")]
    InvalidComposeClass,
    #[serde(rename = "invalid-compose-layer")]
    InvalidComposeLayer,
    #[serde(rename = "removed-managed-directive")]
    RemovedManagedDirective,
    #[serde(rename = "compose-quoted-syntax")]
    ComposeQuotedSyntax,
    #[serde(rename = "compose-group-syntax")]
    ComposeGroupSyntax,
    CssImportError,
    SessionDisposed,
    InvalidInput,
    ClassSyntaxError,
    SourceParseError,
    UnknownCondition,
    MasterQueryRequiresCss,
    UndefinedMode,
    AmbiguousToken,
    UnknownToken,
    Internal,
}

impl ErrorCode {
    pub const ALL: [Self; 28] = [
        Self::InvalidManifest,
        Self::UnsupportedManifestVersion,
        Self::InvalidHydrationManifest,
        Self::NativeUnavailable,
        Self::NativeLoadFailed,
        Self::WasmLoadFailed,
        Self::RuntimeStartupTimeout,
        Self::CssValueInvalid,
        Self::CssValueUnknown,
        Self::CssParseError,
        Self::CssPrintError,
        Self::CssDirectiveError,
        Self::InvalidComposeClass,
        Self::InvalidComposeLayer,
        Self::RemovedManagedDirective,
        Self::ComposeQuotedSyntax,
        Self::ComposeGroupSyntax,
        Self::CssImportError,
        Self::SessionDisposed,
        Self::InvalidInput,
        Self::ClassSyntaxError,
        Self::SourceParseError,
        Self::UnknownCondition,
        Self::MasterQueryRequiresCss,
        Self::UndefinedMode,
        Self::AmbiguousToken,
        Self::UnknownToken,
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
            Self::CssValueInvalid => "CSS_VALUE_INVALID",
            Self::CssValueUnknown => "CSS_VALUE_UNKNOWN",
            Self::CssParseError => "CSS_PARSE_ERROR",
            Self::CssPrintError => "CSS_PRINT_ERROR",
            Self::CssDirectiveError => "CSS_DIRECTIVE_ERROR",
            Self::InvalidComposeClass => "invalid-compose-class",
            Self::InvalidComposeLayer => "invalid-compose-layer",
            Self::RemovedManagedDirective => "removed-managed-directive",
            Self::ComposeQuotedSyntax => "compose-quoted-syntax",
            Self::ComposeGroupSyntax => "compose-group-syntax",
            Self::CssImportError => "CSS_IMPORT_ERROR",
            Self::SessionDisposed => "SESSION_DISPOSED",
            Self::InvalidInput => "INVALID_INPUT",
            Self::ClassSyntaxError => "CLASS_SYNTAX_ERROR",
            Self::SourceParseError => "SOURCE_PARSE_ERROR",
            Self::UnknownCondition => "UNKNOWN_CONDITION",
            Self::MasterQueryRequiresCss => "MASTER_QUERY_REQUIRES_CSS",
            Self::UndefinedMode => "UNDEFINED_MODE",
            Self::AmbiguousToken => "AMBIGUOUS_TOKEN",
            Self::UnknownToken => "UNKNOWN_TOKEN",
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
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CssDirectiveManifestInput {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variants: Option<Vec<Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variables: Option<Vec<CssDirectiveVariableDefinition>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub utilities: Option<Vec<Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scope: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub important: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub animations: Option<Map<String, Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub animation_options: Option<Map<String, Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modes: Option<Vec<ModeDefinition>>,
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
    #[serde(default)]
    pub prune_native: bool,
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

/// Build-time composition inspection; deliberately absent from Manifest v1.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssCompositionTrace {
    pub order: u32,
    pub classes: Vec<String>,
    /// Resolved definition identities used while attaching compiler sources.
    #[serde(skip)]
    pub resolved_utilities: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<CssDirectiveSourceReference>,
    pub definition_sources: Vec<CssDirectiveSourceReference>,
    pub css: String,
    pub variable_names: Vec<String>,
    pub animation_names: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssUtilitySource {
    pub name: String,
    pub source: CssDirectiveSourceReference,
}

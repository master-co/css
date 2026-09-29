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
    Apply {
        order: u32,
        selector: String,
        name: String,
        arguments: Vec<MixinValue>,
        #[serde(skip_serializing_if = "Option::is_none")]
        source: Option<CssDirectiveSourceReference>,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        condition_path: Option<Vec<CssDirectiveConditionPathEntry>>,
    },
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
    #[serde(rename = "removed-managed-directive")]
    RemovedManagedDirective,
    #[serde(rename = "removed-compose-directive")]
    RemovedComposeDirective,
    CssImportError,
    SessionDisposed,
    InvalidInput,
    ClassSyntaxError,
    SourceParseError,
    UnknownCondition,
    MasterQueryRequiresCss,
    RemovedPresetUtility,
    UtilityNameConflict,
    AmbiguousToken,
    DynamicAnimationNames,
    UnknownToken,
    Internal,
}

impl ErrorCode {
    pub const ALL: [Self; 27] = [
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
        Self::RemovedManagedDirective,
        Self::RemovedComposeDirective,
        Self::CssImportError,
        Self::SessionDisposed,
        Self::InvalidInput,
        Self::ClassSyntaxError,
        Self::SourceParseError,
        Self::UnknownCondition,
        Self::MasterQueryRequiresCss,
        Self::RemovedPresetUtility,
        Self::UtilityNameConflict,
        Self::AmbiguousToken,
        Self::DynamicAnimationNames,
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
            Self::RemovedManagedDirective => "removed-managed-directive",
            Self::RemovedComposeDirective => "removed-compose-directive",
            Self::CssImportError => "CSS_IMPORT_ERROR",
            Self::SessionDisposed => "SESSION_DISPOSED",
            Self::InvalidInput => "INVALID_INPUT",
            Self::ClassSyntaxError => "CLASS_SYNTAX_ERROR",
            Self::SourceParseError => "SOURCE_PARSE_ERROR",
            Self::UnknownCondition => "UNKNOWN_CONDITION",
            Self::RemovedPresetUtility => "REMOVED_PRESET_UTILITY",
            Self::MasterQueryRequiresCss => "MASTER_QUERY_REQUIRES_CSS",
            Self::UtilityNameConflict => "UTILITY_NAME_CONFLICT",
            Self::AmbiguousToken => "AMBIGUOUS_TOKEN",
            Self::DynamicAnimationNames => "DYNAMIC_ANIMATION_NAMES",
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
    pub animation_variables: Option<BTreeMap<String, Vec<String>>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keyframes: Option<Vec<KeyframeDefinition>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mixins: Option<Vec<MixinDefinition>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variants: Option<Vec<Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub theme: Option<Vec<ThemeNode>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_media: Option<Vec<CustomMediaDefinition>>,
}

/// Ordered native CSS inside @theme. Declaration nodes occur only inside an
/// explicit selector, including native conditional/nesting descendants.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase", deny_unknown_fields)]
pub enum ThemeNode {
    Rule {
        prelude: String,
        children: Vec<ThemeNode>,
    },
    Declaration {
        name: String,
        value: String,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ScopedThemeValue {
    pub path: Vec<String>,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CustomMediaDefinition {
    pub name: String,
    pub query: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<CssDirectiveSourceReference>,
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

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssMixinSource {
    pub name: String,
    #[serde(default)]
    pub identity: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub replaced_by: Option<CssDirectiveSourceReference>,
    pub source: CssDirectiveSourceReference,
}

/// Resolved declarative custom media expression, with no runtime alias lookup.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case", deny_unknown_fields)]
pub enum MediaQueryExpr {
    True,
    False,
    Feature { value: String },
    MediaType { name: String },
    Not { query: Box<MediaQueryExpr> },
    And { queries: Vec<MediaQueryExpr> },
    Or { queries: Vec<MediaQueryExpr> },
}

/// Informational compiler feedback with an authored source reference.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssDirectiveNotice {
    pub code: crate::ErrorCode,
    pub message: String,
    pub source: Option<CssDirectiveSourceReference>,
}

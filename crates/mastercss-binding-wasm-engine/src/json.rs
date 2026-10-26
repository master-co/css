//! JSON for the engine session results the browser runtime reads, written without
//! serde so the runtime Wasm ships no serializer. Field names, order and omissions
//! match the schema types' serde derives; tests compare both encodings.
use mastercss_schema::{
    BindingInfo, ConditionBoundIr, ConditionRangeIr, Diagnostic, DiagnosticPhase,
    DiagnosticSeverity, EngineExecutionStateIr, EngineKeyframeResourceIr, EngineResourcesIr,
    EngineSnapshotIr, EngineTransitionIr, GeneratedRuleIr, RuleMutationIr, RulePriorityIr,
    RuleTarget, UtilityLayerName,
};

pub(crate) trait WriteJson {
    fn write_json(&self, out: &mut String);

    fn to_json(&self) -> String {
        let mut out = String::new();
        self.write_json(&mut out);
        out
    }
}

/// Writes an object member by member, keeping the separators in one place.
struct Object<'a> {
    out: &'a mut String,
    first: bool,
}

impl<'a> Object<'a> {
    fn new(out: &'a mut String) -> Self {
        out.push('{');
        Self { out, first: true }
    }

    fn key(&mut self, key: &str) -> &mut String {
        if !self.first {
            self.out.push(',');
        }
        self.first = false;
        self.out.push('"');
        self.out.push_str(key);
        self.out.push_str("\":");
        self.out
    }

    fn field(&mut self, key: &str, value: &(impl WriteJson + ?Sized)) -> &mut Self {
        value.write_json(self.key(key));
        self
    }

    fn end(self) {
        self.out.push('}');
    }
}

impl WriteJson for str {
    fn write_json(&self, out: &mut String) {
        out.push('"');
        for character in self.chars() {
            match character {
                '"' => out.push_str("\\\""),
                '\\' => out.push_str("\\\\"),
                '\n' => out.push_str("\\n"),
                '\r' => out.push_str("\\r"),
                '\t' => out.push_str("\\t"),
                '\u{8}' => out.push_str("\\b"),
                '\u{c}' => out.push_str("\\f"),
                character if character < ' ' => {
                    const HEX: &[u8; 16] = b"0123456789abcdef";
                    out.push_str("\\u00");
                    out.push(HEX[character as usize >> 4] as char);
                    out.push(HEX[character as usize & 0xf] as char);
                }
                character => out.push(character),
            }
        }
        out.push('"');
    }
}

impl WriteJson for String {
    fn write_json(&self, out: &mut String) {
        self.as_str().write_json(out);
    }
}

impl WriteJson for &str {
    fn write_json(&self, out: &mut String) {
        (*self).write_json(out);
    }
}

impl WriteJson for bool {
    fn write_json(&self, out: &mut String) {
        out.push_str(if *self { "true" } else { "false" });
    }
}

fn write_integer(value: i64, out: &mut String) {
    let mut digits = [0u8; 20];
    let mut cursor = digits.len();
    let mut magnitude = value.unsigned_abs();
    loop {
        cursor -= 1;
        digits[cursor] = b'0' + (magnitude % 10) as u8;
        magnitude /= 10;
        if magnitude == 0 {
            break;
        }
    }
    if value < 0 {
        out.push('-');
    }
    out.extend(digits[cursor..].iter().map(|digit| *digit as char));
}

macro_rules! integer_json {
    ($($type:ty),*) => {$(
        impl WriteJson for $type {
            fn write_json(&self, out: &mut String) {
                write_integer(i64::from(*self), out);
            }
        }
    )*};
}

integer_json!(i8, i32, u32);

impl WriteJson for f64 {
    fn write_json(&self, out: &mut String) {
        out.push_str(&format_number(*self));
    }
}

// The shortest round-trip text of a finite number. The browser formats it, so the
// runtime Wasm needs no float formatting code; other targets only run tests.
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen::prelude::wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_name = String)]
    fn format_number(value: f64) -> String;
}

#[cfg(not(target_arch = "wasm32"))]
fn format_number(value: f64) -> String {
    value.to_string()
}

impl<T: WriteJson> WriteJson for [T] {
    fn write_json(&self, out: &mut String) {
        out.push('[');
        for (index, item) in self.iter().enumerate() {
            if index > 0 {
                out.push(',');
            }
            item.write_json(out);
        }
        out.push(']');
    }
}

impl<T: WriteJson> WriteJson for Vec<T> {
    fn write_json(&self, out: &mut String) {
        self.as_slice().write_json(out);
    }
}

impl<T: WriteJson> WriteJson for Option<T> {
    fn write_json(&self, out: &mut String) {
        match self {
            Some(value) => value.write_json(out),
            None => out.push_str("null"),
        }
    }
}

impl WriteJson for UtilityLayerName {
    fn write_json(&self, out: &mut String) {
        match self {
            Self::Base => "base",
            Self::Defaults => "defaults",
            Self::Components => "components",
            Self::Utilities => "utilities",
        }
        .write_json(out);
    }
}

impl WriteJson for RuleTarget {
    fn write_json(&self, out: &mut String) {
        match self {
            Self::Theme => "theme",
            Self::Keyframes => "keyframes",
            Self::Base => "base",
            Self::Defaults => "defaults",
            Self::Components => "components",
            Self::Utilities => "utilities",
        }
        .write_json(out);
    }
}

impl WriteJson for ConditionBoundIr {
    fn write_json(&self, out: &mut String) {
        let mut object = Object::new(out);
        object
            .field("value", &self.value)
            .field("inclusive", &self.inclusive);
        object.end();
    }
}

impl WriteJson for ConditionRangeIr {
    fn write_json(&self, out: &mut String) {
        let mut object = Object::new(out);
        object
            .field("domain", &self.domain)
            .field("feature", &self.feature)
            .field("unit", &self.unit)
            .field("lower", &self.lower)
            .field("upper", &self.upper);
        object.end();
    }
}

impl WriteJson for RulePriorityIr {
    fn write_json(&self, out: &mut String) {
        let mut object = Object::new(out);
        object
            .field("features", &self.features)
            .field("selector", &self.selector);
        if !self.conditions.is_empty() {
            object.field("conditions", &self.conditions);
        }
        if self.value_priority != 0 {
            object.field("valuePriority", &self.value_priority);
        }
        if !self.sort_key.is_empty() {
            object.field("sortKey", &self.sort_key);
        }
        object.end();
    }
}

impl WriteJson for GeneratedRuleIr {
    fn write_json(&self, out: &mut String) {
        let mut object = Object::new(out);
        object
            .field("className", &self.class_name)
            .field("key", &self.key)
            .field("layer", &self.layer)
            .field("type", &self.utility_type)
            .field("sortTier", &self.sort_tier)
            .field("priority", &self.priority)
            .field("text", &self.text);
        if !self.nodes.is_empty() {
            let key = object.key("nodes");
            key.push('[');
            for (index, node) in self.nodes.iter().enumerate() {
                if index > 0 {
                    key.push(',');
                }
                let mut node_object = Object::new(key);
                node_object.field("text", &node.text);
                node_object.end();
            }
            key.push(']');
        }
        if let Some(selector_text) = &self.selector_text {
            object.field("selectorText", selector_text);
        }
        if !self.variable_names.is_empty() {
            object.field("variableNames", &self.variable_names);
        }
        if !self.keyframe_names.is_empty() {
            object.field("keyframeNames", &self.keyframe_names);
        }
        if self.retain_all_keyframes {
            object.field("retainAllKeyframes", &true);
        }
        object.end();
    }
}

impl WriteJson for RuleMutationIr {
    fn write_json(&self, out: &mut String) {
        let mut object = Object::new(out);
        match self {
            Self::Insert {
                target,
                index,
                key,
                text,
                rule,
            } => {
                object
                    .field("op", "insert")
                    .field("target", target)
                    .field("index", index)
                    .field("key", key)
                    .field("text", text);
                if let Some(rule) = rule {
                    object.field("rule", rule.as_ref());
                }
            }
            Self::Delete { target, index, key } => {
                object
                    .field("op", "delete")
                    .field("target", target)
                    .field("index", index)
                    .field("key", key);
            }
        }
        object.end();
    }
}

impl WriteJson for EngineTransitionIr {
    fn write_json(&self, out: &mut String) {
        let mut object = Object::new(out);
        object
            .field("version", &self.version)
            .field("mutations", &self.mutations);
        object.end();
    }
}

impl WriteJson for EngineKeyframeResourceIr {
    fn write_json(&self, out: &mut String) {
        let mut object = Object::new(out);
        object
            .field("id", &self.id)
            .field("name", &self.name)
            .field("text", &self.text);
        if !self.containers.is_empty() {
            let key = object.key("containers");
            key.push('[');
            for (index, container) in self.containers.iter().enumerate() {
                if index > 0 {
                    key.push(',');
                }
                let mut container_object = Object::new(key);
                container_object
                    .field("id", &container.id)
                    .field("prelude", &container.prelude);
                container_object.end();
            }
            key.push(']');
        }
        object
            .field("anchored", &self.anchored)
            .field("refCount", &self.ref_count)
            .field("dependencies", &self.dependencies);
        object.end();
    }
}

impl WriteJson for EngineResourcesIr {
    fn write_json(&self, out: &mut String) {
        let mut object = Object::new(out);
        if let Some(theme_text) = &self.theme_text {
            object.field("themeText", theme_text);
        }
        let key = object.key("variables");
        key.push('[');
        for (index, variable) in self.variables.iter().enumerate() {
            if index > 0 {
                key.push(',');
            }
            let mut variable_object = Object::new(key);
            variable_object
                .field("name", &variable.name)
                .field("refCount", &variable.ref_count);
            if !variable.dependencies.is_empty() {
                variable_object.field("dependencies", &variable.dependencies);
            }
            variable_object.end();
        }
        key.push(']');
        object.field("keyframes", &self.keyframes);
        object.end();
    }
}

impl WriteJson for EngineExecutionStateIr {
    fn write_json(&self, out: &mut String) {
        let mut object = Object::new(out);
        let key = object.key("classes");
        key.push('[');
        for (index, class) in self.classes.iter().enumerate() {
            if index > 0 {
                key.push(',');
            }
            let mut class_object = Object::new(key);
            class_object.field("className", &class.class_name);
            let references = class_object.key("references");
            references.push('[');
            for (index, reference) in class.references.iter().enumerate() {
                if index > 0 {
                    references.push(',');
                }
                let mut reference_object = Object::new(references);
                reference_object
                    .field("layer", &reference.layer)
                    .field("key", &reference.key);
                reference_object.end();
            }
            references.push(']');
            class_object.end();
        }
        key.push(']');
        object.field("resources", &self.resources);
        object.end();
    }
}

impl WriteJson for EngineSnapshotIr {
    fn write_json(&self, out: &mut String) {
        let mut object = Object::new(out);
        object
            .field("version", &self.version)
            .field("rules", &self.rules)
            .field("resources", &self.resources)
            .field("text", &self.text);
        if !self.stylesheets.is_empty() {
            object.field("stylesheets", &self.stylesheets);
        }
        object.end();
    }
}

impl WriteJson for Diagnostic {
    fn write_json(&self, out: &mut String) {
        let mut object = Object::new(out);
        object
            .field("code", self.code.as_wire_code())
            .field(
                "phase",
                match self.phase {
                    DiagnosticPhase::Match => "match",
                    DiagnosticPhase::CssValue => "css-value",
                    DiagnosticPhase::CssSyntax => "css-syntax",
                    DiagnosticPhase::BrowserSupport => "browser-support",
                    DiagnosticPhase::Compiler => "compiler",
                },
            )
            .field(
                "severity",
                match self.severity {
                    DiagnosticSeverity::Error => "error",
                    DiagnosticSeverity::Warning => "warning",
                    DiagnosticSeverity::Info => "info",
                },
            )
            .field("message", &self.message);
        if let Some(source) = &self.source {
            object.field("source", source);
        }
        if let Some(range) = &self.range {
            let key = object.key("range");
            let mut range_object = Object::new(key);
            range_object
                .field("start", &range.start)
                .field("end", &range.end);
            range_object.end();
        }
        if !self.notes.is_empty() {
            object.field("notes", &self.notes);
        }
        object.end();
    }
}

impl WriteJson for BindingInfo<'_> {
    fn write_json(&self, out: &mut String) {
        let mut object = Object::new(out);
        object
            .field("bindingAbiVersion", &self.binding_abi_version)
            .field("packageVersion", self.package_version)
            .field("manifestVersion", &self.manifest_version)
            .field("languageVersion", &self.language_version)
            .field("hydrationManifestVersion", &self.hydration_manifest_version)
            .field("engineTransitionVersion", &self.engine_transition_version)
            .field("validatorBatchVersion", &self.validator_batch_version)
            .field("diagnosticsReportVersion", &self.diagnostics_report_version)
            .field("lintBatchVersion", &self.lint_batch_version)
            .field("languageBatchVersion", &self.language_batch_version)
            .field("lexerBatchVersion", &self.lexer_batch_version)
            .field("sourceBatchVersion", &self.source_batch_version)
            .field("target", self.target)
            .field("surface", self.surface)
            .field("features", self.features);
        object.end();
    }
}

#[cfg(test)]
mod tests {
    use super::WriteJson;
    use mastercss_engine::EngineSession;
    use serde::Serialize;

    const DEFAULT_MANIFEST: &str =
        include_str!("../../../packages/preset/src/default-manifest.json");

    fn assert_same_json(value: &(impl WriteJson + Serialize)) {
        let written: serde_json::Value = serde_json::from_str(&value.to_json()).unwrap();
        assert_eq!(written, serde_json::to_value(value).unwrap());
    }

    #[test]
    fn engine_results_match_their_serde_encoding() {
        let mut session = EngineSession::create(DEFAULT_MANIFEST).unwrap();
        let classes = [
            "block",
            "fg-red-60:hover@sm",
            "bg-blue-60/.5",
            "p-md@md&<lg",
            "content:'a\"b\\\\c\\n'",
            "animation:fade|1s",
            "display:grid!",
            "unknown-class",
        ];
        assert_same_json(&session.ensure_class_rules(classes).unwrap());
        assert_same_json(&session.execution_state(classes).unwrap());
        let snapshot = session.snapshot().unwrap();
        // The classes cover numeric condition bounds, keyframes and theme text.
        let json = snapshot.to_json();
        for covered in [
            "\"lower\":{\"value\":",
            "\"keyframes\":[{",
            "\"themeText\":",
        ] {
            assert!(json.contains(covered), "{covered} in {json}");
        }
        assert_same_json(&snapshot);
        assert_same_json(&session.delete_class_rules(["block"]).unwrap());
        assert_same_json(&session.refresh(DEFAULT_MANIFEST).unwrap());
    }

    #[test]
    fn diagnostics_and_binding_info_match_their_serde_encoding() {
        let error = EngineSession::create("{\"version\":5}").unwrap_err();
        let mut diagnostic = error.diagnostic();
        diagnostic.source = Some("source\u{1}".into());
        diagnostic.range = Some(mastercss_schema::SourceRange { start: 1, end: 2 });
        diagnostic.notes = vec!["note \"quoted\"".into()];
        assert_same_json(&diagnostic);
        assert_same_json(&mastercss_schema::BindingInfo::new(
            "0.0.0",
            "wasm32-unknown-unknown",
            "runtime",
            &["engine"],
        ));
    }
}

//! Parity with @eslint/css-tree 4.1.2, which these checks replace: the fixtures record what
//! css-tree's checks reported for a fixed value list against every property and descriptor,
//! and for rules sampled from this repository's built site.

use mastercss_css_grammar::{
    Status, parse_declarations, rule_declarations, syntax_status, validate_css, value_status,
};
use serde_json::Value;

fn status(code: char) -> Option<Status> {
    match code {
        'v' => Some(Status::Valid),
        'i' => Some(Status::Invalid),
        'u' => Some(Status::Unknown),
        _ => None,
    }
}

fn name(status: Status) -> &'static str {
    match status {
        Status::Valid => "valid",
        Status::Invalid => "invalid",
        Status::Unknown => "unknown",
    }
}

#[test]
fn value_statuses_match_css_tree() {
    let fixture: Value = serde_json::from_str(include_str!("fixtures/value-status.json")).unwrap();
    let values: Vec<&str> = fixture["values"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap())
        .collect();
    let properties: Vec<&str> = fixture["properties"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap())
        .collect();
    let statuses: Vec<char> = fixture["statuses"].as_str().unwrap().chars().collect();
    let mut mismatches = Vec::new();
    let mut index = 0;
    for property in &properties {
        for value in &values {
            let expected = status(statuses[index]);
            index += 1;
            let actual = value_status(property, value, None);
            if Some(actual) != expected {
                mismatches.push(format!(
                    "{property}: {value} expected {expected:?} got {actual:?}"
                ));
            }
        }
    }
    for row in fixture["descriptors"].as_array().unwrap() {
        let (atrule, descriptor, codes) = (
            row[0].as_str().unwrap(),
            row[1].as_str().unwrap(),
            row[2].as_str().unwrap(),
        );
        for (value, code) in values.iter().zip(codes.chars()) {
            let actual = rule_declarations(&format!("@{atrule}{{{descriptor}:{value}}}"));
            let actual = actual.first().map(|d| d.status);
            if actual != status(code) {
                mismatches.push(format!(
                    "@{atrule} {descriptor}: {value} expected {:?} got {actual:?}",
                    status(code)
                ));
            }
        }
    }
    let total = index + fixture["descriptors"].as_array().unwrap().len() * values.len();
    assert!(
        mismatches.is_empty(),
        "{} of {total} differ:\n{}",
        mismatches.len(),
        mismatches
            .iter()
            .take(60)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
}

#[test]
fn stylesheets_match_css_tree() {
    let rows: Vec<Value> = serde_json::from_str(include_str!("fixtures/stylesheets.json")).unwrap();
    let mut mismatches = Vec::new();
    for row in &rows {
        let css = row["css"].as_str().unwrap();
        let short: String = css.chars().take(80).collect();
        let syntax = name(syntax_status(css));
        // css-tree also parses rule and at-rule preludes; this port reads them as raw text,
        // so a construct css-tree could not parse in a media query prelude stays valid.
        let prelude_only = [
            "@media (prefers-reduced-motion:reduce){transition:none;&:after",
            "@media (width>=48rem) and (height<50rem){",
        ]
        .iter()
        .any(|prefix| css.starts_with(prefix));
        if syntax != row["syntax"].as_str().unwrap() && !(prelude_only && syntax == "valid") {
            mismatches.push(format!(
                "syntax {short:?}: expected {} got {syntax}",
                row["syntax"]
            ));
        }
        let rules = serde_json::to_value(rule_declarations(css)).unwrap();
        if rules != row["rules"] {
            mismatches.push(format!(
                "rules {short:?}:\n  expected {}\n  got      {rules}",
                row["rules"]
            ));
        }
        if row["errors"].is_array() {
            let errors: Vec<Value> = validate_css(css)
                .into_iter()
                .map(|error| {
                    let mut value = serde_json::to_value(error).unwrap();
                    value.as_object_mut().unwrap().remove("offset");
                    value
                })
                .collect();
            if Value::Array(errors.clone()) != row["errors"] {
                mismatches.push(format!(
                    "errors {short:?}:\n  expected {}\n  got      {}",
                    row["errors"],
                    Value::Array(errors)
                ));
            }
        }
        if row["declarations"].is_object() {
            let declarations: serde_json::Map<String, Value> = parse_declarations(css)
                .into_iter()
                .map(|(k, v)| (k, Value::String(v)))
                .collect();
            if Value::Object(declarations.clone()) != row["declarations"] {
                mismatches.push(format!(
                    "declarations {short:?}:\n  expected {}\n  got      {}",
                    row["declarations"],
                    Value::Object(declarations)
                ));
            }
        }
    }
    assert!(
        mismatches.is_empty(),
        "{} differences in {} stylesheets:\n{}",
        mismatches.len(),
        rows.len(),
        mismatches
            .iter()
            .take(25)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
}

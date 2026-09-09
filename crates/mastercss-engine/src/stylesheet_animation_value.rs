use super::{HashMap, HashSet};

use mastercss_lexer::{CssSyntaxKind as Kind, CssSyntaxToken, tokenize_css_syntax};

use super::ManifestProjection;

const EASING: u16 = 1;
const ITERATION: u16 = 2;
const DIRECTION: u16 = 4;
const FILL: u16 = 8;
const PLAY: u16 = 16;
const DURATION: u16 = 32;
const DELAY: u16 = 64;
const NAME: u16 = 128;
const FIELDS: u16 = 255;
const LIST: u16 = 256;
const WIDE: u16 = 512;

// Names annotate grammar states; their spelling cannot change later parsing.
// Merging equal states avoids expanding a Cartesian product of variable modes.
type States = HashMap<u16, HashSet<String>>;

fn merge(target: &mut States, source: States) {
    for (state, names) in source {
        target.entry(state).or_default().extend(names);
    }
}

fn css_wide(name: &str) -> bool {
    matches!(
        name,
        "initial" | "inherit" | "unset" | "revert" | "revert-layer"
    )
}

fn number(value: &str) -> f64 {
    value.parse().unwrap_or(f64::NAN)
}

fn consume(states: &mut States, kind: &Kind<'_>, name_only: bool) {
    // Engines that lack auto duration still accept `auto` as a keyframe name.
    // The build-time collector must retain names needed by either grammar.
    let mut legacy_auto =
        if !name_only && matches!(kind, Kind::Ident(name) if name.eq_ignore_ascii_case("auto")) {
            Some(states.clone())
        } else {
            None
        };
    let mut next = States::new();
    for (state, mut names) in std::mem::take(states) {
        if state & WIDE != 0 {
            continue;
        }
        let slot = match kind {
            Kind::Delim(',') if state & FIELDS != 0 => {
                next.entry(LIST).or_default().extend(names);
                continue;
            }
            Kind::Ident(name) if css_wide(&name.to_ascii_lowercase()) && state == 0 => {
                next.entry(WIDE).or_default().extend(names);
                continue;
            }
            Kind::Ident(name) => {
                let lower = name.to_ascii_lowercase();
                if css_wide(&lower) || lower == "default" {
                    continue;
                }
                let preferred = if name_only {
                    0
                } else {
                    match lower.as_str() {
                        "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear"
                        | "step-start" | "step-end" => EASING,
                        "infinite" => ITERATION,
                        "normal" | "reverse" | "alternate" | "alternate-reverse" => DIRECTION,
                        "none" | "forwards" | "backwards" | "both" => FILL,
                        "running" | "paused" => PLAY,
                        "auto" => DURATION,
                        _ => 0,
                    }
                };
                if preferred != 0 && state & preferred == 0 {
                    preferred
                } else {
                    if lower != "none" {
                        names.insert(name.to_string());
                    }
                    NAME
                }
            }
            Kind::String(name) => {
                names.insert(name.to_string());
                NAME
            }
            Kind::Number(value) if !name_only && number(value) >= 0.0 => ITERATION,
            Kind::Dimension(value, unit)
                if !name_only && matches!(unit.to_ascii_lowercase().as_str(), "s" | "ms") =>
            {
                if state & DURATION == 0 && number(value) >= 0.0 {
                    DURATION
                } else {
                    DELAY
                }
            }
            Kind::Function(name)
                if !name_only
                    && matches!(
                        name.to_ascii_lowercase().as_str(),
                        "steps" | "linear" | "cubic-bezier"
                    ) =>
            {
                EASING
            }
            _ => continue,
        };
        if state & slot == 0 {
            next.entry(state | slot).or_default().extend(names);
        }
    }
    *states = next;
    if let Some(legacy) = &mut legacy_auto
        && let Kind::Ident(name) = kind
    {
        consume(legacy, &Kind::String(name.clone()), name_only);
        merge(states, std::mem::take(legacy));
    }
}

// A host-defined custom property can fill any subset of shorthand slots.
// Retain explicit candidate names that can follow it, without inventing names
// for unknown values or treating text inside var() as an animation identifier.
fn unknown_variable(input: &States, name_only: bool) -> States {
    let mut result = States::new();
    for (&state, names) in input {
        if state & WIDE != 0 {
            continue;
        }
        for fields in 0..=FIELDS {
            if (name_only && fields & !NAME != 0) || state & fields != 0 {
                continue;
            }
            result
                .entry(state | fields)
                .or_default()
                .extend(names.iter().cloned());
        }
    }
    result
}

fn consume_function(states: &mut States, tokens: &[CssSyntaxToken<'_>], name_only: bool) {
    let Kind::Function(name) = &tokens[0].kind else {
        return;
    };
    let lower = name.to_ascii_lowercase();
    if matches!(lower.as_str(), "steps" | "linear" | "cubic-bezier") {
        consume(states, &tokens[0].kind, name_only);
        return;
    }
    if !matches!(
        lower.as_str(),
        "calc"
            | "min"
            | "max"
            | "clamp"
            | "round"
            | "mod"
            | "rem"
            | "abs"
            | "sign"
            | "sqrt"
            | "pow"
            | "hypot"
            | "log"
            | "exp"
            | "sin"
            | "cos"
            | "tan"
            | "asin"
            | "acos"
            | "atan"
            | "atan2"
    ) {
        // Opaque host/future CSS functions cannot contribute literal names.
        // Resource discovery is not a full CSS function validator.
        return;
    }
    if name_only {
        states.clear();
        return;
    }
    if matches!(
        lower.as_str(),
        "sign" | "sin" | "cos" | "tan" | "sqrt" | "pow" | "log" | "exp"
    ) {
        consume(states, &Kind::Number("0"), false);
        return;
    }
    if matches!(lower.as_str(), "asin" | "acos" | "atan" | "atan2") {
        states.clear();
        return;
    }
    let mut time = false;
    let mut other_unit = false;
    let mut uncertain = false;
    for token in &tokens[1..] {
        match &token.kind {
            Kind::Dimension(_, unit) => {
                if matches!(unit.to_ascii_lowercase().as_str(), "s" | "ms") {
                    time = true
                } else {
                    other_unit = true
                }
            }
            Kind::Percentage(_) => other_unit = true,
            Kind::Delim('/') => uncertain = true,
            Kind::Function(name)
                if matches!(
                    name.to_ascii_lowercase().as_str(),
                    "var"
                        | "env"
                        | "attr"
                        | "sign"
                        | "sin"
                        | "cos"
                        | "tan"
                        | "sqrt"
                        | "pow"
                        | "log"
                        | "exp"
                        | "asin"
                        | "acos"
                        | "atan"
                        | "atan2"
                ) =>
            {
                uncertain = true
            }
            _ => {}
        }
    }
    let input = std::mem::take(states);
    if uncertain || (!time && !other_unit) {
        let mut numbers = input.clone();
        consume(&mut numbers, &Kind::Number("0"), false);
        merge(states, numbers);
    }
    if uncertain || (time && !other_unit) {
        let mut times = input;
        consume(&mut times, &Kind::Dimension("0", "s".into()), false);
        merge(states, times);
    }
}

struct Branches<'a> {
    name: String,
    values: Vec<&'a str>,
    next: usize,
    fallback: Option<&'a str>,
    missing: bool,
    fallback_needed: bool,
    input: States,
    inputs: Vec<(u16, HashSet<String>)>,
    carry: Option<HashSet<String>>,
    output: States,
}

struct Frame<'a> {
    source: &'a str,
    tokens: Vec<CssSyntaxToken<'a>>,
    cursor: usize,
    end: usize,
    owner: Option<String>,
    invalid_variable: bool,
    missing: bool,
    states: States,
    start_state: Option<u16>,
    dependencies: HashSet<String>,
    cycles: HashSet<String>,
    branches: Option<Branches<'a>>,
}

impl<'a> Frame<'a> {
    fn new(source: &'a str, states: States, owner: Option<String>, important: bool) -> Self {
        let tokens = tokenize_css_syntax(source);
        let mut end = tokens.len();
        if important
            && end >= 2
            && tokens[end - 2].kind == Kind::Delim('!')
            && matches!(&tokens[end - 1].kind, Kind::Ident(name) if name.eq_ignore_ascii_case("important"))
        {
            end -= 2;
        }
        let invalid_variable = owner.is_some()
            && end == 1
            && matches!(&tokens[0].kind, Kind::Ident(name) if css_wide(&name.to_ascii_lowercase()));
        Self {
            source,
            tokens,
            cursor: 0,
            end,
            owner: owner.clone(),
            invalid_variable,
            missing: false,
            start_state: owner.as_ref().and_then(|_| states.keys().next().copied()),
            dependencies: HashSet::new(),
            cycles: HashSet::new(),
            states,
            branches: None,
        }
    }
}

#[derive(Clone)]
struct Evaluation {
    states: States,
    missing: bool,
    dependencies: HashSet<String>,
    cycles: HashSet<String>,
}

fn finish_branch(parent: &mut Frame<'_>, mut result: Evaluation) {
    let branches = parent.branches.as_mut().unwrap();
    if result.missing {
        if branches.fallback.is_some()
            && parent
                .owner
                .as_ref()
                .is_none_or(|name| !result.cycles.contains(name))
        {
            branches.fallback_needed = true;
        } else {
            branches.missing = true;
        }
    }
    if let Some(carry) = branches.carry.take() {
        for names in result.states.values_mut() {
            names.extend(carry.iter().cloned());
        }
    }
    parent.dependencies.extend(result.dependencies);
    parent.cycles.extend(result.cycles);
    merge(&mut branches.output, result.states);
}

/// Interpret variable token streams at their original position. Both lexical
/// nesting and variable evaluation use heap frames, never recursive calls.
pub(crate) fn animation_value_names<'a>(
    source: &'a str,
    name_only: bool,
    manifest: &'a ManifestProjection,
) -> Vec<String> {
    let initial = HashMap::from([(0, HashSet::new())]);
    let mut frames = vec![Frame::new(source, initial, None, true)];
    // Each variable value is evaluated once per incoming grammar state. The
    // annotations from preceding tokens are carried separately from the cache.
    let mut cache: HashMap<(String, &'a str, u16), Evaluation> = HashMap::new();
    loop {
        let frame = frames.last_mut().unwrap();
        if frame.invalid_variable || (frame.cursor == frame.end && frame.branches.is_none()) {
            let mut finished = frames.pop().unwrap();
            if finished.invalid_variable {
                finished.states.clear();
                finished.missing = true;
            }
            let result = Evaluation {
                states: finished.states,
                missing: finished.missing,
                dependencies: finished.dependencies,
                cycles: finished.cycles,
            };
            if result.cycles.is_empty()
                && let (Some(owner), Some(state)) = (finished.owner, finished.start_state)
            {
                cache.insert((owner, finished.source, state), result.clone());
            }
            let Some(parent) = frames.last_mut() else {
                let mut names = HashSet::new();
                for (state, retained) in result.states {
                    if state & (FIELDS | WIDE) != 0 {
                        names.extend(retained);
                    }
                }
                let mut names = names.into_iter().collect::<Vec<_>>();
                names.sort_unstable();
                return names;
            };
            finish_branch(parent, result);
            continue;
        }
        if let Some(branches) = &mut frame.branches {
            let input_index = branches.next % branches.inputs.len();
            let value_index = branches.next / branches.inputs.len();
            if let Some(&value) = branches.values.get(value_index) {
                branches.next += 1;
                let (state, carry) = &branches.inputs[input_index];
                let key = (branches.name.clone(), value, *state);
                branches.carry = Some(carry.clone());
                let input = HashMap::from([(*state, HashSet::new())]);
                let cached = cache
                    .get(&key)
                    .filter(|entry| !entry.dependencies.contains(&key.0))
                    .cloned();
                if let Some(entry) = cached.filter(|entry| {
                    frames.iter().all(|frame| {
                        frame
                            .owner
                            .as_ref()
                            .is_none_or(|name| !entry.dependencies.contains(name))
                    })
                }) {
                    finish_branch(frames.last_mut().unwrap(), entry);
                } else {
                    frames.push(Frame::new(value, input, Some(key.0), false));
                }
            } else if branches.fallback_needed && branches.fallback.is_some() {
                let fallback = branches.fallback.take().unwrap();
                branches.fallback_needed = false;
                branches.carry = None;
                let child = Frame::new(fallback, branches.input.clone(), None, false);
                frames.push(child);
            } else {
                let mut branches = frame.branches.take().unwrap();
                frame.missing |= branches.missing;
                if branches.input.is_empty() {
                    branches.output.clear();
                }
                frame.states = branches.output;
            }
            continue;
        }
        let index = frame.cursor;
        let token = &frame.tokens[index];
        let end = token.close.unwrap_or(frame.end).min(frame.end);
        frame.cursor = if matches!(token.kind, Kind::Function(_)) {
            (end + 1).min(frame.end)
        } else {
            index + 1
        };
        if !matches!(&token.kind, Kind::Function(name) if name.eq_ignore_ascii_case("var")) {
            if matches!(token.kind, Kind::Function(_)) {
                consume_function(&mut frame.states, &frame.tokens[index..end], name_only);
            } else {
                consume(&mut frame.states, &token.kind, name_only);
            }
            continue;
        }
        let Some(Kind::Ident(name)) = frame.tokens.get(index + 1).map(|t| &t.kind) else {
            frame.states.clear();
            continue;
        };
        let Some(name) = name.strip_prefix("--").filter(|name| !name.is_empty()) else {
            frame.states.clear();
            continue;
        };
        let has_fallback = frame
            .tokens
            .get(index + 2)
            .is_some_and(|t| t.kind == Kind::Delim(','));
        if index + 2 != end && !has_fallback {
            frame.states.clear();
            continue;
        }
        let name = name.to_owned();
        frame.dependencies.insert(name.clone());
        let fallback = has_fallback.then(|| {
            let start = frame.tokens[index + 2].bytes.end;
            let end = frame
                .tokens
                .get(end)
                .map_or(frame.source.len(), |t| t.bytes.start);
            &frame.source[start..end]
        });
        let input = std::mem::take(&mut frame.states);
        let mut values = manifest.compiled_variables.get(&name).map(|v| {
            v.value
                .iter()
                .map(String::as_str)
                .chain(v.modes.iter().map(|m| m.value.as_str()))
                .collect::<Vec<_>>()
        });
        if let Some(values) = &mut values {
            values.sort_unstable();
            values.dedup();
        }
        let unknown = values.is_none();
        let values = values.unwrap_or_default();
        let inputs = if input.is_empty() {
            vec![(0, HashSet::new())]
        } else {
            input
                .iter()
                .map(|(&state, names)| (state, names.clone()))
                .collect()
        };
        frame.branches = Some(Branches {
            name: name.clone(),
            missing: values.is_empty() && fallback.is_none(),
            fallback_needed: values.is_empty() && fallback.is_some(),
            values,
            next: 0,
            fallback,
            output: if unknown {
                unknown_variable(&input, name_only)
            } else {
                States::new()
            },
            input,
            inputs,
            carry: None,
        });
        if let Some(cycle_start) = frames
            .iter()
            .position(|f| f.owner.as_deref() == Some(&name))
        {
            let cycle_names = frames[cycle_start..]
                .iter()
                .filter_map(|f| f.owner.clone())
                .collect::<HashSet<_>>();
            let frame = frames.last_mut().unwrap();
            frame.invalid_variable = true;
            frame.cycles.extend(cycle_names);
        }
    }
}

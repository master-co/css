//! Engine output for selector lists, nesting, importance, math and ordering,
//! with definitions compiled onto the default preset.
use mastercss_engine::EngineSession;

const PRESET: &str = include_str!("../../../packages/preset/src/default-manifest.json");

fn engine(definitions: &str) -> EngineSession {
    if definitions.is_empty() {
        return EngineSession::create(PRESET).unwrap();
    }
    let parsed =
        mastercss_compiler::compile_css_directives(definitions, &Default::default()).unwrap();
    let manifest = mastercss_compiler::compile_manifest_input(
        &parsed.manifest_input,
        &mastercss_compiler::CompileManifestOptions {
            base_manifest: Some(serde_json::from_str(PRESET).unwrap()),
        },
    )
    .unwrap()
    .manifest;
    EngineSession::create(&manifest.to_string()).unwrap()
}

/// The rule bodies after the class selector, so expectations need no escaping.
fn rules(engine: &EngineSession, class: &str) -> Vec<String> {
    let escaped = format!(".{}", mastercss_lexer::css_escape(class));
    engine
        .inspect(class)
        .unwrap()
        .rules
        .into_iter()
        .map(|rule| rule.text.replace(&escaped, "&"))
        .collect()
}

#[test]
fn pseudo_element_lists_are_not_put_in_is() {
    let engine = engine(
        "@utility x { &::before,&::after { &:hover { color: red } } } @utility y { &:hover { color: red } } @mixin --m { &:hover { @contents; } }",
    );
    assert_eq!(
        rules(&engine, "x"),
        ["&::before:hover,&::after:hover{color:red}"]
    );
    assert_eq!(
        rules(&engine, "y::before,::after"),
        ["&::before:hover,&::after:hover{color:red}"]
    );
    assert_eq!(
        rules(&engine, "(color:red)::before,::after@apply(--m)"),
        ["&::before:hover,&::after:hover{color:red}"]
    );
    // Lists without a pseudo-element keep `:is()`.
    assert_eq!(
        rules(&engine, "y:hover,:focus"),
        [":is(&:hover,&:focus):hover{color:red}"]
    );
}

#[test]
fn nested_lists_without_nesting_are_relative_to_each_branch() {
    let engine = engine(
        "@utility card { h1, h2 { font-weight: 700 } } @utility x { &:hover,&:focus { span { color: red } } } @utility y { .a &, .b { color: red } }",
    );
    assert_eq!(rules(&engine, "card"), ["& h1,& h2{font-weight:700}"]);
    assert_eq!(
        rules(&engine, "x"),
        [":is(&:hover,&:focus) span{color:red}"]
    );
    assert_eq!(rules(&engine, "y"), [".a &,& .b{color:red}"]);
}

#[test]
fn nth_child_of_selectors_decode_their_spaces() {
    let engine = engine("");
    assert_eq!(
        rules(&engine, "block:nth-child(odd_of_.a)"),
        ["&:nth-child(odd of .a){display:block}"]
    );
    assert_eq!(
        rules(&engine, "block:nth-child(2n+1_of_.a_.b)"),
        ["&:nth-child(2n+1 of .a .b){display:block}"]
    );
    assert_eq!(
        rules(&engine, "block:nth-child(2n+1)"),
        ["&:nth-child(2n+1){display:block}"]
    );
}

#[test]
fn compact_subtraction_before_a_function_is_spaced() {
    let engine = engine("");
    for (class, value) in [
        (
            "(width:calc(100%-var(--spacing-md)))",
            "calc(100% - var(--spacing-md))",
        ),
        ("(width:calc(1px-var(--x)))", "calc(1px - var(--x))"),
        (
            "(width:calc(var(--a)-var(--b)))",
            "calc(var(--a) - var(--b))",
        ),
        (
            "(width:calc(100%-calc(2px+1px)))",
            "calc(100% - calc(2px + 1px))",
        ),
        ("(width:-webkit-calc(100%-2px))", "-webkit-calc(100% - 2px)"),
        // A minus that follows an operator is a sign, not a subtraction.
        ("(width:calc(2*-var(--x)))", "calc(2 * -var(--x))"),
    ] {
        assert_eq!(
            rules(&engine, class),
            [format!("&{{width:{value}}}")],
            "{class}"
        );
    }
}

#[test]
fn importance_is_read_wherever_it_is_written() {
    let engine = engine(
        "@mixin --x { &:hover { @contents; } } @utility u { color: red !IMPORTANT } @utility v { color: red ! important }",
    );
    assert_eq!(
        rules(&engine, "block!@apply(--x)"),
        ["&:hover{display:block!important}"]
    );
    assert_eq!(
        rules(&engine, "block!:hover@apply(--x)"),
        ["&:hover:hover{display:block!important}"]
    );
    assert_eq!(rules(&engine, "u!"), ["&{color:red !IMPORTANT}"]);
    assert_eq!(rules(&engine, "v!"), ["&{color:red ! important}"]);
}

#[test]
fn stray_delimiters_and_numbers_are_not_selectors() {
    let engine = engine("");
    for class in [
        "fg-red:hover!@sm",
        "block:hover/2",
        "block[open]1",
        "(display:block).5",
    ] {
        assert!(engine.inspect(class).unwrap().rules.is_empty(), "{class}");
    }
    assert_eq!(
        rules(&engine, "block[data-x='1']"),
        ["&[data-x='1']{display:block}"]
    );
}

#[test]
fn characters_outside_the_basic_plane_keep_their_selector() {
    let engine = engine("");
    let rule = &engine.inspect("(content:'🙂')::before").unwrap().rules[0].text;
    assert!(rule.starts_with(r".\(content\:\'🙂\'\)"), "{rule}");
}

#[test]
fn keyframe_mappings_measure_the_snapshot_they_describe() {
    let mut session = engine(
        "@keyframes fade { to { opacity: 0 } } @utility fade { animation: fade 1s } @keyframes spin { to { rotate: 1turn } } @utility spin { animation: spin 1s }",
    );
    session
        .ensure_class_rules(["fade", "spin", "block"])
        .unwrap();
    // A subset emits fewer keyframes than the session holds.
    let none = session.snapshot_for_classes(["block"]).unwrap();
    assert!(session.keyframe_output_mappings(&none).is_empty());
    let spin = session.snapshot_for_classes(["spin"]).unwrap();
    let units = spin.text.encode_utf16().collect::<Vec<_>>();
    for mapping in session.keyframe_output_mappings(&spin) {
        let text = String::from_utf16(
            &units[mapping.generated_start as usize..mapping.generated_end.unwrap() as usize],
        )
        .unwrap();
        assert!(text.starts_with("@keyframes spin"), "{text}");
    }
}

//! Lowering native rules that apply mixins: selector lists, nesting, group
//! rules, keyframe positions and directive spelling.
use mastercss_compiler::{
    CompileNativeCssOptions, LowerCssDirectivesOptions, LowerCssDirectivesRequest,
    analyze_standalone_directives, compile_css_directives, lower_css_directives_request,
};

fn compile(source: &str) -> Result<String, mastercss_compiler::CompilerError> {
    let parsed = compile_css_directives(source, &CompileNativeCssOptions::default())?;
    let result = lower_css_directives_request(
        &LowerCssDirectivesRequest {
            definition_sources: parsed.definition_sources,
            native_output: parsed.native_output,
            manifest_input: parsed.manifest_input,
            style_definitions: parsed.style_definitions.unwrap_or_default(),
            warnings: parsed.warnings,
        },
        &LowerCssDirectivesOptions::default(),
    )?;
    Ok(result.css.unwrap_or(result.generated_css))
}

fn css(source: &str) -> String {
    compile(source).unwrap_or_else(|error| panic!("{source}: {error}"))
}

const SHEET: &str = "@mixin --sheet{background:red;} ";

#[test]
fn a_mixin_applied_to_a_selector_list_keeps_the_list() {
    // A pseudo-element cannot sit in `:is()`, which would drop the whole rule.
    let output = css(&format!(
        "{SHEET}.a::before,.b::before{{content:'';@apply --sheet;color:blue}}"
    ));
    assert_eq!(
        output,
        ".a:before,.b:before{content:\"\";background:red;color:#00f}"
    );
    // `:is()` would also give `.a` the id's specificity.
    assert_eq!(
        css(&format!("{SHEET}.a,#b{{@apply --sheet}}")),
        ".a,#b{background:red}"
    );
    let nested = css("@mixin --m{&:hover{color:red}} .a::before,.b::before{@apply --m}");
    assert_eq!(nested, ".a:before:hover,.b:before:hover{color:red}");
}

#[test]
fn nesting_flattens_as_css_nesting_reads_it() {
    for (source, expected) in [
        // Every `&` takes every branch.
        (
            ".a,.b{@apply --sheet;& + &{color:blue}}",
            ".a+.a,.a+.b,.b+.a,.b+.b{color:#00f}",
        ),
        // `:not()` does not distribute: the list stays in it.
        (
            ".a,.b{@apply --sheet;:not(&)>p{color:blue}}",
            ":not(:is(.a,.b))>p{color:#00f}",
        ),
        // A type selector after `&` leads its compound.
        (
            ".foo{@apply --sheet;&div{color:blue}}",
            "div.foo{color:#00f}",
        ),
        // A type selector parent after a compound part stays in `:is()`.
        (
            "div{@apply --sheet;.x&{color:blue}}",
            ".x:is(div){color:#00f}",
        ),
        // A complex parent away from the start keeps its meaning.
        (
            ".list .item{@apply --sheet;& + &{color:blue}}",
            ".list .item+:is(.list .item){color:#00f}",
        ),
        (
            ".list .item{@apply --sheet;.x &{color:blue}}",
            ".x :is(.list .item){color:#00f}",
        ),
        (
            ".list .item{@apply --sheet;&:hover{color:blue}}",
            ".list .item:hover{color:#00f}",
        ),
    ] {
        let output = css(&format!("{SHEET}{source}"));
        assert!(output.ends_with(expected), "{source}\n{output}");
    }
    assert_eq!(
        css("@mixin --n{&div{color:red}} .foo{@apply --n}"),
        "div.foo{color:red}"
    );
}

#[test]
fn scoped_and_nested_group_rules_lower() {
    assert_eq!(
        css(&format!(
            "{SHEET}@scope (.card) to (.x){{.a,.b::before{{@apply --sheet}}}}"
        )),
        "@scope (.card) to (.x) {\n  .a,.b:before{background:red}\n}"
    );
    assert_eq!(
        css(&format!(
            "{SHEET}.card,.panel{{@scope (.x){{@apply --sheet;.z{{color:blue}}}}}}"
        )),
        "@scope (.card .x,.panel .x){:where(:scope){background:red}}@scope (.card .x,.panel .x){:where(:scope) .z{color:#00f}}"
    );
    assert_eq!(
        css(&format!("{SHEET}.a{{@nest .b &{{@apply --sheet}}}}")),
        ".b .a{background:red}"
    );
    assert!(
        mastercss_compiler::has_local_style_directives("@scope (.a){.b{@apply --x}}", "/a.css")
            .unwrap()
    );
}

#[test]
fn apply_outside_a_style_rule_is_a_ranged_error() {
    for (source, message) in [
        (
            "@font-face{@apply --sheet}",
            "@apply cannot be used inside @font-face",
        ),
        (
            "@page{@apply --sheet}",
            "@apply cannot be used inside @page",
        ),
        (
            "@media print{@apply --sheet}",
            "@apply requires a style rule",
        ),
    ] {
        let source = format!("{SHEET}{source}");
        let error = compile(&source).unwrap_err();
        assert_eq!(error.to_string(), message, "{source}");
        let range = error.diagnostic().range.unwrap();
        assert_eq!(
            &source[range.start as usize..range.end as usize],
            "@apply",
            "{source}"
        );
    }
    // A container that is not lowered reports it instead of printing an opaque error.
    let error = compile(&format!(
        "{SHEET}@-moz-document url-prefix(){{.a{{@apply --sheet}}}}"
    ))
    .unwrap_err();
    assert!(
        error
            .to_string()
            .starts_with("@apply is only lowered inside"),
        "{error}"
    );
}

#[test]
fn parse_errors_count_lines_from_one_and_carry_a_range() {
    let error = compile(".a{color:red}\n.b{{}").unwrap_err();
    assert!(error.to_string().contains("master.css:2:"), "{error}");
    assert!(error.diagnostic().range.is_some());
}

#[test]
fn anonymous_layers_stay_one_layer_each() {
    assert_eq!(
        css(&format!(
            "{SHEET}.card{{@apply --sheet;@layer{{&:hover{{color:blue}} color:green}}}}"
        )),
        ".card{background:red}@layer{.card:hover{color:#00f}.card{color:green}}"
    );
    assert_eq!(
        css(&format!(
            "{SHEET}.card{{@apply --sheet;@layer{{color:red!important}}@layer{{color:blue!important}}}}"
        )),
        ".card{background:red}@layer{.card{color:red !important}}@layer{.card{color:#00f !important}}"
    );
}

#[test]
fn keyframes_keep_their_text_after_blanked_directives_and_any_line_break() {
    for source in [
        "@reference \"./😀.css\";@keyframes spin{to{opacity:0}} .a{color:red}",
        "@source \"./😀😀/**\";@keyframes spin{to{opacity:0}}",
        ".a{color:red}\r@keyframes spin{to{opacity:0}}",
        ".a{color:red}\u{c}@keyframes spin{to{opacity:0}}",
        ".a{color:red}\r\n@keyframes spin{to{opacity:0}}",
    ] {
        let output = css(source);
        assert!(
            output.contains("@keyframes spin{to{opacity:0}}"),
            "{source:?}\n{output}"
        );
        assert_eq!(
            output.matches(".a").count(),
            usize::from(source.contains(".a")),
            "{output}"
        );
    }
}

#[test]
fn mixin_bodies_read_css_spelling() {
    // At-rule names are case-insensitive; the condition is written in lowercase.
    assert_eq!(
        css("@mixin --n{@MEDIA (width>1px){color:red}} .a{@apply --n}"),
        "@media (width>1px){.a{color:red}}"
    );
    assert_eq!(
        css("@mixin --m{color:blue} @mixin --n{@APPLY --m;} .a{@apply --n}"),
        ".a{color:blue}"
    );
    // Custom properties keep their escapes.
    assert_eq!(
        css(r"@mixin --n{--gap-1\.5:6px} .a{@apply --n}"),
        r".a{--gap-1\.5:6px}"
    );
    // Only a parameter cannot be substituted into a prelude; native var() stays.
    assert_eq!(
        css("@mixin --n{@supports (color: var(--probe)){color:red}} .a{@apply --n}"),
        "@supports (color: var(--probe)){.a{color:red}}"
    );
    assert!(
        compile("@mixin --n(--x){@supports (color: var(--x)){color:red}} .a{@apply --n(red)}")
            .is_err()
    );
    // A query right after the at-rule name still resolves custom media.
    assert_eq!(
        css(
            "@custom-media --wide (width>=40rem); @mixin --n{@media(--wide){color:red}} .a{@apply --n}"
        ),
        "@media (width>=40rem){.a{color:red}}"
    );
}

#[test]
fn directive_keywords_are_case_insensitive() {
    assert!(
        analyze_standalone_directives("@prune NATIVE;")
            .extraction_policy
            .prune_native
    );
    assert!(
        analyze_standalone_directives("@preserve Native;")
            .extraction_policy
            .preserve_native
    );
    let keyframes =
        analyze_standalone_directives("@safelist KEYFRAMES \"fade\";").extraction_policy;
    assert_eq!(keyframes.safelist_keyframes, ["fade"]);
    assert!(keyframes.safelist.is_empty());
    let sources =
        analyze_standalone_directives("@source NOT \"./dist\"; @source \"./src\" /* \"./old\" */;")
            .extraction_policy;
    assert_eq!(sources.exclude, ["./dist"]);
    assert_eq!(sources.include, ["./src"]);
    assert!(compile("@theme INLINE{--color-x:red}").is_ok());
    assert!(mastercss_lexer::is_keyframe_safelist(
        "@SAFELIST keyframes \"fade\";"
    ));
}

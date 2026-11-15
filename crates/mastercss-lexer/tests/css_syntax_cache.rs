use mastercss_lexer::tokenize_css_syntax;

fn view(source: &str) -> Vec<String> {
    tokenize_css_syntax(source)
        .iter()
        .map(|token| format!("{:?} {:?} {:?}", token.kind, token.bytes, token.close))
        .collect()
}

#[test]
fn repeated_texts_tokenize_as_the_first_time() {
    let padding = "/* padding */ ".repeat(24);
    let sources: Vec<String> = [
        ".a { color: red; width: calc(100% - 2px); margin: 1.5em 2px; }",
        "@media (width >= 40rem) { .b { @apply --x(\"value\") } } @theme { --c: 10%; }",
        ".\\61 b { content: '\\'quoted'; } @\\61 pply --y; url(a.png) #id",
        "@keyframes fade { from { opacity: 0 } to { opacity: 1 } } .c:hover::before { --v: 3x }",
    ]
    .iter()
    .map(|source| format!("{padding}{source}"))
    .collect();
    let expected: Vec<_> = sources.iter().map(|source| view(source)).collect();
    // The same text at other addresses, interleaved past the cache's capacity.
    for round in 0..3 {
        for (index, source) in sources.iter().enumerate() {
            let copy = String::from(source.as_str());
            assert_eq!(
                view(&copy),
                expected[index],
                "round {round}, source {index}"
            );
            for other in 0..10 {
                view(&format!(
                    "{padding}.filler-{round}-{other} {{ color: blue }}"
                ));
            }
            assert_eq!(
                view(source),
                expected[index],
                "round {round}, source {index}"
            );
        }
    }
}

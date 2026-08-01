use super::*;

pub fn collect_class_list_token_ranges(class_list: &str) -> Vec<ClassListTokenRange> {
    let units: Vec<u16> = class_list.encode_utf16().collect();
    let mut ranges = Vec::new();
    let mut index = 0_usize;
    while index < units.len() {
        while index < units.len() && ASCII_WHITESPACE.contains(&units[index]) {
            index += 1;
        }
        if index == units.len() {
            break;
        }
        let start = index;
        while index < units.len() && !ASCII_WHITESPACE.contains(&units[index]) {
            index += 1;
        }
        let token = String::from_utf16_lossy(&units[start..index]);
        ranges.push(ClassListTokenRange {
            range: SourceRange {
                start: start as u32,
                end: index as u32,
            },
            token,
        });
    }
    ranges
}

pub fn collect_class_list_cursor_ranges(class_list: &str) -> Vec<SourceRange> {
    let units: Vec<u16> = class_list.encode_utf16().collect();
    let mut ranges = collect_class_list_token_ranges(class_list)
        .into_iter()
        .map(|item| item.range)
        .collect::<Vec<_>>();
    ranges.extend(
        units
            .iter()
            .enumerate()
            .filter(|(_, unit)| ASCII_WHITESPACE.contains(unit))
            .map(|(index, _)| SourceRange {
                start: index as u32,
                end: index as u32,
            }),
    );
    if units
        .last()
        .is_some_and(|unit| ASCII_WHITESPACE.contains(unit))
    {
        ranges.push(SourceRange {
            start: units.len() as u32,
            end: units.len() as u32,
        });
    }
    ranges.sort_by_key(|range| (range.start, u32::from(range.start == range.end)));
    ranges
}

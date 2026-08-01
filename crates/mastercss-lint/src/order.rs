use super::*;

pub(crate) fn get_property_order(property: &str) -> (u8, u8) {
    if property == "position" {
        return (0, 0);
    }
    if matches!(property, "top" | "right" | "bottom" | "left") || property_prefix(property, "inset")
    {
        return (0, 1);
    }
    if property == "z-index" {
        return (0, 2);
    }
    if property == "display" {
        return (0, 3);
    }
    if property == "visibility" {
        return (0, 4);
    }
    if property_prefix(property, "overflow") {
        return (0, 5);
    }
    if property_prefix(property, "container") {
        return (0, 6);
    }
    if property == "isolation" {
        return (0, 7);
    }
    if property == "float" {
        return (0, 8);
    }
    if property == "clear" {
        return (0, 9);
    }
    if property_prefix(property, "flex") {
        return (1, 0);
    }
    if property_prefix(property, "grid") {
        return (1, 1);
    }
    if property_prefix(property, "place") {
        return (1, 2);
    }
    if property_prefix(property, "align") {
        return (1, 3);
    }
    if property_prefix(property, "justify") {
        return (1, 4);
    }
    if property_prefix(property, "gap") {
        return (1, 5);
    }
    if property == "order" {
        return (1, 6);
    }
    if property_prefix(property, "columns") {
        return (1, 7);
    }
    if property == "height" {
        return (2, 0);
    }
    if property == "width" {
        return (2, 1);
    }
    if property_prefix(property, "min") {
        return (2, 2);
    }
    if property_prefix(property, "max") {
        return (2, 3);
    }
    if property == "size" {
        return (2, 4);
    }
    if property == "aspect-ratio" {
        return (2, 5);
    }
    if property_prefix(property, "margin") {
        return (3, 0);
    }
    if property_prefix(property, "padding") {
        return (3, 1);
    }
    if property_prefix(property, "scroll-margin") {
        return (3, 2);
    }
    if property_prefix(property, "scroll-padding") {
        return (3, 3);
    }
    if property_prefix(property, "border") {
        return (4, 0);
    }
    if property_prefix(property, "outline") {
        return (4, 1);
    }
    if property_prefix(property, "font") {
        return (5, 0);
    }
    if property == "line-height" {
        return (5, 1);
    }
    if property == "letter-spacing" {
        return (5, 2);
    }
    if property_prefix(property, "text") {
        return (5, 3);
    }
    if property == "white-space" {
        return (5, 4);
    }
    if property_prefix(property, "word") {
        return (5, 5);
    }
    if property_prefix(property, "list-style") {
        return (5, 6);
    }
    if property_prefix(property, "background") {
        return (6, 0);
    }
    if property == "color" {
        return (6, 1);
    }
    if property == "fill" {
        return (6, 2);
    }
    if property == "stroke" {
        return (6, 3);
    }
    if property == "accent-color" {
        return (6, 4);
    }
    if property == "caret-color" {
        return (6, 5);
    }
    if property_prefix(property, "mask") {
        return (6, 6);
    }
    if property == "opacity" {
        return (7, 0);
    }
    if property == "box-shadow" {
        return (7, 1);
    }
    if property == "filter" {
        return (7, 2);
    }
    if property == "backdrop-filter" {
        return (7, 3);
    }
    if property == "mix-blend-mode" {
        return (7, 4);
    }
    if property == "transform" {
        return (7, 5);
    }
    if property == "translate" {
        return (7, 6);
    }
    if property == "scale" {
        return (7, 7);
    }
    if property == "rotate" {
        return (7, 8);
    }
    if property_prefix(property, "transition") {
        return (7, 9);
    }
    if property_prefix(property, "animation") {
        return (7, 10);
    }
    if property == "cursor" {
        return (8, 0);
    }
    if property == "pointer-events" {
        return (8, 1);
    }
    if property == "user-select" {
        return (8, 2);
    }
    if property == "touch-action" {
        return (8, 3);
    }
    if property == "resize" {
        return (8, 4);
    }
    if property_prefix(property, "scroll") {
        return (8, 5);
    }
    if property_prefix(property, "overscroll") {
        return (8, 6);
    }
    if property == "appearance" {
        return (8, 7);
    }
    (UNKNOWN_PROPERTY_GROUP_ORDER, UNKNOWN_PROPERTY_ORDER)
}

pub(crate) fn property_prefix(property: &str, prefix: &str) -> bool {
    property == prefix || property.starts_with(&format!("{prefix}-"))
}

pub(crate) fn compare_condition_features(
    left: &[(String, f64, f64)],
    right: &[(String, f64, f64)],
) -> Ordering {
    for index in 0..left.len().max(right.len()) {
        let Some(left) = left.get(index) else {
            return Ordering::Less;
        };
        let Some(right) = right.get(index) else {
            return Ordering::Greater;
        };
        let order = natural_compare(&left.0, &right.0)
            .then_with(|| {
                (right.2 - right.1)
                    .partial_cmp(&(left.2 - left.1))
                    .unwrap_or(Ordering::Equal)
            })
            .then_with(|| right.1.partial_cmp(&left.1).unwrap_or(Ordering::Equal))
            .then_with(|| right.2.partial_cmp(&left.2).unwrap_or(Ordering::Equal));
        if order != Ordering::Equal {
            return order;
        }
    }
    Ordering::Equal
}

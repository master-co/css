//! Decimal numbers as CSS writes them, decided on their digits. Range checks stay
//! exact without binary floats, and conversion needs no correctly rounded parser,
//! whose tables would dominate the runtime Wasm's data.

use mastercss_lexer::concat_text;

/// `2^1024 − 2^970`, the least magnitude that `f64::from_str` rounds to infinity.
const F64_OVERFLOW: &str = "179769313486231580793728971405303415079934132710037826936173778980444968292764750946649017977587207096330286416692887910946555547851940402630657488671505820681908902000708383676273854845817711531764475730270069855571366959622842914819860834936475292719074168444365510704342711559699508093042880177904174497792";

/// Powers of ten that `f64` represents exactly.
const EXACT_POWERS_OF_TEN: [f64; 23] = [
    1e0, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14, 1e15, 1e16,
    1e17, 1e18, 1e19, 1e20, 1e21, 1e22,
];

/// A number in a form that `f64::from_str` accepts, other than `inf` and `nan`.
pub(crate) struct Decimal {
    pub(crate) negative: bool,
    /// Significant digits without leading or trailing zeros; empty for zero.
    pub(crate) digits: String,
    /// The value is `0.<digits> × 10^point`.
    pub(crate) point: i64,
}

impl Decimal {
    pub(crate) fn parse(text: &str) -> Option<Self> {
        let (negative, unsigned) = match text.as_bytes().first() {
            Some(b'+') => (false, &text[1..]),
            Some(b'-') => (true, &text[1..]),
            _ => (false, text),
        };
        let (mantissa, exponent) = match unsigned.find(['e', 'E']) {
            Some(index) => {
                let exponent = &unsigned[index + 1..];
                let digits = exponent.strip_prefix(['+', '-']).unwrap_or(exponent);
                if digits.is_empty() || !digits.bytes().all(|byte| byte.is_ascii_digit()) {
                    return None;
                }
                // Beyond this the value is zero or out of range either way.
                let magnitude = digits.parse::<i64>().unwrap_or(i64::MAX).min(1 << 20);
                let exponent = if exponent.starts_with('-') {
                    -magnitude
                } else {
                    magnitude
                };
                (&unsigned[..index], exponent)
            }
            None => (unsigned, 0),
        };
        let (integer, fraction) = mantissa.split_once('.').unwrap_or((mantissa, ""));
        if integer.is_empty() && fraction.is_empty()
            || !integer
                .bytes()
                .chain(fraction.bytes())
                .all(|byte| byte.is_ascii_digit())
        {
            return None;
        }
        let digits = concat_text!(integer, fraction);
        let leading = digits.bytes().take_while(|byte| *byte == b'0').count();
        let digits = digits[leading..].trim_end_matches('0').to_owned();
        Some(Self {
            negative,
            point: integer.len() as i64 - leading as i64 + exponent,
            digits,
        })
    }

    pub(crate) fn is_zero(&self) -> bool {
        self.digits.is_empty()
    }

    pub(crate) fn is_integer(&self) -> bool {
        self.point >= self.digits.len() as i64
    }

    /// Whether `f64::from_str` parses the number to a finite value.
    pub(crate) fn is_finite_f64(&self) -> bool {
        let limit = F64_OVERFLOW.len() as i64;
        if self.is_zero() || self.point != limit {
            return self.is_zero() || self.point < limit;
        }
        // Equal digits round, as ties to even, to infinity.
        let digits = self.digits.bytes().chain(std::iter::repeat(b'0'));
        for (digit, bound) in digits.zip(F64_OVERFLOW.bytes()) {
            if digit != bound {
                return digit < bound;
            }
        }
        false
    }

    /// The nearest `f64` for at most 15 significant digits whose exponent stays
    /// within the exactly representable powers of ten; close to it otherwise.
    pub(crate) fn to_f64(&self) -> f64 {
        let significant = self.digits.len().min(19);
        let mantissa = self.digits.as_bytes()[..significant]
            .iter()
            .fold(0u64, |value, digit| value * 10 + u64::from(digit - b'0'));
        let exponent = self.point - significant as i64;
        let mut value = mantissa as f64;
        if mantissa < 1 << 53 && (-22..=22).contains(&exponent) {
            value = if exponent < 0 {
                value / EXACT_POWERS_OF_TEN[(-exponent) as usize]
            } else {
                value * EXACT_POWERS_OF_TEN[exponent as usize]
            };
        } else if exponent > 22
            && let Some(shifted) = 10u64
                .checked_pow((exponent - 22) as u32)
                .and_then(|scale| mantissa.checked_mul(scale))
                .filter(|shifted| *shifted < 1 << 53)
        {
            value = shifted as f64 * EXACT_POWERS_OF_TEN[22];
        } else {
            // Out of the exact range: overflow and underflow still reach infinity
            // and zero.
            for _ in 0..exponent.unsigned_abs().min(400) {
                if exponent < 0 {
                    value /= 10.0;
                } else {
                    value *= 10.0;
                }
            }
        }
        if self.negative { -value } else { value }
    }
}

#[cfg(test)]
mod tests {
    use super::Decimal;

    #[test]
    fn parses_the_numbers_f64_accepts() {
        for (text, accepted) in [
            ("1", true),
            ("-1.5", true),
            ("+.5", true),
            ("1.", true),
            ("1e3", true),
            ("1.5E-3", true),
            ("", false),
            (".", false),
            ("+", false),
            ("1.2.3", false),
            ("1-2", false),
            ("1e", false),
            ("e3", false),
            ("inf", false),
        ] {
            assert_eq!(Decimal::parse(text).is_some(), accepted, "{text}");
            if accepted {
                assert!(text.parse::<f64>().is_ok(), "{text}");
            }
        }
    }

    #[test]
    fn converts_short_numbers_exactly() {
        for text in [
            "0",
            "-0",
            "1",
            "0.1",
            "0.3",
            "12.5",
            "1920",
            "47.999",
            "0.000001",
            "123456789012345",
            "1e22",
            "1.5e-10",
            "96.5",
            "-2.25",
            "1e30",
            "7e-22",
            "9007199254740991",
        ] {
            let parsed = Decimal::parse(text).unwrap().to_f64();
            let expected = text.parse::<f64>().unwrap();
            assert_eq!(parsed.to_bits(), expected.to_bits(), "{text}");
        }
    }

    #[test]
    fn approximates_long_and_extreme_numbers() {
        for text in ["3.14159265358979323846", "1e-300", "2.5e300"] {
            let parsed = Decimal::parse(text).unwrap().to_f64();
            let expected = text.parse::<f64>().unwrap();
            assert!(((parsed - expected) / expected).abs() < 1e-12, "{text}");
        }
        assert_eq!(Decimal::parse("1e400").unwrap().to_f64(), f64::INFINITY);
        assert_eq!(Decimal::parse("1e-400").unwrap().to_f64(), 0.0);
    }

    #[test]
    fn decides_finiteness_like_f64() {
        for text in [
            "1.7976931348623157e308",
            "1.7976931348623158e308",
            "1.797693134862315807937289714053034150799341327100378269361737789804449682927647509466490179775872070963302864166928879109465555478519404026306574886715058206819089020007083836762738548458177115317644757302700698555713669596228429148198608349364752927190741684443655107043427115596995080930428801779041744977919999e308",
            "1.797693134862315807937289714053034150799341327100378269361737789804449682927647509466490179775872070963302864166928879109465555478519404026306574886715058206819089020007083836762738548458177115317644757302700698555713669596228429148198608349364752927190741684443655107043427115596995080930428801779041744977920000e308",
            "1.8e308",
            "-1e308",
            "1e309",
            "1e-400",
            "0e400",
        ] {
            let expected = text.parse::<f64>().unwrap().is_finite();
            assert_eq!(
                Decimal::parse(text).unwrap().is_finite_f64(),
                expected,
                "{text}"
            );
        }
    }

    #[test]
    fn decides_integrality_on_the_digits() {
        for (text, integer) in [
            ("3", true),
            ("3.0", true),
            ("1.5e1", true),
            ("1.5", false),
            ("4503599627370496.5", false),
            ("1e-1", false),
            ("0", true),
        ] {
            assert_eq!(
                Decimal::parse(text).unwrap().is_integer(),
                integer,
                "{text}"
            );
        }
    }
}

//! Binary encoding of a compiled [`Program`], which browsers receive instead of the
//! Manifest v6 document. It stores what compiling a manifest produces; decoding
//! derives the rest through the same [`finish_program`] that compiling ends with,
//! so a session behaves the same whether it starts from a manifest or the encoding.
//!
//! Layout: the magic `MCSP`, the program and language versions, a table of distinct
//! strings in order of first use, then the program fields in a fixed order. Integers
//! are LEB128 varints (signed ones zigzag-encoded). A string reference is `0` for the
//! next string of the table and `index + 1` for one used before, which keeps the
//! fields compressible. Decoding checks every bound and returns an error rather than
//! panicking on malformed input.
use mastercss_schema::{
    CssDirectiveSourceReference, KeyframeContainer, KeyframeDefinition, KeyframeResource,
    MediaQueryExpr, MixinDefinition, MixinNode, MixinParameter, MixinParameterSyntax,
    MixinValuePart, PROGRAM_VERSION, ScopedThemeValue, SourceLocation, SourceLocationRange,
    SourceRange, ThemeNode, UtilityKind,
};

use super::{
    CompiledVariable, HashMap, Program, TokenFamily, TokenFamilyArgument, UtilityDefinition,
    UtilityEmit, UtilityLayerName, UtilityMatcher, VariableNumeric, finish_program,
};

const MAGIC: &[u8; 4] = b"MCSP";
/// Nesting deeper than any compiled manifest produces is rejected.
const MAX_DEPTH: u32 = 512;

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum ProgramError {
    Invalid(&'static str),
    UnsupportedVersion,
}

type Result<T> = std::result::Result<T, ProgramError>;

#[cfg(feature = "manifest")]
pub(crate) use encoding::encode;
#[cfg(feature = "manifest")]
use encoding::{Encode, Writer};

pub(crate) fn decode(bytes: &[u8]) -> Result<Program> {
    let mut reader = Reader::new(bytes)?;
    let mut program = Program {
        theme: Decode::decode(&mut reader)?,
        keyframes: Decode::decode(&mut reader)?,
        animation_variables: Vec::<(String, Vec<String>)>::decode(&mut reader)?
            .into_iter()
            .collect(),
        custom_media: Vec::<(String, MediaQueryExpr)>::decode(&mut reader)?
            .into_iter()
            .collect(),
        mixins: Decode::decode(&mut reader)?,
        utility_definitions: Decode::decode(&mut reader)?,
        token_families: Decode::decode(&mut reader)?,
        ..Program::default()
    };
    let compiled_variables: Vec<CompiledVariable> = Decode::decode(&mut reader)?;
    program.utilities = Decode::decode(&mut reader)?;
    reader.end()?;
    for variable in compiled_variables {
        program.compiled_variable_order.push(variable.name.clone());
        program
            .compiled_variables
            .insert(variable.name.clone(), variable);
    }
    if program.compiled_variables.len() != program.compiled_variable_order.len() {
        return Err(ProgramError::Invalid("duplicate variable"));
    }
    for utility in &program.utilities {
        if let UtilityEmit::Recipe { definition, .. } = utility.emit
            && definition >= program.utility_definitions.len()
        {
            return Err(ProgramError::Invalid("unknown recipe"));
        }
    }
    finish_program(&mut program).map_err(|_| ProgramError::Invalid("invalid custom media"))?;
    Ok(program)
}

struct Reader<'a> {
    bytes: &'a [u8],
    position: usize,
    strings: Vec<&'a str>,
    /// The strings referenced so far, a prefix of `strings`.
    used: usize,
    depth: u32,
}

impl<'a> Reader<'a> {
    fn new(bytes: &'a [u8]) -> Result<Self> {
        if bytes.get(..MAGIC.len()) != Some(MAGIC) {
            return Err(ProgramError::Invalid("not a Master CSS program"));
        }
        let mut reader = Self {
            bytes,
            position: MAGIC.len(),
            strings: Vec::new(),
            used: 0,
            depth: 0,
        };
        if reader.uint()? != u64::from(PROGRAM_VERSION)
            || reader.uint()? != u64::from(mastercss_schema::LANGUAGE_VERSION)
        {
            return Err(ProgramError::UnsupportedVersion);
        }
        let count = reader.length()?;
        reader.strings.reserve(count);
        for _ in 0..count {
            let length = reader.length()?;
            let bytes = &reader.bytes[reader.position..reader.position + length];
            reader.position += length;
            let string =
                std::str::from_utf8(bytes).map_err(|_| ProgramError::Invalid("invalid UTF-8"))?;
            reader.strings.push(string);
        }
        Ok(reader)
    }

    fn byte(&mut self) -> Result<u8> {
        let byte = *self
            .bytes
            .get(self.position)
            .ok_or(ProgramError::Invalid("truncated"))?;
        self.position += 1;
        Ok(byte)
    }

    fn uint(&mut self) -> Result<u64> {
        let mut value = 0u64;
        for shift in (0..64).step_by(7) {
            let byte = self.byte()?;
            let bits = u64::from(byte & 0x7f);
            if shift == 63 && bits > 1 {
                return Err(ProgramError::Invalid("integer overflow"));
            }
            value |= bits << shift;
            if byte & 0x80 == 0 {
                return Ok(value);
            }
        }
        Err(ProgramError::Invalid("integer overflow"))
    }

    fn int(&mut self) -> Result<i64> {
        let value = self.uint()?;
        Ok(((value >> 1) as i64) ^ -((value & 1) as i64))
    }

    /// A length or count; each item takes at least one byte, so a larger value
    /// than the remaining input is malformed.
    fn length(&mut self) -> Result<usize> {
        let length = self.uint()?;
        if length > (self.bytes.len() - self.position) as u64 {
            return Err(ProgramError::Invalid("length exceeds input"));
        }
        Ok(length as usize)
    }

    fn tag(&mut self, variants: u8) -> Result<u8> {
        let tag = self.byte()?;
        if tag >= variants {
            return Err(ProgramError::Invalid("unknown variant"));
        }
        Ok(tag)
    }

    fn string(&mut self) -> Result<String> {
        let reference = self.uint()?;
        let index = if reference == 0 {
            self.used += 1;
            self.used - 1
        } else {
            usize::try_from(reference - 1)
                .ok()
                .filter(|index| *index < self.used)
                .ok_or(ProgramError::Invalid("unknown string"))?
        };
        self.strings
            .get(index)
            .map(|string| (*string).to_owned())
            .ok_or(ProgramError::Invalid("unknown string"))
    }

    fn nested<T>(&mut self, decode: impl FnOnce(&mut Self) -> Result<T>) -> Result<T> {
        self.depth += 1;
        if self.depth > MAX_DEPTH {
            return Err(ProgramError::Invalid("nesting too deep"));
        }
        let value = decode(self);
        self.depth -= 1;
        value
    }

    fn end(&self) -> Result<()> {
        if self.position == self.bytes.len() && self.used == self.strings.len() {
            Ok(())
        } else {
            Err(ProgramError::Invalid("trailing bytes"))
        }
    }
}

trait Decode: Sized {
    fn decode(reader: &mut Reader<'_>) -> Result<Self>;
}

impl Decode for String {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        reader.string()
    }
}

impl Decode for bool {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        Ok(reader.tag(2)? == 1)
    }
}

impl Decode for u32 {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        Self::try_from(reader.uint()?).map_err(|_| ProgramError::Invalid("integer overflow"))
    }
}

impl Decode for i32 {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        Self::try_from(reader.int()?).map_err(|_| ProgramError::Invalid("integer overflow"))
    }
}

impl Decode for usize {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        Self::try_from(reader.uint()?).map_err(|_| ProgramError::Invalid("integer overflow"))
    }
}

impl Decode for f64 {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        let bytes = reader
            .bytes
            .get(reader.position..reader.position + 8)
            .ok_or(ProgramError::Invalid("truncated"))?;
        reader.position += 8;
        Ok(Self::from_le_bytes(bytes.try_into().expect("eight bytes")))
    }
}

impl<T: Decode> Decode for Option<T> {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        Ok(if reader.tag(2)? == 1 {
            Some(T::decode(reader)?)
        } else {
            None
        })
    }
}

impl<T: Decode> Decode for Vec<T> {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        let length = reader.length()?;
        let mut items = Vec::with_capacity(length);
        for _ in 0..length {
            items.push(T::decode(reader)?);
        }
        Ok(items)
    }
}

impl<A: Decode, B: Decode> Decode for (A, B) {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        Ok((A::decode(reader)?, B::decode(reader)?))
    }
}

/// Field-by-field encoding for plain structs.
macro_rules! record {
    ($type:ident { $($field:ident),* $(,)? }) => {
        #[cfg(feature = "manifest")]
        impl Encode for $type {
            fn encode(&self, writer: &mut Writer) {
                $(self.$field.encode(writer);)*
            }
        }

        impl Decode for $type {
            fn decode(reader: &mut Reader<'_>) -> Result<Self> {
                Ok(Self { $($field: Decode::decode(reader)?),* })
            }
        }
    };
}

/// Tag-and-fields encoding for enums whose variants have named or no fields.
macro_rules! variants {
    ($type:ident { $($variant:ident $({ $($field:ident),* })?),* $(,)? }) => {
        #[cfg(feature = "manifest")]
        impl Encode for $type {
            #[allow(unused_assignments)]
            fn encode(&self, writer: &mut Writer) {
                let mut tag = 0u64;
                $(
                    if let Self::$variant $({ $($field),* })? = self {
                        writer.uint(tag);
                        $($($field.encode(writer);)*)?
                        return;
                    }
                    tag += 1;
                )*
            }
        }

        impl Decode for $type {
            fn decode(reader: &mut Reader<'_>) -> Result<Self> {
                let count = [$(stringify!($variant)),*].len() as u8;
                let tag = reader.tag(count)?;
                let mut index = 0u8;
                $(
                    if tag == index {
                        return Ok(Self::$variant $({ $($field: Decode::decode(reader)?),* })?);
                    }
                    index += 1;
                )*
                let _ = index;
                unreachable!("tag is below the variant count")
            }
        }
    };
}

/// Boxed fields encode as their contents.
macro_rules! boxed {
    ($type:ty) => {
        #[cfg(feature = "manifest")]
        impl Encode for Box<$type> {
            fn encode(&self, writer: &mut Writer) {
                self.as_ref().encode(writer);
            }
        }

        impl Decode for Box<$type> {
            fn decode(reader: &mut Reader<'_>) -> Result<Self> {
                Ok(Box::new(<$type>::decode(reader)?))
            }
        }
    };
}

variants!(UtilityLayerName {
    Base,
    Defaults,
    Components,
    Utilities
});
variants!(UtilityKind {
    Static,
    Token,
    Function
});
variants!(TokenFamilyArgument { Value, Key });
variants!(MixinParameterSyntax {
    Integer,
    Number,
    String,
    CustomIdent
});
variants!(UtilityMatcher {
    Static { name },
    Key { keys },
    Token { prefix },
    Function { name },
});
variants!(UtilityEmit {
    Recipe { definition, key },
    Property { property },
});

record!(SourceRange { start, end });
record!(SourceLocation { line, column });
record!(SourceLocationRange { start, end });
record!(CssDirectiveSourceReference { file, range, loc });
record!(KeyframeResource { start, end, value });
record!(KeyframeContainer { id, prelude });
record!(KeyframeDefinition {
    id,
    owner_id,
    slot_id,
    occurrence,
    name,
    text,
    resources,
    containers,
    retained,
    dependencies,
    source,
});
record!(ScopedThemeValue {
    path,
    value,
    inline,
    is_static
});
record!(MixinParameter {
    name,
    syntax,
    default,
    source
});
record!(MixinDefinition {
    name,
    parameters,
    body,
    source
});
record!(TokenFamily {
    utility,
    prefix,
    namespace,
    argument,
    properties,
});
record!(VariableNumeric { value, unit });

/// `inline_value` and `is_static` follow from `values`, as when compiling, and a
/// missing name is the default one.
impl Decode for CompiledVariable {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        let key: String = Decode::decode(reader)?;
        let namespace: String = Decode::decode(reader)?;
        let name = Option::<String>::decode(reader)?
            .unwrap_or_else(|| super::manifest::default_variable_name(&namespace, &key));
        let values: Vec<ScopedThemeValue> = Decode::decode(reader)?;
        Ok(Self {
            name,
            key,
            namespace,
            inline_value: super::inline_theme::selected_value(&values),
            is_static: values.iter().any(|value| value.is_static),
            values,
            numeric: Decode::decode(reader)?,
            variable_type: Decode::decode(reader)?,
            dependencies: Decode::decode(reader)?,
        })
    }
}

impl Decode for mastercss_schema::UtilityDefinition {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        Ok(Self {
            kind: Decode::decode(reader)?,
            recipe: Decode::decode(reader)?,
        })
    }
}

/// Registered utilities; `finish_program` derives their variables.
impl Decode for UtilityDefinition {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        Ok(Self {
            id: Decode::decode(reader)?,
            name: Decode::decode(reader)?,
            utility_type: Decode::decode(reader)?,
            order: Decode::decode(reader)?,
            layer: Decode::decode(reader)?,
            keys: Decode::decode(reader)?,
            alias_groups: Decode::decode(reader)?,
            variable_aliases: Decode::decode(reader)?,
            variable_alias_refs: Decode::decode(reader)?,
            variables: HashMap::new(),
            variable_entries: Vec::new(),
            native_fallback: Decode::decode(reader)?,
            emit: Decode::decode(reader)?,
            matchers: Decode::decode(reader)?,
        })
    }
}

boxed!(MediaQueryExpr);

impl Decode for ThemeNode {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        reader.nested(|reader| {
            Ok(match reader.tag(2)? {
                0 => Self::Rule {
                    prelude: Decode::decode(reader)?,
                    children: Decode::decode(reader)?,
                },
                _ => Self::Declaration {
                    name: Decode::decode(reader)?,
                    value: Decode::decode(reader)?,
                    inline: Decode::decode(reader)?,
                    is_static: Decode::decode(reader)?,
                },
            })
        })
    }
}

impl Decode for MediaQueryExpr {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        reader.nested(|reader| {
            Ok(match reader.tag(7)? {
                0 => Self::True,
                1 => Self::False,
                2 => Self::Feature {
                    value: Decode::decode(reader)?,
                },
                3 => Self::MediaType {
                    name: Decode::decode(reader)?,
                },
                4 => Self::Not {
                    query: Decode::decode(reader)?,
                },
                5 => Self::And {
                    queries: Decode::decode(reader)?,
                },
                _ => Self::Or {
                    queries: Decode::decode(reader)?,
                },
            })
        })
    }
}

impl Decode for MixinValuePart {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        reader.nested(|reader| {
            Ok(match reader.tag(2)? {
                0 => Self::Text {
                    value: Decode::decode(reader)?,
                },
                _ => Self::Function {
                    name: Decode::decode(reader)?,
                    value: Decode::decode(reader)?,
                },
            })
        })
    }
}

impl Decode for MixinNode {
    fn decode(reader: &mut Reader<'_>) -> Result<Self> {
        reader.nested(|reader| {
            Ok(match reader.tag(5)? {
                0 => Self::Declaration {
                    property: Decode::decode(reader)?,
                    value: Decode::decode(reader)?,
                    source: Decode::decode(reader)?,
                },
                1 => Self::Rule {
                    selector: Decode::decode(reader)?,
                    body: Decode::decode(reader)?,
                },
                2 => Self::Condition {
                    condition: Decode::decode(reader)?,
                    body: Decode::decode(reader)?,
                },
                3 => Self::Apply {
                    name: Decode::decode(reader)?,
                    arguments: Decode::decode(reader)?,
                    contents: Decode::decode(reader)?,
                    source: Decode::decode(reader)?,
                },
                _ => Self::Contents {
                    fallback: Decode::decode(reader)?,
                },
            })
        })
    }
}

/// Encoding, which only hosts that compile manifests need.
#[cfg(feature = "manifest")]
mod encoding {
    use super::*;

    pub(crate) fn encode(program: &Program) -> Vec<u8> {
        let mut writer = Writer::default();
        program.theme.encode(&mut writer);
        program.keyframes.encode(&mut writer);
        sorted(&program.animation_variables).encode(&mut writer);
        sorted(&program.custom_media).encode(&mut writer);
        program.mixins.encode(&mut writer);
        program.utility_definitions.encode(&mut writer);
        program.token_families.encode(&mut writer);
        program
            .compiled_variable_order
            .iter()
            .map(|name| &program.compiled_variables[name])
            .collect::<Vec<_>>()
            .encode(&mut writer);
        // Registered utilities in match order; `finish_program` appends the built-in
        // native ones again.
        let mut utilities = program
            .utilities
            .iter()
            .filter(|utility| !utility.native_fallback)
            .collect::<Vec<_>>();
        utilities.sort_by_key(|utility| crate::manifest::static_last(utility));
        utilities.encode(&mut writer);
        writer.finish()
    }

    fn sorted<V>(map: &HashMap<String, V>) -> Vec<(&String, &V)> {
        let mut entries = map.iter().collect::<Vec<_>>();
        entries.sort_by(|left, right| left.0.cmp(right.0));
        entries
    }

    #[derive(Default)]
    pub(super) struct Writer {
        body: Vec<u8>,
        indexes: HashMap<String, u64>,
        strings: Vec<String>,
    }

    impl Writer {
        pub(super) fn uint(&mut self, mut value: u64) {
            loop {
                let byte = (value & 0x7f) as u8;
                value >>= 7;
                if value == 0 {
                    self.body.push(byte);
                    return;
                }
                self.body.push(byte | 0x80);
            }
        }

        fn int(&mut self, value: i64) {
            self.uint(((value << 1) ^ (value >> 63)) as u64);
        }

        fn string(&mut self, value: &str) {
            match self.indexes.get(value) {
                Some(index) => self.uint(index + 1),
                None => {
                    self.indexes
                        .insert(value.to_owned(), self.strings.len() as u64);
                    self.strings.push(value.to_owned());
                    self.uint(0);
                }
            }
        }

        fn finish(self) -> Vec<u8> {
            let mut header = Writer::default();
            header.body.extend_from_slice(MAGIC);
            header.uint(PROGRAM_VERSION.into());
            header.uint(mastercss_schema::LANGUAGE_VERSION.into());
            header.uint(self.strings.len() as u64);
            for string in &self.strings {
                header.uint(string.len() as u64);
                header.body.extend_from_slice(string.as_bytes());
            }
            header.body.extend_from_slice(&self.body);
            header.body
        }
    }

    pub(super) trait Encode {
        fn encode(&self, writer: &mut Writer);
    }

    impl<T: Encode + ?Sized> Encode for &T {
        fn encode(&self, writer: &mut Writer) {
            (*self).encode(writer);
        }
    }

    impl Encode for str {
        fn encode(&self, writer: &mut Writer) {
            writer.string(self);
        }
    }

    impl Encode for String {
        fn encode(&self, writer: &mut Writer) {
            writer.string(self);
        }
    }

    impl Encode for bool {
        fn encode(&self, writer: &mut Writer) {
            writer.uint(u64::from(*self));
        }
    }

    impl Encode for u32 {
        fn encode(&self, writer: &mut Writer) {
            writer.uint((*self).into());
        }
    }

    impl Encode for i32 {
        fn encode(&self, writer: &mut Writer) {
            writer.int((*self).into());
        }
    }

    impl Encode for usize {
        fn encode(&self, writer: &mut Writer) {
            writer.uint(*self as u64);
        }
    }

    impl Encode for f64 {
        fn encode(&self, writer: &mut Writer) {
            writer.body.extend_from_slice(&self.to_le_bytes());
        }
    }

    impl<T: Encode> Encode for Option<T> {
        fn encode(&self, writer: &mut Writer) {
            match self {
                Some(value) => {
                    writer.uint(1);
                    value.encode(writer);
                }
                None => writer.uint(0),
            }
        }
    }

    impl<T: Encode> Encode for [T] {
        fn encode(&self, writer: &mut Writer) {
            writer.uint(self.len() as u64);
            for item in self {
                item.encode(writer);
            }
        }
    }

    impl<T: Encode> Encode for Vec<T> {
        fn encode(&self, writer: &mut Writer) {
            self.as_slice().encode(writer);
        }
    }

    impl<A: Encode, B: Encode> Encode for (A, B) {
        fn encode(&self, writer: &mut Writer) {
            self.0.encode(writer);
            self.1.encode(writer);
        }
    }

    impl Encode for CompiledVariable {
        fn encode(&self, writer: &mut Writer) {
            self.key.encode(writer);
            self.namespace.encode(writer);
            (self.name != crate::manifest::default_variable_name(&self.namespace, &self.key))
                .then_some(&self.name)
                .encode(writer);
            self.values.encode(writer);
            self.numeric.encode(writer);
            self.variable_type.encode(writer);
            self.dependencies.encode(writer);
        }
    }

    impl Encode for mastercss_schema::UtilityDefinition {
        fn encode(&self, writer: &mut Writer) {
            self.kind.encode(writer);
            self.recipe.encode(writer);
        }
    }

    impl Encode for UtilityDefinition {
        fn encode(&self, writer: &mut Writer) {
            self.id.encode(writer);
            self.name.encode(writer);
            self.utility_type.encode(writer);
            self.order.encode(writer);
            self.layer.encode(writer);
            self.keys.encode(writer);
            self.alias_groups.encode(writer);
            self.variable_aliases.encode(writer);
            self.variable_alias_refs.encode(writer);
            self.native_fallback.encode(writer);
            self.emit.encode(writer);
            self.matchers.encode(writer);
        }
    }

    impl Encode for ThemeNode {
        fn encode(&self, writer: &mut Writer) {
            match self {
                Self::Rule { prelude, children } => {
                    writer.uint(0);
                    prelude.encode(writer);
                    children.encode(writer);
                }
                Self::Declaration {
                    name,
                    value,
                    inline,
                    is_static,
                } => {
                    writer.uint(1);
                    name.encode(writer);
                    value.encode(writer);
                    inline.encode(writer);
                    is_static.encode(writer);
                }
            }
        }
    }

    impl Encode for MediaQueryExpr {
        fn encode(&self, writer: &mut Writer) {
            match self {
                Self::True => writer.uint(0),
                Self::False => writer.uint(1),
                Self::Feature { value } => {
                    writer.uint(2);
                    value.encode(writer);
                }
                Self::MediaType { name } => {
                    writer.uint(3);
                    name.encode(writer);
                }
                Self::Not { query } => {
                    writer.uint(4);
                    query.encode(writer);
                }
                Self::And { queries } => {
                    writer.uint(5);
                    queries.encode(writer);
                }
                Self::Or { queries } => {
                    writer.uint(6);
                    queries.encode(writer);
                }
            }
        }
    }

    impl Encode for MixinValuePart {
        fn encode(&self, writer: &mut Writer) {
            match self {
                Self::Text { value } => {
                    writer.uint(0);
                    value.encode(writer);
                }
                Self::Function { name, value } => {
                    writer.uint(1);
                    name.encode(writer);
                    value.encode(writer);
                }
            }
        }
    }

    impl Encode for MixinNode {
        fn encode(&self, writer: &mut Writer) {
            match self {
                Self::Declaration {
                    property,
                    value,
                    source,
                } => {
                    writer.uint(0);
                    property.encode(writer);
                    value.encode(writer);
                    source.encode(writer);
                }
                Self::Rule { selector, body } => {
                    writer.uint(1);
                    selector.encode(writer);
                    body.encode(writer);
                }
                Self::Condition { condition, body } => {
                    writer.uint(2);
                    condition.encode(writer);
                    body.encode(writer);
                }
                Self::Apply {
                    name,
                    arguments,
                    contents,
                    source,
                } => {
                    writer.uint(3);
                    name.encode(writer);
                    arguments.encode(writer);
                    contents.encode(writer);
                    source.encode(writer);
                }
                Self::Contents { fallback } => {
                    writer.uint(4);
                    fallback.encode(writer);
                }
            }
        }
    }
}

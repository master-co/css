pub struct Scanner {
    source: String,
    pub pos: usize,
}

impl Scanner {
    pub fn new(source: &str) -> Self {
        Self {
            source: source.to_owned(),
            pos: 0,
        }
    }

    pub fn source(&self) -> &str {
        &self.source
    }

    /// Check if a byte is a name character: `[a-zA-Z0-9-]`.
    pub fn is_name_char(code: u8) -> bool {
        code.is_ascii_alphanumeric() || code == b'-'
    }

    pub fn char_code_at(&self, pos: usize) -> Option<u8> {
        self.source.as_bytes().get(pos).copied()
    }

    pub fn char_code(&self) -> Option<u8> {
        self.char_code_at(self.pos)
    }

    pub fn next_char_code(&self) -> Option<u8> {
        self.char_code_at(self.pos + 1)
    }

    pub fn skip_ws(&mut self) {
        self.pos = self.find_ws_end(self.pos);
    }

    pub fn find_ws_end(&self, mut pos: usize) -> usize {
        let bytes = self.source.as_bytes();
        while pos < bytes.len() {
            match bytes[pos] {
                b' ' | b'\t' | b'\n' | b'\r' | 0x0C => pos += 1,
                _ => break,
            }
        }
        pos
    }

    pub fn eat(&mut self, expected: u8) -> Result<(), String> {
        if self.char_code() != Some(expected) {
            return Err(self.error(&format!("Expect `{}`", expected as char)));
        }
        self.pos += 1;
        Ok(())
    }

    pub fn peek_char(&mut self) -> Option<char> {
        let rest = &self.source[self.pos..];
        let ch = rest.chars().next()?;
        self.pos += ch.len_utf8();
        Some(ch)
    }

    pub fn error(&self, message: &str) -> String {
        let context = if self.pos < self.source.len() {
            let end = (self.pos + 20).min(self.source.len());
            format!(
                " at position {} near {:?}",
                self.pos,
                &self.source[self.pos..end]
            )
        } else {
            format!(" at position {} (end of input)", self.pos)
        };
        format!("{message}{context}")
    }

    pub fn scan_spaces(&mut self) -> &str {
        let start = self.pos;
        self.pos = self.find_ws_end(self.pos);
        &self.source[start..self.pos]
    }

    /// Scan a word (identifier): `[a-zA-Z0-9-]+`.
    pub fn scan_word(&mut self) -> Result<String, String> {
        let start = self.pos;
        let bytes = self.source.as_bytes();

        while self.pos < bytes.len() && Self::is_name_char(bytes[self.pos]) {
            self.pos += 1;
        }

        if self.pos == start {
            return Err(self.error("Expect a keyword"));
        }

        Ok(self.source[start..self.pos].to_owned())
    }

    /// Scan a number: `[0-9]+`.
    pub fn scan_number(&mut self) -> Result<String, String> {
        let start = self.pos;
        let bytes = self.source.as_bytes();

        while self.pos < bytes.len() && bytes[self.pos].is_ascii_digit() {
            self.pos += 1;
        }

        if self.pos == start {
            return Err(self.error("Expect a number"));
        }

        Ok(self.source[start..self.pos].to_owned())
    }

    /// Scan a quoted string (including the quotes).
    pub fn scan_string(&mut self) -> Result<String, String> {
        let start = self.pos;

        if self.char_code() != Some(b'\'') {
            return Err(self.error("Expect an apostrophe"));
        }

        let rest = &self.source[self.pos + 1..];
        let Some(end_offset) = rest.find('\'') else {
            self.pos = self.source.len();
            return Err(self.error("Expect an apostrophe"));
        };

        self.pos = self.pos + 1 + end_offset + 1; // skip opening + content + closing
        Ok(self.source[start..self.pos].to_owned())
    }
}

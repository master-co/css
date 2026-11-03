export enum CompletionItemKind {
    Method = 0,
    Function = 1,
    Constructor = 2,
    Field = 3,
    Variable = 4,
    Class = 5,
    Struct = 6,
    Interface = 7,
    Module = 8,
    Property = 9,
    Event = 10,
    Operator = 11,
    Unit = 12,
    Value = 13,
    Constant = 14,
    Enum = 15,
    EnumMember = 16,
    Keyword = 17,
    Text = 18,
    Color = 19,
    File = 20,
    Reference = 21,
    Customcolor = 22,
    Folder = 23,
    TypeParameter = 24,
    User = 25,
    Issue = 26,
    Snippet = 27
}

export interface CompletionItem {
    /**
     * The label of this completion item. By default
     * also the text that is inserted when selecting
     * this completion.
     */
    label: string;
    /**
     * The kind of this completion item. Based of the kind
     * an icon is chosen by the editor.
     */
    kind?: CompletionItemKind;
    /**
     * Tags for this completion item.
     *
     * @since 3.15.0
     */
    tags?: CompletionItemTag[];
    /**
     * A human-readable string with additional information
     * about this item, like type or symbol information.
     */
    detail?: string;
    /**
     * A human-readable string that represents a doc-comment.
     */
    documentation?: string | MarkupContent;
    /**
     * Indicates if this item is deprecated.
     * @deprecated Use `tags` instead.
     */
    deprecated?: boolean;
    /**
     * Select this item when showing.
     *
     * *Note* that only one completion item can be selected and that the
     * tool / client decides which item that is. The rule is that the *first*
     * item of those that match best is selected.
     */
    preselect?: boolean;
    /**
     * A string that should be used when comparing this item
     * with other items. When `falsy` the [label](#CompletionItem.label)
     * is used.
     */
    sortText?: string;
    /**
     * A string that should be used when filtering a set of
     * completion items. When `falsy` the [label](#CompletionItem.label)
     * is used.
     */
    filterText?: string;
    /**
     * A string that should be inserted into a document when selecting
     * this completion. When `falsy` the [label](#CompletionItem.label)
     * is used.
     *
     * The `insertText` is subject to interpretation by the client side.
     * Some tools might not take the string literally. For example
     * VS Code when code complete is requested in this example `con<cursor position>`
     * and a completion item with an `insertText` of `console` is provided it
     * will only insert `sole`. Therefore it is recommended to use `textEdit` instead
     * since it avoids additional client side interpretation.
     */
    insertText?: string;
    /**
     * The format of the insert text. The format applies to both the `insertText` property
     * and the `newText` property of a provided `textEdit`. If omitted defaults to
     * `InsertTextFormat.PlainText`.
     */
    insertTextFormat?: InsertTextFormat;
    /**
     * How whitespace and indentation is handled during completion
     * item insertion. If ignored the clients default value depends on
     * the `textDocument.completion.insertTextMode` client capability.
     *
     * @since 3.16.0
     */
    insertTextMode?: InsertTextMode;
    /**
     * An [edit](#TextEdit) which is applied to a document when selecting
     * this completion. When an edit is provided the value of
     * [insertText](#CompletionItem.insertText) is ignored.
     *
     * Most editors support two different operation when accepting a completion item. One is to insert a
     * completion text and the other is to replace an existing text with a completion text. Since this can
     * usually not predetermined by a server it can report both ranges. Clients need to signal support for
     * `InsertReplaceEdits` via the `textDocument.completion.insertReplaceSupport` client capability
     * property.
     *
     * *Note 1:* The text edit's range as well as both ranges from a insert replace edit must be a
     * [single line] and they must contain the position at which completion has been requested.
     * *Note 2:* If an `InsertReplaceEdit` is returned the edit's insert range must be a prefix of
     * the edit's replace range, that means it must be contained and starting at the same position.
     *
     * @since 3.16.0 additional type `InsertReplaceEdit`
     */
    textEdit?: TextEdit | InsertReplaceEdit;
    /**
     * An optional array of additional [text edits](#TextEdit) that are applied when
     * selecting this completion. Edits must not overlap (including the same insert position)
     * with the main [edit](#CompletionItem.textEdit) nor with themselves.
     *
     * Additional text edits should be used to change text unrelated to the current cursor position
     * (for example adding an import statement at the top of the file if the completion item will
     * insert an unqualified type).
     */
    additionalTextEdits?: TextEdit[];
    /**
     * An optional set of characters that when pressed while this completion is active will accept it first and
     * then type that character. *Note* that all commit characters should have `length=1` and that superfluous
     * characters will be ignored.
     */
    commitCharacters?: string[];
    /**
     * An optional [command](#Command) that is executed *after* inserting this completion. *Note* that
     * additional modifications to the current document should be described with the
     * [additionalTextEdits](#CompletionItem.additionalTextEdits)-property.
     */
    command?: Command;
    /**
     * A data entry field that is preserved on a completion item between
     * a [CompletionRequest](#CompletionRequest) and a [CompletionResolveRequest]
     * (#CompletionResolveRequest)
     */
    data?: any;
}

export interface MasterCssKey {
    key: string[];
    colorful: boolean,
    values: Array<string | CompletionItem>;
}

export interface Range {
    /**
     * The range's start position
     */
    start: Position;
    /**
     * The range's end position.
     */
    end: Position;
}
export interface Index {
    /**
     * The range's start position
     */
    start: number;
    /**
     * The range's end position.
     */
    end: number;
}

export interface Position {
    /**
     * Line position in a document (zero-based).
     * If a line number is greater than the number of lines in a document, it defaults back to the number of lines in the document.
     * If a line number is negative, it defaults to 0.
     */
    line: number;
    /**
     * Character offset on a line in a document (zero-based). Assuming that the line is
     * represented as a string, the `character` value represents the gap between the
     * `character` and `character + 1`.
     *
     * If the character value is greater than the line length it defaults back to the
     * line length.
     * If a line number is negative, it defaults to 0.
     */
    character: number;
}

export interface Color {
    /**
     * The red component of this color in the range [0-1].
     */
    readonly red: decimal;
    /**
     * The green component of this color in the range [0-1].
     */
    readonly green: decimal;
    /**
     * The blue component of this color in the range [0-1].
     */
    readonly blue: decimal;
    /**
     * The alpha component of this color in the range [0-1].
     */
    readonly alpha: decimal;
}
/**
 * Defines a decimal number. Since decimal numbers are very
 * rare in the language server specification we denote the
 * exact range with every decimal using the mathematics
 * interval notations (e.g. [0, 1] denotes all decimals d with
 * 0 <= d <= 1.
 */
export declare type decimal = number;

export interface TextEdit {
    /**
     * The range of the text document to be manipulated. To insert
     * text into a document create a range where start === end.
     */
    range: Range;
    /**
     * The string to be inserted. For delete operations use an
     * empty string.
     */
    newText: string;
}
/**
 * Represents a reference to a command. Provides a title which
 * will be used to represent a command in the UI and, optionally,
 * an array of arguments which will be passed to the command handler
 * function when invoked.
 */
export interface Command {
    /**
     * Title of the command, like `save`.
     */
    title: string;
    /**
     * The identifier of the actual command handler.
     */
    command: string;
    /**
     * Arguments that the command handler should be
     * invoked with.
     */
    arguments?: any[];
}

export interface InsertReplaceEdit {
    /**
     * The string to be inserted.
     */
    newText: string;
    /**
     * The range if the insert is requested
     */
    insert: Range;
    /**
     * The range if the replace is requested.
     */
    replace: Range;
}

export declare namespace InsertTextMode {
    /**
     * The insertion or replace strings is taken as it is. If the
     * value is multi line the lines below the cursor will be
     * inserted using the indentation defined in the string value.
     * The client will not apply any kind of adjustments to the
     * string.
     */
    const asIs: 1;
    /**
     * The editor adjusts leading whitespace of new lines so that
     * they match the indentation up to the cursor of the line for
     * which the item is accepted.
     *
     * Consider a line like this: <2tabs><cursor><3tabs>foo. Accepting a
     * multi line completion item is indented using 2 tabs and all
     * following lines inserted will be indented using 2 tabs as well.
     */
    const adjustIndentation: 2;
}
export declare type InsertTextMode = 1 | 2;

export declare namespace InsertTextFormat {
    /**
     * The primary text to be inserted is treated as a plain string.
     */
    const PlainText: 1;
    /**
     * The primary text to be inserted is treated as a snippet.
     *
     * A snippet can define tab stops and placeholders with `$1`, `$2`
     * and `${3:foo}`. `$0` defines the final tab stop, it defaults to
     * the end of the snippet. Placeholders with equal identifiers are linked,
     * that is typing in one will update others too.
     *
     * See also: https://microsoft.github.io/language-server-protocol/specifications/specification-current/#snippet_syntax
     */
    const Snippet: 2;
}
export declare type InsertTextFormat = 1 | 2;


export interface MarkupContent {
    /**
     * The type of the Markup
     */
    kind: MarkupKind;
    /**
     * The content itself
     */
    value: string;
}

export declare namespace MarkupKind {
    /**
     * Plain text is supported as a content format
     */
    const PlainText: 'plaintext';
    /**
     * Markdown is supported as a content format
     */
    const Markdown: 'markdown';
}
export declare type MarkupKind = 'plaintext' | 'markdown';

export declare namespace CompletionItemTag {
    /**
     * Render a completion as obsolete, usually using a strike-out.
     */
    const Deprecated = 1;
}
export declare type CompletionItemTag = 1;
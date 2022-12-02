import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    InitializeResult,
    DocumentColorParams,
    ColorInformation,
    ColorPresentationParams} from 'vscode-languageserver/node';

import { WorkspaceFolder } from 'vscode-languageserver';
import MasterCSS, { configure, extend } from '@master/css'

import * as minimatch from 'minimatch';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { GetLastInstance, GetCompletionItem } from './completionProvider';
import { doHover } from './hoverProvider';
import { PositionCheck } from './masterCss';
import { GetDocumentColors, GetColorPresentation,GetColorRender } from './documentColorProvider';



const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
let settings: MasterCSSSettings;

let MasterCSSObject: MasterCSS | undefined;

// The example settings
interface MasterCSSSettings {
    languages: {},
    classNameMatches: string[],
    files: { exclude: string[] },
    suggestions: boolean,
    PreviewOnHovers: boolean,
    PreviewColor: boolean
}
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: MasterCSSSettings = {
    languages: [
        "html",
        "php",
        "javascript",
        "typescript",
        "javascriptreact",
        "typescriptreact",
        "vue",
        "svelte",
        "rust"
    ],
    classNameMatches: [
        "(class(?:Name)?\\s?=\\s?)((?:\"[^\"]+\")|(?:'[^']+')|(?:`[^`]+`))",
        "(class(?:Name)?={)([^}]*)}",
        "(?:(\\$|(?:element\\.[^\\s.`]+)`)([^`]+)`)",
        "(classList.(?:add|remove|replace|replace|toggle)\\()([^)]*)\\)"
      ],
    files: { exclude: ['**/.git/**', '**/node_modules/**', '**/.hg/**'] },
    suggestions: true,
    PreviewOnHovers: true,
    PreviewColor: true
};
let globalSettings: MasterCSSSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<MasterCSSSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    } else {
        globalSettings = <MasterCSSSettings>(
            (change.settings.languageServerExample || defaultSettings)
        );
    }

    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});

async function getDocumentSettings(resource: string): Promise<MasterCSSSettings> {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);

    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'masterCSS'
        });
        documentSettings.set(resource, result);
    }

    connection.workspace.getWorkspaceFolders()

    const workspaceFolders = await connection.workspace.getWorkspaceFolders();
    let root: WorkspaceFolder | undefined;
    if (workspaceFolders?.length === 1) {
        root = workspaceFolders[0];
    } else {
        root = workspaceFolders?.find(x => resource.includes(x.uri));
    }
    if (root?.uri) {
        try {
            let userConfig = null;
            try {
                const uri2path = await import('file-uri-to-path');
                userConfig = await import(uri2path(root.uri.replace('%3A', ':') + '/master.css.js'));
            } catch (_) { }
            MasterCSSObject = new MasterCSS(configure(userConfig));
        } catch(_) { }
    }
    return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidOpen(change => {
    validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
    // In this simple example we get the settings for every validate run.
    settings = await getDocumentSettings(textDocument.uri);

}

connection.onInitialize((params: InitializeParams) => {
    const capabilities = params.capabilities;


    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(
        capabilities.workspace && !!capabilities.workspace.configuration
    );
    hasWorkspaceFolderCapability = !!(
        capabilities.workspace && !!capabilities.workspace.workspaceFolders
    );
    hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    );

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,

            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true,
                workDoneProgress: false,
                triggerCharacters: [':', '@', '~']
            },
            colorProvider: {},
            hoverProvider: true
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
});

connection.onCompletion(
    (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {        
        if (settings.suggestions == true && CheckFilesExclude(_textDocumentPosition.textDocument.uri)) {

            let inMasterCSS = PositionCheck(_textDocumentPosition.textDocument.uri, _textDocumentPosition.position, documents, settings.classNameMatches).IsMatch

            let lastInstance = GetLastInstance(_textDocumentPosition, documents);
            if (lastInstance.isInstance == true && inMasterCSS == true) {
                return GetCompletionItem(lastInstance.lastKey, lastInstance.triggerKey, lastInstance.isStart, lastInstance.language, MasterCSSObject);
            }
        }
        return [];
    }
);
connection.onCompletionResolve(
    (item: CompletionItem): CompletionItem => {

        return item;
    }
);


connection.onDocumentColor(
    async (documentColor: DocumentColorParams): Promise<ColorInformation[]> => {
        if (settings == null) {
            return [];
        }
        if (settings.PreviewColor == true && CheckFilesExclude(documentColor.textDocument.uri)) {
            let colorInformation = await GetDocumentColors(documentColor, documents,settings.classNameMatches, MasterCSSObject);
            colorInformation = colorInformation.concat(await GetColorRender(documentColor, documents));
            return colorInformation
        }
        return [];
    });

connection.onColorPresentation((params: ColorPresentationParams) => {
    if (settings.PreviewColor == true && CheckFilesExclude(params.textDocument.uri)) {
        let colorRender = ['(?<=colors:\\s*{\\s*.*)([^}]*)}'];
        let isColorRender = PositionCheck(params.textDocument.uri, params.range.start, documents, colorRender);
        
        return GetColorPresentation(params,isColorRender.IsMatch);
    }
    return [];
});

connection.onHover(textDocumentPosition => {
    if (settings.PreviewOnHovers == true && CheckFilesExclude(textDocumentPosition.textDocument.uri)) {
        let HoverInstance = PositionCheck(textDocumentPosition.textDocument.uri, textDocumentPosition.position, documents, settings.classNameMatches)
        if (HoverInstance.IsMatch) {
            return doHover(HoverInstance.instance.instanceString, HoverInstance.instance.range, MasterCSSObject)
        }
    }
    return null;
});

function CheckFilesExclude(path: string): boolean {
    for (let exclude of settings.files.exclude) {
        if (minimatch(path, exclude)) {
            return false;
        }
    }
    return true;
}

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

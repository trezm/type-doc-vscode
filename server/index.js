const vscodeLanguageServer = require('vscode-languageserver');
const TypeDoc = require('type-doc').main;

const connection = vscodeLanguageServer.createConnection(
  new vscodeLanguageServer.IPCMessageReader(process),
  new vscodeLanguageServer.IPCMessageWriter(process)
);

const documents = new vscodeLanguageServer.TextDocuments();

documents.listen(connection);

let rootPath;
connection.onInitialize((params) => {
  rootPath = params.rootPath;

  return {
    capabilities: {
      textDocumentSync: documents.syncKind
    }
  }
});

let maxNumberOfProblems;
let definitionFiles = [];
let strictClassChecks;
connection.onDidChangeConfiguration((change) => {
  const settings = change.settings;
  maxNumberOfProblems = settings.typeDocServer.maxNumberOfProblems || 100;
  definitionFiles = settings.typeDocServer.definitionFiles || [];
  strictClassChecks = settings.typeDocServer.strictClassChecks || false;
});

documents.onDidChangeContent((event) => {
  let errors = [];

  try {
    const currentFile = event.document.uri.replace(/^file:\/\//, '');
    let now = Date.now();
    errors = TypeDoc(currentFile, false, {
      content: event.document.getText(),
      definitionFiles: definitionFiles,
      strictClassChecks: strictClassChecks
    }).filter((error) => error.extras.file === currentFile);
    console.log(`Finished in: ${Date.now() - now}ms`);
  } catch (e) {
    console.log('e:', e);
  }

  const diagnostics = errors
    .map((error) => {
      const expectedType = error.extras.expectedType || error.extras.type1;
      const actualType = error.extras.actualType || error.extras.type2;

      return {
        severity: vscodeLanguageServer.DiagnosticSeverity.Error,
        range: {
          start: {
            line: error.extras.start.line - 1,
            character: error.extras.start.column
          },
          end: {
            line: error.extras.end.line - 1,
            character: error.extras.end.column
          }
        },
        message: `${error.message}

Expected type: ${expectedType}, but got ${actualType}
`,
        source: 'TypeDoc'
      };
    });

    connection.sendDiagnostics({ uri: event.document.uri, diagnostics });
});

connection.listen();

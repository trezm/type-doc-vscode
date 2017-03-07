const vscode = require('vscode');
const vscodeLanguageClient = require('vscode-languageclient');
const path = require('path');

const CONFIGURATION_STRING = 'typeDocServer';
const DEBUG_SERVER_OPTIONS = { execArgv: ['--nolazy', '--debug=6009'] };
const CLIENT_OPTIONS = {
  documentSelector: ['javascript'],
  synchronize: {
    configurationSection: CONFIGURATION_STRING,
    fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
  }
};

module.exports = {
  activate: activate,
  deactivate: deactivate
}

function activate(context) {
    context.subscriptions.push(_registerServer(context));
}

function deactivate() {}

function _registerServer(context) {
  const serverPath = context.asAbsolutePath(path.join('server', 'index.js'));

  const SERVER_OPTIONS = {
    run: {
      module: serverPath,
      transport: vscodeLanguageClient.TransportKind.ipc
    },
    debug: {
      module: serverPath,
      transport: vscodeLanguageClient.TransportKind.ipc,
      options: DEBUG_SERVER_OPTIONS
    }
  };

  return new vscodeLanguageClient.LanguageClient(CONFIGURATION_STRING, 'TypeDoc Language Server', SERVER_OPTIONS, CLIENT_OPTIONS).start();
}

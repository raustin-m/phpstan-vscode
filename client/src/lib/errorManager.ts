import type { PHPStanError } from '../../../shared/notificationChannels';
import type { LanguageClient } from 'vscode-languageclient/node';
import { errorNotification } from './notificationChannels';
import type { Disposable } from 'vscode';
import * as vscode from 'vscode';

export class ErrorManager implements Disposable, vscode.CodeActionProvider {
	private readonly _diagnosticsCollection: vscode.DiagnosticCollection;
	private readonly _errors: Map<string, PHPStanError[]> = new Map();
	private _disposables: Disposable[] = [];

	public constructor(client: LanguageClient) {
		this._disposables.push(
			client.onNotification(errorNotification, (params) => {
				if (params.isProjectCheck) {
					this._errors.clear();
					this._diagnosticsCollection.clear();
				}
				for (const uri in params.diagnostics) {
					this._errors.set(uri, params.diagnostics[uri]);
					this._showErrors(uri, params.diagnostics[uri]);
				}
			})
		);
		this._diagnosticsCollection =
			vscode.languages.createDiagnosticCollection('PHPStan');
		this._disposables.push(this._diagnosticsCollection);
		this._disposables.push(
			vscode.workspace.onDidOpenTextDocument((e) => {
				if (this._errors.has(e.fileName)) {
					// Refresh, we might have some info on the chars
					this._showErrors(e.fileName, this._errors.get(e.fileName)!);
				}
			})
		);
		this._disposables.push(
			vscode.languages.registerCodeActionsProvider('php', this, {
				providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
			})
		);
	}

	private _createDiagnostic(
		range: vscode.Range,
		message: string
	): vscode.Diagnostic {
		const diagnostic = new vscode.Diagnostic(
			range,
			message,
			vscode.DiagnosticSeverity.Error
		);
		diagnostic.source = 'PHPStan';
		return diagnostic;
	}

	private _getDiagnosticsForURI(
		uri: vscode.Uri,
		errors: PHPStanError[]
	): vscode.Diagnostic[] {
		return errors.map((error) => {
			const file = vscode.workspace.textDocuments.find(
				(doc) => doc.uri.toString() === uri.toString()
			);

			const lineNumber = error.lineNumber - 1;

			if (!file) {
				// Can't match on content, just use 0-char offset
				return this._createDiagnostic(
					new vscode.Range(lineNumber, 0, lineNumber, 0),
					error.message
				);
			}

			// Get text range
			const fullLineText = file.getText().split('\n')[lineNumber];

			const { startChar, endChar } = (() => {
				const match = /^(\s*).*(\s*)$/.exec(fullLineText);
				if (match) {
					const [, leading, trailing] = match;
					return {
						startChar: leading.length,
						endChar: fullLineText.length - trailing.length,
					};
				}
				return {
					startChar: 0,
					endChar: fullLineText.length,
				};
			})();

			return this._createDiagnostic(
				new vscode.Range(lineNumber, startChar, lineNumber, endChar),
				error.message
			);
		});
	}

	private _showErrors(uri: string, errors: PHPStanError[]): void {
		const parsedURI = vscode.Uri.parse(uri);
		const diagnostics = this._getDiagnosticsForURI(parsedURI, errors);
		this._diagnosticsCollection.set(parsedURI, diagnostics);
	}

	public provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection
	): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		const uri = document.uri.toString();
		if (!this._errors.has(uri)) {
			return [];
		}

		const errors = this._errors.get(uri)!;

		const actions: ErrorCodeAction[] = [];

		for (const error of errors) {
			if (error.lineNumber !== range.start.line + 1) {
				continue;
			}
			const action = new ErrorCodeAction(document, error);
			actions.push(action);
		}

		return actions;
	}

	public resolveCodeAction(
		codeAction: ErrorCodeAction
	): vscode.ProviderResult<vscode.CodeAction> {
		codeAction.resolveEdit();
		return codeAction;
	}

	public dispose(): void {
		this._diagnosticsCollection.dispose();
	}
}

class ErrorCodeAction extends vscode.CodeAction {
	public constructor(
		private readonly _document: vscode.TextDocument,
		private readonly _error: PHPStanError
	) {
		super('Ignore PHPStan error', vscode.CodeActionKind.QuickFix);
	}

	public resolveEdit(): void {
		this.edit = new vscode.WorkspaceEdit();
		const errorRange = new vscode.Range(
			this._error.lineNumber - 1,
			0,
			this._error.lineNumber - 1,
			this._document.lineAt(this._error.lineNumber - 1).text.length
		);
		const originalText = this._document.getText(errorRange);
		const lineIndent = /^(\s*)/.exec(originalText);
		this.edit.replace(
			this._document.uri,
			errorRange,
			`${
				lineIndent?.[1] ?? ''
			}// @phpstan-ignore-next-line\n${originalText}`,
			{
				label: 'Ignore PHPStan error',
				needsConfirmation: false,
			}
		);
	}
}

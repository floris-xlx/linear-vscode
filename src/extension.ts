// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// issues provider
import { IssueProvider, getAssignedIssues } from "./IssueProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const issueProvider = new IssueProvider(context.secrets);
  const myIssueProvider = new IssueProvider(context.secrets);
  vscode.window.registerTreeDataProvider("LinearIssueList", issueProvider);
  vscode.window.registerTreeDataProvider("LinearMyIssueList", myIssueProvider);

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "linear" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "linear.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from linear-vscode");
    }
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("linear.refreshIssues", () => {
      issueProvider.refresh();
      myIssueProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("linear.setApiKey", async () => {
      const key = await vscode.window.showInputBox({
        prompt: "Enter your Linear API Key",
        ignoreFocusOut: true,
        password: true,
        placeHolder: "lin_api_...",
      });
      if (!key) {
        return;
      }
      await context.secrets.store("linear.apiKey", key);
      issueProvider.refresh();
      myIssueProvider.refresh();
      vscode.window.showInformationMessage("Linear API key saved.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("linear.deleteApiKey", async () => {
      await context.secrets.delete("linear.apiKey");
      issueProvider.refresh();
      myIssueProvider.refresh();
      vscode.window.showInformationMessage("Linear API key deleted.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("linear.searchIssues", async () => {
      const query = await vscode.window.showInputBox({
        prompt: "Search my Linear issues",
        ignoreFocusOut: true,
        placeHolder: "Search term",
      });
      if (query === undefined) {
        return;
      }

      const result = await getAssignedIssues(context.secrets);
      if (result.requiresApiKey) {
        vscode.window
          .showWarningMessage(
            "Set your Linear API key to search issues.",
            "Set Key"
          )
          .then((selection) => {
            if (selection === "Set Key") {
              vscode.commands.executeCommand("linear.setApiKey");
            }
          });
        return;
      }

      const filtered = result.issues.filter((i) =>
        i.title.toLowerCase().includes((query || "").toLowerCase())
      );
      const picked = await vscode.window.showQuickPick(
        filtered.map((i) => ({
          label: i.title,
          description: i.id,
          issue: i,
        })),
        { placeHolder: "Select an issue to open" }
      );
      if (picked?.issue?.url) {
        vscode.commands.executeCommand(
          "vscode.open",
          vscode.Uri.parse(picked.issue.url)
        );
      }
    })
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

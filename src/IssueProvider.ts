import * as vscode from "vscode";
import { LinearClient } from "@linear/sdk";

const client = new LinearClient({
  apiKey: "xxx",
});

async function getMyIssues() {
  const me = await client.viewer;
  const myIssues = await me.assignedIssues();

  if (myIssues.nodes.length) {
    return myIssues.nodes.map((issue) => ({
      title: issue.title,
      id: issue.identifier,
    }));
  } else {
    return [];
  }
}

export class Issue extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description?: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${label} (${description})`;
    this.description = description;
  }
}

export class IssueProvider implements vscode.TreeDataProvider<Issue> {
  private _onDidChangeTreeData: vscode.EventEmitter<Issue | undefined | void> =
    new vscode.EventEmitter<Issue | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<Issue | undefined | void> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: Issue): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<Issue[]> {
    const issues = await getMyIssues();
    return issues.map((issue) => new Issue(issue.title, issue.id));
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

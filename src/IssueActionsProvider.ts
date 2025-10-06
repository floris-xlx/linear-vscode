import * as vscode from "vscode";

export class IssueActionItem extends vscode.TreeItem {
  constructor(label: string, commandId: string, description?: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = description;
    this.command = { command: commandId, title: label };
  }
}

export class IssueActionsProvider
  implements vscode.TreeDataProvider<IssueActionItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    IssueActionItem | undefined | void
  > = new vscode.EventEmitter<IssueActionItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    IssueActionItem | undefined | void
  > = this._onDidChangeTreeData.event;

  getTreeItem(element: IssueActionItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<IssueActionItem[]> {
    return [
      new IssueActionItem("Search My Issues", "linear.searchIssues"),
      new IssueActionItem("Set API Key", "linear.setApiKey"),
      new IssueActionItem("Delete API Key", "linear.deleteApiKey"),
    ];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}



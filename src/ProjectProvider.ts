import * as vscode from "vscode";
import { createLinearClient } from "./IssueProvider";

export class ProjectItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description?: string,
    public readonly url?: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${label}${description ? ` (${description})` : ""}`;
    this.description = description;
    if (url) {
      this.command = {
        command: "vscode.open",
        title: "Open Project in Linear",
        arguments: [vscode.Uri.parse(url)],
      };
    }
  }
}

export class ProjectProvider implements vscode.TreeDataProvider<ProjectItem> {
  constructor(private readonly secretStorage: vscode.SecretStorage) {}

  private _onDidChangeTreeData: vscode.EventEmitter<
    ProjectItem | undefined | void
  > = new vscode.EventEmitter<ProjectItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ProjectItem | undefined | void> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: ProjectItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<ProjectItem[]> {
    const client = await createLinearClient(this.secretStorage);
    if (!client) {
      const item = new ProjectItem("Set Linear API Key…");
      item.command = { command: "linear.setApiKey", title: "Set Linear API Key" };
      return [item];
    }

    const projectsConn = await client.projects({ first: 100 });
    const nodes = projectsConn.nodes ?? [];
    nodes.sort((a, b) => {
      const aTime = new Date((a as any).updatedAt).getTime();
      const bTime = new Date((b as any).updatedAt).getTime();
      return bTime - aTime;
    });
    return nodes.map((p) => new ProjectItem(p.name, (p as any).state, (p as any).url));
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}



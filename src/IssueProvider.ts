import * as vscode from "vscode";
import { LinearClient } from "@linear/sdk";

export async function createLinearClient(
  secretStorage: vscode.SecretStorage
): Promise<LinearClient | null> {
  const apiKey = await secretStorage.get("linear.apiKey");
  if (!apiKey) return null;
  return new LinearClient({ apiKey });
}

export type IssueRecord = {
  title: string;
  id: string;
  url?: string;
  updatedAt?: string | Date;
};

export async function getAssignedIssues(
  secretStorage: vscode.SecretStorage
): Promise<{ issues: IssueRecord[]; requiresApiKey: boolean }> {
  const client = await createLinearClient(secretStorage);
  if (!client) {
    return { issues: [], requiresApiKey: true };
  }

  const me = await client.viewer;
  const myIssues = await me.assignedIssues({ first: 100 });
  const nodes = myIssues.nodes ?? [];

  // Sort by most recently updated
  nodes.sort((a, b) => {
    const aTime = new Date((a as any).updatedAt).getTime();
    const bTime = new Date((b as any).updatedAt).getTime();
    return bTime - aTime;
  });

  const issues: IssueRecord[] = nodes.map((issue) => ({
    title: issue.title,
    id: issue.identifier,
    url: (issue as any).url,
    updatedAt: (issue as any).updatedAt,
  }));

  return { issues, requiresApiKey: false };
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
  constructor(private readonly secretStorage: vscode.SecretStorage) {}

  private _onDidChangeTreeData: vscode.EventEmitter<Issue | undefined | void> =
    new vscode.EventEmitter<Issue | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<Issue | undefined | void> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: Issue): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<Issue[]> {
    const { issues, requiresApiKey } = await getAssignedIssues(
      this.secretStorage
    );

    if (requiresApiKey) {
      const item = new Issue("Set Linear API Key…");
      item.command = {
        command: "linear.setApiKey",
        title: "Set Linear API Key",
      };
      return [item];
    }

    return issues.map((issue) => {
      const item = new Issue(issue.title, issue.id);
      if (issue.url) {
        item.command = {
          command: "vscode.open",
          title: "Open in Linear",
          arguments: [vscode.Uri.parse(issue.url)],
        };
      }
      return item;
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

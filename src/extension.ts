import * as vscode from "vscode";

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Find the index of the next opening brace '{' starting from the given position
 */
function findNextBrace(text: string, start: number): number {
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") {
      return i;
    }
  }
  return -1;
}

/**
 * Find the matching closing brace '}' for an opening brace at startIndex
 * Uses brace depth counting to handle nested braces
 */
function findMatchingBrace(text: string, startIndex: number): number {
  if (text[startIndex] !== "{") {
    return -1;
  }

  let depth = 1;
  let inString = false;
  let inTemplate = false;
  let stringChar = "";

  for (let i = startIndex + 1; i < text.length; i++) {
    const char = text[i];
    const prevChar = i > 0 ? text[i - 1] : "";

    // Handle string literals to avoid counting braces inside strings
    if (!inTemplate && (char === '"' || char === "'" || char === "`")) {
      if (!inString) {
        inString = true;
        stringChar = char;
        if (char === "`") {
          inTemplate = true;
        }
      } else if (char === stringChar && prevChar !== "\\") {
        inString = false;
        inTemplate = false;
        stringChar = "";
      }
    }

    // Only count braces outside of strings
    if (!inString) {
      if (char === "{") {
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
  }

  return -1;
}

/**
 * Check if the sx is inside a comment
 */
function isInComment(text: string, offset: number): boolean {
  // Check for single-line comment
  const lineStart = text.lastIndexOf("\n", offset) + 1;
  const lineBeforeSx = text.substring(lineStart, offset);
  if (lineBeforeSx.includes("//")) {
    return true;
  }

  // Check for multi-line comment
  let inBlockComment = false;
  for (let i = 0; i < offset; i++) {
    if (text[i] === "/" && text[i + 1] === "*") {
      inBlockComment = true;
      i++;
    } else if (text[i] === "*" && text[i + 1] === "/") {
      inBlockComment = false;
      i++;
    }
  }
  return inBlockComment;
}

/**
 * Interface for SX block information
 */
interface SxBlock {
  sxStartOffset: number;
  sxEndOffset: number;
  braceStartOffset: number;
  braceEndOffset: number;
  sxStartPosition: vscode.Position;
  sxEndPosition: vscode.Position;
  braceStartPosition: vscode.Position;
  braceEndPosition: vscode.Position;
  content: string;
}

/**
 * Find all sx prop blocks in the document
 */
function findSxBlocks(document: vscode.TextDocument): SxBlock[] {
  const text = document.getText();
  const blocks: SxBlock[] = [];
  const sxPattern = /\bsx\b/g;
  let match: RegExpExecArray | null;

  // Get configuration for ignoring commented sx
  const config = vscode.workspace.getConfiguration("sxFold");
  const ignoreCommentedSx = config.get<boolean>("ignoreCommentedSx", true);

  while ((match = sxPattern.exec(text)) !== null) {
    const sxStartOffset = match.index;
    const sxEndOffset = sxStartOffset + 2; // 'sx' is 2 characters

    // Skip if sx is in a comment and config says to ignore
    if (ignoreCommentedSx && isInComment(text, sxStartOffset)) {
      continue;
    }

    // Find the next opening brace after 'sx'
    const braceStartOffset = findNextBrace(text, sxEndOffset);
    if (braceStartOffset === -1) {
      continue;
    }

    // Check that there's only whitespace, '=', ':', or combinations between 'sx' and '{'
    // Supported patterns: sx={{ }}, sx = {{ }}, sx: { }, sx:{{ }}
    const between = text.substring(sxEndOffset, braceStartOffset).trim();
    const validPatterns = ["", "=", ":", "={", ":{"];
    if (!validPatterns.includes(between)) {
      continue;
    }

    // Find the matching closing brace
    const braceEndOffset = findMatchingBrace(text, braceStartOffset);
    if (braceEndOffset === -1) {
      continue;
    }

    // Extract the content between braces
    const content = text.substring(braceStartOffset, braceEndOffset + 1);

    // Convert offsets to positions
    const sxStartPosition = document.positionAt(sxStartOffset);
    const sxEndPosition = document.positionAt(sxEndOffset);
    const braceStartPosition = document.positionAt(braceStartOffset);
    const braceEndPosition = document.positionAt(braceEndOffset);

    blocks.push({
      sxStartOffset,
      sxEndOffset,
      braceStartOffset,
      braceEndOffset,
      sxStartPosition,
      sxEndPosition,
      braceStartPosition,
      braceEndPosition,
      content,
    });
  }

  return blocks;
}

// ============================================================================
// Folding Range Provider
// ============================================================================

class SxFoldingRangeProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(
    document: vscode.TextDocument,
    context: vscode.FoldingContext,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.FoldingRange[]> {
    const blocks = findSxBlocks(document);
    const ranges: vscode.FoldingRange[] = [];

    for (const block of blocks) {
      // Only create folding range if the block spans multiple lines
      if (block.braceStartPosition.line < block.braceEndPosition.line) {
        const braceStartLine = block.braceStartPosition.line;
        const braceEndLine = block.braceEndPosition.line;

        // Fold everything between the line with {{ and the line with }}
        // This keeps both visible and shows: sx={{...}}
        const foldStart = braceStartLine;
        const foldEnd = braceEndLine - 1;

        // Only create fold if there's at least one line to fold
        if (foldStart < foldEnd) {
          ranges.push(
            new vscode.FoldingRange(
              foldStart,
              foldEnd,
              vscode.FoldingRangeKind.Region,
            ),
          );
        } else if (
          foldStart === foldEnd &&
          braceStartLine + 1 === braceEndLine
        ) {
          // For 2-line sx blocks, fold the first line to show {{...}}
          ranges.push(
            new vscode.FoldingRange(
              braceStartLine,
              braceStartLine,
              vscode.FoldingRangeKind.Region,
            ),
          );
        }
      }
    }

    return ranges;
  }
}

// ============================================================================
// Hover Provider
// ============================================================================

class SxHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Hover> {
    const blocks = findSxBlocks(document);

    // Check if hover is on an 'sx' keyword
    for (const block of blocks) {
      const sxRange = new vscode.Range(
        block.sxStartPosition,
        block.sxEndPosition,
      );

      if (sxRange.contains(position)) {
        // Format the content with proper indentation for display
        const formattedContent = this.formatSxContent(block.content);
        const markdown = new vscode.MarkdownString();
        markdown.appendCodeblock(formattedContent, "typescript");

        return new vscode.Hover(markdown, sxRange);
      }
    }

    return null;
  }

  private formatSxContent(content: string): string {
    // Return content as-is - it's already formatted TypeScript/JavaScript
    // This is safer than using eval() and shows the actual code
    return content;
  }
}

// ============================================================================
// Extension Activation
// ============================================================================

// Track fold state for status bar toggle
let sxFolded = false;

export function activate(context: vscode.ExtensionContext) {
  console.log("sx-fold extension is now active");

  const supportedLanguages = [
    "javascript",
    "typescript",
    "typescriptreact",
    "javascriptreact",
  ];

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = "sx-fold.toggleAllSx";
  updateStatusBar(statusBarItem, sxFolded);
  statusBarItem.show();

  // Register Folding Range Provider
  const foldingProvider = vscode.languages.registerFoldingRangeProvider(
    supportedLanguages.map((lang) => ({ language: lang })),
    new SxFoldingRangeProvider(),
  );

  // Register Hover Provider
  const hoverProvider = vscode.languages.registerHoverProvider(
    supportedLanguages.map((lang) => ({ language: lang })),
    new SxHoverProvider(),
  );

  // Register toggle fold command (for keybinding)
  const toggleFoldCommand = vscode.commands.registerCommand(
    "sx-fold.toggleFold",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const document = editor.document;
      const cursorPosition = editor.selection.active;
      const blocks = findSxBlocks(document);

      // Find the sx block that contains the cursor or is on the current line
      let targetBlock: SxBlock | undefined;
      for (const block of blocks) {
        // Check if cursor is within the sx block range
        const blockRange = new vscode.Range(
          block.sxStartPosition,
          block.braceEndPosition,
        );
        if (blockRange.contains(cursorPosition)) {
          targetBlock = block;
          break;
        }
        // Also check if cursor is on the same line as sx
        if (cursorPosition.line === block.sxStartPosition.line) {
          targetBlock = block;
          break;
        }
      }

      if (targetBlock) {
        // Move cursor to the fold start line
        const position = new vscode.Position(
          targetBlock.braceStartPosition.line,
          0,
        );
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position));

        // Execute the toggle fold command
        await vscode.commands.executeCommand("editor.toggleFold");
      } else {
        vscode.window.showInformationMessage(
          "No sx block found at cursor position",
        );
      }
    },
  );

  // Register show home page command
  const showHomePageCommand = vscode.commands.registerCommand(
    "sx-fold.showHomePage",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "sxFoldHomePage",
        "SX Fold - Home",
        vscode.ViewColumn.One,
        { enableScripts: false },
      );

      panel.webview.html = getHomePageHtml();
    },
  );

  // Register fold all sx command
  const foldAllSxCommand = vscode.commands.registerCommand(
    "sx-fold.foldAllSx",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const document = editor.document;
      const blocks = findSxBlocks(document);

      for (const block of blocks) {
        if (block.braceStartPosition.line < block.braceEndPosition.line) {
          const position = new vscode.Position(
            block.braceStartPosition.line,
            0,
          );
          editor.selection = new vscode.Selection(position, position);
          await vscode.commands.executeCommand("editor.fold");
        }
      }
    },
  );

  // Register unfold all sx command
  const unfoldAllSxCommand = vscode.commands.registerCommand(
    "sx-fold.unfoldAllSx",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const document = editor.document;
      const blocks = findSxBlocks(document);

      for (const block of blocks) {
        if (block.braceStartPosition.line < block.braceEndPosition.line) {
          const position = new vscode.Position(
            block.braceStartPosition.line,
            0,
          );
          editor.selection = new vscode.Selection(position, position);
          await vscode.commands.executeCommand("editor.unfold");
        }
      }
    },
  );

  // Register toggle all sx command (for status bar)
  const toggleAllSxCommand = vscode.commands.registerCommand(
    "sx-fold.toggleAllSx",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const document = editor.document;
      const blocks = findSxBlocks(document);

      if (blocks.length === 0) {
        vscode.window.showInformationMessage("No sx blocks found in this file");
        return;
      }

      // Toggle the state
      sxFolded = !sxFolded;
      updateStatusBar(statusBarItem, sxFolded);

      // Save current cursor position
      const originalSelection = editor.selection;

      for (const block of blocks) {
        if (block.braceStartPosition.line < block.braceEndPosition.line) {
          const position = new vscode.Position(
            block.braceStartPosition.line,
            0,
          );
          editor.selection = new vscode.Selection(position, position);
          if (sxFolded) {
            await vscode.commands.executeCommand("editor.fold");
          } else {
            await vscode.commands.executeCommand("editor.unfold");
          }
        }
      }

      // Restore cursor position
      editor.selection = originalSelection;
      editor.revealRange(originalSelection);
    },
  );

  context.subscriptions.push(
    foldingProvider,
    hoverProvider,
    toggleFoldCommand,
    showHomePageCommand,
    foldAllSxCommand,
    unfoldAllSxCommand,
    toggleAllSxCommand,
    statusBarItem,
  );
}

/**
 * Update status bar item text and tooltip
 */
function updateStatusBar(
  statusBarItem: vscode.StatusBarItem,
  folded: boolean,
): void {
  if (folded) {
    statusBarItem.text = "$(fold-up) SX: Folded";
    statusBarItem.tooltip = "Click to unfold all sx blocks";
  } else {
    statusBarItem.text = "$(fold-down) SX: Expanded";
    statusBarItem.tooltip = "Click to fold all sx blocks";
  }
}

/**
 * Generate HTML for the home page webview
 */
function getHomePageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SX Fold - Home</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 20px 40px;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    h1 {
      color: var(--vscode-textLink-foreground);
      border-bottom: 2px solid var(--vscode-textLink-foreground);
      padding-bottom: 10px;
    }
    h2 {
      color: var(--vscode-textPreformat-foreground);
      margin-top: 30px;
    }
    code {
      background-color: var(--vscode-textCodeBlock-background);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Fira Code', 'Consolas', monospace;
    }
    pre {
      background-color: var(--vscode-textCodeBlock-background);
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
    }
    kbd {
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.9em;
      box-shadow: 0 2px 0 var(--vscode-button-hoverBackground);
    }
    .feature {
      background-color: var(--vscode-editor-inactiveSelectionBackground);
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .feature h3 {
      margin-top: 0;
      color: var(--vscode-textLink-activeForeground);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    th {
      background-color: var(--vscode-editor-inactiveSelectionBackground);
    }
    .emoji {
      font-size: 1.2em;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <h1><span class="emoji">📦</span>SX Fold Extension</h1>
  <p>A VS Code extension for folding, previewing, and managing React/MUI <code>sx</code> props.</p>

  <h2><span class="emoji">✨</span>Features</h2>
  
  <div class="feature">
    <h3>🔽 Folding Support</h3>
    <p>Automatically detects and folds multi-line <code>sx</code> prop objects. When folded, displays as <code>sx={{...}}</code></p>
  </div>

  <div class="feature">
    <h3>👁️ Hover Preview</h3>
    <p>Hover over the <code>sx</code> keyword to see the full object content in a tooltip.</p>
  </div>

  <div class="feature">
    <h3>⌨️ Keyboard Shortcuts</h3>
    <p>Quickly toggle folding with keyboard shortcuts.</p>
  </div>

  <h2><span class="emoji">⌨️</span>Keyboard Shortcuts</h2>
  <table>
    <tr>
      <th>Command</th>
      <th>Mac</th>
      <th>Windows/Linux</th>
    </tr>
    <tr>
      <td>Toggle SX Fold</td>
      <td><kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd></td>
      <td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd></td>
    </tr>
    <tr>
      <td>Fold All SX</td>
      <td><kbd>Cmd</kbd> + <kbd>K</kbd> <kbd>Cmd</kbd> + <kbd>S</kbd></td>
      <td><kbd>Ctrl</kbd> + <kbd>K</kbd> <kbd>Ctrl</kbd> + <kbd>S</kbd></td>
    </tr>
    <tr>
      <td>Unfold All SX</td>
      <td><kbd>Cmd</kbd> + <kbd>K</kbd> <kbd>Cmd</kbd> + <kbd>U</kbd></td>
      <td><kbd>Ctrl</kbd> + <kbd>K</kbd> <kbd>Ctrl</kbd> + <kbd>U</kbd></td>
    </tr>
  </table>

  <h2><span class="emoji">📝</span>Supported Patterns</h2>
  <pre><code>// JSX prop style
&lt;Box sx={{ margin: 2 }} /&gt;

// With spaces around equals
&lt;Box sx = {{ padding: 1 }} /&gt;

// Object property style
const styles = {
  sx: {
    color: 'red'
  }
};

// Multi-line
&lt;Box
  sx={{
    mt: 2,
    mb: 3
  }}
/&gt;</code></pre>

  <h2><span class="emoji">⚙️</span>Configuration</h2>
  <table>
    <tr>
      <th>Setting</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
    <tr>
      <td><code>sxFold.ignoreCommentedSx</code></td>
      <td>Ignore <code>sx</code> inside comments (// sx or /* sx */)</td>
      <td><code>true</code></td>
    </tr>
  </table>

  <h2><span class="emoji">🎯</span>Commands</h2>
  <p>Open Command Palette (<kbd>Cmd</kbd>/<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>) and search for:</p>
  <ul>
    <li><code>SX Fold: Toggle Fold</code> - Toggle fold at cursor</li>
    <li><code>SX Fold: Fold All SX</code> - Fold all sx blocks</li>
    <li><code>SX Fold: Unfold All SX</code> - Unfold all sx blocks</li>
    <li><code>SX Fold: Show Home Page</code> - Show this page</li>
  </ul>

  <h2><span class="emoji">📚</span>Supported Languages</h2>
  <ul>
    <li>JavaScript (.js)</li>
    <li>TypeScript (.ts)</li>
    <li>TypeScript React (.tsx)</li>
    <li>JavaScript React (.jsx)</li>
  </ul>

  <hr>
  <p style="text-align: center; opacity: 0.7;">Made with ❤️ for React/MUI developers</p>
</body>
</html>`;
}

export function deactivate() {
  console.log("sx-fold extension is now deactivated");
}

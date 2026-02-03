<p align="center">
  <img src="images/icon.svg" alt="SX Fold Logo" width="128" height="128">
</p>

<h1 align="center">SX Fold</h1>

<p align="center">
  <b>Declutter your React/MUI code by folding sx props</b>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=hasanshahrear.sx-fold">
    <img src="https://img.shields.io/visual-studio-marketplace/v/hasanshahrear.sx-fold?color=blue&label=VS%20Code%20Marketplace" alt="VS Code Marketplace">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=hasanshahrear.sx-fold">
    <img src="https://img.shields.io/visual-studio-marketplace/i/hasanshahrear.sx-fold?color=green" alt="Installs">
  </a>
  <a href="https://github.com/hasanshahrear/sx-fold/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/hasanshahrear/sx-fold" alt="License">
  </a>
</p>

---

## 🎯 What is SX Fold?

**SX Fold** is a VS Code extension designed for React developers using Material-UI (MUI). It helps you manage large `sx` prop objects by:

- **Folding** multi-line `sx` blocks into a clean `sx={{...}}` format
- **Previewing** the full content on hover
- **Toggling** all `sx` blocks with a single click

> 💡 **Perfect for:** Large React components with extensive MUI styling

---

## ✨ Features

### 📁 Smart Folding

Fold multi-line `sx` props to keep your code clean and readable:

```jsx
// Before folding
<Box
  sx={{
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: 3,
    backgroundColor: 'primary.main'
  }}
>

// After folding
<Box
  sx={{...}}
>
```

### 👁️ Hover Preview

Hover over any `sx` keyword to instantly preview its content without scrolling:

![Hover Preview](images/hover-preview.png)

### 🔘 Status Bar Toggle

Click the status bar button to fold/unfold **all** `sx` blocks in the current file:

| State    | Display                     |
| -------- | --------------------------- |
| Expanded | `$(fold-down) SX: Expanded` |
| Folded   | `$(fold-up) SX: Folded`     |

### ⌨️ Keyboard Shortcuts

| Command             | Mac                | Windows/Linux        |
| ------------------- | ------------------ | -------------------- |
| Toggle SX at cursor | `Cmd + Shift + X`  | `Ctrl + Shift + X`   |
| Fold all SX         | `Cmd + K, Cmd + S` | `Ctrl + K, Ctrl + S` |
| Unfold all SX       | `Cmd + K, Cmd + U` | `Ctrl + K, Ctrl + U` |

---

## 📝 Supported Patterns

SX Fold intelligently detects various `sx` prop formats:

```jsx
// ✅ JSX prop style
<Box sx={{ margin: 2 }} />

// ✅ With spaces
<Box sx = {{ padding: 1 }} />

// ✅ Object property style
const styles = {
  sx: {
    color: 'red'
  }
};

// ✅ Colon with double braces
sx:{{
  backgroundColor: 'blue'
}}

// ✅ Multi-line with any formatting
<Box
  sx={{
    mt: 2,
    mb: 3,
    '&:hover': {
      opacity: 0.8
    }
  }}
/>
```

---

## 🚀 Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Cmd/Ctrl + P`
3. Type `ext install hasanshahrear.sx-fold`
4. Press Enter

### From VSIX File

1. Download the `.vsix` file from [Releases](https://github.com/hasanshahrear/sx-fold/releases)
2. Open VS Code
3. Press `Cmd/Ctrl + Shift + P`
4. Type `Extensions: Install from VSIX...`
5. Select the downloaded file

---

## ⚙️ Configuration

Open Settings (`Cmd/Ctrl + ,`) and search for "SX Fold":

| Setting                    | Description                                         | Default |
| -------------------------- | --------------------------------------------------- | ------- |
| `sxFold.ignoreCommentedSx` | Ignore `sx` inside comments (`// sx` or `/* sx */`) | `true`  |

---

## 🎮 Commands

Open Command Palette (`Cmd/Ctrl + Shift + P`) and type:

| Command                   | Description                          |
| ------------------------- | ------------------------------------ |
| `SX Fold: Toggle Fold`    | Toggle fold at cursor position       |
| `SX Fold: Fold All SX`    | Fold all sx blocks in current file   |
| `SX Fold: Unfold All SX`  | Unfold all sx blocks in current file |
| `SX Fold: Toggle All SX`  | Toggle all sx blocks (fold/unfold)   |
| `SX Fold: Show Home Page` | Open extension home page             |

---

## 📚 Supported Languages

- JavaScript (`.js`)
- TypeScript (`.ts`)
- JavaScript React (`.jsx`)
- TypeScript React (`.tsx`)

---

## 🔧 How It Works

SX Fold uses a **robust brace-matching algorithm** instead of fragile regex:

1. **Find** the `sx` keyword using word boundary matching
2. **Scan** forward to locate the first opening brace `{`
3. **Count** brace depth to find the matching closing brace `}`
4. **Handle** nested objects and string literals correctly

This approach ensures reliable detection across various coding styles and edge cases.

---

## 🐛 Known Issues

- Folding may not work perfectly with extremely complex nested template literals
- The status bar toggle state is per-session (resets when VS Code restarts)

---

## 📋 Changelog

### v1.0.0

- Initial release
- Folding support for `sx` props
- Hover preview functionality
- Status bar toggle button
- Keyboard shortcuts
- Configuration for ignoring commented code

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Hasan Shahrear**

- GitHub: [@hasanshahrear](https://github.com/hasanshahrear)

---

<p align="center">
  Made with ❤️ for React/MUI developers
</p>

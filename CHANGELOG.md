# Changelog

All notable changes to the "SX Fold" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-02

### Added

- 🔽 **Folding Support** - Automatically detect and fold multi-line `sx` prop objects
- 👁️ **Hover Preview** - View full `sx` content by hovering over the keyword
- 🔘 **Status Bar Toggle** - One-click button to fold/unfold all `sx` blocks
- ⌨️ **Keyboard Shortcuts**
  - `Cmd/Ctrl + Shift + X` - Toggle fold at cursor
  - `Cmd/Ctrl + K, Cmd/Ctrl + S` - Fold all sx
  - `Cmd/Ctrl + K, Cmd/Ctrl + U` - Unfold all sx
- ⚙️ **Configuration** - Option to ignore `sx` inside comments
- 📚 **Multi-language Support** - Works with JS, TS, JSX, and TSX files
- 📝 **Pattern Support** - Detects various sx formats:
  - `sx={{ }}`
  - `sx = {{ }}`
  - `sx: { }`
  - `sx:{{ }}`

### Technical

- Robust brace-matching algorithm (no fragile regex)
- Proper handling of nested objects and string literals
- Comment detection for single-line and multi-line comments

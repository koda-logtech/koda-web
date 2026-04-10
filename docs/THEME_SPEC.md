# Theme System Spec - Dark/Light Mode

## Objective
Implement a theme system that allows users to toggle between Light and Dark modes using a button in the sidebar.

## 1. CSS Variables (global.css)
Refactor `src/styles/global.css` to use variables that change based on a data attribute (`data-theme="dark"`) on the `html` or `body` tag.

### Variables to define:
- `--bg-color`
- `--sidebar-bg`
- `--card-bg`
- `--text-color`
- `--text-secondary`
- `--border-color`
- `--input-bg`

### Themes:
- **Light (Default):**
  - `--bg-color`: #F4F7F6
  - `--sidebar-bg`: #f5f5f5
  - `--card-bg`: #ffffff
  - `--text-color`: #2C3E50
  - `--text-secondary`: #666666
  - `--border-color`: #DCDDE1
  - `--input-bg`: #f9f9f9

- **Dark:**
  - `--bg-color`: #121212
  - `--sidebar-bg`: #1e1e1e
  - `--card-bg`: #2d2d2d
  - `--text-color`: #e0e0e0
  - `--text-secondary`: #b0b0b0
  - `--border-color`: #444444
  - `--input-bg`: #333333

## 2. Theme Context
Create `src/contexts/ThemeContext.tsx` to:
- Manage the `theme` state ('light' | 'dark').
- Provide a `toggleTheme` function.
- Persist the preference in `localStorage`.
- Update the `data-theme` attribute on the `document.documentElement`.

## 3. UI Implementation (Dashboard Sidebar)
Add the toggle button in `src/pages/Dashboard/Dashboard.tsx` in the `sidebar-footer-links` section.
- Icon: Sun for light mode, Moon for dark mode.
- Label: "Modo Escuro" / "Modo Claro".

## 4. Component Updates
Ensure the following use the new CSS variables:
- `Dashboard.css` (Sidebar background)
- `Management.css` (Cards and tables)
- `Input.css` (Input backgrounds)
- `ConfirmModal.css` (Modal background)

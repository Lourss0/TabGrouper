# Tab Grouper

A tiny Firefox extension (works in Firefox-based browsers like Zen) that groups tabs from the same website next to each other.

## Features

- Organize all tabs by website in one click or with **Alt+Shift+G**
- Optional **auto-organize**: tabs get regrouped when their URL changes (toggle in the popup or by right-clicking the toolbar button)
- Leaves pinned tabs and hidden tabs (e.g. other workspaces) alone
- Groups keep the order in which each site first appeared; tab order inside a group is preserved
- No data collected, no network requests

## Install (from source, temporary)

1. Clone this repo
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on...** and select `manifest.json`

Temporary add-ons are removed when the browser restarts.

## Usage

| Action | How |
| --- | --- |
| Organize now | Click the toolbar button, then **Organize tabs**, or press `Alt+Shift+G` |
| Toggle auto-organize | Checkbox in the popup, or right-click the toolbar button |

The badge shows `OK` or `ERR` for a moment after organizing.

## Permissions

- `tabs`: read tab URLs and reorder tabs
- `storage`: remember the auto-organize setting
- `menus`: the right-click toggle on the toolbar button

## Known limitations

- Subdomains count as different sites (`docs.google.com` and `mail.google.com` are separate groups)
- All non-web pages of the same type (`about:`, etc.) are grouped together

## License

MIT

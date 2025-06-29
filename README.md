# WoW Classic Era Addons Homebrew Tap

This is a [third-party Homebrew tap](https://docs.brew.sh/Taps) that allows users to install classic-era WoW addons via [`brew`](https://brew.sh) on macOS.

## Usage

Add the tap.

```bash
brew tap dbk91/wow-classic-era-addons
```

Install addons with the fully-qualified name.

```bash
brew install --cask dbk91/tap/wow-classic-era-addons/<addon-name>
```

## Available Addons

```
brew install dbk91/tap/wow-classic-era-addons/questie
```

## Development

This repository uses the GitHub JavaScript SDK to automatically check for addon updates. The update script is located at `.github/scripts/check-for-addon-updates.ts` and runs with Bun.

### Running the Update Script Locally

```bash
# Install dependencies
bun install

# Run the update script
bun run .github/scripts/check-for-addon-updates.ts
```

For higher GitHub API rate limits, you can optionally set a `GITHUB_TOKEN` environment variable with a personal access token.

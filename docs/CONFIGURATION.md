# MegaLinter Azure DevOps Extension: Configuration Guide

This document covers advanced configuration options for the extension.

## Using a Configuration File

Create a `.mega-linter.yml` in your repo root. See [MegaLinter docs](https://megalinter.io/latest/configuration/) for all options.

## Environment Variables

You can pass environment variables via the `env` input. Example:

```yaml
- task: MegaLinter@1
  inputs:
    env: "DISABLE_LINTERS=SPELL_CSPELL,COPYPASTE_JSCPD"
```

## Common Variables

| Variable              | Description                                |
|-----------------------|--------------------------------------------|
| ENABLE_LINTERS        | Comma-separated list of linters to enable  |
| DISABLE_LINTERS       | Comma-separated list of linters to disable |
| VALIDATE_ALL_CODEBASE | Lint all files vs only changed files       |
| APPLY_FIXES           | Auto-fix issues where supported            |
| MEGALINTER_CONFIG     | Path to custom config file                 |

See the [MegaLinter docs](https://megalinter.io/latest/configuration/) for more.

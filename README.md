# MegaLinter Azure DevOps Extension

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](LICENSE.md)
[![MegaLinter](https://img.shields.io/badge/MegaLinter-v9-success)](https://megalinter.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green)](https://nodejs.org/)

## Overview

The **MegaLinter Azure DevOps Extension** brings the power of [Ox Security MegaLinter](https://megalinter.io/latest/) directly into your Azure DevOps pipelines. This extension provides a simple, UI-driven task that enables comprehensive code quality analysis across 50+ languages, formats, and tooling configurations.

### What is MegaLinter?

MegaLinter is an Open-Source tool that analyzes your code consistency and quality across multiple languages. It runs on your CI/CD pipeline and provides detailed reports on linting issues, security vulnerabilities, code style violations, and more—all in one consolidated workflow.

### Why Use This Extension?

- **Comprehensive Coverage**: Lint and analyze code in over 50 programming languages and formats
- **One-Click Integration**: Add powerful code quality checks to your Azure DevOps pipelines with minimal configuration
- **Optimized Performance**: Choose from specialized flavors for faster execution tailored to your tech stack
- **Automated Fixes**: Automatically fix linting issues and create pull requests with corrections
- **Developer-Friendly**: PR comment integration provides immediate feedback to developers
- **Enterprise-Ready**: Built with security scanning, permission management, and Docker caching support

### Target Audience

This extension is designed for:
- **Development Teams** implementing code quality standards in Azure DevOps
- **DevOps Engineers** setting up CI/CD pipelines with automated quality gates
- **Security Teams** requiring consistent SAST (Static Application Security Testing) across projects
- **Open Source Projects** looking for comprehensive, free code analysis
- **Organizations** transitioning to or standardizing on Azure DevOps

---

## Key Features

This extension provides a comprehensive set of features to enhance your code quality workflow:

| Feature | Description |
|---------|-------------|
| **50+ Language Support** | Analyze code in JavaScript, TypeScript, Python, Java, Go, C#, Ruby, PHP, Rust, and many more |
| **Multiple Flavors** | Choose optimized Docker images for your tech stack (all, javascript, python, security, etc.) to reduce image size and pull time |
| **PR Comment Integration** | Automatically post linting results as comments on pull requests for immediate developer feedback |
| **Auto-Fix Capabilities** | Automatically fix code issues where supported and optionally create pull requests with the corrections |
| **Docker Image Caching** | Built-in intelligent caching reduces Docker pull times in CI/CD pipelines |
| **Flexible Configuration** | Configure via YAML file, environment variables, or task inputs—choose what works best for your team |
| **Security Scanning** | Includes security-focused linters to catch vulnerabilities early in development |
| **Customizable Reporting** | Generate detailed HTML, JSON, and text reports with configurable output paths |
| **Incremental Linting** | Option to lint only changed files for faster feedback on pull requests |
| **Build Integration** | Fails the build when critical issues are detected, enforcing quality gates |

### Supported Linters

MegaLinter includes linters for:
- **Languages**: JavaScript, TypeScript, Python, Java, Go, C#, PHP, Ruby, Rust, Swift, Kotlin, and more
- **Formats**: JSON, YAML, XML, Markdown, HTML, CSS, SCSS
- **Infrastructure as Code**: Terraform, Ansible, Dockerfile, Kubernetes
- **Security**: Secret detection, dependency scanning, SAST tools
- **Documentation**: Spell checking, link validation, technical writing standards

For the complete list, visit the [MegaLinter documentation](https://megalinter.io/latest/supported-linters/).

---

## Getting Started

### Installation

1. **Install the Extension**
   - Visit the [Visual Studio Marketplace](https://marketplace.visualstudio.com/) and search for "MegaLinter"
   - Click "Get it free" and select your Azure DevOps organization
   - Alternatively, navigate to your Azure DevOps organization settings → Extensions → Browse Marketplace

2. **Verify Installation**
   - Go to your Azure DevOps organization
   - Navigate to Organization Settings → Extensions
   - Confirm "MegaLinter" appears in your installed extensions list

### Basic Usage

#### Step 1: Add the Task to Your Pipeline

Create or edit your `azure-pipelines.yml` file and add the MegaLinter task:

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - checkout: self
    persistCredentials: true  # Required for PR comments and auto-fix PRs

  - task: MegaLinter@1
    displayName: 'Run MegaLinter Code Analysis'
    inputs:
      flavor: 'all'  # Choose a flavor that matches your project
    env:
      SYSTEM_ACCESSTOKEN: $(System.AccessToken)  # Required for PR integration
```

**Screenshot Placeholder**: *Screenshot showing the Azure DevOps pipeline editor with the MegaLinter task added*

#### Step 2: Configure the Task (Optional)

You can configure the task through the UI or by editing the YAML directly:

**Using the Azure DevOps Task Assistant:**
1. In your pipeline editor, click "Show assistant" (right panel)
2. Search for "MegaLinter"
3. Configure the options through the UI form
4. Click "Add" to insert the task into your pipeline

**Screenshot Placeholder**: *Screenshot of the MegaLinter task configuration UI in Azure DevOps showing available options*

**Common Configuration Options:**

```yaml
- task: MegaLinter@1
  displayName: 'Run MegaLinter'
  inputs:
    flavor: 'javascript'           # Optimized flavor for your stack
    release: 'v9'                  # MegaLinter version
    fix: true                      # Auto-fix issues
    createFixPR: true              # Create PR with fixes
    enablePRComments: true         # Post results as PR comments
    path: '$(Build.SourcesDirectory)'  # Root directory to lint
    disableLinters: 'SPELL_CSPELL' # Disable specific linters
  env:
    SYSTEM_ACCESSTOKEN: $(System.AccessToken)
```

#### Step 3: Run Your Pipeline

1. Commit and push your `azure-pipelines.yml` file
2. The pipeline will automatically trigger
3. MegaLinter will analyze your code and report results

**Screenshot Placeholder**: *Screenshot showing a successful MegaLinter run in Azure DevOps with the task output*

#### Step 4: Review Results

MegaLinter provides results through multiple channels:

- **Pipeline Logs**: Detailed linting output in the task logs
- **PR Comments**: Issues posted as comments on pull requests (when enabled)
- **Reports**: HTML and JSON reports available as pipeline artifacts
- **Build Status**: Pipeline fails if critical issues are found

**Screenshot Placeholder**: *Screenshot showing MegaLinter PR comments on a pull request with linting feedback*

### Advanced Usage Examples

#### Example 1: JavaScript/TypeScript Project

```yaml
- task: MegaLinter@1
  inputs:
    flavor: 'javascript'
    fix: true
    createFixPR: true
  env:
    SYSTEM_ACCESSTOKEN: $(System.AccessToken)
    VALIDATE_ALL_CODEBASE: 'false'  # Only lint changed files
```

#### Example 2: Python Project with Custom Configuration

```yaml
- task: MegaLinter@1
  inputs:
    flavor: 'python'
    configFile: '.mega-linter.yml'
    reportsPath: '$(Build.ArtifactStagingDirectory)/megalinter-reports'
  env:
    SYSTEM_ACCESSTOKEN: $(System.AccessToken)
```

#### Example 3: Security-Focused Scanning

```yaml
- task: MegaLinter@1
  inputs:
    flavor: 'security'
    release: 'v9'
  env:
    ENABLE_LINTERS: 'CREDENTIALS,REPOSITORY,SECRETS'
```

#### Example 4: Multi-Language Project

```yaml
- task: MegaLinter@1
  inputs:
    flavor: 'all'
    env: 'DISABLE_LINTERS=SPELL_CSPELL,COPYPASTE_JSCPD'
  env:
    SYSTEM_ACCESSTOKEN: $(System.AccessToken)
```

---

## Configuration Options

### Available Flavors

MegaLinter offers optimized flavors to reduce Docker image size and improve performance:

| Flavor | Description | Use Case |
|--------|-------------|----------|
| **all** | All available linters (largest image) | Multi-language projects, comprehensive analysis |
| **ci_light** | Lightweight CI optimized | Fast CI feedback, essential checks only |
| **cupcake** | Popular linters for common projects | General-purpose projects |
| **documentation** | Documentation files only | Documentation-heavy repositories |
| **dotnet** | .NET projects | C#, F#, VB.NET applications |
| **dotnetweb** | .NET web projects | ASP.NET, Blazor applications |
| **formatters** | Code formatters only | Auto-formatting workflows |
| **go** | Go projects | Go applications and libraries |
| **java** | Java projects | Java, Kotlin, Scala applications |
| **javascript** | JavaScript/TypeScript projects | Node.js, React, Angular, Vue applications |
| **php** | PHP projects | PHP, Laravel, WordPress applications |
| **python** | Python projects | Python applications and libraries |
| **ruby** | Ruby projects | Ruby, Rails applications |
| **rust** | Rust projects | Rust applications and libraries |
| **salesforce** | Salesforce projects | Salesforce development |
| **security** | Security-focused linters | Security audits, vulnerability scanning |
| **swift** | Swift projects | iOS, macOS applications |
| **terraform** | Terraform/IaC projects | Infrastructure as Code |

For detailed flavor information, see the [MegaLinter Flavors Documentation](https://megalinter.io/latest/flavors/).

### Task Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | `$(Pipeline.Workspace)` | Root directory containing files to lint |
| `flavor` | string | `all` | MegaLinter flavor optimized for your stack |
| `release` | string | `v9` | MegaLinter Docker image version |
| `image` | string | - | Override Docker image (including custom registries) |
| `fix` | boolean | `false` | Automatically apply fixes to your files |
| `createFixPR` | boolean | `true` | Create a pull request with auto-fixes |
| `enablePRComments` | boolean | `false` | Post linting results as PR comments |
| `configFile` | string | - | Path to MegaLinter configuration file |
| `reportsPath` | string | - | Directory for MegaLinter reports output |
| `disableLinters` | string | - | Comma-separated list of linters to disable |
| `env` | string | - | Environment variables for MegaLinter configuration |
| `runnerVersion` | string | `latest` | Version of mega-linter-runner npm package |
| `containerName` | string | - | Custom Docker container name |
| `removeContainer` | boolean | `false` | Remove Docker container after completion |
| `install` | boolean | `false` | Generate MegaLinter configuration files |

### Configuration File

You can create a `.mega-linter.yml` file in your repository root for advanced configuration:

```yaml
# .mega-linter.yml example
APPLY_FIXES: all
VALIDATE_ALL_CODEBASE: false
DISABLE_LINTERS:
  - SPELL_CSPELL
  - COPYPASTE_JSCPD
MARKDOWN_MARKDOWNLINT_CONFIG_FILE: .markdownlint.json
JAVASCRIPT_ES_CONFIG_FILE: .eslintrc.json
```

See the [MegaLinter Configuration Documentation](https://megalinter.io/latest/configuration/) for all available options.

---

## Pull Request Integration

MegaLinter seamlessly integrates with Azure DevOps pull requests to provide immediate feedback to developers.

### PR Comment Reporter

When enabled, MegaLinter posts detailed linting results as comments directly on your pull requests:

- **Automatic Activation**: Comments are automatically enabled for PR builds (`Build.Reason = 'PullRequest'`)
- **Manual Override**: Set `enablePRComments: true` to force enable for all builds
- **Inline Feedback**: Issues are posted as comments on the specific lines of code
- **Status Updates**: Summary comment shows overall linting status

**Screenshot Placeholder**: *Screenshot showing MegaLinter comments on a pull request with file-level and line-level feedback*

### Auto-Fix Pull Requests

MegaLinter can automatically fix issues and create a pull request with the corrections:

1. Set `fix: true` to enable auto-fixing
2. Set `createFixPR: true` to automatically create a PR with fixes
3. MegaLinter will apply fixes and push a new PR (e.g., "MegaLinter auto-fixes")
4. Review and merge the auto-fix PR

**Example Configuration:**

```yaml
- task: MegaLinter@1
  inputs:
    fix: true
    createFixPR: true
  env:
    SYSTEM_ACCESSTOKEN: $(System.AccessToken)
```

### Required Permissions

To use PR comments or auto-fix PRs, configure these permissions:

#### 1. Pass System Access Token

Add the token as an environment variable:

```yaml
env:
  SYSTEM_ACCESSTOKEN: $(System.AccessToken)
```

#### 2. Enable Persistent Credentials

Add `persistCredentials: true` to your checkout step:

```yaml
- checkout: self
  persistCredentials: true
```

#### 3. Grant Build Service Permissions

Navigate to your Azure DevOps repository settings and grant the following permissions to the **Build Service** account:

| Permission | Required For |
|------------|--------------|
| **Contribute** | Pushing auto-fix commits |
| **Contribute to pull requests** | Creating and commenting on PRs |
| **Create branch** | Creating auto-fix branches |

**To configure permissions:**
1. Go to Project Settings → Repositories → Your Repository
2. Navigate to Security tab
3. Find "{Project Name} Build Service ({Organization Name})"
4. Grant the required permissions listed above

See the [full permissions guide](docs/CONFIGURATION.md#required-permissions) for detailed steps with screenshots.

---

## Performance Optimization

### Docker Image Caching

MegaLinter automatically checks for cached Docker images before pulling, significantly reducing pipeline execution time:

- **Self-Hosted Agents**: Docker images persist between runs automatically
- **Microsoft-Hosted Agents**: Implement Docker caching in your pipeline (see example below)

**Example Pipeline with Docker Caching:**

```yaml
variables:
  MEGALINTER_IMAGE: 'oxsecurity/megalinter-javascript:v9'

steps:
  # Cache Docker images using Pipeline Caching
  - task: Cache@2
    displayName: 'Cache Docker images'
    inputs:
      key: 'docker | "$(Agent.OS)" | "$(MEGALINTER_IMAGE)"'
      path: '$(Pipeline.Workspace)/docker-cache'
      restoreKeys: |
        docker | "$(Agent.OS)"

  # Load cached image if exists
  - script: |
      if [ -f "$(Pipeline.Workspace)/docker-cache/megalinter.tar" ]; then
        docker load -i $(Pipeline.Workspace)/docker-cache/megalinter.tar
        echo "Loaded cached Docker image"
      fi
    displayName: 'Load cached Docker image'

  # Run MegaLinter (will skip pull if image loaded from cache)
  - task: MegaLinter@1
    inputs:
      flavor: 'javascript'
      release: 'v9'

  # Save image to cache after run
  - script: |
      mkdir -p $(Pipeline.Workspace)/docker-cache
      docker save $(MEGALINTER_IMAGE) -o $(Pipeline.Workspace)/docker-cache/megalinter.tar
    displayName: 'Save Docker image to cache'
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
```

### Best Practices

- **Choose the Right Flavor**: Use specific flavors (e.g., `javascript`, `python`) instead of `all` to reduce image size
- **Incremental Linting**: Set `VALIDATE_ALL_CODEBASE: false` to only lint changed files in PRs
- **Disable Unused Linters**: Use `disableLinters` parameter to skip linters you don't need
- **Self-Hosted Agents**: For best performance, use self-hosted agents where Docker images persist

---

## Documentation

### Extension Documentation
- [Configuration Guide](docs/CONFIGURATION.md) - Advanced configuration options and environment variables
- [Flavors Reference](docs/FLAVORS.md) - Complete list of available MegaLinter flavors
- [Changelog](CHANGELOG.md) - Version history and release notes
- [Contributing](CONTRIBUTING.md) - Guidelines for contributing to this extension
- [Security Policy](SECURITY.md) - Security guidelines and vulnerability reporting

### MegaLinter Documentation
- [MegaLinter Official Documentation](https://megalinter.io/latest/)
- [Supported Linters](https://megalinter.io/latest/supported-linters/)
- [Configuration Options](https://megalinter.io/latest/configuration/)
- [Reporters](https://megalinter.io/latest/reporters/)
- [Flavors](https://megalinter.io/latest/flavors/)

---

## Support and Feedback

We welcome your feedback, questions, and contributions!

### Get Help

- **GitHub Issues**: Report bugs or request features at [GitHub Issues](https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado/issues)
- **GitHub Discussions**: Ask questions and share ideas at [GitHub Discussions](https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado/discussions)
- **Documentation**: Check our [Configuration Guide](docs/CONFIGURATION.md) for common questions

### Contributing

We appreciate contributions from the community! Here's how you can help:

1. **Report Issues**: Found a bug? [Open an issue](https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado/issues/new)
2. **Suggest Features**: Have an idea? [Start a discussion](https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado/discussions)
3. **Submit Pull Requests**: Read our [Contributing Guide](CONTRIBUTING.md) and submit a PR
4. **Improve Documentation**: Help us improve docs by submitting corrections or additions

### Links

- **GitHub Repository**: [https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado](https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado)
- **Visual Studio Marketplace**: [MegaLinter Extension](https://marketplace.visualstudio.com/)
- **MegaLinter Project**: [https://megalinter.io](https://megalinter.io)

### Stay Connected

- ⭐ Star the repository to show your support
- 👀 Watch the repository for updates
- 🐛 Report issues to help improve the extension



---

## Frequently Asked Questions

### Q: Which flavor should I use for my project?

**A:** Choose based on your primary tech stack:
- Single-language projects: Use the specific flavor (e.g., `javascript`, `python`, `dotnet`)
- Multi-language projects: Start with `cupcake` for common linters, or `all` for comprehensive coverage
- Security audits: Use the `security` flavor
- CI/CD optimization: Use `ci_light` for faster feedback

### Q: How do I reduce pipeline execution time?

**A:** 
1. Use a specific flavor instead of `all` to reduce Docker image size
2. Enable Docker image caching (see [Performance Optimization](#performance-optimization))
3. Set `VALIDATE_ALL_CODEBASE: false` to lint only changed files
4. Use self-hosted agents where Docker images persist between runs
5. Disable linters you don't need with `disableLinters` parameter

### Q: Why is my build failing after adding MegaLinter?

**A:** MegaLinter intentionally fails the build when linting issues are detected. This enforces quality gates. To address:
1. Review the linting errors in the task output
2. Fix the issues in your code
3. Or configure MegaLinter to disable specific linters: `disableLinters: 'LINTER_NAME'`
4. Or adjust severity settings in your `.mega-linter.yml` configuration

### Q: Can I use MegaLinter with private Docker registries?

**A:** Yes! Use the `image` parameter to specify a custom Docker image from any registry:

```yaml
- task: MegaLinter@1
  inputs:
    image: 'myregistry.azurecr.io/megalinter:custom'
```

### Q: How do I disable specific linters?

**A:** Use the `disableLinters` parameter or environment variables:

```yaml
- task: MegaLinter@1
  inputs:
    disableLinters: 'SPELL_CSPELL,MARKDOWN_MARKDOWNLINT'
```

Or in `.mega-linter.yml`:
```yaml
DISABLE_LINTERS:
  - SPELL_CSPELL
  - MARKDOWN_MARKDOWNLINT
```

---

## Roadmap

### Completed ✅
- [x] Basic extension skeleton
- [x] Streaming output and Docker caching
- [x] PR comment and auto-fix PR features
- [x] Documentation and permission guidance
- [x] Support for all MegaLinter flavors
- [x] Comprehensive task input parameters

### In Progress 🚧
- [ ] Improved test coverage
- [ ] Marketplace publishing automation
- [ ] Enhanced error handling and diagnostics

### Planned 📋
- [ ] Visual task configuration templates
- [ ] Integration with Azure DevOps test results
- [ ] Support for custom reporter configurations
- [ ] Performance analytics and metrics
- [ ] Community feedback and enhancements

See [CHANGELOG.md](CHANGELOG.md) for release history and [GitHub Issues](https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado/issues) for detailed tracking.

---

## Built With

This extension is built using modern tools and frameworks:

- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[MegaLinter](https://megalinter.io/latest/)** - Core linting engine
- **[azure-pipelines-task-lib](https://www.npmjs.com/package/azure-pipelines-task-lib)** - Azure DevOps task SDK
- **[mega-linter-runner](https://www.npmjs.com/package/mega-linter-runner)** - MegaLinter NPM wrapper
- **[Prettier](https://prettier.io/)** - Code formatting
- **[pre-commit](https://pre-commit.com/)** - Git hook management
- **[CSpell](https://cspell.org/)** - Spell checking
- **[GitVersion](https://gitversion.net/)** - Semantic versioning

### Development Tools

This repository uses pre-commit hooks for code quality:
- JSON/YAML validation
- Secret detection with `detect-secrets`
- Line ending normalization
- CSpell spell checking
- Prettier formatting
- MegaLinter incremental checks

See `.pre-commit-config.yaml` for the complete configuration.



---

## Acknowledgements

- **MegaLinter** is an [Ox Security](https://ox.security/) project. This extension is **unofficial** but built with permission from Ox Security.
- Thanks to the **MegaLinter community** for creating and maintaining this powerful linting tool.
- Thanks to the **Azure DevOps community** for inspiration, support, and feedback.
- Special thanks to all [contributors](https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado/graphs/contributors) who help improve this extension.

---

## Contributors

Made with ❤️ by [@RolfMoleman](https://github.com/RolfMoleman)

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the **GPL-3.0 License**. See [LICENSE.md](LICENSE.md) for details.

### Third-Party Licenses

This extension uses the following open-source projects:
- **MegaLinter**: MIT License
- **azure-pipelines-task-lib**: MIT License
- **TypeScript**: Apache License 2.0

---

## Related Projects

- **[MegaLinter](https://megalinter.io)** - The core linting engine
- **[MegaLinter GitHub Action](https://github.com/marketplace/actions/megalinter)** - MegaLinter for GitHub Actions
- **[Ox Security](https://ox.security/)** - Security tools and platforms

---

<p align="center">
  <b>⭐ If you find this extension useful, please star the repository! ⭐</b>
</p>

<p align="center">
  <a href="https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado">GitHub</a> •
  <a href="https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado/issues">Issues</a> •
  <a href="https://github.com/DownAtTheBottomOfTheMoleHole/megalinter-ado/discussions">Discussions</a> •
  <a href="docs/CONFIGURATION.md">Documentation</a>
</p>

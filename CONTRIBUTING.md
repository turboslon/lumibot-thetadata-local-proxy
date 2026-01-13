# Contributing to ThetaData Local Proxy

First off, thank you for considering contributing to ThetaData Local Proxy! It's people like you that make this project better for everyone.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, configuration, etc.)
- **Describe the behavior you observed and what you expected**
- **Include your environment details**:
  - OS and version
  - Bun version (`bun --version`)
  - Node.js version (if applicable)
  - ThetaData Terminal version

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed enhancement**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `bun install`
3. **Make your changes**
4. **Add or update tests** as needed
5. **Ensure tests pass**: `bun test`
6. **Update documentation** if you're changing behavior
7. **Submit your pull request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/thetadata-local-proxy.git
cd thetadata-local-proxy

# Install dependencies
bun install

# Copy environment template
cp .env_template .env

# Start development server
bun run dev
```

## Project Structure

```
├── app/                    # Next.js App Router (API endpoints)
├── lib/                    # Core library code
│   ├── handlers/           # Request handlers
│   ├── factory/            # Handler factory
│   └── queueStore.ts       # Queue storage
├── test/                   # Test files
└── docs/                   # Documentation
```

## Coding Guidelines

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types when possible
- Use meaningful variable and function names

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Keep lines under 100 characters when practical

### Testing

- Write tests for new features
- Maintain or improve code coverage
- Tests should be in the `test/` directory
- Mirror the source structure in tests

### Commits

- Use clear, descriptive commit messages
- Reference issues when applicable (e.g., "Fix #123: ...")
- Keep commits focused and atomic

## Adding New Request Handlers

When adding support for a new ThetaData API endpoint:

1. Create a new handler in `lib/handlers/`
2. Extend the appropriate base handler class
3. Register the handler in `lib/factory/RequestHandlerFactory.ts`
4. Add tests in `test/lib/handlers/`
5. Document in `docs/REQUEST_TYPES.md`

## Questions?

Feel free to open an issue with your question. We're happy to help!

## Thank You!

Your contributions help make this project better for the entire community. We appreciate your time and effort!

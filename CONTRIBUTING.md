# Contributing Guide

This guide explains how to contribute to the Climate project, from setting up your development environment to getting your changes merged.

## Table of Contents
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Branch Naming](#branch-naming)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [CI/CD Pipeline](#cicd-pipeline)
- [Release Process](#release-process)
- [Knowledge Base Service](#knowledge-base-service)

## Development Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- Docker and Docker Compose
- Git

### Initial Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Jss-on/climagent.git
   cd climate
   ```

2. Set up frontend:
   ```bash
   cd web-frontend
   npm install
   ```

3. Set up backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. Set up pre-commit hooks:
   ```bash
   pip install pre-commit
   pre-commit install
   ```

## Development Workflow

### 1. Starting New Work

a. Update your local main branches:
   ```bash
   git checkout alpha
   git pull origin alpha
   ```

b. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### 2. During Development

a. Keep your branch up to date:
   ```bash
   git checkout alpha
   git pull origin alpha
   git checkout feature/your-feature-name
   git rebase alpha
   ```

b. Run local tests:
   ```bash
   # Frontend
   cd web-frontend
   npm run lint
   npm test

   # Backend
   cd backend
   flake8
   pytest
   ```

c. Commit your changes:
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

### 3. Preparing for Pull Request

a. Ensure your branch is up to date:
   ```bash
   git checkout alpha
   git pull origin alpha
   git checkout feature/your-feature-name
   git rebase alpha
   ```

b. Run all checks:
   ```bash
   # Frontend
   cd web-frontend
   npm run lint
   npm test

   # Backend
   cd backend
   flake8
   pytest
   ```

c. Push your changes:
   ```bash
   git push origin feature/your-feature-name
   ```

## Branch Naming

Follow these patterns for branch names:

- Features: `feature/descriptive-name`
- Bug fixes: `fix/issue-description`
- Hotfixes: `hotfix/critical-issue`
- Releases: `release/vX.Y.Z`

Examples:
- `feature/user-authentication`
- `fix/login-validation`
- `hotfix/security-vulnerability`
- `release/v1.2.0`

## Commit Guidelines

Follow the Conventional Commits specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add user authentication system
fix(ui): correct button alignment in dashboard
docs: update API documentation
```

## Pull Request Process

1. **Create Pull Request**
   - Create PR from your feature branch to `alpha`
   - Fill out the PR template completely
   - Link related issues

2. **PR Title Format**
   ```
   type(scope): description
   ```
   Example: `feat(auth): implement OAuth2 authentication`

3. **PR Description**
   - Describe the changes
   - List any breaking changes
   - Include testing instructions
   - Add screenshots for UI changes

4. **Review Process**
   - Address reviewer comments
   - Keep the PR updated with the target branch
   - Ensure all checks pass

5. **Merging**
   - Squash and merge to keep history clean
   - Delete the feature branch after merging

## CI/CD Pipeline

Our pipeline runs these checks:

1. **On Push to Feature Branch**
   - Linting
   - Unit tests
   - Build check

2. **On PR to Alpha**
   - All above checks
   - Integration tests
   - Version bump check

3. **On Merge to Alpha**
   - All above checks
   - Staging deployment
   - Version bump (alpha)

4. **On PR to Prod**
   - All above checks
   - Production readiness check

5. **On Merge to Prod**
   - All above checks
   - Version bump (release)
   - Production deployment

## Release Process

### 1. Regular Release
a. Create release branch:
   ```bash
   git checkout alpha
   git pull origin alpha
   git checkout -b release/vX.Y.Z
   ```

b. Update version:
   ```bash
   ./scripts/version.sh bump minor release/vX.Y.Z
   git add version.txt CHANGELOG.md
   git commit -m "chore: bump version to vX.Y.Z"
   git push origin release/vX.Y.Z
   ```

c. Create PR to prod branch

### 2. Hotfix Release
a. Create hotfix branch from prod:
   ```bash
   git checkout prod
   git pull origin prod
   git checkout -b hotfix/issue-description
   ```

b. Fix the issue and update version:
   ```bash
   ./scripts/version.sh bump patch hotfix/issue-description
   git add version.txt CHANGELOG.md
   git commit -m "fix: critical issue description"
   git push origin hotfix/issue-description
   ```

c. Create PR to prod branch

## Knowledge Base Service

### Development Setup

1. Install dependencies:
```bash
cd knowledge-base
pip install -r requirements.txt
```

2. Set up environment variables:
Create a `.env` file in the knowledge-base directory:
```bash
COHERE_API_KEY=your_cohere_api_key_here
```

3. Run tests:
```bash
pytest tests/ -v
```

### Docker Development

1. Build and run the service:
```bash
cd knowledge-base
docker-compose up app
```

2. Run tests in Docker:
```bash
docker-compose up test
```

### CI/CD Pipeline

The knowledge base service uses GitHub Actions for CI/CD:

1. **Testing**: All PRs and pushes trigger test runs
2. **Docker Build**: Successful merges to main/develop trigger Docker image builds
3. **Required Secrets**:
   - `COHERE_API_KEY`: For running tests
   - `DOCKERHUB_USERNAME`: For Docker image pushes
   - `DOCKERHUB_TOKEN`: For Docker Hub authentication

## Additional Resources

- [Branching Strategy](docs/BRANCHING_STRATEGY.md)
- [Versioning Guide](docs/VERSIONING.md)
- [API Documentation](docs/API.md)

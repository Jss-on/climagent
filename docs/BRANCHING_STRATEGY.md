# Branching Strategy

This document outlines our Git branching strategy and protection rules.

## Branch Structure

### Core Branches

1. **`prod` branch**
   - Main production branch (formerly 'main')
   - Contains production-ready code
   - Protected branch with strict rules
   - Only accepts merges from `alpha` and `hotfix/*` branches

2. **`alpha` branch**
   - Main development branch (formerly 'develop')
   - Contains code ready for next release
   - Protected branch
   - Accepts merges from `feature/*` and `release/*` branches

### Supporting Branches

3. **Feature Branches (`feature/*`)**
   - Naming convention: `feature/feature-name`
   - Created from: `alpha`
   - Merges into: `alpha`
   - Used for new features and non-emergency fixes
   - Example: `feature/user-authentication`

4. **Release Branches (`release/*`)**
   - Naming convention: `release/vX.Y.Z`
   - Created from: `alpha`
   - Merges into: `alpha` and `prod`
   - Used for release preparation
   - Example: `release/v1.2.0`

5. **Hotfix Branches (`hotfix/*`)**
   - Naming convention: `hotfix/issue-description`
   - Created from: `prod`
   - Merges into: `prod` and `alpha`
   - Used for emergency production fixes
   - Example: `hotfix/fix-login-crash`

## Branch Protection Rules

### For `prod` Branch
```
Branch name pattern: prod
√ Require a pull request before merging
√ Require approvals
√ Dismiss stale pull request approvals when new commits are pushed
√ Require status checks to pass before merging
√ Require branches to be up to date before merging
√ Include administrators
√ Allow force pushes: No
√ Allow deletions: No
```

### For `alpha` Branch
```
Branch name pattern: alpha
√ Require a pull request before merging
√ Require approvals
√ Require status checks to pass before merging
√ Require branches to be up to date before merging
√ Include administrators
√ Allow force pushes: No
√ Allow deletions: No
```

## Workflow

1. **Feature Development**
   ```
   alpha → feature/* → alpha
   ```

2. **Release Process**
   ```
   alpha → release/* → prod
   ```

3. **Hotfix Process**
   ```
   prod → hotfix/* → prod + alpha
   ```

## Deployment Workflow

### Staging Deployment
- Triggered automatically when:
  - Push to `alpha` branch
  - Push to `release/*` branches
- Deploys the latest successful build to staging environment

### Production Deployment
- Triggered ONLY when:
  - A pull request to `prod` branch is merged
  - The source branch can only be `alpha` or `hotfix/*`
- Requires successful CI pipeline run
- Deploys the exact commit that was merged to production

### Deployment Process
1. **Staging**:
   ```
   alpha/release/* branch → CI Pipeline → Staging Environment
   ```

2. **Production**:
   ```
   PR merge to prod → CI Pipeline → Production Environment
   ```

### Docker Images
- Images are tagged with both commit SHA and 'latest'
- Production deployments always use the specific commit SHA tag
- Format: `tensordt/climagent-[frontend|backend]:[sha|latest]`

## CI/CD Pipeline

The CI/CD pipeline is configured to run on:
- All pushes to `prod` and `alpha` branches
- All pushes to `feature/*`, `release/*`, and `hotfix/*` branches
- All pull requests targeting `prod` and `alpha` branches

### Docker Registry
- Repository: `tensordt/climagent`
- Image naming:
  - Frontend: `tensordt/climagent-frontend:[tag]`
  - Backend: `tensordt/climagent-backend:[tag]`
- Tags:
  - `latest`: Most recent successful build
  - `[git-sha]`: Specific commit version

### Required GitHub Secrets
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Your Docker Hub access token (for authentication)

## Best Practices

1. Always create feature branches from the latest `alpha`
2. Keep branches up to date with their parent branch
3. Delete feature branches after merging
4. Use meaningful and descriptive branch names
5. Follow the branch naming conventions strictly

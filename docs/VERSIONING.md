# Versioning Strategy

This document outlines our versioning strategy following Semantic Versioning (SemVer).

## Version Format

We follow the format: `MAJOR.MINOR.PATCH` (e.g., 1.2.3)

- **MAJOR**: Breaking/incompatible API changes
- **MINOR**: New features (backwards-compatible)
- **PATCH**: Bug fixes (backwards-compatible)

Additional labels for pre-release and build metadata:
- Alpha: `-alpha.{number}` (e.g., 1.2.3-alpha.1)
- Release Candidate: `-rc.{number}` (e.g., 1.2.3-rc.1)
- Build Metadata: `+{metadata}` (e.g., 1.2.3+20231205)

## Version Lifecycle

1. **Development (alpha branch)**
   - Format: `X.Y.Z-alpha.N`
   - Example: `1.2.0-alpha.1`
   - Auto-increments alpha number on each merge to alpha branch

2. **Release Preparation**
   - Format: `X.Y.Z-rc.N`
   - Example: `1.2.0-rc.1`
   - Created when branching release/* from alpha
   - RC number increments for each fix in release branch

3. **Production Release**
   - Format: `X.Y.Z`
   - Example: `1.2.0`
   - Tagged when merging to prod branch

4. **Hotfix**
   - Format: `X.Y.Z+hotfix.N`
   - Example: `1.2.0+hotfix.1`
   - Used for emergency fixes on prod

## Version Control

### Git Tags
- All releases are tagged in Git
- Tag format: `v{version}`
- Examples:
  - `v1.2.3`
  - `v1.2.3-alpha.1`
  - `v1.2.3-rc.1`
  - `v1.2.3+hotfix.1`

### Docker Tags
- Images always tagged with Git SHA
- Additional tags based on version:
  - Latest: `latest`
  - Release: `1.2.3`
  - Alpha: `1.2.3-alpha.1`
  - RC: `1.2.3-rc.1`
  - Hotfix: `1.2.3+hotfix.1`

## Version Bumping Rules

1. **MAJOR** version bump:
   - Significant API changes
   - Breaking changes in functionality
   - Major UI overhauls

2. **MINOR** version bump:
   - New features
   - Substantial improvements
   - Non-breaking changes

3. **PATCH** version bump:
   - Bug fixes
   - Minor improvements
   - Security patches

## Branch-Version Mapping

| Branch Type | Version Format | Example |
|------------|----------------|---------|
| feature/* | No version tag | - |
| alpha | X.Y.Z-alpha.N | 1.2.0-alpha.1 |
| release/* | X.Y.Z-rc.N | 1.2.0-rc.1 |
| hotfix/* | X.Y.Z+hotfix.N | 1.2.0+hotfix.1 |
| prod | X.Y.Z | 1.2.0 |

## Version Files

- `version.txt`: Current version number
- `CHANGELOG.md`: Version history and changes

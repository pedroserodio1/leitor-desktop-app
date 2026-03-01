Create a new official GitHub release for Readito.

Command: /release {version}

You MUST:

1. Detect latest tag.
2. Determine previous version.
3. Collect commits since previous tag.
4. Abort if no commits exist.
5. Update project version everywhere.
6. Commit version bump.
7. Generate release Markdown.
8. Update README.md feature section if new features were introduced.
9. Create annotated git tag v{version}.
10. Push commit and tag.
11. Confirm success.

Output:
- Final Markdown release
- Confirmation of:
  - Files updated
  - Commit hash
  - Tag created

Do not show reasoning.
Do not skip git validation.

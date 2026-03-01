When generating a release, you MUST:

1. Execute:
   git tag --sort=-creatordate
   to detect latest version tag.

2. If no tag exists:
   - Abort and instruct user to create initial tag.

3. Determine previous tag.

4. Execute:
   git log {previousTag}..HEAD --pretty=format:"%h %s"

5. If no new commits:
   - Abort and inform user.

6. Update project version everywhere the previous version appears exactly:
   - package.json
   - tauri.conf.json
   - Cargo.toml
   - README.md
   - Version constants
   - CHANGELOG.md

7. Stage changes:
   git add .

8. Commit:
   git commit -m "chore(release): bump version to v{version}"

9. Generate release markdown using commit history.

10. Create annotated tag pointing to HEAD:
    git tag -a v{version} -m "Release v{version}"

11. Push:
    git push origin HEAD
    git push origin v{version}

12. If tag already exists:
    - Abort immediately.

Never hallucinate commits.
Never skip git validation.

#!/usr/bin/env bash
set -euo pipefail

PACKAGE_JSON="package.json"
CURRENT_VERSION=$(node -p "require('./$PACKAGE_JSON').version")

echo "📦 @acmedinotech/ezdatagrid-react"
echo "   current version: $CURRENT_VERSION"
echo ""

read -rp "New version: " NEW_VERSION
if [[ -z "$NEW_VERSION" ]]; then
  echo "❌ Version is required." >&2
  exit 1
fi

if [[ ! "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "❌ Invalid semver: $NEW_VERSION" >&2
  exit 1
fi

read -rp "Version message (optional): " VERSION_MESSAGE

if [[ -z "$VERSION_MESSAGE" ]]; then
  COMMIT_MSG="- version-bump: $NEW_VERSION"
  TAG_MSG="$NEW_VERSION"
else
  COMMIT_MSG="- version-bump: $NEW_VERSION // $VERSION_MESSAGE"
  TAG_MSG="$VERSION_MESSAGE"
fi

echo ""
echo "  version:  $CURRENT_VERSION → $NEW_VERSION"
echo "  commit:   $COMMIT_MSG"
echo "  tag:      $NEW_VERSION  ($TAG_MSG)"
echo ""
read -rp "Proceed? [y/N] " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  exit 0
fi

# 1. Update version in package.json (no git side-effects from npm version)
npm version "$NEW_VERSION" --no-git-tag-version

# 2. Commit & tag
git add "$PACKAGE_JSON"
git commit -m "$COMMIT_MSG"
git tag -a "$NEW_VERSION" -m "$TAG_MSG"

# 3. Build & publish
npm run build
npm publish --access public

echo ""
echo "✅ Published @acmedinotech/ezdatagrid-react@$NEW_VERSION"

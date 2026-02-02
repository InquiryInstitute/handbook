#!/bin/bash

# Enable GitHub Pages using gh CLI
# Requires: gh CLI installed and authenticated

REPO_OWNER="inquiryinstitute"
REPO_NAME="handbook"
BRANCH="main"
PATH_DIR="/docs"

echo "📚 Enabling GitHub Pages for $REPO_OWNER/$REPO_NAME"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

# Enable GitHub Pages
echo "Configuring GitHub Pages..."
echo "  Source: $BRANCH branch"
echo "  Path: $PATH_DIR"
echo ""

gh api \
  repos/$REPO_OWNER/$REPO_NAME/pages \
  -X POST \
  -f source[branch]=$BRANCH \
  -f source[path]=$PATH_DIR

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ GitHub Pages enabled!"
    echo ""
    echo "Your handbook will be available at:"
    echo "  https://$REPO_OWNER.github.io/$REPO_NAME/"
    echo ""
    echo "Note: It may take a few minutes for the site to be available."
    echo "Check status: gh api repos/$REPO_OWNER/$REPO_NAME/pages"
else
    echo ""
    echo "❌ Failed to enable GitHub Pages."
    echo "Make sure:"
    echo "  1. Repository exists: https://github.com/$REPO_OWNER/$REPO_NAME"
    echo "  2. You have admin access to the repository"
    echo "  3. The /docs folder exists in the repository"
fi

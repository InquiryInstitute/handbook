#!/bin/bash

# Check GitHub Pages status for handbook repository

REPO="inquiryinstitute/handbook"

echo "🔍 Checking GitHub Pages status for $REPO"
echo ""

# Check if repository exists
echo "1. Checking if repository exists..."
if gh repo view "$REPO" &> /dev/null; then
    echo "   ✅ Repository exists"
else
    echo "   ❌ Repository does not exist!"
    echo "   Create it with: gh repo create $REPO --public"
    exit 1
fi

# Check Pages configuration
echo ""
echo "2. Checking Pages configuration..."
PAGES_CONFIG=$(gh api "repos/$REPO/pages" 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Pages is configured"
    echo "$PAGES_CONFIG" | jq -r '
        "   Source: " + .source.branch + " branch, " + .source.path + " folder",
        "   URL: " + .html_url,
        "   Status: " + .status
    '
else
    echo "   ❌ Pages is not enabled"
    echo "   Enable with: ./enable-pages.sh"
fi

# Check if docs/index.html exists
echo ""
echo "3. Checking if docs/index.html exists..."
if gh api "repos/$REPO/contents/docs/index.html" &> /dev/null; then
    echo "   ✅ docs/index.html exists"
else
    echo "   ❌ docs/index.html not found in repository"
    echo "   Make sure you've pushed the files"
fi

# Check recent builds
echo ""
echo "4. Checking recent builds..."
BUILDS=$(gh api "repos/$REPO/pages/builds" --jq '.[0]' 2>&1)
if [ $? -eq 0 ] && [ "$BUILDS" != "null" ]; then
    echo "$BUILDS" | jq -r '
        "   Latest build:",
        "   Status: " + .status,
        "   Commit: " + .commit,
        "   Created: " + .created_at
    '
else
    echo "   ⚠️  No builds found (this is normal for new repositories)"
fi

# Expected URL
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Expected URL: https://inquiryinstitute.github.io/handbook/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test URL
echo "5. Testing URL..."
if curl -s -o /dev/null -w "%{http_code}" "https://inquiryinstitute.github.io/handbook/" | grep -q "200"; then
    echo "   ✅ Site is live!"
elif curl -s -o /dev/null -w "%{http_code}" "https://inquiryinstitute.github.io/handbook/" | grep -q "404"; then
    echo "   ❌ Site returns 404"
    echo "   This usually means:"
    echo "   - Pages is not enabled, OR"
    echo "   - Files haven't been pushed yet, OR"
    echo "   - Build is still in progress (wait 2-3 minutes)"
else
    echo "   ⚠️  Site status unknown"
fi

echo ""

#!/bin/bash

# Quick fix for 404 on GitHub Pages

REPO="inquiryinstitute/handbook"

echo "🔧 Fixing GitHub Pages 404 for $REPO"
echo ""

# Step 1: Check if repo exists
echo "Step 1: Checking repository..."
if ! gh repo view "$REPO" &> /dev/null; then
    echo "   ❌ Repository doesn't exist. Creating..."
    gh repo create "$REPO" --public --source=. --remote=origin 2>/dev/null || {
        echo "   ⚠️  Could not create automatically. Please create manually:"
        echo "   https://github.com/organizations/inquiryinstitute/repositories/new"
        exit 1
    }
    echo "   ✅ Repository created"
else
    echo "   ✅ Repository exists"
fi

# Step 2: Ensure files are pushed
echo ""
echo "Step 2: Checking if files are pushed..."
if [ -d .git ]; then
    # Check if remote exists
    if ! git remote get-url origin &> /dev/null; then
        echo "   Adding remote..."
        git remote add origin "https://github.com/$REPO.git" 2>/dev/null || \
        git remote set-url origin "https://github.com/$REPO.git"
    fi
    
    # Push if needed
    echo "   Pushing files..."
    git add -A
    git commit -m "Update handbook files" 2>/dev/null || echo "   (no changes to commit)"
    git push origin main 2>/dev/null || git push -u origin main
    echo "   ✅ Files pushed"
else
    echo "   ⚠️  Not a git repository. Initializing..."
    git init
    git add -A
    git commit -m "Initial commit: Handbook for the Recently Deceased"
    git branch -M main
    git remote add origin "https://github.com/$REPO.git"
    git push -u origin main
    echo "   ✅ Repository initialized and pushed"
fi

# Step 3: Enable Pages (simple method - deploy from branch)
echo ""
echo "Step 3: Enabling GitHub Pages..."
PAGES_STATUS=$(gh api "repos/$REPO/pages" 2>&1)

if echo "$PAGES_STATUS" | grep -q "Not Found"; then
    echo "   Enabling Pages (Deploy from branch method)..."
    # Try the API method
    gh api "repos/$REPO/pages" \
      -X POST \
      -f source[branch]=main \
      -f source[path]=/docs 2>/dev/null && echo "   ✅ Pages enabled via API" || {
        echo "   ⚠️  API method failed. Please enable manually:"
        echo "   1. Go to: https://github.com/$REPO/settings/pages"
        echo "   2. Source: Deploy from a branch"
        echo "   3. Branch: main, Folder: /docs"
        echo "   4. Click Save"
    }
else
    echo "   ✅ Pages is already configured"
    echo "$PAGES_STATUS" | jq -r '"   Source: " + .source.branch + " branch, " + .source.path + " folder"'
fi

# Step 4: Wait and verify
echo ""
echo "Step 4: Waiting for deployment (this may take 1-2 minutes)..."
sleep 5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!"
echo ""
echo "Your handbook should be available at:"
echo "  https://inquiryinstitute.github.io/handbook/"
echo ""
echo "If you still see 404:"
echo "  1. Wait 2-3 minutes for GitHub to build"
echo "  2. Check: https://github.com/$REPO/settings/pages"
echo "  3. Verify 'Source' is set to 'Deploy from a branch'"
echo "  4. Run: ./check-pages.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

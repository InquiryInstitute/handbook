#!/bin/bash

# Push script for Handbook repository
# Run this after creating the repository on GitHub

cd "$(dirname "$0")"

echo "📚 Handbook for the Recently Deceased - Push Script"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
fi

# Add all files
echo "Adding files..."
git add -A

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "No changes to commit."
else
    echo "Committing changes..."
    git commit -m "Initial commit: Handbook for the Recently Deceased with flipbook implementation"
fi

# Check if remote exists
if git remote | grep -q "^origin$"; then
    echo "Remote 'origin' already exists."
    git remote -v
else
    echo ""
    echo "⚠️  No remote configured!"
    echo ""
    echo "Please add the remote first:"
    echo "  git remote add origin https://github.com/inquiryinstitute/handbook.git"
    echo ""
    echo "Or if using SSH:"
    echo "  git remote add origin git@github.com:inquiryinstitute/handbook.git"
    echo ""
    read -p "Enter the GitHub repository URL (or press Enter to skip): " repo_url
    
    if [ ! -z "$repo_url" ]; then
        git remote add origin "$repo_url"
        echo "✅ Remote added: $repo_url"
    else
        echo "Skipping remote setup. Please add it manually."
        exit 1
    fi
fi

# Set branch to main
git branch -M main

# Push
echo ""
echo "Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    
    # Try to enable GitHub Pages using gh CLI
    if command -v gh &> /dev/null && gh auth status &> /dev/null; then
        echo "Enabling GitHub Pages..."
        gh api \
          repos/inquiryinstitute/handbook/pages \
          -X POST \
          -f source[branch]=main \
          -f source[path]=/docs
        
        if [ $? -eq 0 ]; then
            echo "✅ GitHub Pages enabled!"
        else
            echo "⚠️  Could not enable Pages automatically. Enable manually:"
            echo "   gh api repos/inquiryinstitute/handbook/pages -X POST -f source[branch]=main -f source[path]=/docs"
        fi
    else
        echo "To enable GitHub Pages, run:"
        echo "  gh api repos/inquiryinstitute/handbook/pages -X POST -f source[branch]=main -f source[path]=/docs"
    fi
    
    echo ""
    echo "Your handbook will be available at: https://inquiryinstitute.github.io/handbook/"
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "  - Repository exists on GitHub"
    echo "  - You have push permissions"
    echo "  - Remote URL is correct"
fi

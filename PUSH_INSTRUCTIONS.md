# Push Instructions

To push this repository to GitHub:

## 1. Create the repository on GitHub

1. Go to https://github.com/organizations/inquiryinstitute/repositories/new
2. Repository name: `handbook`
3. Description: "Handbook for the Recently Deceased - A Practical Guide for Faculty of Inquiry Institute"
4. Set to Public (or Private if preferred)
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## 2. Push from local repository

```bash
cd ~/GitHub/handbook

# Add all files
git add -A

# Commit
git commit -m "Initial commit: Handbook for the Recently Deceased with flipbook implementation"

# Add remote (replace with actual GitHub URL)
git remote add origin https://github.com/inquiryinstitute/handbook.git

# Or if using SSH:
# git remote add origin git@github.com:inquiryinstitute/handbook.git

# Push to main branch
git branch -M main
git push -u origin main
```

## 3. Enable GitHub Pages

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main` / `docs` folder
4. Click Save

The handbook will be available at: `https://inquiryinstitute.github.io/handbook/`

## 4. Verify deployment

After pushing, GitHub Actions will automatically:
- Build the pages from Markdown chapters
- Deploy to GitHub Pages
- Make the flipbook available online

Check the Actions tab to see the deployment status.

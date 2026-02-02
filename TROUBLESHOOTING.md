# Troubleshooting GitHub Pages 404

## Quick Checks

### 1. Verify Repository Exists
```bash
gh repo view inquiryinstitute/handbook
```

If it doesn't exist, create it first:
```bash
gh repo create inquiryinstitute/handbook --public --source=. --remote=origin
```

### 2. Check if Pages is Enabled
```bash
gh api repos/inquiryinstitute/handbook/pages
```

Should return configuration, not 404.

### 3. Verify Files are Pushed
```bash
gh repo view inquiryinstitute/handbook --json defaultBranchRef
```

Check if `docs/index.html` exists in the repository.

### 4. Check Pages Build Status
```bash
gh api repos/inquiryinstitute/handbook/pages/builds --jq '.[0]'
```

## Common Issues

### Issue: Repository doesn't exist
**Solution:** Create the repository first:
```bash
cd ~/GitHub/handbook
git remote add origin https://github.com/inquiryinstitute/handbook.git
git push -u origin main
```

### Issue: Pages not enabled
**Solution:** Enable Pages:
```bash
gh api repos/inquiryinstitute/handbook/pages \
  -X POST \
  -f source[branch]=main \
  -f source[path]=/docs
```

### Issue: Wrong branch or folder
**Solution:** Verify configuration:
- Branch should be: `main`
- Folder should be: `/docs`
- Root file should be: `docs/index.html`

### Issue: Files not in docs folder
**Solution:** Make sure structure is:
```
handbook/
├── docs/
│   ├── index.html
│   ├── pages/
│   ├── scripts/
│   └── styles/
└── ...
```

### Issue: Build/deployment failed
**Solution:** Check Actions tab:
```bash
gh run list --repo inquiryinstitute/handbook
```

## Step-by-Step Fix

1. **Ensure repository exists:**
   ```bash
   gh repo view inquiryinstitute/handbook || gh repo create inquiryinstitute/handbook --public
   ```

2. **Push all files:**
   ```bash
   cd ~/GitHub/handbook
   git add -A
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Enable Pages:**
   ```bash
   gh api repos/inquiryinstitute/handbook/pages \
     -X POST \
     -f source[branch]=main \
     -f source[path]=/docs
   ```

4. **Wait 1-2 minutes**, then check:
   ```bash
   gh api repos/inquiryinstitute/handbook/pages
   ```

5. **Verify URL:**
   - Should be: `https://inquiryinstitute.github.io/handbook/`
   - Note the trailing slash!

## Verify Setup

Run this command to check everything:
```bash
echo "Repository:" && \
gh repo view inquiryinstitute/handbook --json name,url && \
echo -e "\nPages Config:" && \
gh api repos/inquiryinstitute/handbook/pages && \
echo -e "\nFiles in docs:" && \
gh api repos/inquiryinstitute/handbook/contents/docs --jq '.[].name' && \
echo -e "\nRecent builds:" && \
gh api repos/inquiryinstitute/handbook/pages/builds --jq '.[0] | {status, url}'
```

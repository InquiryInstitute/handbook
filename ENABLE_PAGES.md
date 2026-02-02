# Enable GitHub Pages with gh CLI

## Quick Command

After pushing the repository, enable GitHub Pages with:

```bash
gh api repos/inquiryinstitute/handbook/pages \
  -X POST \
  -f source[branch]=main \
  -f source[path]=/docs
```

## Or Use the Script

```bash
./enable-pages.sh
```

## Verify Pages Status

Check if Pages is enabled:

```bash
gh api repos/inquiryinstitute/handbook/pages
```

## Check Pages Build Status

```bash
gh api repos/inquiryinstitute/handbook/pages/builds
```

## Manual Alternative

If `gh` CLI is not available, enable Pages via the web UI:

1. Go to: https://github.com/inquiryinstitute/handbook/settings/pages
2. Source: Deploy from a branch
3. Branch: `main` / folder: `/docs`
4. Click Save

## Expected URL

Once enabled, the handbook will be available at:
**https://inquiryinstitute.github.io/handbook/**

Note: It may take a few minutes for the site to be available after enabling.

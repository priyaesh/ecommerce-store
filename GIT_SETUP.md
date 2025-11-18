# Git Setup Guide

Your project is now initialized with Git and has an initial commit. Follow these steps to connect it to a remote repository (GitHub, GitLab, etc.).

## Step 1: Create a Repository on GitHub

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Choose a repository name (e.g., `ecommerce-store`)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Connect Your Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use one of these methods:

### Method A: Using HTTPS (Recommended for beginners)

```powershell
cd C:\Users\hemap\ecommerce-store
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Method B: Using SSH (If you have SSH keys set up)

```powershell
cd C:\Users\hemap\ecommerce-store
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Replace:**
- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with your repository name

## Step 3: Verify Connection

Check that your remote is set up correctly:

```powershell
git remote -v
```

This should show your repository URL.

## Using Git in Cursor

Cursor has built-in Git support. You can:

1. **View Git Status**: Click the Source Control icon in the left sidebar (or press `Ctrl+Shift+G`)
2. **Stage Changes**: Click the "+" next to files you want to stage
3. **Commit**: Enter a commit message and click the checkmark
4. **Push/Pull**: Use the sync button or the three dots menu for more options
5. **View Changes**: Click on any file to see the diff

## Common Git Commands

```powershell
# Check status
git status

# Stage all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to remote
git push

# Pull latest changes
git pull

# View commit history
git log

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout branch-name
```

## Troubleshooting

### If you get authentication errors:
- For HTTPS: You may need to use a Personal Access Token instead of your password
- For SSH: Make sure your SSH key is added to your GitHub account

### If you need to change the remote URL:
```powershell
git remote set-url origin NEW_URL
```


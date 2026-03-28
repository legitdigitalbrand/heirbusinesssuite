#!/bin/bash
# Git setup and push script

cd /c/Users/HP/heirsbizsuite

# Configure git (use your GitHub email/name)
echo "Setting up git configuration..."
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# Initialize git if not already initialized
if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init
else
  echo "Git repository already exists"
fi

# Add all files
echo "Adding files to git..."
git add .

# Create initial commit
echo "Creating initial commit..."
git commit -m "Initial commit: Heirs Business Suite complete application"

echo ""
echo "✅ Git setup complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/new"
echo "2. Create a new repository named: heirs-business-suite"
echo "3. Run this command:"
echo ""
echo "git remote add origin https://github.com/YOUR_USERNAME/heirs-business-suite.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""

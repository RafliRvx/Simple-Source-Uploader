# FileStream - Permanent File Uploader

A production-ready file uploader service that stores files permanently in a separate GitHub repository.

## Features
- Upload any file type up to 20MB
- Permanent file storage with GitHub as backend
- Duplicate file detection
- Modern, responsive UI with drag & drop
- Direct file access via permanent URLs
- No database required (uses JSON mappings)

## Prerequisites
1. Node.js 18 or higher
2. GitHub account
3. GitHub Personal Access Token with `repo` permissions
4. Two separate GitHub repositories:
   - One for the project code
   - One for file storage (must be empty initially)

## Setup Instructions

### 1. Create GitHub Repository for File Storage
- Create a new **public** repository (e.g., `file-storage-repo`)
- Keep it empty (no README, no .gitignore, no license)

### 2. Generate GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope (full control of repositories)
3. Copy the token (you won't see it again)

### 3. Deploy to Vercel

#### Method A: Vercel Dashboard
1. Push this code to your project repository
2. Go to [Vercel](https://vercel.com)
3. Import your project repository
4. Configure environment variables:

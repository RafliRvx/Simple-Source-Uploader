// GitHub Configuration for File Storage
const settings = {
  // GitHub Personal Access Token with repo permissions
  github_token: process.env.GITHUB_TOKEN || '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',
  
  // GitHub username
  github_username: process.env.GITHUB_USERNAME || 'RafliRvx',
  
  // Repository name for file storage (MUST be different from project repo)
  repo_name: process.env.REPO_NAME || 'media',
  
  // Branch to use (recommend 'main')
  branch: process.env.BRANCH || 'main',
  
  // Folder name inside repository
  folder_name: process.env.FOLDER_NAME || 'media',
  
  // Website domain (for generating URLs)
  domain: process.env.DOMAIN || 'https://your-domain.vercel.app',
  
  // Max file size in bytes (20MB)
  max_file_size: 20 * 1024 * 1024,
  
  // Allowed file extensions (empty array means all files allowed)
  allowed_extensions: [],
  
  // Rate limiting
  rate_limit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};

module.exports = settings;

const GitHubStorage = require('../utils/githubStorage');

module.exports = async (req, res) => {
  // Handle file access via URL
  if (req.method === 'GET') {
    const path = req.url.substring(1); // Remove leading slash
    
    // Check if it's a file request (has extension)
    const hasExtension = path.match(/\.([a-zA-Z0-9]+)$/);
    
    if (hasExtension) {
      const fileId = path.split('.')[0];
      const storage = new GitHubStorage();
      const fileInfo = await storage.checkFile(fileId);
      
      if (fileInfo) {
        // Redirect to GitHub raw content
        const mappings = await storage.loadMappings();
        const fileData = mappings.files[fileId];
        
        if (fileData && fileData.downloadUrl) {
          return res.redirect(302, fileData.downloadUrl);
        }
      }
      
      // File not found
      return res.status(404).json({ error: 'File not found' });
    }
    
    // For non-file paths, serve frontend
    return res.redirect(302, '/');
  }

  // Handle POST requests for checking files
  if (req.method === 'POST') {
    try {
      const { hash } = req.body;
      
      if (!hash) {
        return res.status(400).json({ error: 'Hash is required' });
      }

      const storage = new GitHubStorage();
      const fileId = await storage.checkDuplicate(hash);
      
      if (fileId) {
        const mappings = await storage.loadMappings();
        const fileData = mappings.files[fileId];
        
        return res.status(200).json({
          exists: true,
          url: fileData.url,
          originalName: fileData.originalName
        });
      }
      
      return res.status(200).json({ exists: false });
      
    } catch (error) {
      return res.status(500).json({ error: 'Check failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

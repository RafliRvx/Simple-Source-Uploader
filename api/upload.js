const { IncomingForm } = require('formidable');
const fs = require('fs').promises;
const GitHubStorage = require('../utils/githubStorage');
const settings = require('../settings');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const storage = new GitHubStorage();
    
    // Parse multipart form data
    const data = await new Promise((resolve, reject) => {
      const form = new IncomingForm({
        maxFileSize: settings.max_file_size,
        multiples: false
      });

      form.parse(req, (err, fields, files) => {
        if (err) {
          if (err.code === 'limitExceeded') {
            reject(new Error('File size exceeds 20MB limit'));
          } else {
            reject(err);
          }
        } else {
          resolve({ files, fields });
        }
      });
    });

    const file = data.files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Read file buffer
    const buffer = await fs.readFile(file.filepath);
    
    // Upload to GitHub
    const result = await storage.uploadFile(buffer, file.originalFilename);

    // Clean up temp file
    await fs.unlink(file.filepath).catch(() => {});

    return res.status(200).json({
      success: true,
      url: result.url,
      filename: result.filename,
      size: result.size,
      isDuplicate: result.isDuplicate || false
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    return res.status(500).json({
      error: error.message || 'Upload failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

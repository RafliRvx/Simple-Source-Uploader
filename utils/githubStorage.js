const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const settings = require('../settings');

class GitHubStorage {
  constructor() {
    this.baseURL = `https://api.github.com/repos/${settings.github_username}/${settings.repo_name}/contents`;
    this.headers = {
      'Authorization': `token ${settings.github_token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'File-Uploader-Service'
    };
    this.mappingsPath = path.join(__dirname, '../mappings.json');
  }

  async loadMappings() {
    try {
      const data = await fs.readFile(this.mappingsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Create default mappings if file doesn't exist
      const defaultMappings = {
        lastId: 0,
        files: {},
        hashes: {},
        stats: {
          totalUploads: 0,
          totalSize: 0,
          uniqueFiles: 0
        },
        updatedAt: new Date().toISOString()
      };
      await this.saveMappings(defaultMappings);
      return defaultMappings;
    }
  }

  async saveMappings(mappings) {
    mappings.updatedAt = new Date().toISOString();
    await fs.writeFile(this.mappingsPath, JSON.stringify(mappings, null, 2));
  }

  generateFileId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  async calculateFileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async checkDuplicate(hash) {
    const mappings = await this.loadMappings();
    return mappings.hashes[hash];
  }

  async uploadFile(buffer, originalFilename) {
    const fileHash = await this.calculateFileHash(buffer);
    
    // Check for duplicate
    const duplicate = await this.checkDuplicate(fileHash);
    if (duplicate) {
      const mappings = await this.loadMappings();
      const fileData = mappings.files[duplicate];
      mappings.stats.totalUploads += 1;
      await this.saveMappings(mappings);
      
      return {
        success: true,
        isDuplicate: true,
        url: `${settings.domain}/${fileData.id}${fileData.extension}`,
        filename: originalFilename,
        size: buffer.length
      };
    }

    // Generate unique ID
    const mappings = await this.loadMappings();
    let fileId;
    let isUnique = false;
    
    while (!isUnique) {
      fileId = this.generateFileId();
      if (!mappings.files[fileId]) {
        isUnique = true;
      }
    }

    // Get file extension
    const extension = path.extname(originalFilename).toLowerCase() || '.bin';
    
    // Prepare file name and path
    const filename = `${fileId}${extension}`;
    const filePath = `${settings.folder_name}/${filename}`;
    
    // Convert buffer to base64
    const content = buffer.toString('base64');
    
    // Prepare GitHub API request
    const data = {
      message: `Upload: ${originalFilename}`,
      content: content,
      branch: settings.branch
    };

    try {
      // Upload to GitHub
      const response = await axios.put(
        `${this.baseURL}/${filePath}`,
        data,
        { headers: this.headers }
      );

      // Update mappings
      const now = new Date();
      const fileData = {
        id: fileId,
        originalName: originalFilename,
        extension: extension,
        size: buffer.length,
        hash: fileHash,
        githubPath: response.data.content.path,
        githubUrl: response.data.content.html_url,
        downloadUrl: response.data.content.download_url,
        uploadedAt: now.toISOString(),
        url: `${settings.domain}/${filename}`
      };

      mappings.lastId += 1;
      mappings.files[fileId] = fileData;
      mappings.hashes[fileHash] = fileId;
      mappings.stats.totalUploads += 1;
      mappings.stats.totalSize += buffer.length;
      mappings.stats.uniqueFiles += 1;
      
      await this.saveMappings(mappings);

      return {
        success: true,
        isDuplicate: false,
        url: fileData.url,
        filename: originalFilename,
        size: buffer.length,
        id: fileId
      };

    } catch (error) {
      console.error('GitHub upload error:', error.response?.data || error.message);
      throw new Error(`Failed to upload to GitHub: ${error.response?.data?.message || error.message}`);
    }
  }

  async checkFile(fileId) {
    const mappings = await this.loadMappings();
    const fileData = mappings.files[fileId];
    
    if (!fileData) {
      return null;
    }

    return {
      exists: true,
      url: fileData.url,
      originalName: fileData.originalName,
      size: fileData.size,
      uploadedAt: fileData.uploadedAt
    };
  }
}

module.exports = GitHubStorage;

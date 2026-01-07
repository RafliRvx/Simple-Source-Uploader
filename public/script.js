class FileUploader {
    constructor() {
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.dropZone = document.getElementById('dropZone');
        this.progressSection = document.getElementById('progressSection');
        this.resultSection = document.getElementById('resultSection');
        this.uploadArea = document.getElementById('uploadArea');
        this.progressFill = document.getElementById('progressFill');
        this.progressPercent = document.getElementById('progressPercent');
        this.fileInfo = document.getElementById('fileInfo');
        this.resultUrl = document.getElementById('resultUrl');
        this.copyBtn = document.getElementById('copyBtn');
        this.visitLink = document.getElementById('visitLink');
        this.uploadAnother = document.getElementById('uploadAnother');
        this.duplicateNotice = document.getElementById('duplicateNotice');
        this.toast = document.getElementById('toast');
        
        this.init();
    }
    
    init() {
        // Event Listeners
        this.browseBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Button events
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.uploadAnother.addEventListener('click', () => this.resetUploader());
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
        });
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleDragOver(e) {
        this.dropZone.classList.add('dragover');
    }
    
    handleDragLeave(e) {
        this.dropZone.classList.remove('dragover');
    }
    
    handleDrop(e) {
        this.dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    async processFile(file) {
        // Validate file size (20MB limit)
        if (file.size > 20 * 1024 * 1024) {
            this.showToast('File size exceeds 20MB limit', 'error');
            return;
        }
        
        // Show progress section
        this.uploadArea.classList.add('hidden');
        this.progressSection.classList.remove('hidden');
        this.resultSection.classList.add('hidden');
        
        // Update file info
        this.fileInfo.textContent = `Uploading: ${file.name} (${this.formatFileSize(file.size)})`;
        
        // Simulate progress for better UX
        this.simulateProgress();
        
        try {
            // Calculate file hash for duplicate check
            const hash = await this.calculateFileHash(file);
            
            // Check for duplicate
            const duplicateCheck = await this.checkDuplicate(hash);
            
            if (duplicateCheck.exists) {
                // File already exists
                this.completeUpload(duplicateCheck.url, file.name, file.size, true);
                return;
            }
            
            // Upload file
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.completeUpload(result.url, file.name, file.size, result.isDuplicate);
            } else {
                throw new Error(result.error || 'Upload failed');
            }
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast(`Upload failed: ${error.message}`, 'error');
            this.resetUploader();
        }
    }
    
    simulateProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) {
                clearInterval(interval);
                progress = 90; // Hold at 90% until actual upload completes
            }
            this.updateProgress(progress);
        }, 200);
        
        this.progressInterval = interval;
    }
    
    updateProgress(percent) {
        const progress = Math.min(100, Math.max(0, percent));
        this.progressFill.style.width = `${progress}%`;
        this.progressPercent.textContent = `${Math.round(progress)}%`;
    }
    
    async calculateFileHash(file) {
        // Simple hash calculation for demo
        // In production, you'd use Web Crypto API
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Simple hash from file size and name
                const hashData = `${file.name}-${file.size}-${file.lastModified}`;
                const hash = btoa(hashData).substring(0, 32);
                resolve(hash);
            };
            reader.readAsDataURL(file);
        });
    }
    
    async checkDuplicate(hash) {
        try {
            const response = await fetch('/api/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ hash })
            });
            
            if (response.ok) {
                return await response.json();
            }
            return { exists: false };
        } catch (error) {
            console.error('Duplicate check failed:', error);
            return { exists: false };
        }
    }
    
    completeUpload(url, filename, size, isDuplicate = false) {
        clearInterval(this.progressInterval);
        this.updateProgress(100);
        
        // Wait a bit for smooth transition
        setTimeout(() => {
            this.progressSection.classList.add('hidden');
            this.resultSection.classList.remove('hidden');
            
            // Set result URL
            this.resultUrl.value = url;
            this.visitLink.href = url;
            
            // Show duplicate notice if applicable
            if (isDuplicate) {
                this.duplicateNotice.classList.remove('hidden');
            } else {
                this.duplicateNotice.classList.add('hidden');
            }
            
            this.showToast('File uploaded successfully!', 'success');
        }, 500);
    }
    
    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.resultUrl.value);
            this.copyBtn.classList.add('copied');
            this.copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            this.showToast('Link copied to clipboard', 'success');
            
            setTimeout(() => {
                this.copyBtn.classList.remove('copied');
                this.copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
        } catch (error) {
            console.error('Copy failed:', error);
            this.showToast('Failed to copy link', 'error');
        }
    }
    
    resetUploader() {
        // Reset file input
        this.fileInput.value = '';
        
        // Reset progress
        this.updateProgress(0);
        
        // Reset UI
        this.progressSection.classList.add('hidden');
        this.resultSection.classList.add('hidden');
        this.uploadArea.classList.remove('hidden');
        
        // Reset copy button
        this.copyBtn.classList.remove('copied');
        this.copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    showToast(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.className = 'toast';
        
        // Add type-based styling
        if (type === 'error') {
            this.toast.style.background = '#dc3545';
        } else if (type === 'success') {
            this.toast.style.background = '#28a745';
        } else {
            this.toast.style.background = 'var(--dark)';
        }
        
        this.toast.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const uploader = new FileUploader();
    
    // Add smooth transitions for page elements
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.step, .feature').forEach(el => {
        observer.observe(el);
    });
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .step, .feature {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .step.animate-in, .feature.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .step:nth-child(2) { transition-delay: 0.1s; }
        .step:nth-child(3) { transition-delay: 0.2s; }
        .feature:nth-child(2) { transition-delay: 0.1s; }
        .feature:nth-child(3) { transition-delay: 0.2s; }
        .feature:nth-child(4) { transition-delay: 0.3s; }
    `;
    document.head.appendChild(style);
});

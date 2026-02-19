/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

class ExplorerController {
    constructor() {
        this.currentFolder = this.getFolderFromURL() || 'images';
        this.images = [];
        this.csrfToken = document.getElementById('csrf-token').value;
        
        // Get translations from Joomla
        this.translations = Joomla.getOptions('com_phocamosaic.translations', {});
        
        // Get upload config from Joomla
        this.uploadConfig = Joomla.getOptions('com_phocamosaic.upload', {
            maxUploadSize: 5242880,
            maxUploadSizeMB: 5.0
        });
        
        this.init();
    }
    
    // Translation helper
    t(key, fallback = '') {
        return this.translations[key] || fallback || key;
    }
    
    getFolderFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('folder');
    }

    init() {
        this.createToastContainer();
        this.attachEventListeners();
        this.loadFolderTree();
        this.loadImages();
        
        // Make controller globally accessible for toolbar button onclick
        window.explorerController = this;
        
        //console.log('ExplorerController initialized and exposed globally');
    }
    
    createToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(container);
        }
    }
    
    showToast(message, type = 'info', duration = 3000) {
        const container = document.querySelector('.toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.style.cssText = `
            min-width:300px;padding:1rem 1.25rem;border-radius:6px;
            box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;
            gap:0.75rem;font-size:14px;color:#ffffff;
            background-color:${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
            animation:slideIn 0.3s ease-out;
        `;
        
        const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
        toast.innerHTML = `<span style="font-size:20px;font-weight:bold;">${icons[type] || icons.info}</span><span>${message}</span>`;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, duration);
    }

    attachEventListeners() {
        // Search input
        const searchInput = document.getElementById('image-search');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // File input and upload handlers
        const fileInput = document.getElementById('file-upload-input');
        
        // Select files button (drop zone)
        const selectFilesBtn = document.getElementById('select-files-btn');
        selectFilesBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling to drop zone
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleUpload(e.target.files);
            }
        });
        
        // Drag and drop on drop zone
        const dropZone = document.getElementById('upload-drop-zone');
        
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleUpload(files);
            }
        });
        
        // Also handle drag and drop on the entire image grid area
        const imageGrid = document.querySelector('.image-grid');
        
        imageGrid.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
        
        imageGrid.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === imageGrid) {
                dropZone.classList.remove('drag-over');
            }
        });
        
        imageGrid.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleUpload(files);
            }
        });
    }

    async loadFolderTree() {
        try {
            const response = await fetch(
                `index.php?option=com_phocamosaic&task=explorer.getFolderTree&format=json`,
                { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `${this.csrfToken}=1`
                }
            );
            
            const result = await response.json();
            
            if (result.success) {
                this.renderFolderTree(result.data);
            }
        } catch (error) {
            console.error('Failed to load folder tree:', error);
        }
    }

    renderFolderTree(tree) {
        const container = document.getElementById('folder-tree-container');
        container.innerHTML = this.buildTreeHTML(tree);

        // Attach click handlers to all folder items
        container.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const path = e.currentTarget.dataset.path;
                this.selectFolder(path);
            });
        });
    }

    buildTreeHTML(node, level = 0) {
        let html = `
            <div class="folder-item" data-path="${node.path}" style="padding-left: ${(level * 1) + 0.5}rem">
                <span class="icon-folder"></span>
                <span>${node.name}</span>
                <span class="badge">${node.imageCount}</span>
            </div>
        `;

        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                html += this.buildTreeHTML(child, level + 1);
            }
        }

        return html;
    }

    async selectFolder(path) {
        this.currentFolder = path;
        
        // Update active state
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-path="${path}"]`)?.classList.add('active');

        await this.loadImages();
    }

    async loadImages() {
        try {
            const response = await fetch(
                `index.php?option=com_phocamosaic&task=explorer.getFolderContents&format=json`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `${this.csrfToken}=1&path=${encodeURIComponent(this.currentFolder)}&recursive=false`
                }
            );
            
            const result = await response.json();
            
            if (result.success) {
                this.images = result.data;
                this.renderImages(this.images);
            }
        } catch (error) {
            console.error('Failed to load images:', error);
        }
    }

    renderImages(images) {
        const container = document.getElementById('image-grid-container');
        
        if (images.length === 0) {
            container.innerHTML = `<div class="no-images">${this.t('COM_PHOCAMOSAIC_NO_IMAGES_FOUND', 'No images found in this folder')}</div>`;
            return;
        }

        // title="${image.path}"
        container.innerHTML = images.map(image => `
            <div class="image-card" data-path="${image.path}">
                <img src="${image.thumbnailUrl}" alt="${image.filename}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%232a2a2a%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23666%22%3E${this.t('COM_PHOCAMOSAIC_NO_PREVIEW', 'No Preview')}%3C/text%3E%3C/svg%3E'">
                <div class="phoca-image-actions">
                    <button class="phoca-action-btn phoca-action-info" title="${this.t('COM_PHOCAMOSAIC_SHOW_INFO', 'Show Info')}" data-action="info">ℹ️</button>
                    <button class="phoca-action-btn phoca-action-rename" title="${this.t('COM_PHOCAMOSAIC_RENAME', 'Rename')}" data-action="rename">✏️</button>
                    <button class="phoca-action-btn phoca-action-delete" title="${this.t('COM_PHOCAMOSAIC_DELETE', 'Delete')}" data-action="delete">🗑️</button>
                </div>
                <div class="phoca-image-info-tooltip" style="display:none">${image.path}</div>
                <div class="image-card-info">
                    <div class="image-card-filename" title="${image.path}">${image.filename}</div>
                    <div class="image-card-meta">
                        <span>${image.dimensions.width} × ${image.dimensions.height}</span>
                        <span>${this.formatFileSize(image.fileSize)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Attach click handlers to image cards (for opening editor)
        container.querySelectorAll('.image-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open editor if clicking on action buttons
                if (e.target.closest('.phoca-action-btn')) {
                    return;
                }
                e.preventDefault();
                const path = e.currentTarget.dataset.path;
                this.openEditor(path);
            });
        });

        // Attach handlers to action buttons
        container.querySelectorAll('.phoca-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                const action = e.currentTarget.dataset.action;
                const card = e.currentTarget.closest('.image-card');
                const path = card.dataset.path;
                const filename = card.querySelector('.image-card-filename').textContent;
                
                this.handleAction(action, path, filename);
            });
        });
    }

    openEditor(imagePath) {
        window.location.href = `index.php?option=com_phocamosaic&view=editor&path=${encodeURIComponent(imagePath)}`;
    }

    handleAction(action, path, filename) {
        switch (action) {
            case 'info':
                this.showInfo(path);
                break;
            case 'rename':
                this.showRenameModal(path, filename);
                break;
            case 'delete':
                this.showDeleteModal(path, filename);
                break;
        }
    }

    showInfo(path) {
        // Find the card and toggle tooltip
        const card = document.querySelector(`.image-card[data-path="${path}"]`);
        if (!card) return;
        
        const tooltip = card.querySelector('.phoca-image-info-tooltip');
        if (!tooltip) return;
        
        // Hide all other tooltips first
        document.querySelectorAll('.phoca-image-info-tooltip').forEach(t => {
            if (t !== tooltip) t.style.display = 'none';
        });
        
        // Toggle this tooltip
        if (tooltip.style.display === 'none') {
            tooltip.style.display = 'block';
            // Auto-hide after 5 seconds
            setTimeout(() => {
                tooltip.style.display = 'none';
            }, 5000);
        } else {
            tooltip.style.display = 'none';
        }
    }

    showRenameModal(path, currentFilename) {
        const body = `
            <label class="mosaic-dialog-label">Current: ${currentFilename}</label>
            <input type="text" id="rename-input" class="mosaic-dialog-input" value="${currentFilename}" />
            <div id="rename-error" class="mosaic-dialog-error"></div>
        `;
        
        this.showModal('Rename Image', body, [
            { text: 'Cancel', class: 'mosaic-dialog-btn-secondary', onClick: () => this.closeModal() },
            { text: 'Rename', class: 'mosaic-dialog-btn-primary', onClick: () => this.handleRename(path, currentFilename) }
        ]);
        
        // Focus input and select filename without extension
        setTimeout(() => {
            const input = document.getElementById('rename-input');
            if (input) {
                input.focus();
                const lastDot = currentFilename.lastIndexOf('.');
                if (lastDot > 0) {
                    input.setSelectionRange(0, lastDot);
                } else {
                    input.select();
                }
            }
        }, 100);
    }

    async handleRename(path, oldFilename) {
        const input = document.getElementById('rename-input');
        const errorDiv = document.getElementById('rename-error');
        const newFilename = input.value.trim();
        
        // Validate
        if (!newFilename) {
            errorDiv.textContent = this.t('COM_PHOCAMOSAIC_ERROR_FILENAME_EMPTY', 'Filename cannot be empty');
            errorDiv.style.display = 'block';
            return;
        }
        
        if (newFilename === oldFilename) {
            this.closeModal();
            return;
        }
        
        try {
            const response = await fetch(
                `index.php?option=com_phocamosaic&task=explorer.renameImage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `${this.csrfToken}=1&path=${encodeURIComponent(path)}&newFilename=${encodeURIComponent(newFilename)}`
                }
            );
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Image renamed successfully', 'success');
                this.closeModal();
                // Reload images to show updated filename
                await this.loadImages();
            } else {
                errorDiv.textContent = result.message || this.t('COM_PHOCAMOSAIC_ERROR_RENAME_FAILED', 'Failed to rename image');
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Rename error:', error);
            errorDiv.textContent = this.t('COM_PHOCAMOSAIC_ERROR_RENAME_FAILED', 'Failed to rename image') + ': ' + error.message;
            errorDiv.style.display = 'block';
        }
    }

    showDeleteModal(path, filename) {
        const body = `
            <p>Are you sure you want to delete:</p>
            <p><strong>${filename}</strong></p>
            <p class="mosaic-dialog-warning">⚠️ This action cannot be undone.</p>
        `;
        
        this.showModal('Delete Image', body, [
            { text: 'Cancel', class: 'mosaic-dialog-btn-secondary', onClick: () => this.closeModal() },
            { text: 'Delete', class: 'mosaic-dialog-btn-danger', onClick: () => this.handleDelete(path, filename) }
        ]);
    }

    async handleDelete(path, filename) {
        try {
            const response = await fetch(
                `index.php?option=com_phocamosaic&task=explorer.deleteImage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `${this.csrfToken}=1&path=${encodeURIComponent(path)}`
                }
            );
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Image deleted successfully', 'success');
                this.closeModal();
                // Remove the image card from display
                const card = document.querySelector(`.image-card[data-path="${path}"]`);
                if (card) {
                    card.remove();
                }
                // Update images array
                this.images = this.images.filter(img => img.path !== path);
            } else {
                this.showToast('Failed to delete image: ' + (result.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showToast('Failed to delete image: ' + error.message, 'error');
        }
    }

    showModal(title, bodyHTML, buttons = []) {
        const overlay = document.getElementById('mosaic-dialog-overlay');
        const modalTitle = document.getElementById('mosaic-dialog-title');
        const modalBody = document.getElementById('mosaic-dialog-body');
        const modalFooter = document.getElementById('mosaic-dialog-footer');
        const modalDialog = overlay.querySelector('.mosaic-dialog-box');
        
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHTML;
        
        modalFooter.innerHTML = '';
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.className = `mosaic-dialog-btn ${btn.class}`;
            button.onclick = btn.onClick;
            modalFooter.appendChild(button);
        });
        
        overlay.style.display = 'flex';
        
        // Remove any existing handlers to prevent duplicates
        const newOverlay = overlay.cloneNode(true);
        overlay.parentNode.replaceChild(newOverlay, overlay);
        
        // Get references to the new elements
        const newModalDialog = newOverlay.querySelector('.mosaic-dialog-box');
        const newModalFooter = newOverlay.querySelector('.mosaic-dialog-footer');
        
        // Re-attach button handlers
        const newButtons = newModalFooter.querySelectorAll('.mosaic-dialog-btn');
        buttons.forEach((btn, index) => {
            newButtons[index].onclick = btn.onClick;
        });
        
        // Prevent clicks inside dialog from closing modal
        newModalDialog.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Close only on overlay background click (outside dialog)
        newOverlay.addEventListener('click', (e) => {
            if (e.target === newOverlay) {
                this.closeModal();
            }
        });
    }

    closeModal() {
        const overlay = document.getElementById('mosaic-dialog-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    async showDeleteBackupsModal() {
        console.log('showDeleteBackupsModal called');
        
        try {
            // First, get the count of backup files
            console.log('Fetching backup count...');
            const response = await fetch(
                `index.php?option=com_phocamosaic&task=explorer.countBackups`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `${this.csrfToken}=1`
                }
            );
            
            console.log('Response received:', response);
            const result = await response.json();
            console.log('Result:', result);
            
            if (!result.success) {
                this.showToast('Failed to count backup files', 'error');
                return;
            }
            
            const count = result.count || 0;
            console.log('Backup count:', count);
            
            if (count === 0) {
                this.showToast('No backup files found', 'info');
                return;
            }
            
            const body = `
                <p>Found <strong>${count}</strong> backup file${count !== 1 ? 's' : ''}.</p>
                <p class="mosaic-dialog-warning">⚠️ This will permanently delete all .phmos.bak files.</p>
                <p class="mosaic-dialog-warning">⚠️ This action cannot be undone.</p>
            `;
            
            console.log('Showing modal...');
            this.showModal('Delete All Backup Files', body, [
                { text: 'Cancel', class: 'mosaic-dialog-btn-secondary', onClick: () => this.closeModal() },
                { text: 'Delete All', class: 'mosaic-dialog-btn-danger', onClick: () => this.handleDeleteBackups() }
            ]);
        } catch (error) {
            console.error('Count backups error:', error);
            this.showToast('Failed to count backup files: ' + error.message, 'error');
        }
    }

    async handleDeleteBackups() {
        try {
            const response = await fetch(
                `index.php?option=com_phocamosaic&task=explorer.deleteBackups`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `${this.csrfToken}=1`
                }
            );
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message || `Deleted ${result.count} backup file(s)`, 'success');
                this.closeModal();
            } else {
                this.showToast('Failed to delete backups: ' + (result.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Delete backups error:', error);
            this.showToast('Failed to delete backups: ' + error.message, 'error');
        }
    }

    async showCreateFolderModal() {
        console.log('showCreateFolderModal called');
        
        const body = `
            <label class="mosaic-dialog-label">Folder Name</label>
            <input type="text" id="folder-name-input" class="mosaic-dialog-input" placeholder="Enter folder name" />
            <div id="folder-error" class="mosaic-dialog-error"></div>
            <p class="mosaic-dialog-info">Folder will be created in: <strong>${this.currentFolder}</strong></p>
        `;
        
        this.showModal('Create New Folder', body, [
            { text: 'Cancel', class: 'mosaic-dialog-btn-secondary', onClick: () => this.closeModal() },
            { text: 'Create', class: 'mosaic-dialog-btn-primary', onClick: () => this.handleCreateFolder() }
        ]);
        
        // Focus input
        setTimeout(() => {
            const input = document.getElementById('folder-name-input');
            if (input) {
                input.focus();
            }
        }, 100);
    }

    async handleCreateFolder() {
        const input = document.getElementById('folder-name-input');
        const errorDiv = document.getElementById('folder-error');
        const folderName = input.value.trim();
        
        // Validate
        if (!folderName) {
            errorDiv.textContent = this.t('COM_PHOCAMOSAIC_ERROR_FOLDER_NAME_EMPTY', 'Folder name cannot be empty');
            errorDiv.style.display = 'block';
            return;
        }
        
        // Validate folder name - only alphanumeric, underscore, hyphen
        if (!/^[a-zA-Z0-9_-]+$/.test(folderName)) {
            errorDiv.textContent = this.t('COM_PHOCAMOSAIC_ERROR_FOLDER_NAME_INVALID_CHARS', 'Folder name can only contain letters, numbers, underscores, and hyphens');
            errorDiv.style.display = 'block';
            return;
        }
        
        try {
            const response = await fetch(
                `index.php?option=com_phocamosaic&task=explorer.createFolder`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `${this.csrfToken}=1&parentPath=${encodeURIComponent(this.currentFolder)}&folderName=${encodeURIComponent(folderName)}`
                }
            );
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast('Folder created successfully', 'success');
                this.closeModal();
                // Reload folder tree to show new folder
                await this.loadFolderTree();
            } else {
                errorDiv.textContent = result.message || this.t('COM_PHOCAMOSAIC_ERROR_CREATE_FOLDER_FAILED', 'Failed to create folder');
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Create folder error:', error);
            errorDiv.textContent = this.t('COM_PHOCAMOSAIC_ERROR_CREATE_FOLDER_FAILED', 'Failed to create folder') + ': ' + error.message;
            errorDiv.style.display = 'block';
        }
    }

    async handleSearch(query) {
        if (!query) {
            this.renderImages(this.images);
            return;
        }

        const filtered = this.images.filter(image => 
            image.filename.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderImages(filtered);
    }
    
    async handleUpload(files) {
        // Get max upload size from config
        const maxUploadSize = this.uploadConfig.maxUploadSize;
        const maxUploadSizeMB = this.uploadConfig.maxUploadSizeMB;
        
        // Validate files before upload
        const validFiles = [];
        const errors = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Check file size
            if (file.size > maxUploadSize) {
                errors.push(`${file.name}: File too large (max ${maxUploadSizeMB} MB)`);
                continue;
            }
            
            // Check file type
            if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
                errors.push(`${file.name}: Invalid file type (only JPG, PNG, GIF, WebP allowed)`);
                continue;
            }
            
            validFiles.push(file);
        }
        
        // Show errors if any
        if (errors.length > 0) {
            this.showToast(errors.join('<br>'), 'error', 5000);
            if (validFiles.length === 0) {
                return; // No valid files to upload
            }
        }
        
        const formData = new FormData();
        
        // Add all valid files to form data
        for (let i = 0; i < validFiles.length; i++) {
            formData.append('files[]', validFiles[i]);
        }
        
        formData.append('folder', this.currentFolder);
        formData.append(this.csrfToken, '1');
        
        try {
            // Show loading indicator
            const gridContainer = document.getElementById('image-grid-container');
            gridContainer.innerHTML = `
                <div class="loading-indicator">
                    <span class="spinner-border" role="status"></span>
                    <span>Uploading ${validFiles.length} file(s)...</span>
                </div>
            `;
            
            const response = await fetch(
                'index.php?option=com_phocamosaic&task=explorer.uploadImages',
                {
                    method: 'POST',
                    body: formData
                }
            );
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`Successfully uploaded ${result.uploaded} file(s)`, 'success');
                // Reload images to show newly uploaded files
                await this.loadImages();
                // Clear file input
                document.getElementById('file-upload-input').value = '';
            } else {
                this.showToast('Upload failed: ' + (result.message || 'Unknown error'), 'error');
                await this.loadImages();
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Upload failed: ' + error.message, 'error');
            await this.loadImages();
        }
    }

    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        
        while (bytes >= 1024 && i < units.length - 1) {
            bytes /= 1024;
            i++;
        }
        
        return `${bytes.toFixed(1)} ${units[i]}`;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ExplorerController());
} else {
    new ExplorerController();
}

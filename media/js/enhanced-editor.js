/* @package Joomla
 * @copyright Copyright (C) Open Source Matters. All rights reserved.
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
 * @extension Phoca Extension
 * @copyright Copyright (C) Jan Pavelka www.phoca.cz
 * @license http://www.gnu.org/copyleft/gpl.html GNU/GPL
 */

/**
 * Filter configuration system for advanced controls
 * Defines control types, parameters, and interactive features for each filter
 */
const FILTER_CONFIGS = {
    'Tint': {
        controls: [
            { type: 'color', name: 'tintColor', label: 'TINT_COLOR', default: '#ff8800' }
        ]
    },
    'Soft Focus': {
        controls: [
            { type: 'range', name: 'focalSize', label: 'FOCAL_SIZE', min: 50, max: 500, default: 200 }
        ],
        interactive: 'focalPoint'
    },
    'Filtered B&W': {
        controls: [
            { type: 'color', name: 'filterColor', label: 'FILTER_COLOR', default: '#ff0000' }
        ]
    },
    'Focal B&W': {
        controls: [
            { type: 'range', name: 'focalSize', label: 'FOCAL_SIZE', min: 50, max: 500, default: 200 }
        ],
        interactive: 'focalPoint'
    },
    'Graduated Tint': {
        controls: [
            { type: 'color', name: 'tintColor', label: 'TINT_COLOR', default: '#ffc864' },
            { type: 'range', name: 'feather', label: 'FEATHER', min: 0, max: 100, default: 50 },
            { type: 'range', name: 'shade', label: 'SHADE', min: 0, max: 100, default: 50 }
        ],
        interactive: 'gradientLine'
    },
    'Lomo-ish': {
        controls: [
            { type: 'range', name: 'blurEdges', label: 'BLUR_EDGES', min: 0, max: 100, default: 50 }
        ]
    },
    'Holga-ish': {
        controls: [
            { type: 'range', name: 'blurEdges', label: 'BLUR_EDGES', min: 0, max: 100, default: 50 },
            { type: 'range', name: 'grain', label: 'GRAIN', min: 0, max: 100, default: 50 }
        ]
    },
    'HDR-ish': {
        controls: [
            { type: 'range', name: 'radius', label: 'RADIUS', min: 1, max: 20, default: 5 },
            { type: 'range', name: 'strength', label: 'STRENGTH', min: 0, max: 100, default: 50 }
        ]
    },
    'Orton-ish': {
        controls: [
            { type: 'range', name: 'bloom', label: 'BLOOM', min: 0, max: 100, default: 50 },
            { type: 'range', name: 'brightness', label: 'BRIGHTNESS', min: 0, max: 100, default: 50 }
        ]
    },
    'Duo Tone': {
        controls: [
            { type: 'color', name: 'shadowColor', label: 'SHADOW_COLOR', default: '#2c3e50' },
            { type: 'color', name: 'highlightColor', label: 'HIGHLIGHT_COLOR', default: '#f39c12' },
            { type: 'range', name: 'brightness', label: 'BRIGHTNESS', min: -50, max: 50, default: 0 },
            { type: 'range', name: 'contrast', label: 'CONTRAST', min: -50, max: 50, default: 0 }
        ]
    },
    'Vignette': {
        controls: [
            { type: 'range', name: 'size', label: 'SIZE', min: 0, max: 100, default: 50 },
            { type: 'range', name: 'strength', label: 'STRENGTH', min: 0, max: 100, default: 50 },
            { type: 'color', name: 'vignetteColor', label: 'VIGNETTE_COLOR', default: '#000000' }
        ]
    },
    'Focal Zoom': {
        controls: [
            { type: 'range', name: 'zoominess', label: 'ZOOMINESS', min: 0, max: 100, default: 50 },
            { type: 'range', name: 'focalSize', label: 'FOCAL_SIZE', min: 50, max: 500, default: 200 },
            { type: 'range', name: 'edgeHardness', label: 'EDGE_HARDNESS', min: 0, max: 100, default: 50 }
        ],
        interactive: 'focalPoint'
    },
    'Pencil Sketch': {
        controls: [
            { type: 'range', name: 'radius', label: 'RADIUS', min: 1, max: 10, default: 3 },
            { type: 'range', name: 'strength', label: 'STRENGTH', min: 0, max: 100, default: 50 }
        ]
    },
    'Neon': {
        controls: [
            { type: 'color', name: 'neonColor', label: 'NEON_COLOR', default: '#ff0000' }
        ]
    },
    'Comic Book': {
        controls: [
            { type: 'range', name: 'colorBrush', label: 'COLOR_BRUSH', min: 2, max: 16, default: 8 },
            { type: 'range', name: 'dotDensity', label: 'DOT_DENSITY', min: 1, max: 10, default: 4 }
        ]
    }
};

class EnhancedMosaicEditor {
    constructor() {
        this.canvas = document.getElementById('image-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.imagePath = document.getElementById('image-path').value;
        this.baseUrl = document.getElementById('base-url').value;
        this.csrfToken = document.getElementById('csrf-token').value;
        
        // Get translations from Joomla
        this.translations = Joomla.getOptions('com_phocamosaic.translations', {});
        
        // Get configuration from Joomla
        this.config = Joomla.getOptions('com_phocamosaic.config', {
            presetStorage: 'localStorage'
        });
        
        //             storageMethod: 'json'
        // Debug: Log configuration
        //console.log('Phoca Mosaic Config:', this.config);
        
        // Image state
        this.originalImage = null;
        this.currentTool = null;
        
        // History management
        this.historyStack = [];
        this.historyIndex = -1;
        this.maxHistoryStates = 20;
        
        // Active filters
        this.activeFilters = [];
        
        /**
         * Current filter parameters object
         * Stores all parameter values for the currently selected filter
         * Structure varies by filter - see FILTER_CONFIGS for parameter definitions
         * @type {Object}
         */
        this.currentFilterParams = {};
        
        // Initialize
        this.init();
    }

    async init() {
        // Debug: Check for global r, g, b variables that might interfere with color picker
        /*console.log('Global variables check:', {
            r: typeof window.r !== 'undefined' ? window.r : 'undefined',
            g: typeof window.g !== 'undefined' ? window.g : 'undefined',
            b: typeof window.b !== 'undefined' ? window.b : 'undefined'
        });*/
        
        // Clean up any global r, g, b variables
        try {
            delete window.r;
            delete window.g;
            delete window.b;
        } catch (e) {
            console.warn('Could not delete global variables:', e);
        }
        
        await this.loadImage();
        this.attachEventListeners();
        this.updateHistoryButtons();
        this.createToastContainer();
        this.attachMobileToggleListeners();
    }
    
    // Translation helper
    t(key, fallback = '') {
        return this.translations[key] || fallback || key;
    }
    
    // Get translated filter name
    getFilterTranslation(filterName) {
        // Map filter names to translation keys
        const filterMap = {
            "I'm Feeling Lucky": 'COM_PHOCAMOSAIC_FEELING_LUCKY',
            'Autocontrast': 'COM_PHOCAMOSAIC_AUTOCONTRAST',
            'Autocolor': 'COM_PHOCAMOSAIC_AUTOCOLOR',
            'Fill Light': 'COM_PHOCAMOSAIC_FILL_LIGHT',
            'Highlights': 'COM_PHOCAMOSAIC_HIGHLIGHTS',
            'Shadows': 'COM_PHOCAMOSAIC_SHADOWS',
            'Color Temperature': 'COM_PHOCAMOSAIC_COLOR_TEMP',
            'Brightness': 'COM_PHOCAMOSAIC_BRIGHTNESS',
            'Contrast': 'COM_PHOCAMOSAIC_CONTRAST',
            'Sharpen': 'COM_PHOCAMOSAIC_SHARPEN',
            'Sepia': 'COM_PHOCAMOSAIC_SEPIA',
            'B&W': 'COM_PHOCAMOSAIC_BW',
            'Warmify': 'COM_PHOCAMOSAIC_WARMIFY',
            'Film Grain': 'COM_PHOCAMOSAIC_FILM_GRAIN',
            'Tint': 'COM_PHOCAMOSAIC_TINT',
            'Saturation': 'COM_PHOCAMOSAIC_SATURATION',
            'Soft Focus': 'COM_PHOCAMOSAIC_SOFT_FOCUS',
            'Glow': 'COM_PHOCAMOSAIC_GLOW',
            'Filtered B&W': 'COM_PHOCAMOSAIC_FILTERED_BW',
            'Focal B&W': 'COM_PHOCAMOSAIC_FOCAL_BW',
            'Graduated Tint': 'COM_PHOCAMOSAIC_GRADUATED_TINT',
            'Infrared': 'COM_PHOCAMOSAIC_INFRARED',
            'Lomo-ish': 'COM_PHOCAMOSAIC_LOMO',
            'Holga-ish': 'COM_PHOCAMOSAIC_HOLGA',
            'HDR-ish': 'COM_PHOCAMOSAIC_HDR_SCAPE',
            'Cinemascope': 'COM_PHOCAMOSAIC_CINEMASCOPE',
            'Orton-ish': 'COM_PHOCAMOSAIC_ORTON',
            "1960's": 'COM_PHOCAMOSAIC_1960S',
            'Invert Colors': 'COM_PHOCAMOSAIC_INVERT_COLORS',
            'Heat Map': 'COM_PHOCAMOSAIC_HEAT_MAP',
            'Cross Process': 'COM_PHOCAMOSAIC_CROSS_PROCESS',
            'Posterize': 'COM_PHOCAMOSAIC_POSTERIZE',
            'Duo Tone': 'COM_PHOCAMOSAIC_DUO_TONE',
            'Boost': 'COM_PHOCAMOSAIC_BOOST',
            'Soften': 'COM_PHOCAMOSAIC_SOFTEN',
            'Vignette': 'COM_PHOCAMOSAIC_VIGNETTE',
            'Pixelate': 'COM_PHOCAMOSAIC_PIXELATE',
            'Focal Zoom': 'COM_PHOCAMOSAIC_FOCAL_ZOOM',
            'Pencil Sketch': 'COM_PHOCAMOSAIC_PENCIL_SKETCH',
            'Neon': 'COM_PHOCAMOSAIC_NEON',
            'Comic Book': 'COM_PHOCAMOSAIC_COMIC_BOOK',
            'Tilt Shift': 'COM_PHOCAMOSAIC_TILT_SHIFT',
            'Valencia': 'COM_PHOCAMOSAIC_VALENCIA',
            'Nashville': 'COM_PHOCAMOSAIC_NASHVILLE',
            'Clarendon': 'COM_PHOCAMOSAIC_CLARENDON',
            'Gingham': 'COM_PHOCAMOSAIC_GINGHAM',
            'Juno': 'COM_PHOCAMOSAIC_JUNO',
            'Lark': 'COM_PHOCAMOSAIC_LARK'
        };
        
        const key = filterMap[filterName];
        return key ? this.t(key, filterName) : filterName;
    }

    createToastContainer() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
            document.body.appendChild(container);
            // console.log('Toast container created and appended to body');
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        //console.log('showToast called:', message, type, duration);
        
        // Ensure container exists
        let container = document.querySelector('.toast-container');
        if (!container) {
            //console.log('Creating toast container...');
            this.createToastContainer();
            container = document.querySelector('.toast-container');
        }
        
        if (!container) {
            console.error('Failed to create toast container!');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Force inline styles for visibility
        const bgColors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8',
            warning: '#ffc107'
        };
        
        toast.style.cssText = `
            min-width: 300px;
            padding: 1rem 1.25rem;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 14px;
            color: ${type === 'warning' ? '#000000' : '#ffffff'};
            background-color: ${bgColors[type] || bgColors.info};
            pointer-events: all;
            z-index: 999999;
            animation: slideIn 0.3s ease-out;
        `;
        
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ⓘ',
            warning: '⚠'
        };
        
        toast.innerHTML = `
            <span class="toast-icon" style="font-size: 20px; font-weight: bold;">${icons[type] || icons.info}</span>
            <span class="toast-message" style="flex: 1;">${message}</span>
        `;
        
        container.appendChild(toast);
       // console.log('Toast added to container:', toast);
       // console.log('Toast computed styles:', window.getComputedStyle(toast));
        
        // Force reflow to ensure animation plays
        toast.offsetHeight;
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    async loadImage() {
        try {
            let cleanPath = this.imagePath.replace(/^\/+/, '');
            //let imageUrl = this.baseUrl + cleanPath;
            // Force refresh in editor
            let imageUrl = this.baseUrl + cleanPath + '?t=' + Date.now();
            imageUrl = imageUrl.replace(/([^:]\/)\/+/g, "$1");
            
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imageUrl;
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            this.originalImage = img;
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            this.ctx.drawImage(img, 0, 0);
            this.pushHistory();
            
            // Update dimensions display
            this.updateDimensionsDisplay();
        } catch (error) {
            console.error('Failed to load image:', error);
            this.showToast(this.t('COM_PHOCAMOSAIC_ERROR_LOAD_IMAGE', 'Failed to load image'), 'error');
        }
    }
    
    // Helper to get basename
    basename(path) {
        return path.split('/').pop();
    }
    
    // Helper to update dimensions display
    updateDimensionsDisplay() {
        const dimensions = `${this.canvas.width} × ${this.canvas.height}`;
        const filename = this.basename(this.imagePath);
        
        // Update page title with filename and dimensions
        document.title = `${filename} (${dimensions})`;
        
        // Update dimensions display element (filename is separate in the template)
        const dimensionsEl = document.getElementById('image-dimensions');
        if (dimensionsEl) {
            dimensionsEl.textContent = `(${dimensions})`;
        }
        
        // console.log('Updated dimensions display:', filename, dimensions);
    }

    // ==================== HISTORY MANAGEMENT ====================
    
    pushHistory() {
        // Remove any forward history
        if (this.historyIndex < this.historyStack.length - 1) {
            this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
        }
        
        // Add current state with canvas dimensions
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.historyStack.push({
            imageData: imageData,
            width: this.canvas.width,
            height: this.canvas.height,
            filters: JSON.parse(JSON.stringify(this.activeFilters))
        });
        
        // Limit history size
        if (this.historyStack.length > this.maxHistoryStates) {
            this.historyStack.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateHistoryButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.historyStack[this.historyIndex];
            
            // Track if dimensions changed
            const dimensionsChanged = this.canvas.width !== state.width || this.canvas.height !== state.height;
            
            // Resize canvas if dimensions changed
            if (dimensionsChanged) {
                this.canvas.width = state.width;
                this.canvas.height = state.height;
            }
            
            this.ctx.putImageData(state.imageData, 0, 0);
            this.activeFilters = JSON.parse(JSON.stringify(state.filters));
            this.updateHistoryButtons();
            
            // Update dimensions display if changed
            if (dimensionsChanged) {
                this.updateDimensionsDisplay();
            }
            
            // Reset tool panel and clear current tool
            this.clearCurrentTool();
        }
    }

    redo() {
        if (this.historyIndex < this.historyStack.length - 1) {
            this.historyIndex++;
            const state = this.historyStack[this.historyIndex];
            
            // Track if dimensions changed
            const dimensionsChanged = this.canvas.width !== state.width || this.canvas.height !== state.height;
            
            // Resize canvas if dimensions changed
            if (dimensionsChanged) {
                this.canvas.width = state.width;
                this.canvas.height = state.height;
            }
            
            this.ctx.putImageData(state.imageData, 0, 0);
            this.activeFilters = JSON.parse(JSON.stringify(state.filters));
            this.updateHistoryButtons();
            
            // Update dimensions display if changed
            if (dimensionsChanged) {
                this.updateDimensionsDisplay();
            }
            
            // Reset tool panel and clear current tool
            this.clearCurrentTool();
        }
    }

    updateHistoryButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.historyIndex >= this.historyStack.length - 1;
    }

    reset() {
        this.showModal(this.t('RESET_CHANGES', 'Reset Changes'), this.t('RESET_CONFIRM', 'Are you sure you want to reset all changes?'), [
            { text: this.t('CANCEL', 'Cancel'), class: 'mosaic-dialog-btn-secondary', onClick: () => this.closeModal() },
            { text: this.t('RESET', 'Reset'), class: 'mosaic-dialog-btn-primary', onClick: () => {
                this.canvas.width = this.originalImage.width;
                this.canvas.height = this.originalImage.height;
                this.ctx.drawImage(this.originalImage, 0, 0);
                this.activeFilters = [];
                this.pushHistory();
                this.closeModal();
                this.showToast(this.t('IMAGE_RESET', 'Image reset to original'), 'info');
                
                // Reset tool panel and clear current tool
                this.clearCurrentTool();
            }}
        ]);
    }

    clearCurrentTool() {
        // Clear current tool
        this.currentTool = null;
        
        // Disable focal point interaction
        this.disableFocalPointInteraction();
        
        // Remove active class from all tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Reset tool panel
        const panel = document.querySelector('.tool-panel');
        if (panel) {
            panel.innerHTML = `<h3>${this.t('COM_PHOCAMOSAIC_TOOL_OPTIONS', 'Tool Options')}</h3><p style="color: var(--mosaic-text-secondary); font-size: 0.875rem;">${this.t('COM_PHOCAMOSAIC_SELECT_TOOL', 'Select a tool to see options')}</p>`;
        }
    }

    // ==================== EVENT LISTENERS ====================
    
    attachEventListeners() {
        // Toolbar buttons
        document.getElementById('save-btn')?.addEventListener('click', () => this.save());
        document.getElementById('save-as-btn')?.addEventListener('click', () => this.showSaveAsDialog());
        document.getElementById('apply-btn')?.addEventListener('click', () => this.apply());
        document.getElementById('cancel-btn')?.addEventListener('click', () => this.cancel());
        document.getElementById('reset-btn')?.addEventListener('click', () => this.reset());
        document.getElementById('undo-btn')?.addEventListener('click', () => this.undo());
        document.getElementById('redo-btn')?.addEventListener('click', () => this.redo());
        document.getElementById('close-btn')?.addEventListener('click', () => {
            // Extract folder from current image path to return to the same folder
            const pathParts = this.imagePath.split('/');
            pathParts.pop(); // Remove filename
            const folder = pathParts.join('/') || 'images';
            
            // Preserve tmpl and e_name parameters if we're in component mode
            const urlParams = new URLSearchParams(window.location.search);
            const tmpl = urlParams.get('tmpl');
            const eName = urlParams.get('e_name');
            
            let extraParams = '';
            if (tmpl) extraParams += `&tmpl=${tmpl}`;
            if (eName) extraParams += `&e_name=${eName}`;
            
            window.location.href = `index.php?option=com_phocamosaic&view=explorer&folder=${encodeURIComponent(folder)}${extraParams}`;
        });
        
        // Filter search
        document.getElementById('filter-search')?.addEventListener('input', (e) => {
            this.filterSearch(e.target.value);
        });
        
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filterName = e.target.dataset.filter;
                const toolName = e.target.dataset.tool;
                
                if (filterName) {
                    this.selectFilter(filterName);
                } else if (toolName) {
                    this.handleEditTool(toolName);
                }
            });
        });
        
        // Intensity slider
        document.getElementById('filter-intensity')?.addEventListener('input', (e) => {
            this.applyCurrentFilter(parseInt(e.target.value));
        });
        
        // Preset buttons
        document.getElementById('save-preset-btn')?.addEventListener('click', () => this.savePreset());
        document.getElementById('load-preset-btn')?.addEventListener('click', () => this.loadPreset());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    this.undo();
                } else if (e.key === 'y') {
                    e.preventDefault();
                    this.redo();
                }
            }
        });
    }

    attachMobileToggleListeners() {
        // Mobile filter toggle (left sidebar)
        const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
        const toolSidebar = document.getElementById('tool-sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        
        // Mobile tool toggle (right panel)
        const mobileToolToggle = document.getElementById('mobile-tool-toggle');
        const toolPanel = document.querySelector('.tool-panel');
        
        if (mobileFilterToggle && toolSidebar) {
            mobileFilterToggle.addEventListener('click', () => {
                toolSidebar.classList.add('mobile-open');
                sidebarOverlay.classList.add('active');
                // Close tool panel if open
                toolPanel.classList.remove('mobile-open');
            });
        }
        
        if (mobileToolToggle && toolPanel) {
            mobileToolToggle.addEventListener('click', () => {
                toolPanel.classList.add('mobile-open');
                sidebarOverlay.classList.add('active');
                // Close filter sidebar if open
                toolSidebar.classList.remove('mobile-open');
            });
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                toolSidebar.classList.remove('mobile-open');
                toolPanel.classList.remove('mobile-open');
                sidebarOverlay.classList.remove('active');
            });
        }
    }

    filterSearch(query) {
        const tools = document.querySelectorAll('.tool-btn');
        const lowerQuery = query.toLowerCase();
        
        tools.forEach(tool => {
            const filterName = tool.textContent.toLowerCase();
            if (filterName.includes(lowerQuery)) {
                tool.classList.remove('hidden');
            } else {
                tool.classList.add('hidden');
            }
        });
    }

    selectFilter(filterName) {
        // If there's a current filter being previewed, ask to apply or discard
        if (this.currentTool && this.currentTool !== filterName) {
            const currentIntensity = document.getElementById('filter-intensity')?.value || 0;
            if (parseInt(currentIntensity) !== 0) {
                // Commit the current filter to history before switching
                this.pushHistory();
            }
        }
        
        this.currentTool = filterName;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filterName}"]`)?.classList.add('active');
        
        // Get filter configuration
        const config = FILTER_CONFIGS[filterName];
        
        // Initialize currentFilterParams with default values
        this.currentFilterParams = {};
        if (config && config.controls) {
            for (const control of config.controls) {
                this.currentFilterParams[control.name] = control.default;
            }
        }
        
        // Initialize interactive control positions if applicable
        if (config && config.interactive === 'focalPoint') {
            this.currentFilterParams.focalX = this.canvas.width / 2;
            this.currentFilterParams.focalY = this.canvas.height / 2;
        } else if (config && config.interactive === 'gradientLine') {
            this.currentFilterParams.gradientY = this.canvas.height / 2;
            this.currentFilterParams.gradientAngle = 0;
        }
        
        // Determine slider range based on filter type
        let minValue = -100;
        let maxValue = 100;
        let defaultValue = 0;
        
        // Autocontrast and Autocolor apply at full strength immediately
        if (filterName === 'Autocontrast' || filterName === 'Autocolor') {
            minValue = 0;
            maxValue = 100;
            defaultValue = 100; // Full effect immediately
        }
        
        // Show controls using buildFilterControlsHTML
        const panel = document.querySelector('.tool-panel');
        if (panel) {
            // Clean up any global r, g, b variables that might interfere with browser's color picker
            try {
                delete window.r;
                delete window.g;
                delete window.b;
            } catch (e) {
                // Ignore errors if variables don't exist or can't be deleted
            }
            
            panel.innerHTML = this.buildFilterControlsHTML(filterName, config, minValue, maxValue, defaultValue);
            
            // Color Picker - Bug in Chrome
            // Explicitly set color picker values via JavaScript to ensure browser initializes them correctly
            if (config && config.controls) {
                for (const control of config.controls) {
                    if (control.type === 'color') {
                        const colorInput = document.getElementById(`filter-${control.name}`);
                        if (colorInput) {
                            /*console.log('Setting color picker:', {
                                id: `filter-${control.name}`,
                                defaultValue: control.default,
                                currentValue: colorInput.value
                            });*/
                            
                            // Recreate the input element to force browser to reinitialize
                            const parent = colorInput.parentNode;
                            const newInput = document.createElement('input');
                            newInput.type = 'color';
                            newInput.id = colorInput.id;
                            newInput.className = colorInput.className;
                            newInput.style.cssText = colorInput.style.cssText;
                            
                            // Set value using both setAttribute and property
                            newInput.setAttribute('value', control.default);
                            newInput.value = control.default;
                            
                            // Watch for value changes using MutationObserver
                            const observer = new MutationObserver((mutations) => {
                                mutations.forEach((mutation) => {
                                    if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                                        const newValue = newInput.value;
                                        //console.log('MutationObserver detected value change:', newValue);
                                        
                                        // Trigger change event manually
                                        newInput.dispatchEvent(new Event('change', { bubbles: true }));
                                    }
                                });
                            });
                            
                            observer.observe(newInput, {
                                attributes: true,
                                attributeFilter: ['value']
                            });
                            
                            parent.replaceChild(newInput, colorInput);
                            
                            /*console.log('After recreating:', {
                                value: newInput.value,
                                getAttribute: newInput.getAttribute('value')
                            });*/
                            
                            // Add eyedropper button functionality
                            const eyedropperBtn = document.getElementById(`eyedropper-${control.name}`);
                            if (eyedropperBtn) {
                                eyedropperBtn.addEventListener('click', async () => {
                                    if (!window.EyeDropper) {
                                        this.showToast('EyeDropper API not supported in this browser', 'error');
                                        return;
                                    }
                                    
                                    try {
                                        const eyeDropper = new EyeDropper();
                                        const result = await eyeDropper.open();
                                        
                                        //console.log('EyeDropper result:', result.sRGBHex);
                                        
                                        let colorValue = result.sRGBHex;
                                        
                                        // Check if the result is in rgba format (some browsers return this)
                                        if (colorValue && (colorValue.startsWith('rgba') || colorValue.startsWith('rgb'))) {
                                            //console.log('Converting rgba to hex:', colorValue);
                                            
                                            // Parse rgba/rgb values
                                            const match = colorValue.match(/rgba?\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*[\d.]+)?\s*\)/);
                                            if (match) {
                                                let r = match[1].trim();
                                                let g = match[2].trim();
                                                let b = match[3].trim();
                                                
                                                // Convert to numbers
                                                r = parseInt(r, 10);
                                                g = parseInt(g, 10);
                                                b = parseInt(b, 10);
                                                
                                                //console.log('Parsed RGB:', { r, g, b });
                                                
                                                // Convert to hex
                                                const toHex = (n) => {
                                                    const hex = Math.max(0, Math.min(255, n)).toString(16);
                                                    return hex.length === 1 ? '0' + hex : hex;
                                                };
                                                
                                                colorValue = '#' + toHex(r) + toHex(g) + toHex(b);
                                                //console.log('Converted to hex:', colorValue);
                                            }
                                        }
                                        
                                        // Get the color input element again (it might have been recreated)
                                        const colorInput = document.getElementById(`filter-${control.name}`);
                                        if (colorInput) {
                                            // Set the color in the input
                                            colorInput.value = colorValue;
                                            
                                            // Update the filter params
                                            this.currentFilterParams[control.name] = colorValue;
                                            
                                            // Apply filter immediately
                                            const intensity = parseInt(document.getElementById('filter-intensity')?.value || 0);
                                            this.applyCurrentFilter(intensity);
                                            
                                            this.showToast('Color picked: ' + colorValue, 'success');
                                        }
                                    } catch (err) {
                                        console.log('EyeDropper cancelled or failed:', err);
                                    }
                                });
                            }
                        }
                    }
                }
            }
            
            // Attach event listener for intensity slider
            document.getElementById('filter-intensity').addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.querySelector('.slider-value').textContent = `${value}`;
                this.applyCurrentFilter(value);
            });
            
            // Attach event listeners for filter-specific controls (MUST be after recreation)
            this.attachControlEventListeners(config);
            
            // Apply the filter with default value immediately for preview
            this.applyCurrentFilter(defaultValue);
            
            // Apply button handler
            document.getElementById('apply-filter').addEventListener('click', () => {
                const intensity = parseInt(document.getElementById('filter-intensity').value);
                if (intensity !== 0) {
                    // Add filter to activeFilters array with parameters
                    this.activeFilters.push({
                        name: filterName,
                        intensity: intensity,
                        params: { ...this.currentFilterParams }
                    });
                    
                    // Commit the filter to history
                    this.pushHistory();
                    this.showToast(`${filterName} ${this.t('FILTER_APPLIED', 'applied')}`, 'success');
                }
                this.clearCurrentTool();
            });
            
            // Cancel button handler
            document.getElementById('cancel-filter').addEventListener('click', () => {
                // Restore to last history state
                if (this.historyIndex >= 0) {
                    const state = this.historyStack[this.historyIndex];
                    this.canvas.width = state.width;
                    this.canvas.height = state.height;
                    this.ctx.putImageData(state.imageData, 0, 0);
                }
                this.clearCurrentTool();
            });
        }
    }

    /**
     * Build HTML for a color picker control
     * @param {Object} control - Control configuration object
     * @returns {string} HTML string for color picker
     */
    buildColorPicker(control) {
        const label = this.t(control.label, control.label);
        return `
            <div class="control-group" style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem;">${label}</label>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <input type="color" 
                           id="filter-${control.name}" 
                           value="${control.default}"
                           class="filter-color-picker"
                           style="flex: 1; height: 40px; cursor: pointer;">
                    <button type="button" 
                            id="eyedropper-${control.name}"
                            class="eyedropper-btn"
                            style="height: 40px; width: 40px; background: var(--mosaic-bg-medium); border: 1px solid var(--mosaic-border); border-radius: 4px; cursor: pointer; color: var(--mosaic-text-primary); font-size: 20px; display: flex; align-items: center; justify-content: center;"
                            title="Pick color from screen">
                        💧
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Build HTML for a range input control
     * @param {Object} control - Control configuration object
     * @returns {string} HTML string for range input
     */
    buildRangeInput(control) {
        const label = this.t(control.label, control.label);
        return `
            <div class="slider-control" style="margin-bottom: 1rem;">
                <label>${label}</label>
                <input type="range" 
                       id="filter-${control.name}" 
                       min="${control.min}" 
                       max="${control.max}" 
                       value="${control.default}">
                <span class="slider-value">${control.default}</span>
            </div>
        `;
    }

    /**
     * Build complete HTML for filter controls
     * @param {string} filterName - Name of the filter
     * @param {Object} config - Filter configuration from FILTER_CONFIGS
     * @param {number} minValue - Minimum intensity value
     * @param {number} maxValue - Maximum intensity value
     * @param {number} defaultValue - Default intensity value
     * @returns {string} Complete HTML string for filter controls
     */
    buildFilterControlsHTML(filterName, config, minValue, maxValue, defaultValue) {
        const translatedFilterName = this.getFilterTranslation(filterName);
        
        let html = `<h3>${translatedFilterName}</h3>`;
        
        // Always include intensity slider
        html += `
            <div class="slider-control">
                <label>${this.t('COM_PHOCAMOSAIC_INTENSITY', 'Intensity')}</label>
                <input type="range" id="filter-intensity" min="${minValue}" max="${maxValue}" value="${defaultValue}">
                <span class="slider-value">${defaultValue}</span>
            </div>
        `;
        
        // Add filter-specific controls if configuration exists
        if (config && config.controls) {
            for (const control of config.controls) {
                if (control.type === 'color') {
                    html += this.buildColorPicker(control);
                } else if (control.type === 'range') {
                    html += this.buildRangeInput(control);
                }
            }
        }
        
        // Add Apply and Cancel buttons
        html += `
            <button type="button" id="apply-filter" class="mosaic-dialog-btn mosaic-dialog-btn-primary" style="width: 100%; margin-top: 1rem;">${this.t('COM_PHOCAMOSAIC_APPLY', 'Apply')}</button>
            <button type="button" id="cancel-filter" class="mosaic-dialog-btn mosaic-dialog-btn-secondary" style="width: 100%; margin-top: 0.5rem;">${this.t('COM_PHOCAMOSAIC_CANCEL', 'Cancel')}</button>
        `;
        
        return html;
    }

    /**
     * Attach event listeners to filter-specific controls
     * @param {Object} config - Filter configuration from FILTER_CONFIGS
     */
    attachControlEventListeners(config) {
        if (!config || !config.controls) return;
        
        for (const control of config.controls) {
            const element = document.getElementById(`filter-${control.name}`);
            if (!element) continue;
            
            if (control.type === 'color') {
                const element = document.getElementById(`filter-${control.name}`);
                
                // Debug: Listen to ALL events to see what the eyedropper sends
                ['input', 'change', 'blur', 'focus', 'click', 'mouseup', 'mousedown'].forEach(eventType => {
                    element.addEventListener(eventType, (e) => {
                      /*  console.log(`Event ${eventType}:`, {
                            value: e.target.value,
                            computedValue: window.getComputedStyle(e.target).getPropertyValue('color')
                        });*/
                    });
                });
                
                // For color pickers, handle both input and change events
                const handleColorChange = (e) => {
                    let colorValue = e.target.value;
                    
                  /*  console.log('Color picker event:', {
                        eventType: e.type,
                        controlName: control.name,
                        rawValue: colorValue,
                        type: typeof colorValue
                    });*/
                    
                    // Check if value is in rgba format (from eyedropper)
                    if (colorValue && (colorValue.startsWith('rgba') || colorValue.startsWith('rgb'))) {
                        //console.log('Converting rgba/rgb to hex:', colorValue);
                        
                        // Parse rgba/rgb values - handle NaN in the string
                        const match = colorValue.match(/rgba?\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*[\d.]+)?\s*\)/);
                        if (match) {
                            let r = match[1].trim();
                            let g = match[2].trim();
                            let b = match[3].trim();
                            
                            //console.log('Parsed RGB strings:', { r, g, b });
                            
                            // Convert to numbers, replacing NaN with 0
                            r = r === 'NaN' || isNaN(parseInt(r, 10)) ? 0 : parseInt(r, 10);
                            g = g === 'NaN' || isNaN(parseInt(g, 10)) ? 0 : parseInt(g, 10);
                            b = b === 'NaN' || isNaN(parseInt(b, 10)) ? 0 : parseInt(b, 10);
                            
                            //console.log('Parsed RGB numbers:', { r, g, b });
                            
                            // Convert to hex
                            const toHex = (n) => {
                                const hex = Math.max(0, Math.min(255, n)).toString(16);
                                return hex.length === 1 ? '0' + hex : hex;
                            };
                            
                            colorValue = '#' + toHex(r) + toHex(g) + toHex(b);
                            
                            //console.log('Converted to hex:', colorValue);
                            
                            // Update the input element with hex value
                            e.target.value = colorValue;
                        } else {
                            console.error('Failed to match rgba pattern:', colorValue);
                            return;
                        }
                    }
                    
                    // Validate color value - must be hex format
                    if (!colorValue || !colorValue.match(/^#[0-9A-Fa-f]{6}$/)) {
                        console.warn('Invalid color value received:', colorValue);
                        // Invalid color, don't update or apply filter
                        return;
                    }
                    
                    // Valid color - update params and apply
                    this.currentFilterParams[control.name] = colorValue;
                    
                    //console.log('Color accepted:', colorValue, 'currentFilterParams:', this.currentFilterParams);
                    
                    // Apply filter with current intensity for real-time preview
                    const intensity = parseInt(document.getElementById('filter-intensity')?.value || 0);
                    this.applyCurrentFilter(intensity);
                };
                
                // Listen to both input and change events
                element.addEventListener('input', handleColorChange);
                element.addEventListener('change', handleColorChange);
                
            } else if (control.type === 'range') {
                element.addEventListener('input', (e) => {
                    this.currentFilterParams[control.name] = parseFloat(e.target.value);
                    // Update value display for range inputs
                    const valueDisplay = e.target.nextElementSibling;
                    if (valueDisplay && valueDisplay.classList.contains('slider-value')) {
                        valueDisplay.textContent = e.target.value;
                    }
                    
                    // Apply filter with current intensity for real-time preview
                    const intensity = parseInt(document.getElementById('filter-intensity')?.value || 0);
                    this.applyCurrentFilter(intensity);
                });
            }
        }
        
        // Enable focal point interaction if filter supports it
        if (config && config.interactive === 'focalPoint') {
            this.enableFocalPointInteraction();
        }
    }

    /**
     * Enable interactive focal point selection on canvas
     * User can click on canvas to set the focal point for filters
     */
    enableFocalPointInteraction() {
        // Remove any existing focal point listeners
        this.disableFocalPointInteraction();
        
        // Create focal point indicator (shows the affected area)
        const indicator = document.createElement('div');
        indicator.id = 'focal-point-indicator';
        indicator.style.cssText = `
            position: absolute;
            border: 2px solid #4a9eff;
            border-radius: 50%;
            pointer-events: none;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 10px rgba(74, 158, 255, 0.5);
            background-color: rgba(74, 158, 255, 0.1);
            z-index: 1000;
        `;
        
        const canvasArea = document.querySelector('.canvas-area');
        canvasArea.style.position = 'relative';
        canvasArea.appendChild(indicator);
        
        // Position indicator at current focal point
        this.updateFocalPointIndicator();
        
        // Canvas click handler
        this.focalPointHandler = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Normalize to 0-1 range based on display size
            this.currentFilterParams.focalX = x / rect.width;
            this.currentFilterParams.focalY = y / rect.height;
            
            // Update indicator position
            this.updateFocalPointIndicator();
            
            // Apply filter with new focal point
            const intensity = parseInt(document.getElementById('filter-intensity')?.value || 0);
            this.applyCurrentFilter(intensity);
        };
        
        this.canvas.addEventListener('click', this.focalPointHandler);
        this.canvas.style.cursor = 'crosshair';
        
        // Listen to focalSize changes to update indicator size
        const focalSizeInput = document.getElementById('filter-focalSize');
        if (focalSizeInput) {
            this.focalSizeHandler = () => {
                this.updateFocalPointIndicator();
            };
            focalSizeInput.addEventListener('input', this.focalSizeHandler);
        }
    }

    /**
     * Update focal point indicator position and size
     */
    updateFocalPointIndicator() {
        const indicator = document.getElementById('focal-point-indicator');
        if (!indicator) return;
        
        const focalX = this.currentFilterParams.focalX || 0.5;
        const focalY = this.currentFilterParams.focalY || 0.5;
        const focalSize = this.currentFilterParams.focalSize || 200;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasArea = document.querySelector('.canvas-area');
        const canvasRect = canvasArea.getBoundingClientRect();
        
        // Calculate position on screen - use display coordinates directly
        const left = rect.left - canvasRect.left + (focalX * rect.width);
        const top = rect.top - canvasRect.top + (focalY * rect.height);
        
        // Calculate size - focalSize is in canvas pixels, scale to display size
        const scale = rect.width / this.canvas.width;
        const displaySize = focalSize * 2 * scale; // Diameter
        
        indicator.style.left = `${left}px`;
        indicator.style.top = `${top}px`;
        indicator.style.width = `${displaySize}px`;
        indicator.style.height = `${displaySize}px`;
        indicator.style.display = 'block';
    }

    /**
     * Disable focal point interaction
     */
    disableFocalPointInteraction() {
        if (this.focalPointHandler) {
            this.canvas.removeEventListener('click', this.focalPointHandler);
            this.focalPointHandler = null;
        }
        
        if (this.focalSizeHandler) {
            const focalSizeInput = document.getElementById('filter-focalSize');
            if (focalSizeInput) {
                focalSizeInput.removeEventListener('input', this.focalSizeHandler);
            }
            this.focalSizeHandler = null;
        }
        
        this.canvas.style.cursor = 'default';
        
        const indicator = document.getElementById('focal-point-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    applyCurrentFilter(intensity) {
        if (!this.currentTool) return;
        
        // Get the last saved state from history (not original image)
        if (this.historyIndex >= 0) {
            const state = this.historyStack[this.historyIndex];
            this.canvas.width = state.width;
            this.canvas.height = state.height;
            this.ctx.putImageData(state.imageData, 0, 0);
        } else {
            // Fallback to original image if no history
            this.ctx.drawImage(this.originalImage, 0, 0);
        }
        
        // If intensity is 0, just show current state
        if (intensity === 0) {
            return;
        }
        
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply filter with parameters
        const filtered = this.applyFilter(imageData, this.currentTool, intensity, this.currentFilterParams);
        this.ctx.putImageData(filtered, 0, 0);
    }

    applyFilter(imageData, filterName, intensity, params = {}) {
            const data = imageData.data;
            const width = imageData.width;
            const height = imageData.height;

            // Create a copy for processing
            const result = new ImageData(
                new Uint8ClampedArray(data),
                width,
                height
            );

            // Apply the appropriate filter
            switch(filterName) {
                // Common
                case 'I\'m Feeling Lucky': return this.filterLucky(result, intensity, params);
                case 'Autocontrast': return this.filterAutocontrast(result, intensity, params);
                case 'Autocolor': return this.filterAutocolor(result, intensity, params);

                // Lighting/Color
                case 'Fill Light': return this.filterFillLight(result, intensity, params);
                case 'Highlights': return this.filterHighlights(result, intensity, params);
                case 'Shadows': return this.filterShadows(result, intensity, params);
                case 'Color Temperature': return this.filterColorTemp(result, intensity, params);
                case 'Brightness': return this.filterBrightness(result, intensity, params);
                case 'Contrast': return this.filterContrast(result, intensity, params);

                // Filter A
                case 'Sharpen': return this.filterSharpen(result, intensity, params);
                case 'Sepia': return this.filterSepia(result, intensity, params);
                case 'B&W': return this.filterBW(result, intensity, params);
                case 'Warmify': return this.filterWarmify(result, intensity, params);
                case 'Film Grain': return this.filterFilmGrain(result, intensity, params);
                case 'Tint': return this.filterTint(result, intensity, params);
                case 'Saturation': return this.filterSaturation(result, intensity, params);
                case 'Soft Focus': return this.filterSoftFocus(result, intensity, params);
                case 'Glow': return this.filterGlow(result, intensity, params);
                case 'Filtered B&W': return this.filterFilteredBW(result, intensity, params);
                case 'Focal B&W': return this.filterFocalBW(result, intensity, params);
                case 'Graduated Tint': return this.filterGraduatedTint(result, intensity, params);

                // Filter B
                case 'Infrared': return this.filterInfrared(result, intensity, params);
                case 'Lomo-ish': return this.filterLomo(result, intensity, params);
                case 'Holga-ish': return this.filterHolga(result, intensity, params);
                case 'HDR-ish': return this.filterHDR(result, intensity, params);
                case 'Cinemascope': return this.filterCinemascope(result, intensity, params);
                case 'Orton-ish': return this.filterOrton(result, intensity, params);
                case '1960\'s': return this.filter1960s(result, intensity, params);
                case 'Invert Colors': return this.filterInvert(result, intensity, params);
                case 'Heat Map': return this.filterHeatMap(result, intensity, params);
                case 'Cross Process': return this.filterCrossProcess(result, intensity, params);
                case 'Posterize': return this.filterPosterize(result, intensity, params);
                case 'Duo Tone': return this.filterDuoTone(result, intensity, params);

                // Filter C
                case 'Boost': return this.filterBoost(result, intensity, params);
                case 'Soften': return this.filterSoften(result, intensity, params);
                case 'Vignette': return this.filterVignette(result, intensity, params);
                case 'Pixelate': return this.filterPixelate(result, intensity, params);
                case 'Focal Zoom': return this.filterFocalZoom(result, intensity, params);
                case 'Pencil Sketch': return this.filterPencilSketch(result, intensity, params);
                case 'Neon': return this.filterNeon(result, intensity, params);
                case 'Comic Book': return this.filterComicBook(result, intensity, params);
                case 'Tilt Shift': return this.filterTiltShift(result, intensity, params);

                // Instagram
                case 'Valencia': return this.filterValencia(result, intensity, params);
                case 'Nashville': return this.filterNashville(result, intensity, params);
                case 'Clarendon': return this.filterClarendon(result, intensity, params);
                case 'Gingham': return this.filterGingham(result, intensity, params);
                case 'Juno': return this.filterJuno(result, intensity, params);
                case 'Lark': return this.filterLark(result, intensity, params);

                default: return result;
            }
        }

    // ==================== FILTER ENGINE ====================
    
    // ==================== COMMON FILTERS ====================
    
    filterLucky(imageData, intensity) {
        const data = imageData.data;
        const histogram = { r: [], g: [], b: [] };
        
        // Calculate histogram
        for (let i = 0; i < 256; i++) {
            histogram.r[i] = histogram.g[i] = histogram.b[i] = 0;
        }
        
        for (let i = 0; i < data.length; i += 4) {
            histogram.r[data[i]]++;
            histogram.g[data[i + 1]]++;
            histogram.b[data[i + 2]]++;
        }
        
        // Find 1st and 99th percentile
        const totalPixels = data.length / 4;
        const p1 = Math.floor(totalPixels * 0.01);
        const p99 = Math.floor(totalPixels * 0.99);
        
        const getPercentile = (hist, percentile) => {
            let sum = 0;
            for (let i = 0; i < 256; i++) {
                sum += hist[i];
                if (sum >= percentile) return i;
            }
            return 255;
        };
        
        const min = {
            r: getPercentile(histogram.r, p1),
            g: getPercentile(histogram.g, p1),
            b: getPercentile(histogram.b, p1)
        };
        
        const max = {
            r: getPercentile(histogram.r, p99),
            g: getPercentile(histogram.g, p99),
            b: getPercentile(histogram.b, p99)
        };
        
        // Apply contrast stretch
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const newR = Math.max(0, Math.min(255, (r - min.r) * 255 / (max.r - min.r)));
            const newG = Math.max(0, Math.min(255, (g - min.g) * 255 / (max.g - min.g)));
            const newB = Math.max(0, Math.min(255, (b - min.b) * 255 / (max.b - min.b)));
            
            data[i] = this.blend(r, newR, intensity);
            data[i + 1] = this.blend(g, newG, intensity);
            data[i + 2] = this.blend(b, newB, intensity);
        }
        
        return imageData;
    }

    filterAutocontrast(imageData, intensity) {
        // Intensity is now 0-100, where 0 = no effect, 100 = full effect
        if (intensity === 0) return imageData;
        
        const data = imageData.data;
        
        // Build histogram
        const histogram = { r: new Array(256).fill(0), g: new Array(256).fill(0), b: new Array(256).fill(0) };
        for (let i = 0; i < data.length; i += 4) {
            histogram.r[data[i]]++;
            histogram.g[data[i + 1]]++;
            histogram.b[data[i + 2]]++;
        }
        
        // Find 1st and 99th percentile
        const totalPixels = data.length / 4;
        const p1 = Math.floor(totalPixels * 0.01);
        const p99 = Math.floor(totalPixels * 0.99);
        
        const getPercentile = (hist, percentile) => {
            let sum = 0;
            for (let i = 0; i < 256; i++) {
                sum += hist[i];
                if (sum >= percentile) return i;
            }
            return 255;
        };
        
        const min = {
            r: getPercentile(histogram.r, p1),
            g: getPercentile(histogram.g, p1),
            b: getPercentile(histogram.b, p1)
        };
        
        const max = {
            r: getPercentile(histogram.r, p99),
            g: getPercentile(histogram.g, p99),
            b: getPercentile(histogram.b, p99)
        };
        
        //console.log('Autocontrast - min:', min, 'max:', max, 'intensity:', intensity);
        
        // Apply contrast stretch - blend expects 0-100 intensity
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Prevent division by zero - if range is 0, skip this channel
            const rangeR = max.r - min.r;
            const rangeG = max.g - min.g;
            const rangeB = max.b - min.b;
            
            const newR = rangeR > 0 ? Math.max(0, Math.min(255, (r - min.r) * 255 / rangeR)) : r;
            const newG = rangeG > 0 ? Math.max(0, Math.min(255, (g - min.g) * 255 / rangeG)) : g;
            const newB = rangeB > 0 ? Math.max(0, Math.min(255, (b - min.b) * 255 / rangeB)) : b;
            
            data[i] = this.blend(r, newR, intensity);
            data[i + 1] = this.blend(g, newG, intensity);
            data[i + 2] = this.blend(b, newB, intensity);
        }
        
        return imageData;
    }

    filterAutocolor(imageData, intensity) {
        // Intensity is now 0-100, where 0 = no effect, 100 = full effect
        if (intensity === 0) return imageData;
        
        const data = imageData.data;
        let avgR = 0, avgG = 0, avgB = 0;
        const pixelCount = data.length / 4;
        
        // Calculate averages
        for (let i = 0; i < data.length; i += 4) {
            avgR += data[i];
            avgG += data[i + 1];
            avgB += data[i + 2];
        }
        
        avgR /= pixelCount;
        avgG /= pixelCount;
        avgB /= pixelCount;
        
        const gray = (avgR + avgG + avgB) / 3;
        
        // Prevent division by very small numbers
        const scaleR = avgR > 1 ? gray / avgR : 1;
        const scaleG = avgG > 1 ? gray / avgG : 1;
        const scaleB = avgB > 1 ? gray / avgB : 1;
        
        //console.log('Autocolor - avg:', {avgR, avgG, avgB}, 'gray:', gray, 'scale:', {scaleR, scaleG, scaleB}, 'intensity:', intensity);
        
        // Apply color balance with amplified effect - blend expects 0-100 intensity
        for (let i = 0; i < data.length; i += 4) {
            // Amplify the scaling effect
            const amplifiedScaleR = 1 + (scaleR - 1) * 1.5;
            const amplifiedScaleG = 1 + (scaleG - 1) * 1.5;
            const amplifiedScaleB = 1 + (scaleB - 1) * 1.5;
            
            const newR = Math.min(255, Math.max(0, data[i] * amplifiedScaleR));
            const newG = Math.min(255, Math.max(0, data[i + 1] * amplifiedScaleG));
            const newB = Math.min(255, Math.max(0, data[i + 2] * amplifiedScaleB));
            
            data[i] = this.blend(data[i], newR, intensity);
            data[i + 1] = this.blend(data[i + 1], newG, intensity);
            data[i + 2] = this.blend(data[i + 2], newB, intensity);
        }
        
        return imageData;
    }

    // ==================== LIGHTING/COLOR FILTERS ====================
    
    filterFillLight(imageData, intensity) {
        const data = imageData.data;
        
        // Normalize intensity from -100..100 to -1..1
        const normalizedIntensity = intensity / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            const l = this.getLuminance(data[i], data[i + 1], data[i + 2]);
            
            if (normalizedIntensity > 0) {
                // Brighten shadows progressively
                if (l < 180) {
                    const shadowFactor = (180 - l) / 180;
                    const boost = shadowFactor * normalizedIntensity * 0.6;
                    data[i] = Math.min(255, data[i] + (255 - data[i]) * boost);
                    data[i + 1] = Math.min(255, data[i + 1] + (255 - data[i + 1]) * boost);
                    data[i + 2] = Math.min(255, data[i + 2] + (255 - data[i + 2]) * boost);
                }
            } else {
                // Darken shadows
                if (l < 180) {
                    const shadowFactor = (180 - l) / 180;
                    const darken = shadowFactor * Math.abs(normalizedIntensity) * 0.4;
                    data[i] = Math.max(0, data[i] * (1 - darken));
                    data[i + 1] = Math.max(0, data[i + 1] * (1 - darken));
                    data[i + 2] = Math.max(0, data[i + 2] * (1 - darken));
                }
            }
        }
        
        return imageData;
    }

    filterHighlights(imageData, intensity) {
        const data = imageData.data;
        const factor = 1 + (intensity / 100) * 0.5;
        
        for (let i = 0; i < data.length; i += 4) {
            const l = this.getLuminance(data[i], data[i + 1], data[i + 2]);
            
            if (l > 180) {
                data[i] = Math.min(255, data[i] * factor);
                data[i + 1] = Math.min(255, data[i + 1] * factor);
                data[i + 2] = Math.min(255, data[i + 2] * factor);
            }
        }
        
        return imageData;
    }

    filterShadows(imageData, intensity) {
        const data = imageData.data;
        const factor = 1 + (intensity / 100) * 0.5;
        
        for (let i = 0; i < data.length; i += 4) {
            const l = this.getLuminance(data[i], data[i + 1], data[i + 2]);
            
            if (l < 75) {
                data[i] = Math.min(255, data[i] * factor);
                data[i + 1] = Math.min(255, data[i + 1] * factor);
                data[i + 2] = Math.min(255, data[i + 2] * factor);
            }
        }
        
        return imageData;
    }

    filterColorTemp(imageData, intensity) {
        const data = imageData.data;
        const amount = intensity / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            if (intensity > 0) {
                // Warm
                data[i] = Math.min(255, data[i] + amount * 40);
                data[i + 1] = Math.min(255, data[i + 1] + amount * 20);
                data[i + 2] = Math.max(0, data[i + 2] - amount * 10);
            } else {
                // Cool
                const coolAmount = Math.abs(amount);
                data[i] = Math.max(0, data[i] - coolAmount * 10);
                data[i + 1] = Math.max(0, data[i + 1] - coolAmount * 10);
                data[i + 2] = Math.min(255, data[i + 2] + coolAmount * 40);
            }
        }
        
        return imageData;
    }

    filterBrightness(imageData, intensity) {
        const data = imageData.data;
        // Convert slider range (-100 to 100) to brightness range (0 to 100 where 50 = no change)
        // Slider: -100 = darkest, 0 = no change, 100 = brightest
        // Filter: 0 = darkest, 50 = no change, 100 = brightest
        const brightnessValue = (intensity / 2) + 50;
        const amount = (brightnessValue - 50) * 2.55;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, data[i] + amount));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + amount));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + amount));
        }
        
        return imageData;
    }

    filterContrast(imageData, intensity) {
        const data = imageData.data;
        const factor = (259 * (intensity + 255)) / (255 * (259 - intensity));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
            data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
            data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
        }
        
        return imageData;
    }

    // ==================== FILTER A ====================
    
    filterSharpen(imageData, intensity) {
        if (Math.abs(intensity) < 5) {
            return imageData;
        }
        
        const kernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        ];
        
        const sharpened = this.convolve(imageData, kernel, 1);
        return this.blendImageData(imageData, sharpened, intensity);
    }

    filterSepia(imageData, intensity) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const newR = r * 0.393 + g * 0.769 + b * 0.189;
            const newG = r * 0.349 + g * 0.686 + b * 0.168;
            const newB = r * 0.272 + g * 0.534 + b * 0.131;
            
            data[i] = this.blend(r, Math.min(255, newR), intensity);
            data[i + 1] = this.blend(g, Math.min(255, newG), intensity);
            data[i + 2] = this.blend(b, Math.min(255, newB), intensity);
        }
        
        return imageData;
    }

    filterBW(imageData, intensity) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = this.getLuminance(data[i], data[i + 1], data[i + 2]);
            
            data[i] = this.blend(data[i], gray, intensity);
            data[i + 1] = this.blend(data[i + 1], gray, intensity);
            data[i + 2] = this.blend(data[i + 2], gray, intensity);
        }
        
        return imageData;
    }

    filterWarmify(imageData, intensity) {
        const data = imageData.data;
        const amount = intensity / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            const newR = Math.min(255, data[i] * (1 + amount * 0.1));
            const newG = Math.min(255, data[i + 1] * (1 + amount * 0.05));
            const newB = Math.min(255, data[i + 2] * (1 - amount * 0.1));
            
            data[i] = this.blend(data[i], newR, intensity);
            data[i + 1] = this.blend(data[i + 1], newG, intensity);
            data[i + 2] = this.blend(data[i + 2], newB, intensity);
        }
        
        return imageData;
    }

    filterFilmGrain(imageData, intensity) {
        const data = imageData.data;
        const amount = intensity / 100 * 25;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * amount;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        
        return imageData;
    }

    filterTint(imageData, intensity, params = {}) {
            const data = imageData.data;

            // Extract tint color from params or use default
            const tintColor = params.tintColor || '#ff8800';

            // Convert hex color to RGB
            const tintRGB = this.hexToRGB(tintColor);

            // Convert RGB to HSL to get hue
            const tintHSL = this.rgbToHsl(tintRGB.r, tintRGB.g, tintRGB.b);
            const tintHue = tintHSL.h;

            const amount = intensity / 100;

            for (let i = 0; i < data.length; i += 4) {
                const hsl = this.rgbToHsl(data[i], data[i + 1], data[i + 2]);
                hsl.h = tintHue;
                hsl.s = Math.min(1, hsl.s * (1 + amount));

                const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);

                data[i] = this.blend(data[i], rgb.r, intensity);
                data[i + 1] = this.blend(data[i + 1], rgb.g, intensity);
                data[i + 2] = this.blend(data[i + 2], rgb.b, intensity);
            }

            return imageData;
        }

    filterSaturation(imageData, intensity) {
        const data = imageData.data;
        const amount = intensity / 50 - 1; // -1 to 1
        
        for (let i = 0; i < data.length; i += 4) {
            const hsl = this.rgbToHsl(data[i], data[i + 1], data[i + 2]);
            hsl.s = Math.max(0, Math.min(1, hsl.s * (1 + amount)));
            
            const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
            
            data[i] = rgb.r;
            data[i + 1] = rgb.g;
            data[i + 2] = rgb.b;
        }
        
        return imageData;
    }

    filterSoftFocus(imageData, intensity, params = {}) {
        if (Math.abs(intensity) < 5) {
            return imageData;
        }
        
        // Get focal point and size from params
        // focalX and focalY are normalized (0-1), convert to pixel coordinates
        const focalXNorm = params.focalX !== undefined ? params.focalX : 0.5;
        const focalYNorm = params.focalY !== undefined ? params.focalY : 0.5;
        const focalX = focalXNorm * imageData.width;
        const focalY = focalYNorm * imageData.height;
        const focalSize = params.focalSize !== undefined ? params.focalSize : 200;
        
        const width = imageData.width;
        const height = imageData.height;
        
        // Create blurred version
        const blurred = this.gaussianBlur(imageData, Math.abs(intensity) / 10);
        
        // Apply focal masking
        const data = imageData.data;
        const blurredData = blurred.data;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                
                // Calculate distance from focal point
                const dist = Math.sqrt((x - focalX) ** 2 + (y - focalY) ** 2);
                
                // Calculate blur amount based on distance
                let blurAmount = 0;
                if (dist < focalSize) {
                    // Inside focal area - no blur
                    blurAmount = 0;
                } else {
                    // Outside focal area - progressive blur
                    blurAmount = Math.min(1, (dist - focalSize) / focalSize);
                }
                
                // Blend original and blurred based on blur amount
                data[i] = data[i] + (blurredData[i] - data[i]) * blurAmount;
                data[i + 1] = data[i + 1] + (blurredData[i + 1] - data[i + 1]) * blurAmount;
                data[i + 2] = data[i + 2] + (blurredData[i + 2] - data[i + 2]) * blurAmount;
            }
        }
        
        return imageData;
    }

    filterGlow(imageData, intensity) {
        if (Math.abs(intensity) < 5) {
            return imageData;
        }
        
        const data = imageData.data;
        const brightData = new ImageData(
            new Uint8ClampedArray(data),
            imageData.width,
            imageData.height
        );
        
        // Extract bright areas
        for (let i = 0; i < brightData.data.length; i += 4) {
            const l = this.getLuminance(brightData.data[i], brightData.data[i + 1], brightData.data[i + 2]);
            if (l < 200) {
                brightData.data[i] = 0;
                brightData.data[i + 1] = 0;
                brightData.data[i + 2] = 0;
            }
        }
        
        // Blur bright areas
        const blurred = this.gaussianBlur(brightData, 10);
        
        // Add to original
        for (let i = 0; i < data.length; i += 4) {
            const amount = Math.abs(intensity) / 100;
            data[i] = Math.min(255, data[i] + blurred.data[i] * amount);
            data[i + 1] = Math.min(255, data[i + 1] + blurred.data[i + 1] * amount);
            data[i + 2] = Math.min(255, data[i + 2] + blurred.data[i + 2] * amount);
        }
        
        return imageData;
    }

    filterFilteredBW(imageData, intensity, params = {}) {
            const data = imageData.data;

            // Extract filter color from params or use default (red)
            const filterColor = params.filterColor || '#ff0000';
            const filterRGB = this.hexToRGB(filterColor);

            // Calculate channel weights based on filter color
            // Normalize to sum to 1.0
            const total = filterRGB.r + filterRGB.g + filterRGB.b;
            const rWeight = filterRGB.r / total;
            const gWeight = filterRGB.g / total;
            const bWeight = filterRGB.b / total;

            for (let i = 0; i < data.length; i += 4) {
                // Apply weighted grayscale conversion based on filter color
                const gray = data[i] * rWeight + data[i + 1] * gWeight + data[i + 2] * bWeight;

                data[i] = this.blend(data[i], gray, intensity);
                data[i + 1] = this.blend(data[i + 1], gray, intensity);
                data[i + 2] = this.blend(data[i + 2], gray, intensity);
            }

            return imageData;
        }

    filterFocalBW(imageData, intensity, params = {}) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Get focal point and size from params
        // focalX and focalY are normalized (0-1), convert to pixel coordinates
        const focalXNorm = params.focalX !== undefined ? params.focalX : 0.5;
        const focalYNorm = params.focalY !== undefined ? params.focalY : 0.5;
        const focalX = focalXNorm * width;
        const focalY = focalYNorm * height;
        const focalSize = params.focalSize !== undefined ? params.focalSize : 200;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const dist = Math.sqrt((x - focalX) ** 2 + (y - focalY) ** 2);
                
                if (dist > focalSize) {
                    const gray = this.getLuminance(data[i], data[i + 1], data[i + 2]);
                    const amount = Math.min(1, (dist - focalSize) / focalSize) * (intensity / 100);
                    
                    data[i] = this.blend(data[i], gray, amount * 100);
                    data[i + 1] = this.blend(data[i + 1], gray, amount * 100);
                    data[i + 2] = this.blend(data[i + 2], gray, amount * 100);
                }
            }
        }
        
        return imageData;
    }

    filterGraduatedTint(imageData, intensity, params = {}) {
            const data = imageData.data;
            const width = imageData.width;
            const height = imageData.height;

            // Extract parameters or use defaults
            const tintColor = params.tintColor || '#ffc864';
            const gradientY = params.gradientY !== undefined ? params.gradientY : height / 2;
            const feather = params.feather !== undefined ? params.feather : 50;
            const shade = params.shade !== undefined ? params.shade : 50;

            // Convert hex color to RGB
            const tintRGB = this.hexToRGB(tintColor);

            // Calculate feather distance in pixels
            const featherDist = (feather / 100) * height * 0.5;

            for (let y = 0; y < height; y++) {
                // Calculate distance from gradient line
                const distFromLine = Math.abs(y - gradientY);

                // Calculate gradient position
                // 0 = at gradient line (no tint), 1 = at edge (full tint)
                const gradientPos = Math.min(1, distFromLine / featherDist);

                // Apply shade multiplier
                const tintAmount = gradientPos * (shade / 100) * (intensity / 100);

                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;

                    data[i] = this.blend(data[i], tintRGB.r, tintAmount * 100);
                    data[i + 1] = this.blend(data[i + 1], tintRGB.g, tintAmount * 100);
                    data[i + 2] = this.blend(data[i + 2], tintRGB.b, tintAmount * 100);
                }
            }

            return imageData;
        }


    // ==================== FILTER B ====================
    
    filterInfrared(imageData, intensity) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const newR = Math.min(255, 255 - b);
            const newG = Math.min(255, 255 - g * 0.5);
            const newB = Math.min(255, r * 0.3);
            
            data[i] = this.blend(r, newR, intensity);
            data[i + 1] = this.blend(g, newG, intensity);
            data[i + 2] = this.blend(b, newB, intensity);
        }
        
        return imageData;
    }

    filterLomo(imageData, intensity, params = {}) {
        // Extract parameters or use defaults
        const blurEdges = params.blurEdges !== undefined ? params.blurEdges : 30;
        
        // Increase contrast
        const contrasted = this.filterContrast(imageData, 30);
        
        // Boost saturation
        const saturated = this.filterSaturation(contrasted, 70);
        
        // Apply vignette
        const vignetted = this.filterVignette(saturated, intensity * 0.6);
        
        // Color shift
        const data = vignetted.data;
        for (let i = 0; i < data.length; i += 4) {
            const l = this.getLuminance(data[i], data[i + 1], data[i + 2]);
            
            if (l < 128) {
                // Cyan to shadows
                data[i + 1] = Math.min(255, data[i + 1] + 10);
                data[i + 2] = Math.min(255, data[i + 2] + 10);
            } else {
                // Yellow to highlights
                data[i] = Math.min(255, data[i] + 10);
                data[i + 1] = Math.min(255, data[i + 1] + 10);
            }
        }
        
        // Apply edge blur based on blurEdges parameter
        if (blurEdges > 0) {
            const blurRadius = Math.max(1, Math.floor(blurEdges / 10));
            const blurred = this.gaussianBlur(vignetted, blurRadius);
            return this.blendImageData(vignetted, blurred, blurEdges / 100);
        }
        
        return vignetted;
    }

    filterHolga(imageData, intensity, params = {}) {
        // Extract parameters or use defaults
        const blurEdges = params.blurEdges !== undefined ? params.blurEdges : 30;
        const grain = params.grain !== undefined ? params.grain : 20;
        
        // Reduce saturation
        const desaturated = this.filterSaturation(imageData, 30);
        
        // Strong vignette
        const vignetted = this.filterVignette(desaturated, intensity * 0.8);
        
        // Apply edge blur based on blurEdges parameter
        let result = vignetted;
        if (blurEdges > 0) {
            const blurRadius = Math.max(1, Math.floor(blurEdges / 10));
            const blurred = this.gaussianBlur(vignetted, blurRadius);
            result = this.blendImageData(vignetted, blurred, blurEdges / 100);
        }
        
        // Add grain/noise based on grain parameter
        if (grain > 0) {
            const data = result.data;
            const grainIntensity = grain / 100;
            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 50 * grainIntensity;
                data[i] = Math.max(0, Math.min(255, data[i] + noise));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
            }
        }
        
        return result;
    }

    filterHDR(imageData, intensity, params = {}) {
        // Intensity 0-100: 0 = no effect, 100 = full HDR effect
        if (intensity === 0) return imageData;
        
        // Extract parameters or use defaults
        const radius = params.radius !== undefined ? params.radius : 50;
        const strength = params.strength !== undefined ? params.strength : 50;
        
        const data = imageData.data;
        const normalizedIntensity = intensity / 100;
        const strengthFactor = strength / 50; // Normalize to 1.0 at default
        
        for (let i = 0; i < data.length; i += 4) {
            const origR = data[i];
            const origG = data[i + 1];
            const origB = data[i + 2];
            
            let l = this.getLuminance(origR, origG, origB);
            
            let newR = origR;
            let newG = origG;
            let newB = origB;
            
            // Compress highlights (affected by strength)
            const highlightThreshold = 180 + (radius - 50) / 2;
            if (l > highlightThreshold) {
                const compressionFactor = 0.3 * strengthFactor;
                const newL = highlightThreshold + (l - highlightThreshold) * compressionFactor;
                const factor = newL / l;
                newR = origR * factor;
                newG = origG * factor;
                newB = origB * factor;
            }
            
            // Expand shadows (affected by strength)
            const shadowThreshold = 75 - (radius - 50) / 2;
            if (l < shadowThreshold) {
                const expansionFactor = 0.3 * strengthFactor;
                const newL = shadowThreshold - (shadowThreshold - l) * expansionFactor;
                const factor = newL / l;
                newR = origR * factor;
                newG = origG * factor;
                newB = origB * factor;
            }
            
            // Blend with original based on intensity
            data[i] = this.blend(origR, newR, normalizedIntensity);
            data[i + 1] = this.blend(origG, newG, normalizedIntensity);
            data[i + 2] = this.blend(origB, newB, normalizedIntensity);
        }
        
        // Boost saturation based on intensity and strength
        return this.filterSaturation(imageData, 65 * normalizedIntensity * strengthFactor);
    }

    filterCinemascope(imageData, intensity) {
        // Intensity 0-100: 0 = no effect, 100 = full letterbox bars
        if (intensity === 0) return imageData;
        
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const normalizedIntensity = intensity / 100;
        const barHeight = Math.floor(height * 0.12 * normalizedIntensity);
        
        // Add letterbox bars with intensity-based opacity
        for (let y = 0; y < height; y++) {
            if (y < barHeight || y > height - barHeight) {
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                }
            } else {
                // Cinematic color grading based on intensity
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    const l = this.getLuminance(data[i], data[i + 1], data[i + 2]);
                    
                    const origR = data[i];
                    const origG = data[i + 1];
                    const origB = data[i + 2];
                    
                    let newR = origR;
                    let newG = origG;
                    let newB = origB;
                    
                    if (l < 128) {
                        // Teal shadows
                        newG = Math.min(255, origG + 10);
                        newB = Math.min(255, origB + 15);
                    } else {
                        // Orange highlights
                        newR = Math.min(255, origR + 15);
                        newG = Math.min(255, origG + 10);
                    }
                    
                    data[i] = this.blend(origR, newR, normalizedIntensity);
                    data[i + 1] = this.blend(origG, newG, normalizedIntensity);
                    data[i + 2] = this.blend(origB, newB, normalizedIntensity);
                }
            }
        }
        
        // Slight desaturation based on intensity
        return this.filterSaturation(imageData, 100 - (55 * normalizedIntensity));
    }

    filterOrton(imageData, intensity, params = {}) {
        // Extract parameters or use defaults
        const bloom = params.bloom !== undefined ? params.bloom : 50;
        const brightness = params.brightness !== undefined ? params.brightness : 30;
        
        // Create blurred copy with bloom parameter affecting blur radius
        const blurRadius = Math.max(5, Math.floor(10 + (bloom / 100) * 30));
        const blurred = this.gaussianBlur(imageData, blurRadius);
        
        // Lighten blurred copy based on brightness parameter
        const brightnessMultiplier = 1 + (brightness / 100);
        for (let i = 0; i < blurred.data.length; i += 4) {
            blurred.data[i] = Math.min(255, blurred.data[i] * brightnessMultiplier);
            blurred.data[i + 1] = Math.min(255, blurred.data[i + 1] * brightnessMultiplier);
            blurred.data[i + 2] = Math.min(255, blurred.data[i + 2] * brightnessMultiplier);
        }
        
        // Screen blend with intensity
        const blendAmount = intensity * (0.3 + (bloom / 200));
        return this.blendImageData(imageData, blurred, blendAmount);
    }

    filter1960s(imageData, intensity) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const newR = Math.min(255, r * 1.1 + 20);
            const newG = Math.min(255, g * 0.95);
            const newB = Math.max(0, b * 0.85 - 10);
            
            data[i] = this.blend(r, newR, intensity);
            data[i + 1] = this.blend(g, newG, intensity);
            data[i + 2] = this.blend(b, newB, intensity);
        }
        
        // Reduce contrast
        return this.filterContrast(imageData, 35);
    }

    filterInvert(imageData, intensity) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = this.blend(data[i], 255 - data[i], intensity);
            data[i + 1] = this.blend(data[i + 1], 255 - data[i + 1], intensity);
            data[i + 2] = this.blend(data[i + 2], 255 - data[i + 2], intensity);
        }
        
        return imageData;
    }

    filterHeatMap(imageData, intensity) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const l = this.getLuminance(data[i], data[i + 1], data[i + 2]);
            let r, g, b;
            
            if (l < 64) {
                // Black to Blue
                r = 0;
                g = 0;
                b = l * 4;
            } else if (l < 128) {
                // Blue to Cyan
                r = 0;
                g = (l - 64) * 4;
                b = 255;
            } else if (l < 192) {
                // Cyan to Yellow
                r = (l - 128) * 4;
                g = 255;
                b = 255 - (l - 128) * 4;
            } else {
                // Yellow to Red
                r = 255;
                g = 255 - (l - 192) * 4;
                b = 0;
            }
            
            data[i] = this.blend(data[i], r, intensity);
            data[i + 1] = this.blend(data[i + 1], g, intensity);
            data[i + 2] = this.blend(data[i + 2], b, intensity);
        }
        
        return imageData;
    }

    filterCrossProcess(imageData, intensity) {
        // Boost contrast
        const contrasted = this.filterContrast(imageData, 40);
        
        // Color shift
        const data = contrasted.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const newR = Math.min(255, r * 1.2);
            const newG = Math.min(255, g * 0.9 + 10);
            const newB = Math.max(0, Math.min(255, b * 1.1 - 10));
            
            data[i] = this.blend(r, newR, intensity);
            data[i + 1] = this.blend(g, newG, intensity);
            data[i + 2] = this.blend(b, newB, intensity);
        }
        
        // Increase saturation
        return this.filterSaturation(contrasted, 65);
    }

    filterPosterize(imageData, intensity) {
        const data = imageData.data;
        const levels = Math.floor(4 + (intensity / 100) * 12);
        const step = 255 / levels;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = Math.floor(data[i] / step) * step;
            const g = Math.floor(data[i + 1] / step) * step;
            const b = Math.floor(data[i + 2] / step) * step;
            
            data[i] = this.blend(data[i], r, intensity);
            data[i + 1] = this.blend(data[i + 1], g, intensity);
            data[i + 2] = this.blend(data[i + 2], b, intensity);
        }
        
        return imageData;
    }

    filterDuoTone(imageData, intensity, params = {}) {
            const data = imageData.data;

            // Extract colors from params or use defaults
            const shadowColor = params.shadowColor || '#2c3e50';
            const highlightColor = params.highlightColor || '#f39c12';
            const brightness = params.brightness || 0;
            const contrast = params.contrast || 0;

            // Convert hex colors to RGB
            const color1 = this.hexToRGB(shadowColor);
            const color2 = this.hexToRGB(highlightColor);

            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Apply brightness adjustment
                if (brightness !== 0) {
                    r = Math.max(0, Math.min(255, r + brightness * 2.55));
                    g = Math.max(0, Math.min(255, g + brightness * 2.55));
                    b = Math.max(0, Math.min(255, b + brightness * 2.55));
                }

                // Apply contrast adjustment
                if (contrast !== 0) {
                    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                    r = Math.max(0, Math.min(255, factor * (r - 128) + 128));
                    g = Math.max(0, Math.min(255, factor * (g - 128) + 128));
                    b = Math.max(0, Math.min(255, factor * (b - 128) + 128));
                }

                // Calculate luminance
                const l = this.getLuminance(r, g, b) / 255;

                // Map luminance to gradient between shadow and highlight colors
                const duoR = color1.r + (color2.r - color1.r) * l;
                const duoG = color1.g + (color2.g - color1.g) * l;
                const duoB = color1.b + (color2.b - color1.b) * l;

                data[i] = this.blend(data[i], duoR, intensity);
                data[i + 1] = this.blend(data[i + 1], duoG, intensity);
                data[i + 2] = this.blend(data[i + 2], duoB, intensity);
            }

            return imageData;
        }

    // ==================== FILTER C ====================
    
    filterBoost(imageData, intensity) {
        // Intensity 0-100: 0 = no effect, 100 = full boost
        if (intensity === 0) return imageData;
        
        const normalizedIntensity = intensity / 100;
        
        // Increase contrast based on intensity
        const contrasted = this.filterContrast(imageData, 30 * normalizedIntensity);
        
        // Increase saturation based on intensity
        return this.filterSaturation(contrasted, 70 * normalizedIntensity);
    }

    filterSoften(imageData, intensity) {
        // Intensity 0-100: 0 = no effect, 100 = maximum softness
        if (intensity === 0) {
            return imageData;
        }
        
        const normalizedIntensity = intensity / 100;
        const blurAmount = Math.max(1, Math.floor(2 + (normalizedIntensity * 8))); // 2-10 blur radius
        const blurred = this.gaussianBlur(imageData, blurAmount);
        return this.blendImageData(imageData, blurred, normalizedIntensity * 0.7);
    }

    filterVignette(imageData, intensity, params = {}) {
            const data = imageData.data;
            const width = imageData.width;
            const height = imageData.height;
            const centerX = width / 2;
            const centerY = height / 2;

            // Extract parameters or use defaults
            const size = params.size !== undefined ? params.size : 50;
            const strength = params.strength !== undefined ? params.strength : 50;
            const vignetteColor = params.vignetteColor || '#000000';

            // Convert vignette color to RGB
            const colorRGB = this.hexToRGB(vignetteColor);

            // Calculate vignette radius based on size parameter (0-100)
            // Size 0 = small vignette, Size 100 = large vignette
            const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
            const vignetteRadius = maxDist * (1 - size / 200); // Adjust scaling

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

                    // Calculate vignette amount based on distance and parameters
                    let vignetteAmount = 0;
                    if (distance > vignetteRadius) {
                        vignetteAmount = ((distance - vignetteRadius) / (maxDist - vignetteRadius)) * (strength / 100) * (intensity / 100);
                        vignetteAmount = Math.min(1, vignetteAmount);
                    }

                    // Blend with vignette color
                    data[i] = this.blend(data[i], colorRGB.r, vignetteAmount * 100);
                    data[i + 1] = this.blend(data[i + 1], colorRGB.g, vignetteAmount * 100);
                    data[i + 2] = this.blend(data[i + 2], colorRGB.b, vignetteAmount * 100);
                }
            }

            return imageData;
        }

    filterPixelate(imageData, intensity) {
        // Skip if intensity is too low
        if (Math.abs(intensity) < 5) {
            return imageData;
        }
        
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Map intensity to block size (5-50 pixels)
        const blockSize = Math.max(2, Math.floor(2 + (Math.abs(intensity) / 100) * 48));
        
        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                // Calculate average color of block
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let by = 0; by < blockSize && y + by < height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                        const i = ((y + by) * width + (x + bx)) * 4;
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }
                
                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);
                
                // Fill block with average color
                for (let by = 0; by < blockSize && y + by < height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                        const i = ((y + by) * width + (x + bx)) * 4;
                        data[i] = r;
                        data[i + 1] = g;
                        data[i + 2] = b;
                    }
                }
            }
        }
        
        return imageData;
    }

    filterFocalZoom(imageData, intensity, params = {}) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Extract parameters or use defaults
        const zoominess = params.zoominess !== undefined ? params.zoominess : 50;
        const focalSize = params.focalSize !== undefined ? params.focalSize : 200;
        const edgeHardness = params.edgeHardness !== undefined ? params.edgeHardness : 50;
        const focalXNorm = params.focalX !== undefined ? params.focalX : 0.5;
        const focalYNorm = params.focalY !== undefined ? params.focalY : 0.5;
        
        // Calculate focal point in pixel coordinates
        const centerX = width * focalXNorm;
        const centerY = height * focalYNorm;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        
        // focalSize is in pixels (radius)
        const focalRadius = focalSize;
        
        const result = new ImageData(
            new Uint8ClampedArray(data),
            width,
            height
        );
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                // Calculate blur amount based on distance from focal point
                let blurFactor = 0;
                if (distance > focalRadius) {
                    // Apply edge hardness to transition
                    const distanceFromFocal = distance - focalRadius;
                    const hardnessFactor = 1 - (edgeHardness / 100) * 0.5;
                    blurFactor = Math.min(1, (distanceFromFocal / (maxDist * hardnessFactor)));
                }
                
                const blurAmount = blurFactor * (intensity / 100) * (zoominess / 50);
                
                if (blurAmount > 0.1) {
                    // Radial blur with zoominess
                    let r = 0, g = 0, b = 0, samples = 0;
                    const sampleCount = Math.max(2, Math.floor(blurAmount * 8));
                    
                    for (let s = 0; s < sampleCount; s++) {
                        const angle = Math.atan2(y - centerY, x - centerX);
                        const offset = s * blurAmount * 3;
                        const sx = Math.floor(x + Math.cos(angle) * offset);
                        const sy = Math.floor(y + Math.sin(angle) * offset);
                        
                        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
                            const si = (sy * width + sx) * 4;
                            r += data[si];
                            g += data[si + 1];
                            b += data[si + 2];
                            samples++;
                        }
                    }
                    
                    if (samples > 0) {
                        result.data[i] = r / samples;
                        result.data[i + 1] = g / samples;
                        result.data[i + 2] = b / samples;
                    }
                }
            }
        }
        
        return result;
    }

    filterPencilSketch(imageData, intensity, params = {}) {
        // Extract parameters or use defaults
        const radius = params.radius !== undefined ? params.radius : 50;
        const strength = params.strength !== undefined ? params.strength : 50;
        
        // Convert to grayscale
        const gray = this.filterBW(imageData, 100);
        
        // Invert
        const inverted = this.filterInvert(gray, 100);
        
        // Blur with radius parameter
        const blurAmount = Math.max(1, Math.floor(3 + (radius / 100) * 7));
        const blurred = this.gaussianBlur(inverted, blurAmount);
        
        // Color dodge blend with strength parameter
        const data = gray.data;
        const blurData = blurred.data;
        const strengthFactor = strength / 50;
        
        for (let i = 0; i < data.length; i += 4) {
            let result = Math.min(255, (data[i] * 255) / (255 - blurData[i] + 1));
            
            // Apply strength by adjusting contrast of sketch
            result = Math.max(0, Math.min(255, (result - 128) * strengthFactor + 128));
            
            data[i] = this.blend(imageData.data[i], result, intensity);
            data[i + 1] = this.blend(imageData.data[i + 1], result, intensity);
            data[i + 2] = this.blend(imageData.data[i + 2], result, intensity);
        }
        
        return imageData;
    }

    filterNeon(imageData, intensity, params = {}) {
            // Extract neon color from params or use default
            const neonColor = params.neonColor || '#ff0000';
            const neonRGB = this.hexToRGB(neonColor);

            // Edge detection
            const edges = this.detectEdges(imageData);

            // Invert edges
            const data = edges.data;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }

            // Apply glow
            const glowed = this.gaussianBlur(edges, 3);

            // Colorize with custom neon color
            for (let i = 0; i < glowed.data.length; i += 4) {
                const l = this.getLuminance(glowed.data[i], glowed.data[i + 1], glowed.data[i + 2]) / 255;
                glowed.data[i] = Math.min(255, neonRGB.r * l * 1.5);
                glowed.data[i + 1] = Math.min(255, neonRGB.g * l * 1.5);
                glowed.data[i + 2] = Math.min(255, neonRGB.b * l * 1.5);
            }

            return this.blendImageData(imageData, glowed, intensity);
        }

    filterComicBook(imageData, intensity, params = {}) {
            // Extract parameters or use defaults
            const colorBrush = params.colorBrush !== undefined ? params.colorBrush : 8;
            const dotDensity = params.dotDensity !== undefined ? params.dotDensity : 4;

            const width = imageData.width;
            const height = imageData.height;

            // Create a copy for posterize to avoid modifying original
            const posterized = new ImageData(
                new Uint8ClampedArray(imageData.data),
                width,
                height
            );

            // Posterize the copy with custom color brush levels
            const posterizeIntensity = 100 - (colorBrush / 16) * 50;
            this.filterPosterize(posterized, posterizeIntensity);

            // Edge detection on original
            const edges = this.detectEdges(imageData);

            // Apply halftone dots
            const data = posterized.data;
            const edgeData = edges.data;
            
            // Calculate dot size based on density (1-10, where 10 is smallest dots)
            const dotSize = Math.max(2, 12 - dotDensity);
            const dotSpacing = dotSize;

            // Apply halftone pattern
            for (let y = 0; y < height; y += dotSpacing) {
                for (let x = 0; x < width; x += dotSpacing) {
                    // Sample the center pixel of this dot area
                    const centerX = Math.min(x + Math.floor(dotSpacing / 2), width - 1);
                    const centerY = Math.min(y + Math.floor(dotSpacing / 2), height - 1);
                    const centerIdx = (centerY * width + centerX) * 4;
                    
                    // Calculate luminance of the center pixel
                    const lum = this.getLuminance(data[centerIdx], data[centerIdx + 1], data[centerIdx + 2]);
                    
                    // Calculate dot radius based on luminance (darker = larger dots)
                    const dotRadius = ((255 - lum) / 255) * (dotSize / 2);
                    
                    // Draw the dot
                    for (let dy = 0; dy < dotSpacing && y + dy < height; dy++) {
                        for (let dx = 0; dx < dotSpacing && x + dx < width; dx++) {
                            const px = x + dx;
                            const py = y + dy;
                            
                            // Calculate distance from dot center
                            const distX = dx - dotSpacing / 2;
                            const distY = dy - dotSpacing / 2;
                            const dist = Math.sqrt(distX * distX + distY * distY);
                            
                            // If outside dot radius, make it white (paper color)
                            if (dist > dotRadius) {
                                const idx = (py * width + px) * 4;
                                // Blend towards white based on distance
                                const whiteFactor = Math.min(1, (dist - dotRadius) / (dotSize / 4));
                                data[idx] = data[idx] + (255 - data[idx]) * whiteFactor * 0.7;
                                data[idx + 1] = data[idx + 1] + (255 - data[idx + 1]) * whiteFactor * 0.7;
                                data[idx + 2] = data[idx + 2] + (255 - data[idx + 2]) * whiteFactor * 0.7;
                            }
                        }
                    }
                }
            }

            // Add black edges for comic book outline effect
            const edgeThreshold = 0.3;
            for (let i = 0; i < data.length; i += 4) {
                const edgeStrength = edgeData[i] / 255;
                if (edgeStrength > edgeThreshold) {
                    data[i] = 0;
                    data[i + 1] = 0;
                    data[i + 2] = 0;
                }
            }

            return this.blendImageData(imageData, posterized, intensity);
        }

    filterTiltShift(imageData, intensity) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const focusY = height / 2;
        const focusBand = height * 0.3;
        
        const blurred = this.gaussianBlur(imageData, 5);
        const blurData = blurred.data;
        
        for (let y = 0; y < height; y++) {
            const distance = Math.abs(y - focusY);
            const blurAmount = Math.max(0, (distance - focusBand / 2) / (focusBand / 2));
            
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                
                if (blurAmount > 0) {
                    // blend expects 0-100, so multiply by intensity directly
                    const effectiveBlur = blurAmount * intensity;
                    data[i] = this.blend(data[i], blurData[i], effectiveBlur);
                    data[i + 1] = this.blend(data[i + 1], blurData[i + 1], effectiveBlur);
                    data[i + 2] = this.blend(data[i + 2], blurData[i + 2], effectiveBlur);
                }
            }
        }
        
        // Increase saturation for miniature effect - saturation level 50 = no change, 60 = slight increase
        // Scale saturation with intensity
        if (intensity > 0) {
            const saturationLevel = 50 + (10 * intensity / 100);
            return this.filterSaturation(imageData, saturationLevel);
        }
        
        return imageData;
    }


    // ==================== INSTAGRAM FILTERS ====================
    
    filterValencia(imageData, intensity) {
        const data = imageData.data;
        
        // Warm tones
        for (let i = 0; i < data.length; i += 4) {
            const r = Math.min(255, data[i] + 10);
            const g = Math.min(255, data[i + 1] + 5);
            const b = Math.max(0, data[i + 2] - 5);
            
            data[i] = this.blend(data[i], r, intensity);
            data[i + 1] = this.blend(data[i + 1], g, intensity);
            data[i + 2] = this.blend(data[i + 2], b, intensity);
        }
        
        // Increase exposure - convert from old style (55) to slider style (10)
        const brightened = this.filterBrightness(imageData, 10);
        
        // Slight vignette
        return this.filterVignette(brightened, intensity * 0.3);
    }

    filterNashville(imageData, intensity) {
        const data = imageData.data;
        
        // Warm pink tint
        for (let i = 0; i < data.length; i += 4) {
            const r = Math.min(255, data[i] + 20);
            const g = Math.min(255, data[i + 1] + 10);
            const b = Math.min(255, data[i + 2] + 15);
            
            data[i] = this.blend(data[i], r, intensity);
            data[i + 1] = this.blend(data[i + 1], g, intensity);
            data[i + 2] = this.blend(data[i + 2], b, intensity);
        }
        
        // Reduce contrast
        const contrasted = this.filterContrast(imageData, 40);
        
        // Increase brightness - convert from old style (58) to slider style (16)
        const brightened = this.filterBrightness(contrasted, 16);
        
        // Desaturate
        return this.filterSaturation(brightened, 30);
    }

    filterClarendon(imageData, intensity) {
        // Increase contrast
        const contrasted = this.filterContrast(imageData, 70);
        
        // Increase saturation
        const saturated = this.filterSaturation(contrasted, 65);
        
        // Brighten highlights
        const data = saturated.data;
        for (let i = 0; i < data.length; i += 4) {
            const l = this.getLuminance(data[i], data[i + 1], data[i + 2]);
            
            if (l > 150) {
                const boost = (intensity / 100) * 0.2;
                data[i] = Math.min(255, data[i] * (1 + boost));
                data[i + 1] = Math.min(255, data[i + 1] * (1 + boost));
                data[i + 2] = Math.min(255, data[i + 2] * (1 + boost));
            }
            
            // Deepen shadows
            if (l < 100) {
                const darken = (intensity / 100) * 0.2;
                data[i] = Math.max(0, data[i] * (1 - darken));
                data[i + 1] = Math.max(0, data[i + 1] * (1 - darken));
                data[i + 2] = Math.max(0, data[i + 2] * (1 - darken));
            }
        }
        
        return saturated;
    }

    filterGingham(imageData, intensity) {
        // Desaturate
        const desaturated = this.filterSaturation(imageData, 35);
        
        // Soft pastel shift
        const data = desaturated.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = Math.min(255, data[i] + 5);
            const g = Math.min(255, data[i + 1] + 5);
            const b = Math.min(255, data[i + 2] + 10);
            
            data[i] = this.blend(data[i], r, intensity);
            data[i + 1] = this.blend(data[i + 1], g, intensity);
            data[i + 2] = this.blend(data[i + 2], b, intensity);
        }
        
        // Increase brightness - convert from old style (55) to slider style (10)
        const brightened = this.filterBrightness(desaturated, 10);
        
        // Reduce contrast
        return this.filterContrast(brightened, 35);
    }

    filterJuno(imageData, intensity) {
        // Warm color temperature
        const warmed = this.filterColorTemp(imageData, 20);
        
        // Increase contrast
        const contrasted = this.filterContrast(warmed, 62);
        
        // Boost reds and yellows
        const data = contrasted.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = Math.min(255, data[i] * 1.1);
            const g = Math.min(255, data[i + 1] * 1.05);
            
            data[i] = this.blend(data[i], r, intensity);
            data[i + 1] = this.blend(data[i + 1], g, intensity);
        }
        
        // Slight vignette
        return this.filterVignette(contrasted, intensity * 0.4);
    }

    filterLark(imageData, intensity) {
        // Desaturate
        const desaturated = this.filterSaturation(imageData, 20);
        
        // Increase brightness - convert from old style (60) to slider style (20)
        const brightened = this.filterBrightness(desaturated, 20);
        
        // Soft contrast
        const contrasted = this.filterContrast(brightened, 45);
        
        // Cool color temperature
        return this.filterColorTemp(contrasted, -10);
    }

    // ==================== HELPER METHODS ====================
    
    getLuminance(r, g, b) {
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    blend(original, filtered, intensity) {
        const alpha = intensity / 100;
        return Math.round(original * (1 - alpha) + filtered * alpha);
    }

    blendImageData(original, filtered, intensity) {
        const result = new ImageData(
            new Uint8ClampedArray(original.data),
            original.width,
            original.height
        );
        
        const alpha = intensity / 100;
        
        for (let i = 0; i < result.data.length; i += 4) {
            result.data[i] = this.blend(original.data[i], filtered.data[i], intensity);
            result.data[i + 1] = this.blend(original.data[i + 1], filtered.data[i + 1], intensity);
            result.data[i + 2] = this.blend(original.data[i + 2], filtered.data[i + 2], intensity);
        }
        
        return result;
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return { h: h * 360, s: s, l: l };
    }

    hslToRgb(h, s, l) {
        h /= 360;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * Convert hex color string to RGB object
     * @param {string} hex - Hex color string (e.g., '#ff8800' or 'ff8800')
     * @returns {Object} RGB object with r, g, b properties (0-255)
     */
    hexToRGB(hex) {
        // Handle invalid input
        if (!hex || typeof hex !== 'string') {
            console.warn('hexToRGB: Invalid input type:', hex);
            return { r: 255, g: 0, b: 0 }; // Default to red
        }
        
        // Store original for debugging
        const original = hex;
        
        // Remove # if present
        hex = hex.replace(/^#/, '');
        
        // Ensure hex is 6 characters
        if (hex.length !== 6) {
            console.warn('hexToRGB: Invalid length:', original, 'cleaned:', hex);
            return { r: 255, g: 0, b: 0 }; // Default to red
        }
        
        // Validate hex characters
        if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
            console.warn('hexToRGB: Invalid hex characters:', hex);
            return { r: 255, g: 0, b: 0 }; // Default to red
        }
        
        // Parse hex values - extract substrings first for debugging
        const rHex = hex.substring(0, 2);
        const gHex = hex.substring(2, 4);
        const bHex = hex.substring(4, 6);
        
        const r = parseInt(rHex, 16);
        const g = parseInt(gHex, 16);
        const b = parseInt(bHex, 16);
        
        // Validate parsed values
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
            console.error('hexToRGB: Parse failed!', {
                original,
                hex,
                rHex, r,
                gHex, g,
                bHex, b
            });
            return { r: 255, g: 0, b: 0 }; // Default to red
        }
        
        return { r, g, b };
    }

    gaussianBlur(imageData, radius) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        const result = new ImageData(
            new Uint8ClampedArray(data),
            width,
            height
        );
        
        // Simple box blur approximation
        const kernelSize = Math.ceil(radius) * 2 + 1;
        const half = Math.floor(kernelSize / 2);
        
        // Horizontal pass
        const temp = new Uint8ClampedArray(data);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let kx = -half; kx <= half; kx++) {
                    const px = x + kx;
                    if (px >= 0 && px < width) {
                        const i = (y * width + px) * 4;
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }
                
                const i = (y * width + x) * 4;
                temp[i] = r / count;
                temp[i + 1] = g / count;
                temp[i + 2] = b / count;
                temp[i + 3] = data[i + 3];
            }
        }
        
        // Vertical pass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let ky = -half; ky <= half; ky++) {
                    const py = y + ky;
                    if (py >= 0 && py < height) {
                        const i = (py * width + x) * 4;
                        r += temp[i];
                        g += temp[i + 1];
                        b += temp[i + 2];
                        count++;
                    }
                }
                
                const i = (y * width + x) * 4;
                result.data[i] = r / count;
                result.data[i + 1] = g / count;
                result.data[i + 2] = b / count;
            }
        }
        
        return result;
    }

    convolve(imageData, kernel, weight) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        const result = new ImageData(
            new Uint8ClampedArray(data),
            width,
            height
        );
        
        const side = Math.round(Math.sqrt(kernel.length));
        const half = Math.floor(side / 2);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0;
                
                for (let ky = 0; ky < side; ky++) {
                    for (let kx = 0; kx < side; kx++) {
                        const px = x + kx - half;
                        const py = y + ky - half;
                        
                        if (px >= 0 && px < width && py >= 0 && py < height) {
                            const i = (py * width + px) * 4;
                            const k = kernel[ky * side + kx];
                            
                            r += data[i] * k;
                            g += data[i + 1] * k;
                            b += data[i + 2] * k;
                        }
                    }
                }
                
                const i = (y * width + x) * 4;
                result.data[i] = Math.max(0, Math.min(255, r / weight));
                result.data[i + 1] = Math.max(0, Math.min(255, g / weight));
                result.data[i + 2] = Math.max(0, Math.min(255, b / weight));
            }
        }
        
        return result;
    }

    detectEdges(imageData) {
        const sobelX = [
            -1, 0, 1,
            -2, 0, 2,
            -1, 0, 1
        ];
        
        const sobelY = [
            -1, -2, -1,
             0,  0,  0,
             1,  2,  1
        ];
        
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        const result = new ImageData(
            new Uint8ClampedArray(data.length),
            width,
            height
        );
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const i = ((y + ky) * width + (x + kx)) * 4;
                        const gray = this.getLuminance(data[i], data[i + 1], data[i + 2]);
                        const ki = (ky + 1) * 3 + (kx + 1);
                        
                        gx += gray * sobelX[ki];
                        gy += gray * sobelY[ki];
                    }
                }
                
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const i = (y * width + x) * 4;
                
                result.data[i] = magnitude;
                result.data[i + 1] = magnitude;
                result.data[i + 2] = magnitude;
                result.data[i + 3] = 255;
            }
        }
        
        return result;
    }

    // ==================== PRESET MANAGEMENT ====================
    
    savePreset() {
        const body = `
            <label class="mosaic-dialog-label">${this.t('COM_PHOCAMOSAIC_PRESET_NAME', 'Preset Name')}:</label>
            <input type="text" id="preset-name" class="mosaic-dialog-input" placeholder="${this.t('COM_PHOCAMOSAIC_ENTER_PRESET_NAME', 'Enter preset name')}">
        `;
        
        this.showModal(this.t('COM_PHOCAMOSAIC_SAVE_PRESET', 'Save Preset'), body, [
            { text: this.t('COM_PHOCAMOSAIC_CANCEL', 'Cancel'), class: 'mosaic-dialog-btn-secondary', onClick: () => this.closeModal() },
            { text: this.t('COM_PHOCAMOSAIC_SAVE', 'Save'), class: 'mosaic-dialog-btn-primary', onClick: async () => {
                const name = document.getElementById('preset-name').value.trim();
                if (!name) {
                    this.showToast(this.t('COM_PHOCAMOSAIC_ENTER_PRESET_NAME', 'Please enter a preset name'), 'warning');
                    return;
                }
                
                //console.log('Saving preset:', name);
                //console.log('Storage method:', this.config.presetStorage);
                //console.log('Active filters:', this.activeFilters);
                
                if (this.config.presetStorage === 'database') {
                    // Save to database
                    //console.log('Using database storage');
                    await this.savePresetToDatabase(name);
                } else {
                    // Save to localStorage
                    //console.log('Using localStorage storage');
                    const presets = this.getPresetsFromLocalStorage();
                    presets[name] = {
                        filters: this.activeFilters,
                        created: Date.now()
                    };
                    
                    localStorage.setItem('phoca_mosaic_presets', JSON.stringify(presets));
                    this.closeModal();
                    this.showToast(this.t('COM_PHOCAMOSAIC_PRESET_SAVED', 'Preset saved successfully'), 'success');
                }
            }}
        ]);
    }

    async savePresetToDatabase(name) {
        try {
            //console.log('savePresetToDatabase called with name:', name);
            //console.log('CSRF Token:', this.csrfToken);
            //console.log('Active filters to save:', this.activeFilters);
            
            const formData = new FormData();
            formData.append(this.csrfToken, '1');
            formData.append('name', name);
            // Don't double-encode - send as JSON string, PHP will handle it
            formData.append('filters', JSON.stringify(this.activeFilters));
            
            //console.log('Filters JSON string:', JSON.stringify(this.activeFilters));
            
            const url = 'index.php?option=com_phocamosaic&task=editor.savePreset';
            //console.log('Fetching URL:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });
            
            //console.log('Response status:', response.status);
            //console.log('Response headers:', response.headers);
            
            const responseText = await response.text();
            //console.log('Response text:', responseText);
            
            const result = JSON.parse(responseText);
            //console.log('Parsed result:', result);
            
            if (result.success) {
                this.closeModal();
                this.showToast(result.message || this.t('COM_PHOCAMOSAIC_PRESET_SAVED', 'Preset saved successfully'), 'success');
            } else {
                this.showToast(result.message || this.t('COM_PHOCAMOSAIC_FAILED_SAVE_PRESET', 'Failed to save preset'), 'error');
            }
        } catch (error) {
            console.error('Error saving preset:', error);
            this.showToast(this.t('COM_PHOCAMOSAIC_FAILED_SAVE_PRESET', 'Failed to save preset'), 'error');
        }
    }

    async loadPreset() {
        console.log('loadPreset called - storage method:', this.config.presetStorage);
        
        if (this.config.presetStorage === 'database') {
            // Load from database
            await this.loadPresetFromDatabase();
        } else {
            // Load from localStorage
            this.loadPresetFromLocalStorage();
        }
    }

    async loadPresetFromDatabase() {
        try {
           // console.log('loadPresetFromDatabase called');
            
            const formData = new FormData();
            formData.append(this.csrfToken, '1');
            
            const response = await fetch('index.php?option=com_phocamosaic&task=editor.loadPresets', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            //console.log('Load presets result:', result);
            
            if (!result.success) {
                this.showToast(result.message || this.t('COM_PHOCAMOSAIC_FAILED_LOAD_PRESETS', 'Failed to load presets'), 'error');
                return;
            }
            
            const presets = result.presets || [];
            //console.log('Loaded presets:', presets);
            
            if (presets.length === 0) {
                this.showToast(this.t('COM_PHOCAMOSAIC_NO_PRESETS', 'No presets saved'), 'info');
                return;
            }
            
            const body = `
                <label class="mosaic-dialog-label">${this.t('COM_PHOCAMOSAIC_SELECT_PRESET', 'Select Preset')}:</label>
                <select id="preset-select" class="mosaic-dialog-select">
                    ${presets.map(preset => `<option value="${preset.id}">${preset.name}</option>`).join('')}
                </select>
                <button type="button" id="delete-preset-btn" class="mosaic-dialog-btn mosaic-dialog-btn-danger" style="width: 100%; margin-top: 1rem;">${this.t('COM_PHOCAMOSAIC_DELETE', 'Delete')} ${this.t('COM_PHOCAMOSAIC_SELECT_PRESET', 'Selected')}</button>
            `;
            
            this.showModal(this.t('COM_PHOCAMOSAIC_LOAD_PRESET', 'Load Preset'), body, [
                { text: this.t('COM_PHOCAMOSAIC_CANCEL', 'Cancel'), class: 'mosaic-dialog-btn-secondary', onClick: () => this.closeModal() },
                { text: this.t('COM_PHOCAMOSAIC_LOAD', 'Load'), class: 'mosaic-dialog-btn-primary', onClick: () => {
                    const selectedId = parseInt(document.getElementById('preset-select').value);
                    //console.log('Selected preset ID:', selectedId);
                    
                    const preset = presets.find(p => p.id === selectedId);
                    //console.log('Found preset:', preset);
                    //console.log('Preset filters type:', typeof preset.filters);
                    //console.log('Preset filters value:', preset.filters);
                    
                    if (!preset) {
                        console.error('Preset not found!');
                        return;
                    }
                    
                    // Parse filters - handle various encoding scenarios
                    let filters = preset.filters;
                    
                    //console.log('Raw filters:', filters);
                    //console.log('Is array?', Array.isArray(filters));
                    
                    // If it's a string, parse it first
                    if (typeof filters === 'string') {
                        //console.log('Filters is a string, parsing...');
                        try {
                            filters = JSON.parse(filters);
                            //console.log('Parsed string to:', filters);
                        } catch (e) {
                            console.error('Failed to parse filters string:', e);
                            filters = [];
                        }
                    }
                    
                    // If it's an array with a single string element, parse that string
                    if (Array.isArray(filters) && filters.length === 1 && typeof filters[0] === 'string') {
                        //console.log('Filters is array with string element, parsing...');
                        try {
                            filters = JSON.parse(filters[0]);
                            //console.log('Parsed array element to:', filters);
                        } catch (e) {
                            console.error('Failed to parse filters[0]:', e);
                            filters = [];
                        }
                    }
                    
                    // Final validation - ensure it's an array
                    if (!Array.isArray(filters)) {
                        console.error('Filters is not an array after parsing:', filters);
                        filters = [];
                    }
                    
                    //console.log('Final parsed filters:', filters);
                    
                    //console.log('Final filters to apply:', filters);
                    this.activeFilters = filters;
                    
                    //console.log('Calling applyAllFilters...');
                    this.applyAllFilters();
                    
                    this.closeModal();
                    this.showToast(this.t('COM_PHOCAMOSAIC_PRESET_LOADED', 'Preset loaded successfully'), 'success');
                }}
            ]);
            
            // Add delete button handler
            document.getElementById('delete-preset-btn')?.addEventListener('click', async () => {
                const selectedId = parseInt(document.getElementById('preset-select').value);
                await this.deletePresetFromDatabase(selectedId);
            });
            
        } catch (error) {
            console.error('Error loading presets:', error);
            this.showToast(this.t('COM_PHOCAMOSAIC_FAILED_LOAD_PRESETS', 'Failed to load presets'), 'error');
        }
    }

    async deletePresetFromDatabase(id) {
        try {
            const formData = new FormData();
            formData.append(this.csrfToken, '1');
            formData.append('id', id);
            
            const response = await fetch('index.php?option=com_phocamosaic&task=editor.deletePreset', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message || this.t('COM_PHOCAMOSAIC_PRESET_DELETED', 'Preset deleted successfully'), 'success');
                this.closeModal();
                // Reload preset list
                setTimeout(() => this.loadPreset(), 500);
            } else {
                this.showToast(result.message || this.t('COM_PHOCAMOSAIC_FAILED_DELETE_PRESET', 'Failed to delete preset'), 'error');
            }
        } catch (error) {
            console.error('Error deleting preset:', error);
            this.showToast(this.t('COM_PHOCAMOSAIC_FAILED_DELETE_PRESET', 'Failed to delete preset'), 'error');
        }
    }

    loadPresetFromLocalStorage() {
        const presets = this.getPresetsFromLocalStorage();
        const names = Object.keys(presets);
        
        if (names.length === 0) {
            this.showToast(this.t('COM_PHOCAMOSAIC_NO_PRESETS', 'No presets saved'), 'info');
            return;
        }
        
        const body = `
            <label class="mosaic-dialog-label">${this.t('COM_PHOCAMOSAIC_SELECT_PRESET', 'Select Preset')}:</label>
            <select id="preset-select" class="mosaic-dialog-select">
                ${names.map(name => `<option value="${name}">${name}</option>`).join('')}
            </select>
        `;
        
        this.showModal(this.t('COM_PHOCAMOSAIC_LOAD_PRESET', 'Load Preset'), body, [
            { text: this.t('COM_PHOCAMOSAIC_CANCEL', 'Cancel'), class: 'mosaic-dialog-btn-secondary', onClick: () => this.closeModal() },
            { text: this.t('COM_PHOCAMOSAIC_LOAD', 'Load'), class: 'mosaic-dialog-btn-primary', onClick: () => {
                const name = document.getElementById('preset-select').value;
                if (!name || !presets[name]) return;
                
                this.activeFilters = presets[name].filters;
                this.applyAllFilters();
                this.closeModal();
                this.showToast(this.t('COM_PHOCAMOSAIC_PRESET_LOADED', 'Preset loaded successfully'), 'success');
            }}
        ]);
    }

    getPresetsFromLocalStorage() {
        const stored = localStorage.getItem('phoca_mosaic_presets');
        return stored ? JSON.parse(stored) : {};
    }

    // Legacy method for backward compatibility
    getPresets() {
        return this.getPresetsFromLocalStorage();
    }

    applyAllFilters() {
           // console.log('applyAllFilters called');
           // console.log('Active filters to apply:', this.activeFilters);
           // console.log('Number of filters:', this.activeFilters.length);

            // Start from original image
            this.canvas.width = this.originalImage.width;
            this.canvas.height = this.originalImage.height;
            this.ctx.drawImage(this.originalImage, 0, 0);

            let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

            // Apply each filter in sequence
            for (const filter of this.activeFilters) {
                //console.log('Applying filter:', filter.name, 'with intensity:', filter.intensity);
                imageData = this.applyFilter(imageData, filter.name, filter.intensity, filter.params || {});
            }

            this.ctx.putImageData(imageData, 0, 0);
            this.pushHistory();

            //console.log('All filters applied successfully');
        }

    // ==================== EDIT TOOLS ====================
    
    handleEditTool(toolName) {
        // Clear active tool state
        this.currentTool = null;
        this.straightenBaseImage = null;
        
        // Clear right panel first
        const panel = document.querySelector('.tool-panel');
        if (panel) {
            panel.innerHTML = `<h3>${this.t('COM_PHOCAMOSAIC_TOOL_OPTIONS', 'Tool Options')}</h3><p style="color: var(--mosaic-text-secondary); font-size: 0.875rem;">${this.t('COM_PHOCAMOSAIC_SELECT_TOOL', 'Select a tool to see options')}</p>`;
        }
        
        switch(toolName) {
            case 'rotate-left':
                this.rotateImage(-90);
                break;
            case 'rotate-right':
                this.rotateImage(90);
                break;
            case 'mirror':
                this.mirrorImage();
                break;
            case 'flip':
                this.flipImage();
                break;
            case 'resize':
                this.showResizeDialog();
                break;
            case 'crop':
                this.showCropTool();
                break;
            case 'straighten':
                this.showStraightenTool();
                break;
        }
    }
    
    rotateImage(degrees) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        if (degrees === 90 || degrees === -90 || degrees === 270 || degrees === -270) {
            // Swap dimensions for 90/270 degree rotations
            tempCanvas.width = this.canvas.height;
            tempCanvas.height = this.canvas.width;
        } else {
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
        }
        
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate((degrees * Math.PI) / 180);
        tempCtx.drawImage(this.canvas, -this.canvas.width / 2, -this.canvas.height / 2);
        
        this.canvas.width = tempCanvas.width;
        this.canvas.height = tempCanvas.height;
        this.ctx.drawImage(tempCanvas, 0, 0);
        
        this.pushHistory();
        this.showToast(this.t('COM_PHOCAMOSAIC_ROTATED', 'Rotated') + ` ${degrees}°`, 'success');
    }
    
    mirrorImage() {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        tempCtx.translate(tempCanvas.width, 0);
        tempCtx.scale(-1, 1);
        tempCtx.drawImage(this.canvas, 0, 0);
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(tempCanvas, 0, 0);
        
        this.pushHistory();
        this.showToast(this.t('COM_PHOCAMOSAIC_IMAGE_MIRRORED', 'Image mirrored'), 'success');
    }
    
    flipImage() {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        
        tempCtx.translate(0, tempCanvas.height);
        tempCtx.scale(1, -1);
        tempCtx.drawImage(this.canvas, 0, 0);
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(tempCanvas, 0, 0);
        
        this.pushHistory();
        this.showToast(this.t('COM_PHOCAMOSAIC_IMAGE_FLIPPED', 'Image flipped'), 'success');
    }
    
    showResizeDialog() {
        const body = `
            <label class="mosaic-dialog-label">${this.t('COM_PHOCAMOSAIC_WIDTH', 'Width')} (px):</label>
            <input type="number" id="resize-width" class="mosaic-dialog-input" value="${this.canvas.width}" min="1">
            
            <label class="mosaic-dialog-label">${this.t('COM_PHOCAMOSAIC_HEIGHT', 'Height')} (px):</label>
            <input type="number" id="resize-height" class="mosaic-dialog-input" value="${this.canvas.height}" min="1">
            
            <label style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                <input type="checkbox" id="resize-aspect" checked>
                <span class="mosaic-dialog-label" style="margin: 0;">${this.t('COM_PHOCAMOSAIC_MAINTAIN_ASPECT', 'Maintain aspect ratio')}</span>
            </label>
        `;
        
        this.showModal(this.t('COM_PHOCAMOSAIC_RESIZE_IMAGE', 'Resize Image'), body, [
            { text: this.t('COM_PHOCAMOSAIC_CANCEL', 'Cancel'), class: 'mosaic-dialog-btn-secondary', onClick: () => this.closeModal() },
            { text: this.t('COM_PHOCAMOSAIC_RESIZE', 'Resize'), class: 'mosaic-dialog-btn-primary', onClick: () => this.applyResize() }
        ]);
        
        const widthInput = document.getElementById('resize-width');
        const heightInput = document.getElementById('resize-height');
        const aspectCheckbox = document.getElementById('resize-aspect');
        const aspectRatio = this.canvas.width / this.canvas.height;
        
        widthInput.addEventListener('input', () => {
            if (aspectCheckbox.checked) {
                heightInput.value = Math.round(widthInput.value / aspectRatio);
            }
        });
        
        heightInput.addEventListener('input', () => {
            if (aspectCheckbox.checked) {
                widthInput.value = Math.round(heightInput.value * aspectRatio);
            }
        });
    }
    
    applyResize() {
        const width = parseInt(document.getElementById('resize-width').value);
        const height = parseInt(document.getElementById('resize-height').value);
        
        if (!width || !height || width < 1 || height < 1) {
            this.showToast(this.t('COM_PHOCAMOSAIC_INVALID_DIMENSIONS', 'Invalid dimensions'), 'error');
            return;
        }
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        tempCtx.drawImage(this.canvas, 0, 0);
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.drawImage(tempCanvas, 0, 0, width, height);
        
        this.closeModal();
        this.pushHistory();
        this.updateDimensionsDisplay();
        this.showToast(this.t('COM_PHOCAMOSAIC_RESIZED_TO', 'Resized to') + ` ${width}×${height}`, 'success');
    }
    
    showCropTool() {
        this.currentTool = 'crop';
        
        // Initialize crop area (centered, 80% of image)
        this.cropArea = {
            x: this.canvas.width * 0.1,
            y: this.canvas.height * 0.1,
            width: this.canvas.width * 0.8,
            height: this.canvas.height * 0.8
        };
        
        // Initialize aspect ratio settings
        this.cropMaintainAspect = false;
        this.cropAspectRatio = this.cropArea.width / this.cropArea.height;
        
        // Save current state
        this.cropBaseImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Show crop overlay
        this.drawCropOverlay();
        
        // Setup mouse and touch events for dragging/resizing
        this.setupCropMouseEvents();
        
        // Show controls in right panel
        const panel = document.querySelector('.tool-panel');
        if (panel) {
            panel.innerHTML = `
                <h3>${this.t('COM_PHOCAMOSAIC_CROP', 'Crop')}</h3>
                <div style="margin-bottom: 1rem; font-size: 12px; color: var(--mosaic-text-secondary);">
                    <p>${this.t('COM_PHOCAMOSAIC_CROP_DRAG_MOVE', 'Drag to move crop area')}</p>
                    <p>${this.t('COM_PHOCAMOSAIC_CROP_DRAG_RESIZE', 'Drag corners to resize')}</p>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label class="mosaic-dialog-label" style="font-size: 12px;">${this.t('COM_PHOCAMOSAIC_WIDTH', 'Width')}:</label>
                    <input type="number" id="crop-width-input" value="${Math.round(this.cropArea.width)}" min="10" max="${this.canvas.width}" class="mosaic-dialog-input" style="margin-bottom: 0.5rem;">
                    
                    <label class="mosaic-dialog-label" style="font-size: 12px;">${this.t('COM_PHOCAMOSAIC_HEIGHT', 'Height')}:</label>
                    <input type="number" id="crop-height-input" value="${Math.round(this.cropArea.height)}" min="10" max="${this.canvas.height}" class="mosaic-dialog-input" style="margin-bottom: 0.5rem;">
                    
                    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 12px; margin-top: 0.5rem;">
                        <input type="checkbox" id="crop-maintain-aspect" style="width: auto;">
                        ${this.t('COM_PHOCAMOSAIC_MAINTAIN_ASPECT', 'Maintain aspect ratio')}
                    </label>
                </div>
                <div style="margin-bottom: 1rem; font-size: 11px; color: var(--mosaic-text-secondary);">
                    <label class="mosaic-dialog-label" style="font-size: 11px;">Position:</label>
                    X: <span id="crop-x">${Math.round(this.cropArea.x)}</span>, 
                    Y: <span id="crop-y">${Math.round(this.cropArea.y)}</span>
                </div>
                <button type="button" id="apply-crop" class="mosaic-dialog-btn mosaic-dialog-btn-primary" style="width: 100%; margin-bottom: 0.5rem;">${this.t('COM_PHOCAMOSAIC_APPLY_CROP', 'Apply Crop')}</button>
                <button type="button" id="cancel-crop" class="mosaic-dialog-btn mosaic-dialog-btn-secondary" style="width: 100%;">${this.t('COM_PHOCAMOSAIC_CANCEL', 'Cancel')}</button>
            `;
            
            // Width input handler
            document.getElementById('crop-width-input').addEventListener('input', (e) => {
                let newWidth = parseInt(e.target.value) || 10;
                newWidth = Math.max(10, Math.min(this.canvas.width, newWidth));
                
                this.cropArea.width = newWidth;
                
                if (this.cropMaintainAspect) {
                    const newHeight = newWidth / this.cropAspectRatio;
                    if (newHeight <= this.canvas.height) {
                        this.cropArea.height = newHeight;
                        document.getElementById('crop-height-input').value = Math.round(newHeight);
                    } else {
                        // Height would exceed canvas, adjust width back
                        this.cropArea.height = this.canvas.height;
                        this.cropArea.width = this.cropArea.height * this.cropAspectRatio;
                        e.target.value = Math.round(this.cropArea.width);
                    }
                }
                
                // Constrain position
                this.cropArea.x = Math.min(this.cropArea.x, this.canvas.width - this.cropArea.width);
                this.cropArea.y = Math.min(this.cropArea.y, this.canvas.height - this.cropArea.height);
                
                // Update position display only
                document.getElementById('crop-x').textContent = Math.round(this.cropArea.x);
                document.getElementById('crop-y').textContent = Math.round(this.cropArea.y);
                
                this.drawCropOverlay();
            });
            
            // Height input handler
            document.getElementById('crop-height-input').addEventListener('input', (e) => {
                let newHeight = parseInt(e.target.value) || 10;
                newHeight = Math.max(10, Math.min(this.canvas.height, newHeight));
                
                this.cropArea.height = newHeight;
                
                if (this.cropMaintainAspect) {
                    const newWidth = newHeight * this.cropAspectRatio;
                    if (newWidth <= this.canvas.width) {
                        this.cropArea.width = newWidth;
                        document.getElementById('crop-width-input').value = Math.round(newWidth);
                    } else {
                        // Width would exceed canvas, adjust height back
                        this.cropArea.width = this.canvas.width;
                        this.cropArea.height = this.cropArea.width / this.cropAspectRatio;
                        e.target.value = Math.round(this.cropArea.height);
                    }
                }
                
                // Constrain position
                this.cropArea.x = Math.min(this.cropArea.x, this.canvas.width - this.cropArea.width);
                this.cropArea.y = Math.min(this.cropArea.y, this.canvas.height - this.cropArea.height);
                
                // Update position display only
                document.getElementById('crop-x').textContent = Math.round(this.cropArea.x);
                document.getElementById('crop-y').textContent = Math.round(this.cropArea.y);
                
                this.drawCropOverlay();
            });
            
            // Aspect ratio checkbox handler
            document.getElementById('crop-maintain-aspect').addEventListener('change', (e) => {
                this.cropMaintainAspect = e.target.checked;
                if (this.cropMaintainAspect) {
                    this.cropAspectRatio = this.cropArea.width / this.cropArea.height;
                }
            });
            
            document.getElementById('apply-crop').addEventListener('click', () => this.applyCrop());
            document.getElementById('cancel-crop').addEventListener('click', () => this.cancelCrop());
        }
    }
    
    setupCropMouseEvents() {
        let isDragging = false;
        let isResizing = false;
        let resizeHandle = null;
        let startX = 0;
        let startY = 0;
        let startCropArea = null;
        
        const getCanvasCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Handle both mouse and touch events
            const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
            return {
                x: (clientX - rect.left) * (this.canvas.width / rect.width),
                y: (clientY - rect.top) * (this.canvas.height / rect.height)
            };
        };
        
        const getResizeHandle = (x, y) => {
            const handleSize = 20;
            const handles = {
                'nw': { x: this.cropArea.x, y: this.cropArea.y },
                'ne': { x: this.cropArea.x + this.cropArea.width, y: this.cropArea.y },
                'sw': { x: this.cropArea.x, y: this.cropArea.y + this.cropArea.height },
                'se': { x: this.cropArea.x + this.cropArea.width, y: this.cropArea.y + this.cropArea.height }
            };
            
            for (const [handle, pos] of Object.entries(handles)) {
                if (Math.abs(x - pos.x) < handleSize && Math.abs(y - pos.y) < handleSize) {
                    return handle;
                }
            }
            return null;
        };
        
        const isInsideCropArea = (x, y) => {
            return x >= this.cropArea.x && x <= this.cropArea.x + this.cropArea.width &&
                   y >= this.cropArea.y && y <= this.cropArea.y + this.cropArea.height;
        };
        
        this.cropMouseDown = (e) => {
            if (this.currentTool !== 'crop') return;
            
            const coords = getCanvasCoords(e);
            resizeHandle = getResizeHandle(coords.x, coords.y);
            
            if (resizeHandle) {
                isResizing = true;
            } else if (isInsideCropArea(coords.x, coords.y)) {
                isDragging = true;
            }
            
            startX = coords.x;
            startY = coords.y;
            startCropArea = { ...this.cropArea };
        };
        
        this.cropMouseMove = (e) => {
            if (this.currentTool !== 'crop') return;
            
            const coords = getCanvasCoords(e);
            
            if (isResizing && resizeHandle) {
                const dx = coords.x - startX;
                const dy = coords.y - startY;
                
                if (this.cropMaintainAspect) {
                    // Maintain aspect ratio during resize
                    switch (resizeHandle) {
                        case 'se':
                            // Use width change as primary, calculate height
                            const newWidth = Math.max(50, startCropArea.width + dx);
                            this.cropArea.width = newWidth;
                            this.cropArea.height = newWidth / this.cropAspectRatio;
                            break;
                        case 'sw':
                            const widthSW = Math.max(50, startCropArea.width - dx);
                            this.cropArea.width = widthSW;
                            this.cropArea.height = widthSW / this.cropAspectRatio;
                            this.cropArea.x = startCropArea.x + startCropArea.width - this.cropArea.width;
                            break;
                        case 'ne':
                            const widthNE = Math.max(50, startCropArea.width + dx);
                            this.cropArea.width = widthNE;
                            this.cropArea.height = widthNE / this.cropAspectRatio;
                            this.cropArea.y = startCropArea.y + startCropArea.height - this.cropArea.height;
                            break;
                        case 'nw':
                            const widthNW = Math.max(50, startCropArea.width - dx);
                            this.cropArea.width = widthNW;
                            this.cropArea.height = widthNW / this.cropAspectRatio;
                            this.cropArea.x = startCropArea.x + startCropArea.width - this.cropArea.width;
                            this.cropArea.y = startCropArea.y + startCropArea.height - this.cropArea.height;
                            break;
                    }
                } else {
                    // Free resize without aspect ratio
                    switch (resizeHandle) {
                        case 'se':
                            this.cropArea.width = Math.max(50, startCropArea.width + dx);
                            this.cropArea.height = Math.max(50, startCropArea.height + dy);
                            break;
                        case 'sw':
                            this.cropArea.x = Math.min(startCropArea.x + startCropArea.width - 50, startCropArea.x + dx);
                            this.cropArea.width = startCropArea.width - (this.cropArea.x - startCropArea.x);
                            this.cropArea.height = Math.max(50, startCropArea.height + dy);
                            break;
                        case 'ne':
                            this.cropArea.width = Math.max(50, startCropArea.width + dx);
                            this.cropArea.y = Math.min(startCropArea.y + startCropArea.height - 50, startCropArea.y + dy);
                            this.cropArea.height = startCropArea.height - (this.cropArea.y - startCropArea.y);
                            break;
                        case 'nw':
                            this.cropArea.x = Math.min(startCropArea.x + startCropArea.width - 50, startCropArea.x + dx);
                            this.cropArea.width = startCropArea.width - (this.cropArea.x - startCropArea.x);
                            this.cropArea.y = Math.min(startCropArea.y + startCropArea.height - 50, startCropArea.y + dy);
                            this.cropArea.height = startCropArea.height - (this.cropArea.y - startCropArea.y);
                            break;
                    }
                }
                
                // Constrain to canvas
                this.cropArea.x = Math.max(0, Math.min(this.cropArea.x, this.canvas.width - this.cropArea.width));
                this.cropArea.y = Math.max(0, Math.min(this.cropArea.y, this.canvas.height - this.cropArea.height));
                this.cropArea.width = Math.min(this.cropArea.width, this.canvas.width - this.cropArea.x);
                this.cropArea.height = Math.min(this.cropArea.height, this.canvas.height - this.cropArea.y);
                
                this.drawCropOverlay();
                this.updateCropInfo();
            } else if (isDragging) {
                const dx = coords.x - startX;
                const dy = coords.y - startY;
                
                this.cropArea.x = Math.max(0, Math.min(this.canvas.width - this.cropArea.width, startCropArea.x + dx));
                this.cropArea.y = Math.max(0, Math.min(this.canvas.height - this.cropArea.height, startCropArea.y + dy));
                
                this.drawCropOverlay();
                this.updateCropInfo();
            } else {
                // Update cursor
                const handle = getResizeHandle(coords.x, coords.y);
                if (handle) {
                    const cursors = { 'nw': 'nw-resize', 'ne': 'ne-resize', 'sw': 'sw-resize', 'se': 'se-resize' };
                    this.canvas.style.cursor = cursors[handle];
                } else if (isInsideCropArea(coords.x, coords.y)) {
                    this.canvas.style.cursor = 'move';
                } else {
                    this.canvas.style.cursor = 'default';
                }
            }
        };
        
        this.cropMouseUp = () => {
            isDragging = false;
            isResizing = false;
            resizeHandle = null;
        };
        
        this.canvas.addEventListener('mousedown', this.cropMouseDown);
        this.canvas.addEventListener('mousemove', this.cropMouseMove);
        this.canvas.addEventListener('mouseup', this.cropMouseUp);
        this.canvas.addEventListener('mouseleave', this.cropMouseUp);
        
        // Add touch event support for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.cropMouseDown(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.cropMouseMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.cropMouseUp();
        });
        this.canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.cropMouseUp();
        });
    }
    
    drawCropOverlay() {
        if (!this.cropBaseImage) return;
        
        // Restore original image
        this.ctx.putImageData(this.cropBaseImage, 0, 0);
        
        // Draw semi-transparent overlay over entire canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Create temp canvas with original image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(this.cropBaseImage, 0, 0);
        
        // Draw the crop area without overlay
        this.ctx.drawImage(
            tempCanvas,
            this.cropArea.x,
            this.cropArea.y,
            this.cropArea.width,
            this.cropArea.height,
            this.cropArea.x,
            this.cropArea.y,
            this.cropArea.width,
            this.cropArea.height
        );
        
        // Draw border
        this.ctx.strokeStyle = '#4a9eff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.cropArea.x, this.cropArea.y, this.cropArea.width, this.cropArea.height);
        
        // Draw corner handles
        const handleSize = 10;
        const handles = [
            { x: this.cropArea.x, y: this.cropArea.y },
            { x: this.cropArea.x + this.cropArea.width, y: this.cropArea.y },
            { x: this.cropArea.x, y: this.cropArea.y + this.cropArea.height },
            { x: this.cropArea.x + this.cropArea.width, y: this.cropArea.y + this.cropArea.height }
        ];
        
        this.ctx.fillStyle = '#4a9eff';
        handles.forEach(handle => {
            this.ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        });
    }
    
    updateCropInfo() {
        document.getElementById('crop-x').textContent = Math.round(this.cropArea.x);
        document.getElementById('crop-y').textContent = Math.round(this.cropArea.y);
        document.getElementById('crop-width-input').value = Math.round(this.cropArea.width);
        document.getElementById('crop-height-input').value = Math.round(this.cropArea.height);
    }
    
    applyCrop() {
        // Create a temporary canvas with the original image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(this.cropBaseImage, 0, 0);
        
        // Resize main canvas to crop dimensions
        this.canvas.width = Math.round(this.cropArea.width);
        this.canvas.height = Math.round(this.cropArea.height);
        
        // Draw the cropped portion
        this.ctx.drawImage(
            tempCanvas,
            Math.round(this.cropArea.x),
            Math.round(this.cropArea.y),
            Math.round(this.cropArea.width),
            Math.round(this.cropArea.height),
            0,
            0,
            Math.round(this.cropArea.width),
            Math.round(this.cropArea.height)
        );
        
        this.cleanupCropTool();
        this.pushHistory();
        this.updateDimensionsDisplay();
        this.showToast(this.t('COM_PHOCAMOSAIC_CROPPED_TO', 'Cropped to') + ` ${Math.round(this.cropArea.width)}×${Math.round(this.cropArea.height)}`, 'success');
    }
    
    cancelCrop() {
        this.ctx.putImageData(this.cropBaseImage, 0, 0);
        this.cleanupCropTool();
    }
    
    cleanupCropTool() {
        this.currentTool = null;
        this.cropArea = null;
        this.cropBaseImage = null;
        this.canvas.style.cursor = 'default';
        
        // Remove event listeners
        if (this.cropMouseDown) {
            this.canvas.removeEventListener('mousedown', this.cropMouseDown);
            this.canvas.removeEventListener('mousemove', this.cropMouseMove);
            this.canvas.removeEventListener('mouseup', this.cropMouseUp);
            this.canvas.removeEventListener('mouseleave', this.cropMouseUp);
        }
        
        const panel = document.querySelector('.tool-panel');
        if (panel) {
            panel.innerHTML = `<h3>${this.t('COM_PHOCAMOSAIC_TOOL_OPTIONS', 'Tool Options')}</h3><p style="color: var(--mosaic-text-secondary); font-size: 0.875rem;">${this.t('COM_PHOCAMOSAIC_SELECT_TOOL', 'Select a tool to see options')}</p>`;
        }
    }
    
    showStraightenTool() {
        this.currentTool = 'straighten';
        this.straightenBaseImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        const panel = document.querySelector('.tool-panel');
        if (panel) {
            panel.innerHTML = `
                <h3>${this.t('COM_PHOCAMOSAIC_STRAIGHTEN', 'Straighten')}</h3>
                <div class="slider-control">
                    <label>${this.t('COM_PHOCAMOSAIC_ROTATION_ANGLE', 'Rotation Angle')}</label>
                    <input type="range" id="straighten-slider" min="-45" max="45" value="0" step="0.1">
                    <span class="slider-value" id="straighten-value">0°</span>
                </div>
                <button type="button" id="apply-straighten" class="mosaic-dialog-btn mosaic-dialog-btn-primary" style="width: 100%; margin-top: 1rem;">${this.t('COM_PHOCAMOSAIC_APPLY', 'Apply')}</button>
            `;
            
            const slider = document.getElementById('straighten-slider');
            const valueDisplay = document.getElementById('straighten-value');
            
            slider.addEventListener('input', (e) => {
                const angle = parseFloat(e.target.value);
                valueDisplay.textContent = angle.toFixed(1) + '°';
                this.applyStraighten(angle);
            });
            
            document.getElementById('apply-straighten').addEventListener('click', () => {
                this.pushHistory();
                this.currentTool = null;
                this.straightenBaseImage = null;
                this.showToast(this.t('COM_PHOCAMOSAIC_STRAIGHTEN_APPLIED', 'Straighten applied'), 'success');
                panel.innerHTML = `<h3>${this.t('COM_PHOCAMOSAIC_TOOL_OPTIONS', 'Tool Options')}</h3><p style="color: var(--mosaic-text-secondary); font-size: 0.875rem;">${this.t('COM_PHOCAMOSAIC_SELECT_TOOL', 'Select a tool to see options')}</p>`;
            });
        }
    }
    
    applyStraighten(angle) {
        if (!this.straightenBaseImage) return;
        
        this.ctx.putImageData(this.straightenBaseImage, 0, 0);
        
        if (angle === 0) return;
        
        const radians = (angle * Math.PI) / 180;
        
        // Calculate auto-scale to fill ALL corners
        // We need to scale UP so rotated image covers entire canvas with no empty corners
        const w = this.canvas.width;
        const h = this.canvas.height;
        const sinAngle = Math.abs(Math.sin(radians));
        const cosAngle = Math.abs(Math.cos(radians));
        
        // The rotated image bounding box dimensions
        const rotatedWidth = w * cosAngle + h * sinAngle;
        const rotatedHeight = h * cosAngle + w * sinAngle;
        
        // Scale needed to make the rotated bounding box fit back into original canvas
        // We need the INVERSE: scale so original canvas fills the rotated space
        const scaleX = rotatedWidth / w;
        const scaleY = rotatedHeight / h;
        
        // Use the larger scale to ensure ALL corners are covered
        const autoScale = Math.max(scaleX, scaleY);
        
        // Create temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // Clear and apply rotation with auto-scale (zoom in to cover all corners)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate(radians);
        this.ctx.scale(autoScale, autoScale);
        this.ctx.drawImage(tempCanvas, -this.canvas.width / 2, -this.canvas.height / 2);
        this.ctx.restore();
    }

    // ==================== SAVE/APPLY/CANCEL ====================
    
    async save() {
        try {
            const blob = await new Promise(resolve => {
                this.canvas.toBlob(resolve, 'image/jpeg', 0.95);
            });
            
            const formData = new FormData();
            formData.append('image', blob, 'edited.jpg');
            formData.append('path', this.imagePath);
            formData.append(this.csrfToken, '1');
            
            const response = await fetch(
                'index.php?option=com_phocamosaic&task=editor.saveImage&format=json',
                {
                    method: 'POST',
                    body: formData
                }
            );
            
            const result = await response.json();
            
            if (result.success) {
                // Show success toast
                this.showToast(this.t('IMAGE_SAVED', 'Image saved successfully'), 'success', 3000);
                
                // Update original image reference to current canvas state
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.canvas.width;
                tempCanvas.height = this.canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(this.canvas, 0, 0);
                
                const img = new Image();
                img.onload = () => {
                    this.originalImage = img;
                    // Update dimensions display
                    document.getElementById('image-dimensions').textContent = 
                        `${this.canvas.width} × ${this.canvas.height}`;
                };
                img.src = tempCanvas.toDataURL();
                
                // No reload - keep filters active
            } else {
                this.showToast(`${this.t('FAILED_SAVE', 'Failed to save image')}: ` + (result.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showToast(`${this.t('FAILED_SAVE', 'Failed to save image')}: ` + error.message, 'error');
        }
    }

    showSaveAsDialog() {
        const pathParts = this.imagePath.split('/');
        const filename = pathParts[pathParts.length - 1];
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
        
        const body = `
            <label class="mosaic-dialog-label">${this.t('COM_PHOCAMOSAIC_FILENAME', 'Filename')}:</label>
            <input type="text" id="save-as-filename" class="mosaic-dialog-input" value="${nameWithoutExt}">
            
            <label class="mosaic-dialog-label">${this.t('COM_PHOCAMOSAIC_FORMAT', 'Format')}:</label>
            <select id="save-as-format" class="mosaic-dialog-select">
                <option value="jpg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
            </select>
            
            <div id="quality-control">
                <label class="mosaic-dialog-label">${this.t('COM_PHOCAMOSAIC_QUALITY', 'Quality')}: <span id="quality-value">95</span>%</label>
                <input type="range" id="save-as-quality" min="1" max="100" value="95" style="width: 100%;">
            </div>
        `;
        
        this.showModal(this.t('COM_PHOCAMOSAIC_SAVE_AS', 'Save As'), body, [
            { text: this.t('COM_PHOCAMOSAIC_CANCEL', 'Cancel'), class: 'mosaic-dialog-btn-secondary', onClick: () => this.closeModal() },
            { text: this.t('COM_PHOCAMOSAIC_SAVE', 'Save'), class: 'mosaic-dialog-btn-primary', onClick: () => this.saveAs() }
        ]);
        
        // Quality slider handler
        document.getElementById('save-as-quality').addEventListener('input', (e) => {
            document.getElementById('quality-value').textContent = e.target.value;
        });
        
        // Format change handler - hide quality for PNG
        document.getElementById('save-as-format').addEventListener('change', (e) => {
            const qualityControl = document.getElementById('quality-control');
            qualityControl.style.display = e.target.value === 'png' ? 'none' : 'block';
        });
    }

    async saveAs() {
        const filename = document.getElementById('save-as-filename').value.trim();
        const format = document.getElementById('save-as-format').value;
        const quality = parseInt(document.getElementById('save-as-quality').value) / 100;
        
        if (!filename) {
            this.showToast(this.t('COM_PHOCAMOSAIC_ENTER_FILENAME', 'Please enter a filename'), 'warning');
            return;
        }
        
        this.closeModal();
        
        try {
            const mimeTypes = {
                'jpg': 'image/jpeg',
                'png': 'image/png',
                'webp': 'image/webp'
            };
            
            const blob = await new Promise(resolve => {
                this.canvas.toBlob(resolve, mimeTypes[format], quality);
            });
            
            const formData = new FormData();
            formData.append('image', blob, `${filename}.${format}`);
            formData.append('path', this.imagePath);
            formData.append('filename', filename);
            formData.append('format', format);
            formData.append('quality', Math.round(quality * 100));
            formData.append(this.csrfToken, '1');
            
            const response = await fetch(
                'index.php?option=com_phocamosaic&task=editor.saveAsImage',
                {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );
            
            const result = await response.json();
            
            if (result.success) {
                // Show toast with longer duration for redirect
                this.showToast(this.t('COM_PHOCAMOSAIC_IMAGE_SAVED_AS', 'Image saved as') + ` ${filename}.${format}! ` + this.t('COM_PHOCAMOSAIC_LOADING', 'Loading...'), 'success', 5000);
                
                // Reload page with new image after delay
                setTimeout(() => {
                    const newPath = result.path || `${this.imagePath.substring(0, this.imagePath.lastIndexOf('/'))}/${filename}.${format}`;
                    
                    // Preserve tmpl and e_name parameters if we're in component mode
                    const urlParams = new URLSearchParams(window.location.search);
                    const tmpl = urlParams.get('tmpl');
                    const eName = urlParams.get('e_name');
                    
                    let extraParams = '';
                    if (tmpl) extraParams += `&tmpl=${tmpl}`;
                    if (eName) extraParams += `&e_name=${eName}`;
                    
                    window.location.href = `index.php?option=com_phocamosaic&view=editor&path=${encodeURIComponent(newPath)}${extraParams}`;
                }, 2000);
            } else {
                this.showToast(this.t('COM_PHOCAMOSAIC_FAILED_SAVE', 'Failed to save image') + ': ' + (result.message || this.t('COM_PHOCAMOSAIC_ERROR_UNKNOWN', 'Unknown error')), 'error');
            }
        } catch (error) {
            console.error('Save As error:', error);
            this.showToast(this.t('COM_PHOCAMOSAIC_FAILED_SAVE', 'Failed to save image') + ': ' + error.message, 'error');
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
        overlay.style.display = 'none';
    }

    async apply() {
        await this.save();
    }

    cancel() {
        this.showModal(
            this.t('COM_PHOCAMOSAIC_DISCARD_CHANGES', 'Discard Changes'), 
            this.t('COM_PHOCAMOSAIC_DISCARD_CONFIRM', 'Are you sure you want to discard all changes?'), 
            [
                { text: this.t('COM_PHOCAMOSAIC_NO', 'No'), class: 'mosaic-dialog-btn-secondary', onClick: () => this.closeModal() },
                { text: this.t('COM_PHOCAMOSAIC_YES_DISCARD', 'Yes, Discard'), class: 'mosaic-dialog-btn-primary', onClick: () => {
                    window.location.href = 'index.php?option=com_media';
                }}
            ]
        );
    }
}

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    //console.log('Initializing Enhanced Mosaic Editor...');
    try {
        const editor = new EnhancedMosaicEditor();
        //console.log('Enhanced Mosaic Editor initialized successfully');
        
        // Make editor globally accessible for debugging
        window.mosaicEditor = editor;
    } catch (error) {
        console.error('Failed to initialize Enhanced Mosaic Editor:', error);
    }
});

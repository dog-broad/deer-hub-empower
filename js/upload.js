
/**
 * DEER Hub Document Upload System
 * Handles file uploads, document management, and library display
 */

class UploadManager {
    constructor() {
        this.selectedFiles = [];
        this.documents = [];
        this.init();
    }

    async init() {
        // Check authentication and role
        if (!this.checkManagerAuth()) {
            return;
        }

        await this.loadComponents();
        this.bindEvents();
        this.loadRecentUploads();
        this.loadDocumentLibrary();
        this.initDragAndDrop();
    }

    // Check if user has manager access
    checkManagerAuth() {
        const session = window.authManager ? window.authManager.getSession() : null;
        
        if (!session || !session.isLoggedIn) {
            if (window.authManager) {
                window.authManager.showToast('Please login to access this feature', 'warning');
            }
            window.location.href = 'auth.html';
            return false;
        }
        
        if (session.role !== 'manager' && session.role !== 'admin') {
            if (window.authManager) {
                window.authManager.showToast('This feature is only available to managers', 'warning');
            }
            window.location.href = 'index.html';
            return false;
        }
        
        return true;
    }

    // Load navbar and footer components
    async loadComponents() {
        try {
            await new Promise((resolve, reject) => {
                $('#navbar-container').load('components/navbar.html', (response, status) => {
                    if (status === 'error') {
                        reject(new Error('Failed to load navbar'));
                    } else {
                        resolve();
                    }
                });
            });

            await new Promise((resolve, reject) => {
                $('#footer-container').load('components/footer.html', (response, status) => {
                    if (status === 'error') {
                        reject(new Error('Failed to load footer'));
                    } else {
                        resolve();
                    }
                });
            });

            console.log('Upload page components loaded successfully');
        } catch (error) {
            console.error('Error loading components:', error);
        }
    }

    // Bind event listeners
    bindEvents() {
        // File input and browse button
        $('#browseBtn').on('click', () => {
            $('#fileInput').click();
        });

        $('#fileInput').on('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Form submission
        $('#uploadForm').on('submit', (e) => {
            e.preventDefault();
            this.handleUpload();
        });

        // Clear form
        $('#clearFormBtn').on('click', () => {
            this.clearForm();
        });

        // View toggle
        $('.library-controls button[data-view]').on('click', (e) => {
            const view = $(e.currentTarget).data('view');
            this.toggleView(view);
        });

        // Search functionality
        $('#searchDocs').on('input', (e) => {
            this.searchDocuments(e.target.value);
        });

        // Remove file from selection
        $(document).on('click', '.remove-file', (e) => {
            const index = $(e.currentTarget).data('index');
            this.removeFile(index);
        });
    }

    // Initialize drag and drop
    initDragAndDrop() {
        const uploadArea = $('#uploadArea')[0];

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFileSelection(e.dataTransfer.files);
        });
    }

    // Handle file selection
    handleFileSelection(files) {
        const validFiles = this.validateFiles(files);
        
        if (validFiles.length > 0) {
            this.selectedFiles = [...this.selectedFiles, ...validFiles];
            this.displaySelectedFiles();
        }
    }

    // Validate uploaded files
    validateFiles(files) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif'
        ];

        const validFiles = [];
        const errors = [];

        Array.from(files).forEach(file => {
            if (file.size > maxSize) {
                errors.push(`${file.name} exceeds 10MB limit`);
                return;
            }

            if (!allowedTypes.includes(file.type)) {
                errors.push(`${file.name} has unsupported format`);
                return;
            }

            validFiles.push(file);
        });

        if (errors.length > 0 && window.authManager) {
            window.authManager.showToast(errors.join(', '), 'error');
        }

        return validFiles;
    }

    // Display selected files
    displaySelectedFiles() {
        const fileList = $('#fileList');
        const fileItems = $('#fileItems');

        if (this.selectedFiles.length === 0) {
            fileList.hide();
            return;
        }

        fileList.show();
        fileItems.empty();

        this.selectedFiles.forEach((file, index) => {
            const fileSize = this.formatFileSize(file.size);
            const fileIcon = this.getFileIcon(file.type);

            const fileItem = $(`
                <div class="file-item d-flex align-items-center justify-content-between p-3 mb-2 glass">
                    <div class="d-flex align-items-center">
                        <i class="${fileIcon} me-3 text-primary"></i>
                        <div>
                            <h6 class="mb-0">${file.name}</h6>
                            <small class="text-muted">${fileSize}</small>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger remove-file" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `);

            fileItems.append(fileItem);
        });
    }

    // Remove file from selection
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.displaySelectedFiles();
    }

    // Handle upload
    handleUpload() {
        if (!this.validateForm()) {
            return;
        }

        if (this.selectedFiles.length === 0) {
            if (window.authManager) {
                window.authManager.showToast('Please select files to upload', 'warning');
            }
            return;
        }

        const formData = this.gatherFormData();
        this.simulateUpload(formData);
    }

    // Validate form
    validateForm() {
        let isValid = true;
        
        const requiredFields = ['docTitle', 'category', 'description'];
        
        requiredFields.forEach(fieldId => {
            const $field = $(`#${fieldId}`);
            if (!$field.val().trim()) {
                $field.addClass('is-invalid');
                isValid = false;
            } else {
                $field.removeClass('is-invalid');
            }
        });

        return isValid;
    }

    // Gather form data
    gatherFormData() {
        const session = window.authManager ? window.authManager.getSession() : {};
        
        return {
            id: Date.now(),
            title: $('#docTitle').val().trim(),
            category: $('#category').val(),
            description: $('#description').val().trim(),
            accessLevel: $('#accessLevel').val(),
            tags: $('#tags').val().split(',').map(tag => tag.trim()).filter(tag => tag),
            versionControl: $('#versionControl').is(':checked'),
            files: this.selectedFiles,
            uploadedBy: session.name || 'Current User',
            uploadDate: new Date().toISOString(),
            status: 'active'
        };
    }

    // Simulate upload process
    simulateUpload(formData) {
        const uploadBtn = $('#uploadBtn');
        const progressContainer = $('#uploadProgress');
        const progressBar = $('#progressBar');
        const progressPercent = $('#progressPercent');

        // Show progress and disable button
        uploadBtn.prop('disabled', true);
        progressContainer.show();

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                // Complete upload
                setTimeout(() => {
                    this.completeUpload(formData);
                    progressContainer.hide();
                    uploadBtn.prop('disabled', false);
                    progressBar.css('width', '0%');
                    progressPercent.text('0%');
                }, 500);
            }

            progressBar.css('width', `${progress}%`);
            progressPercent.text(`${Math.round(progress)}%`);
        }, 200);
    }

    // Complete upload
    completeUpload(formData) {
        // Save to localStorage (simulate backend)
        let documents = JSON.parse(localStorage.getItem('documents') || '[]');
        
        // Process each file
        formData.files.forEach((file, index) => {
            const document = {
                ...formData,
                id: formData.id + index,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                downloadUrl: '#' // Would be actual URL in real implementation
            };
            
            delete document.files; // Remove files array from individual documents
            documents.unshift(document);
        });

        localStorage.setItem('documents', JSON.stringify(documents));

        if (window.authManager) {
            window.authManager.showToast(`Successfully uploaded ${formData.files.length} file(s)!`, 'success');
        }

        this.clearForm();
        this.loadRecentUploads();
        this.loadDocumentLibrary();
    }

    // Clear form
    clearForm() {
        $('#uploadForm')[0].reset();
        this.selectedFiles = [];
        this.displaySelectedFiles();
        $('.is-invalid').removeClass('is-invalid');
    }

    // Load recent uploads
    loadRecentUploads() {
        const documents = JSON.parse(localStorage.getItem('documents') || '[]');
        const recentContainer = $('#recentUploads');
        
        recentContainer.empty();
        
        if (documents.length === 0) {
            recentContainer.html('<p class="text-muted">No recent uploads</p>');
            return;
        }

        documents.slice(0, 5).forEach(doc => {
            const uploadDate = new Date(doc.uploadDate).toLocaleDateString();
            const fileIcon = this.getFileIcon(doc.fileType);

            const uploadItem = $(`
                <div class="recent-upload-item mb-3">
                    <div class="d-flex align-items-start">
                        <i class="${fileIcon} me-2 text-primary"></i>
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${doc.title}</h6>
                            <small class="text-muted d-block">${doc.fileName}</small>
                            <small class="text-muted">${uploadDate}</small>
                        </div>
                    </div>
                </div>
            `);
            
            recentContainer.append(uploadItem);
        });
    }

    // Load document library
    loadDocumentLibrary() {
        const documents = JSON.parse(localStorage.getItem('documents') || '[]');
        this.documents = documents;
        this.renderDocumentGrid(documents);
    }

    // Render document grid
    renderDocumentGrid(documents) {
        const grid = $('#documentGrid');
        grid.empty();

        if (documents.length === 0) {
            grid.html(`
                <div class="col-12 text-center py-5">
                    <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No documents uploaded yet</h5>
                    <p class="text-muted">Upload your first document to get started</p>
                </div>
            `);
            return;
        }

        const isListView = $('.library-controls button[data-view="list"]').hasClass('active');
        
        if (isListView) {
            this.renderListView(documents);
        } else {
            this.renderGridView(documents);
        }
    }

    // Render grid view
    renderGridView(documents) {
        const grid = $('#documentGrid');
        grid.removeClass('list-view').addClass('row g-4');

        documents.forEach(doc => {
            const fileIcon = this.getFileIcon(doc.fileType);
            const fileSize = this.formatFileSize(doc.fileSize);
            const uploadDate = new Date(doc.uploadDate).toLocaleDateString();

            const docCard = $(`
                <div class="col-lg-3 col-md-4 col-sm-6">
                    <div class="document-card">
                        <div class="document-icon">
                            <i class="${fileIcon}"></i>
                        </div>
                        <div class="document-info">
                            <h6 class="document-title">${doc.title}</h6>
                            <p class="document-filename">${doc.fileName}</p>
                            <div class="document-meta">
                                <small class="text-muted">${fileSize} • ${uploadDate}</small>
                            </div>
                            <div class="document-tags mt-2">
                                ${doc.tags.slice(0, 2).map(tag => `<span class="badge bg-light text-dark">${tag}</span>`).join(' ')}
                            </div>
                        </div>
                        <div class="document-actions">
                            <button class="btn btn-sm btn-outline-primary" onclick="window.uploadManager.downloadDocument('${doc.id}')">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="window.uploadManager.viewDocument('${doc.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `);

            grid.append(docCard);
        });
    }

    // Render list view
    renderListView(documents) {
        const grid = $('#documentGrid');
        grid.removeClass('row g-4').addClass('list-view');

        const table = $(`
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Document</th>
                            <th>Category</th>
                            <th>Size</th>
                            <th>Upload Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="documentTableBody">
                    </tbody>
                </table>
            </div>
        `);

        grid.append(table);

        const tbody = $('#documentTableBody');

        documents.forEach(doc => {
            const fileIcon = this.getFileIcon(doc.fileType);
            const fileSize = this.formatFileSize(doc.fileSize);
            const uploadDate = new Date(doc.uploadDate).toLocaleDateString();

            const row = $(`
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <i class="${fileIcon} me-3 text-primary"></i>
                            <div>
                                <h6 class="mb-0">${doc.title}</h6>
                                <small class="text-muted">${doc.fileName}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-secondary">${doc.category}</span>
                    </td>
                    <td>${fileSize}</td>
                    <td>${uploadDate}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="window.uploadManager.downloadDocument('${doc.id}')">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn btn-outline-secondary" onclick="window.uploadManager.viewDocument('${doc.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `);

            tbody.append(row);
        });
    }

    // Toggle between grid and list view
    toggleView(view) {
        $('.library-controls button[data-view]').removeClass('active');
        $(`.library-controls button[data-view="${view}"]`).addClass('active');
        
        this.renderDocumentGrid(this.documents);
    }

    // Search documents
    searchDocuments(query) {
        if (!query.trim()) {
            this.renderDocumentGrid(this.documents);
            return;
        }

        const filteredDocs = this.documents.filter(doc => 
            doc.title.toLowerCase().includes(query.toLowerCase()) ||
            doc.fileName.toLowerCase().includes(query.toLowerCase()) ||
            doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
            doc.category.toLowerCase().includes(query.toLowerCase())
        );

        this.renderDocumentGrid(filteredDocs);
    }

    // Download document (placeholder)
    downloadDocument(docId) {
        if (window.authManager) {
            window.authManager.showToast('Download functionality would be implemented here', 'info');
        }
    }

    // View document (placeholder)
    viewDocument(docId) {
        if (window.authManager) {
            window.authManager.showToast('Document viewer would open here', 'info');
        }
    }

    // Get file icon based on file type
    getFileIcon(fileType) {
        if (fileType.includes('pdf')) return 'fas fa-file-pdf text-danger';
        if (fileType.includes('word')) return 'fas fa-file-word text-primary';
        if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'fas fa-file-powerpoint text-warning';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fas fa-file-excel text-success';
        if (fileType.includes('text')) return 'fas fa-file-alt text-secondary';
        if (fileType.includes('image')) return 'fas fa-file-image text-info';
        return 'fas fa-file text-muted';
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Add CSS for upload-specific styles
$('<style>').text(`
    .auth-section, .leave-section, .upload-section {
        padding: 2rem 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
    }

    .auth-container, .leave-form-container, .upload-form-container {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--radius-lg);
        padding: 3rem;
        box-shadow: var(--shadow-lg);
    }

    .page-header {
        margin-bottom: 3rem;
    }

    .page-icon {
        width: 80px;
        height: 80px;
        background: var(--accent-gradient);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
        font-size: 2rem;
        color: white;
    }

    .page-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: white;
        margin-bottom: 1rem;
    }

    .page-subtitle {
        font-size: 1.25rem;
        color: rgba(255, 255, 255, 0.8);
    }

    .auth-header, .auth-icon {
        margin-bottom: 2rem;
    }

    .auth-icon {
        width: 80px;
        height: 80px;
        background: var(--accent-gradient);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
        font-size: 2rem;
        color: white;
    }

    .auth-title {
        font-size: 2rem;
        font-weight: 700;
        color: white;
        margin-bottom: 0.5rem;
    }

    .auth-subtitle {
        color: rgba(255, 255, 255, 0.8);
        font-size: 1.1rem;
    }

    .glass-input {
        background: rgba(255, 255, 255, 0.1) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        color: white !important;
        backdrop-filter: blur(10px);
    }

    .glass-input::placeholder {
        color: rgba(255, 255, 255, 0.6) !important;
    }

    .glass-input:focus {
        background: rgba(255, 255, 255, 0.15) !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
        box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.1) !important;
        color: white !important;
    }

    .form-floating > label {
        color: rgba(255, 255, 255, 0.8) !important;
    }

    .switch-text {
        color: rgba(255, 255, 255, 0.8);
    }

    .switch-link, .forgot-link {
        color: white !important;
        text-decoration: none;
        font-weight: 600;
    }

    .switch-link:hover, .forgot-link:hover {
        color: rgba(255, 255, 255, 0.8) !important;
        text-decoration: underline;
    }

    .leave-info-sidebar, .upload-sidebar {
        padding-left: 2rem;
    }

    .info-card {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--radius-md);
        padding: 1.5rem;
    }

    .info-title {
        color: white;
        font-weight: 600;
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }

    .duration-display {
        background: rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-sm);
        padding: 1rem;
        color: white;
        text-align: center;
        margin-bottom: 1rem;
    }

    .balance-item {
        display: flex;
        justify-content: between;
        align-items: center;
        padding: 0.5rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .balance-item:last-child {
        border-bottom: none;
    }

    .balance-type {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
    }

    .balance-value {
        color: white;
        font-weight: 600;
    }

    .guidelines-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .guidelines-list li {
        padding: 0.5rem 0;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
        position: relative;
        padding-left: 1.5rem;
    }

    .guidelines-list li:before {
        content: "•";
        color: var(--accent-gradient);
        position: absolute;
        left: 0;
        font-weight: bold;
    }

    .upload-area {
        border: 2px dashed rgba(255, 255, 255, 0.3);
        border-radius: var(--radius-md);
        padding: 3rem 2rem;
        text-align: center;
        transition: var(--transition-smooth);
        cursor: pointer;
    }

    .upload-area:hover, .upload-area.drag-over {
        border-color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.05);
    }

    .upload-icon {
        font-size: 3rem;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 1rem;
    }

    .upload-content h4 {
        color: white;
        margin-bottom: 0.5rem;
    }

    .upload-content p {
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 1rem;
    }

    .file-item {
        border-radius: var(--radius-sm);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .upload-progress .progress {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }

    .document-card {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--radius-md);
        padding: 1.5rem;
        transition: var(--transition-smooth);
        height: 100%;
        position: relative;
    }

    .document-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-lg);
    }

    .document-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        text-align: center;
    }

    .document-title {
        color: white;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .document-filename {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
    }

    .document-actions {
        position: absolute;
        top: 1rem;
        right: 1rem;
        display: none;
    }

    .document-card:hover .document-actions {
        display: block;
    }

    .storage-progress .progress {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
    }

    .storage-text {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
    }

    .recent-request-item, .recent-upload-item {
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: var(--radius-sm);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .recent-request-item h6, .recent-upload-item h6 {
        color: white;
        font-size: 0.9rem;
    }

    .library-controls {
        display: flex;
        align-items: center;
    }

    .library-controls .btn-group .btn {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: white;
    }

    .library-controls .btn.active {
        background: var(--accent-gradient);
        border-color: transparent;
    }

    .section-title {
        color: white;
        font-weight: 600;
        font-size: 1.5rem;
    }

    @media (max-width: 768px) {
        .leave-info-sidebar, .upload-sidebar {
            padding-left: 0;
            margin-top: 3rem;
        }
        
        .auth-container, .leave-form-container, .upload-form-container {
            padding: 2rem;
        }
        
        .page-title {
            font-size: 2rem;
        }
    }
`).appendTo('head');

// Initialize when DOM is ready
$(document).ready(() => {
    window.uploadManager = new UploadManager();
});

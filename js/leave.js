
/**
 * DEER Hub Leave Request System
 * Handles leave form validation, date calculations, and submission
 */

class LeaveManager {
    constructor() {
        this.leaveData = [];
        this.init();
    }

    async init() {
        // Check authentication
        if (!this.checkAuth()) {
            return;
        }

        await this.loadComponents();
        this.bindEvents();
        this.setMinDate();
        this.loadRecentRequests();
        this.loadLeaveBalance();
    }

    // Check if user is authenticated
    checkAuth() {
        const session = window.authManager ? window.authManager.getSession() : null;
        
        if (!session || !session.isLoggedIn) {
            if (window.authManager) {
                window.authManager.showToast('Please login to access leave request', 'warning');
            }
            window.location.href = 'auth.html';
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

            console.log('Leave page components loaded successfully');
        } catch (error) {
            console.error('Error loading components:', error);
        }
    }

    // Bind event listeners
    bindEvents() {
        // Date change handlers
        $('#startDate, #endDate').on('change', () => {
            this.calculateDuration();
            this.toggleEmergencyContact();
        });

        // Form submission
        $('#leaveForm').on('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Save draft
        $('#saveDraftBtn').on('click', () => {
            this.saveDraft();
        });

        // Character counter for reason
        $('#reason').on('input', () => {
            this.updateCharacterCount();
        });

        // File upload validation
        $('#supportingDocs').on('change', (e) => {
            this.validateFiles(e.target.files);
        });

        // Leave type change
        $('#leaveType').on('change', () => {
            this.updateFormBasedOnLeaveType();
        });
    }

    // Set minimum date to today
    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        $('#startDate').attr('min', today);
        $('#endDate').attr('min', today);
    }

    // Calculate duration between dates
    calculateDuration() {
        const startDate = new Date($('#startDate').val());
        const endDate = new Date($('#endDate').val());

        if (startDate && endDate && endDate >= startDate) {
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both dates

            $('#durationText').html(
                `<strong>${diffDays} day${diffDays !== 1 ? 's' : ''}</strong> 
                (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`
            );

            // Update end date minimum
            $('#endDate').attr('min', $('#startDate').val());
        } else if (endDate < startDate) {
            $('#durationText').html('<span class="text-warning">End date must be after start date</span>');
        } else {
            $('#durationText').text('Select dates to calculate duration');
        }
    }

    // Toggle emergency contact section for longer leaves
    toggleEmergencyContact() {
        const startDate = new Date($('#startDate').val());
        const endDate = new Date($('#endDate').val());

        if (startDate && endDate) {
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (diffDays > 5) {
                $('#emergencyContactSection').slideDown();
                $('#emergencyContact').attr('required', true);
            } else {
                $('#emergencyContactSection').slideUp();
                $('#emergencyContact').attr('required', false);
            }
        }
    }

    // Update character count for reason field
    updateCharacterCount() {
        const reason = $('#reason').val();
        const count = reason.length;
        const maxLength = 500;

        $('#reasonCount').text(count);

        if (count > maxLength) {
            $('#reason').val(reason.substring(0, maxLength));
            $('#reasonCount').text(maxLength);
        }

        // Color coding
        const percentage = (count / maxLength) * 100;
        if (percentage > 90) {
            $('#reasonCount').removeClass('text-muted text-warning').addClass('text-danger');
        } else if (percentage > 75) {
            $('#reasonCount').removeClass('text-muted text-danger').addClass('text-warning');
        } else {
            $('#reasonCount').removeClass('text-warning text-danger').addClass('text-muted');
        }
    }

    // Validate uploaded files
    validateFiles(files) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];

        let isValid = true;
        let errorMessages = [];

        Array.from(files).forEach(file => {
            if (file.size > maxSize) {
                errorMessages.push(`${file.name} exceeds 5MB limit`);
                isValid = false;
            }

            if (!allowedTypes.includes(file.type)) {
                errorMessages.push(`${file.name} has unsupported format`);
                isValid = false;
            }
        });

        if (!isValid && window.authManager) {
            window.authManager.showToast(errorMessages.join(', '), 'error');
            $('#supportingDocs').val('');
        }

        return isValid;
    }

    // Update form based on leave type
    updateFormBasedOnLeaveType() {
        const leaveType = $('#leaveType').val();
        
        // Set priority based on leave type
        if (leaveType === 'emergency' || leaveType === 'bereavement') {
            $('#priority').val('urgent');
        } else if (leaveType === 'sick') {
            $('#priority').val('high');
        } else {
            $('#priority').val('normal');
        }
    }

    // Handle form submission
    handleSubmit() {
        if (!this.validateForm()) {
            return;
        }

        const formData = this.gatherFormData();
        
        // Show loading state
        const submitBtn = $('#leaveForm button[type="submit"]');
        this.setButtonLoading(submitBtn, true);

        // Simulate API submission
        setTimeout(() => {
            this.submitLeaveRequest(formData);
            this.setButtonLoading(submitBtn, false);
        }, 2000);
    }

    // Validate form
    validateForm() {
        let isValid = true;
        
        // Check required fields
        const requiredFields = ['leaveType', 'startDate', 'endDate', 'reason', 'priority'];
        
        requiredFields.forEach(fieldId => {
            const $field = $(`#${fieldId}`);
            if (!$field.val().trim()) {
                $field.addClass('is-invalid');
                isValid = false;
            } else {
                $field.removeClass('is-invalid');
            }
        });

        // Validate date range
        const startDate = new Date($('#startDate').val());
        const endDate = new Date($('#endDate').val());
        
        if (endDate < startDate) {
            $('#endDate').addClass('is-invalid');
            if (window.authManager) {
                window.authManager.showToast('End date must be after start date', 'error');
            }
            isValid = false;
        }

        return isValid;
    }

    // Gather form data
    gatherFormData() {
        const session = window.authManager ? window.authManager.getSession() : {};
        
        return {
            id: Date.now(), // Simple ID generation
            employeeName: session.name || 'Current User',
            employeeEmail: session.email || '',
            leaveType: $('#leaveType').val(),
            priority: $('#priority').val(),
            startDate: $('#startDate').val(),
            endDate: $('#endDate').val(),
            reason: $('#reason').val(),
            emergencyContact: $('#emergencyContact').val(),
            supportingDocs: $('#supportingDocs')[0].files.length,
            status: 'pending',
            submissionDate: new Date().toISOString(),
            duration: this.calculateLeaveDays()
        };
    }

    // Calculate leave days
    calculateLeaveDays() {
        const startDate = new Date($('#startDate').val());
        const endDate = new Date($('#endDate').val());
        
        if (startDate && endDate) {
            const diffTime = Math.abs(endDate - startDate);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
        
        return 0;
    }

    // Submit leave request
    submitLeaveRequest(formData) {
        // Save to localStorage (simulate backend)
        let leaveRequests = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
        leaveRequests.unshift(formData);
        localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));

        if (window.authManager) {
            window.authManager.showToast('Leave request submitted successfully!', 'success');
        }

        // Reset form
        this.resetForm();
        
        // Reload recent requests
        this.loadRecentRequests();
    }

    // Save draft
    saveDraft() {
        const formData = this.gatherFormData();
        formData.status = 'draft';
        
        localStorage.setItem('leaveRequestDraft', JSON.stringify(formData));
        
        if (window.authManager) {
            window.authManager.showToast('Draft saved successfully!', 'info');
        }
    }

    // Reset form
    resetForm() {
        $('#leaveForm')[0].reset();
        $('#durationText').text('Select dates to calculate duration');
        $('#emergencyContactSection').hide();
        $('#reasonCount').text('0');
        $('.is-invalid').removeClass('is-invalid');
    }

    // Load recent requests
    loadRecentRequests() {
        const requests = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
        const recentContainer = $('#recentRequests');
        
        recentContainer.empty();
        
        if (requests.length === 0) {
            recentContainer.html('<p class="text-muted">No recent requests</p>');
            return;
        }

        requests.slice(0, 3).forEach(request => {
            const statusClass = {
                'pending': 'warning',
                'approved': 'success',
                'rejected': 'danger',
                'draft': 'secondary'
            }[request.status] || 'secondary';

            const requestItem = $(`
                <div class="recent-request-item mb-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">${request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} Leave</h6>
                            <small class="text-muted">${new Date(request.startDate).toLocaleDateString()} - ${new Date(request.endDate).toLocaleDateString()}</small>
                        </div>
                        <span class="badge bg-${statusClass}">${request.status}</span>
                    </div>
                    <div class="request-duration">
                        <small><i class="fas fa-calendar-day me-1"></i>${request.duration} day${request.duration !== 1 ? 's' : ''}</small>
                    </div>
                </div>
            `);
            
            recentContainer.append(requestItem);
        });
    }

    // Load leave balance (mock data)
    loadLeaveBalance() {
        // This would typically come from an API
        const balanceData = {
            annual: { used: 7, total: 25 },
            sick: { used: 3, total: 15 },
            personal: { used: 1, total: 6 }
        };

        $('.balance-item').each(function() {
            const $item = $(this);
            const type = $item.find('.balance-type').text().toLowerCase();
            
            if (type.includes('annual')) {
                const remaining = balanceData.annual.total - balanceData.annual.used;
                $item.find('.balance-value').text(`${remaining} days`);
            } else if (type.includes('sick')) {
                const remaining = balanceData.sick.total - balanceData.sick.used;
                $item.find('.balance-value').text(`${remaining} days`);
            } else if (type.includes('personal')) {
                const remaining = balanceData.personal.total - balanceData.personal.used;
                $item.find('.balance-value').text(`${remaining} days`);
            }
        });
    }

    // Set button loading state
    setButtonLoading($button, loading) {
        if (loading) {
            $button.prop('disabled', true);
            const originalText = $button.html();
            $button.data('original-text', originalText);
            $button.html('<i class="fas fa-spinner fa-spin me-2"></i>Submitting...');
        } else {
            $button.prop('disabled', false);
            $button.html($button.data('original-text'));
        }
    }
}

// Initialize when DOM is ready
$(document).ready(() => {
    window.leaveManager = new LeaveManager();
});

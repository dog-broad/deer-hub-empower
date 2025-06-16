
/**
 * DEER Hub Authentication Forms Handler
 * Handles form switching, validation, and submission
 */

class AuthFormsManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadComponents();
        this.bindEvents();
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

            console.log('Auth page components loaded successfully');
        } catch (error) {
            console.error('Error loading components:', error);
        }
    }

    // Bind event listeners
    bindEvents() {
        // Form switching
        $('#showRegister').on('click', (e) => {
            e.preventDefault();
            this.switchToRegister();
        });

        $('#showLogin').on('click', (e) => {
            e.preventDefault();
            this.switchToLogin();
        });

        // Form submissions
        $('#loginForm').on('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        $('#registerForm').on('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Password confirmation validation
        $('#confirmPassword').on('input', () => {
            this.validatePasswordMatch();
        });

        // Real-time email validation
        $('#registerEmail, #loginEmail').on('input', (e) => {
            this.validateEmail($(e.target));
        });
    }

    // Switch to registration form
    switchToRegister() {
        $('#login-form').fadeOut(300, () => {
            $('#register-form').fadeIn(300);
        });
    }

    // Switch to login form
    switchToLogin() {
        $('#register-form').fadeOut(300, () => {
            $('#login-form').fadeIn(300);
        });
    }

    // Handle login form submission
    handleLogin() {
        const email = $('#loginEmail').val().trim();
        const password = $('#loginPassword').val();

        // Validate inputs
        if (!this.validateForm($('#loginForm'))) {
            return;
        }

        // Show loading state
        const submitBtn = $('#loginForm button[type="submit"]');
        this.setButtonLoading(submitBtn, true);

        // Simulate API call with timeout
        setTimeout(() => {
            if (window.authManager && window.authManager.login(email, password)) {
                // Redirect to homepage or dashboard
                window.location.href = 'index.html';
            } else {
                this.setButtonLoading(submitBtn, false);
            }
        }, 1500);
    }

    // Handle registration form submission
    handleRegister() {
        const name = $('#registerName').val().trim();
        const email = $('#registerEmail').val().trim();
        const role = $('#registerRole').val();
        const password = $('#registerPassword').val();
        const confirmPassword = $('#confirmPassword').val();

        // Validate inputs
        if (!this.validateForm($('#registerForm'))) {
            return;
        }

        if (password !== confirmPassword) {
            this.showFieldError($('#confirmPassword'), 'Passwords do not match');
            return;
        }

        // Show loading state
        const submitBtn = $('#registerForm button[type="submit"]');
        this.setButtonLoading(submitBtn, true);

        // Simulate registration
        setTimeout(() => {
            // Create mock user session
            const sessionData = {
                isLoggedIn: true,
                name: name,
                role: role,
                email: email,
                loginTime: new Date().toISOString()
            };

            if (window.authManager) {
                window.authManager.saveSession(sessionData);
                window.authManager.showToast('Registration successful! Welcome to DEER Hub!', 'success');
                
                // Redirect to homepage
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.setButtonLoading(submitBtn, false);
                this.showError('Registration failed. Please try again.');
            }
        }, 2000);
    }

    // Validate form inputs
    validateForm(form) {
        let isValid = true;
        const inputs = form.find('input[required], select[required]');

        inputs.each((index, input) => {
            const $input = $(input);
            const value = $input.val().trim();

            if (!value) {
                this.showFieldError($input, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError($input);
            }
        });

        return isValid;
    }

    // Validate email format
    validateEmail($input) {
        const email = $input.val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email && !emailRegex.test(email)) {
            this.showFieldError($input, 'Please enter a valid email address');
            return false;
        } else {
            this.clearFieldError($input);
            return true;
        }
    }

    // Validate password match
    validatePasswordMatch() {
        const password = $('#registerPassword').val();
        const confirmPassword = $('#confirmPassword').val();

        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError($('#confirmPassword'), 'Passwords do not match');
            return false;
        } else {
            this.clearFieldError($('#confirmPassword'));
            return true;
        }
    }

    // Show field error
    showFieldError($input, message) {
        $input.addClass('is-invalid');
        $input.siblings('.invalid-feedback').text(message);
    }

    // Clear field error
    clearFieldError($input) {
        $input.removeClass('is-invalid');
    }

    // Set button loading state
    setButtonLoading($button, loading) {
        if (loading) {
            $button.prop('disabled', true);
            const originalText = $button.html();
            $button.data('original-text', originalText);
            $button.html('<i class="fas fa-spinner fa-spin me-2"></i>Processing...');
        } else {
            $button.prop('disabled', false);
            $button.html($button.data('original-text'));
        }
    }

    // Show general error message
    showError(message) {
        if (window.authManager) {
            window.authManager.showToast(message, 'error');
        } else {
            alert(message);
        }
    }
}

// Initialize when DOM is ready
$(document).ready(() => {
    window.authFormsManager = new AuthFormsManager();
});

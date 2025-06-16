
/**
 * DEER Hub Authentication System
 * Handles login, logout, and role-based UI management
 */

class AuthManager {
    constructor() {
        this.sessionKey = 'deerHubSession';
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.bindEvents();
    }

    // Check if user is authenticated and update UI accordingly
    checkAuthStatus() {
        const session = this.getSession();
        if (session && session.isLoggedIn) {
            this.updateUIForLoggedInUser(session);
        } else {
            this.updateUIForGuestUser();
        }
    }

    // Get current session from sessionStorage
    getSession() {
        try {
            const session = sessionStorage.getItem(this.sessionKey);
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Error reading session:', error);
            return null;
        }
    }

    // Save session to sessionStorage
    saveSession(sessionData) {
        try {
            sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
            return true;
        } catch (error) {
            console.error('Error saving session:', error);
            return false;
        }
    }

    // Clear session from sessionStorage
    clearSession() {
        try {
            sessionStorage.removeItem(this.sessionKey);
            return true;
        } catch (error) {
            console.error('Error clearing session:', error);
            return false;
        }
    }

    // Simulate login process
    login(email, password, role = 'employee') { 
        // Simulate authentication (replace with real API call)
        const mockUsers = {
            'employee@deer.com': { name: 'John Employee', role: 'employee' },
            'manager@deer.com': { name: 'Jane Manager', role: 'manager' },
            'admin@deer.com': { name: 'Admin User', role: 'admin' }
        };

        if (mockUsers[email] && password === 'password123') {
            const user = mockUsers[email];
            const sessionData = {
                isLoggedIn: true,
                name: user.name,
                role: user.role,
                email: email,
                loginTime: new Date().toISOString()
            };

            if (this.saveSession(sessionData)) {
                this.updateUIForLoggedInUser(sessionData);
                this.showToast('Login successful!', 'success');
                return true;
            }
        }
        
        this.showToast('Invalid credentials. Try employee@deer.com / manager@deer.com with password: password123', 'error');
        return false;
    }

    // Logout user
    logout() {
        if (this.clearSession()) {
            this.updateUIForGuestUser();
            this.showToast('Logged out successfully!', 'info');
            // Redirect to home page
            window.location.href = 'index.html';
            return true;
        }
        return false;
    }

    // Update UI for logged-in user
    updateUIForLoggedInUser(session) {
        // Update navbar
        $('#auth-nav-item').hide();
        $('#user-dropdown').show();
        $('#user-name').text(session.name);

        // Show/hide role-based navigation items
        $('#leave-nav-item').show();
        
        if (session.role === 'manager' || session.role === 'admin') {
            $('#upload-nav-item').show();
        } else {
            $('#upload-nav-item').hide();
        }

        // Update quick actions based on role
        this.updateQuickActions(session.role);

        // Update hero CTA
        $('#getStartedBtn').text('Go to Dashboard').off('click').on('click', () => {
            this.showToast('Dashboard feature coming soon!', 'info');
        });
    }

    // Update UI for guest user
    updateUIForGuestUser() {
        // Update navbar
        $('#auth-nav-item').show();
        $('#user-dropdown').hide();
        $('#leave-nav-item').hide();
        $('#upload-nav-item').hide();

        // Update hero CTA
        $('#getStartedBtn').text('Get Started').off('click').on('click', () => {
            this.redirectToAuth();
        });

        // Update quick actions for guest
        this.updateQuickActions('guest');
    }

    // Update quick actions based on user role
    updateQuickActions(role) {
        const quickActionsContainer = $('#quick-action-cards');
        quickActionsContainer.empty();

        let actions = [];

        if (role === 'guest') {
            actions = [
                {
                    icon: 'fas fa-sign-in-alt',
                    title: 'Login',
                    description: 'Access your account',
                    action: () => this.redirectToAuth()
                },
                {
                    icon: 'fas fa-info-circle',
                    title: 'Learn More',
                    description: 'Discover our features',
                    action: () => this.showToast('Feature overview coming soon!', 'info')
                }
            ];
        } else if (role === 'employee') {
            actions = [
                {
                    icon: 'fas fa-calendar-alt',
                    title: 'Request Leave',
                    description: 'Submit leave application',
                    action: () => this.redirectToLeave()
                },
                {
                    icon: 'fas fa-user',
                    title: 'My Profile',
                    description: 'View and edit profile',
                    action: () => this.showToast('Profile page coming soon!', 'info')
                },
                {
                    icon: 'fas fa-history',
                    title: 'Leave History',
                    description: 'View past requests',
                    action: () => this.showToast('Leave history coming soon!', 'info')
                }
            ];
        } else if (role === 'manager' || role === 'admin') {
            actions = [
                {
                    icon: 'fas fa-calendar-alt',
                    title: 'Request Leave',
                    description: 'Submit leave application',
                    action: () => this.redirectToLeave()
                },
                {
                    icon: 'fas fa-cloud-upload-alt',
                    title: 'Upload Documents',
                    description: 'Manage team resources',
                    action: () => this.redirectToUpload()
                },
                {
                    icon: 'fas fa-users',
                    title: 'Team Management',
                    description: 'Manage team members',
                    action: () => this.showToast('Team management coming soon!', 'info')
                },
                {
                    icon: 'fas fa-chart-bar',
                    title: 'Analytics',
                    description: 'View team insights',
                    action: () => this.showToast('Analytics dashboard coming soon!', 'info')
                }
            ];
        }

        actions.forEach(action => {
            const actionCard = $(`
                <div class="col-lg-3 col-md-6">
                    <div class="quick-action-card" role="button" tabindex="0">
                        <div class="quick-action-icon">
                            <i class="${action.icon}"></i>
                        </div>
                        <div class="quick-action-title">${action.title}</div>
                        <div class="quick-action-description">${action.description}</div>
                    </div>
                </div>
            `);
            
            actionCard.find('.quick-action-card').on('click', action.action);
            quickActionsContainer.append(actionCard);
        });
    }

    // Bind event listeners
    bindEvents() {
        // Auth link click
        $(document).on('click', '#auth-link', (e) => {
            e.preventDefault();
            this.redirectToAuth();
        });

        // Logout link click
        $(document).on('click', '#logout-link', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Leave link click
        $(document).on('click', '#leave-link', (e) => {
            e.preventDefault();
            if (this.requireAuth()) {
                this.redirectToLeave();
            }
        });

        // Upload link click
        $(document).on('click', '#upload-link', (e) => {
            e.preventDefault();
            if (this.requireManagerAuth()) {
                this.redirectToUpload();
            }
        });
    }

    // Check if user is authenticated, redirect to auth if not
    requireAuth() {
        const session = this.getSession();
        if (!session || !session.isLoggedIn) {
            this.showToast('Please login to access this feature', 'warning');
            this.redirectToAuth();
            return false;
        }
        return true;
    }

    // Check if user has manager role
    requireManagerAuth() {
        const session = this.getSession();
        if (!session || !session.isLoggedIn) {
            this.showToast('Please login to access this feature', 'warning');
            this.redirectToAuth();
            return false;
        }
        
        if (session.role !== 'manager' && session.role !== 'admin') {
            this.showToast('This feature is only available to managers', 'warning');
            return false;
        }
        
        return true;
    }

    // Navigation methods
    redirectToAuth() {
        window.location.href = 'auth.html';
    }

    redirectToLeave() {
        window.location.href = 'leave.html';
    }

    redirectToUpload() {
        window.location.href = 'upload.html';
    }

    // Toast notification system
    showToast(message, type = 'info') {
        // Remove existing toasts
        $('.toast-notification').remove();

        const toastColors = {
            success: 'linear-gradient(135deg, #4CAF50, #45a049)',
            error: 'linear-gradient(135deg, #f44336, #d32f2f)',
            warning: 'linear-gradient(135deg, #ff9800, #f57c00)',
            info: 'linear-gradient(135deg, #2196F3, #1976D2)'
        };

        const toast = $(`
            <div class="toast-notification" style="
                position: fixed;
                top: 100px;
                right: 20px;
                background: ${toastColors[type]};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.2);
                z-index: 10000;
                max-width: 350px;
                font-weight: 500;
                animation: slideInRight 0.3s ease-out;
            ">
                ${message}
            </div>
        `);

        $('body').append(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.css('animation', 'slideOutRight 0.3s ease-out');
            setTimeout(() => toast.remove(), 300);
        }, 4000);

        // Add click to dismiss
        toast.on('click', () => {
            toast.css('animation', 'slideOutRight 0.3s ease-out');
            setTimeout(() => toast.remove(), 300);
        });
    }
}

// Add toast animations to CSS
$('<style>').text(`
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`).appendTo('head');

// Initialize auth manager when DOM is ready
$(document).ready(() => {
    window.authManager = new AuthManager();
});

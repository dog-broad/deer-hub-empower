
/**
 * DEER Hub Main Application Script
 * Handles component loading, feature cards, and general UI interactions
 */

class DeerHubApp {
    constructor() {
        this.features = [
            {
                icon: 'fas fa-calendar-check',
                title: 'Leave Management',
                description: 'Submit and track leave requests with an intuitive calendar interface. Get instant approvals and maintain perfect attendance records.',
                link: '#',
                category: 'hr'
            },
            {
                icon: 'fas fa-cloud-upload-alt',
                title: 'Document Hub',
                description: 'Centralized document management system for team resources, policies, and shared files with version control.',
                link: '#',
                category: 'productivity'
            },
            {
                icon: 'fas fa-users',
                title: 'Team Directory',
                description: 'Find and connect with colleagues across departments. View contact information, roles, and organizational charts.',
                link: '#',
                category: 'social'
            },
            {
                icon: 'fas fa-chart-bar',
                title: 'Analytics Dashboard',
                description: 'Comprehensive insights into team performance, engagement metrics, and productivity trends with interactive charts.',
                link: '#',
                category: 'analytics'
            },
            {
                icon: 'fas fa-bell',
                title: 'Smart Notifications',
                description: 'Stay updated with personalized notifications for approvals, deadlines, announcements, and team activities.',
                link: '#',
                category: 'communication'
            },
            {
                icon: 'fas fa-mobile-alt',
                title: 'Mobile Ready',
                description: 'Access all features on-the-go with our responsive design that works seamlessly across all devices.',
                link: '#',
                category: 'technology'
            }
        ];

        this.init();
    }

    async init() {
        try {
            await this.loadComponents();
            this.renderFeatureCards();
            this.bindEvents();
            this.initializeAnimations();
            console.log('DEER Hub application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
        }
    }

    // Load navbar and footer components
    async loadComponents() {
        try {
            // Load navbar
            await new Promise((resolve, reject) => {
                $('#navbar-container').load('components/navbar.html', (response, status) => {
                    if (status === 'error') {
                        reject(new Error('Failed to load navbar'));
                    } else {
                        resolve();
                    }
                });
            });

            // Load footer
            await new Promise((resolve, reject) => {
                $('#footer-container').load('components/footer.html', (response, status) => {
                    if (status === 'error') {
                        reject(new Error('Failed to load footer'));
                    } else {
                        resolve();
                    }
                });
            });

            console.log('Components loaded successfully');
        } catch (error) {
            console.error('Error loading components:', error);
            throw error;
        }
    }

    // Render feature cards dynamically
    renderFeatureCards() {
        const featuresContainer = $('#feature-cards');
        featuresContainer.empty();

        this.features.forEach((feature, index) => {
            const featureCard = $(`
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="feature-card h-100" data-category="${feature.category}" data-aos="fade-up" data-aos-delay="${index * 100}">
                        <div class="feature-icon">
                            <i class="${feature.icon}"></i>
                        </div>
                        <h4 class="feature-title">${feature.title}</h4>
                        <p class="feature-description">${feature.description}</p>
                        <div class="feature-actions mt-auto">
                            <button class="btn glass-button btn-sm feature-learn-more" data-feature="${feature.title}">
                                Learn More <i class="fas fa-arrow-right ms-1"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `);

            featuresContainer.append(featureCard);
        });

        console.log(`Rendered ${this.features.length} feature cards`);
    }

    // Bind event listeners
    bindEvents() {
        // Feature card hover effects
        $(document).on('mouseenter', '.feature-card', function() {
            $(this).find('.feature-icon').addClass('pulse-animation');
        });

        $(document).on('mouseleave', '.feature-card', function() {
            $(this).find('.feature-icon').removeClass('pulse-animation');
        });

        // Feature learn more buttons
        $(document).on('click', '.feature-learn-more', (e) => {
            const featureName = $(e.currentTarget).data('feature');
            this.showFeatureDetail(featureName);
        });

        // Smooth scrolling for internal links
        $(document).on('click', 'a[href^="#"]', function(e) {
            const target = $($(this).attr('href'));
            if (target.length) {
                e.preventDefault();
                $('html, body').animate({
                    scrollTop: target.offset().top - 100
                }, 800, 'easeInOutCubic');
            }
        });

        // Navbar scroll effect
        $(window).on('scroll', this.handleNavbarScroll);

        // Window resize handler
        $(window).on('resize', this.handleWindowResize);

        // Parallax effect for hero section
        $(window).on('scroll', this.handleParallaxEffect);

        console.log('Event listeners bound successfully');
    }

    // Handle navbar scroll effect
    handleNavbarScroll() {
        const navbar = $('.glass-nav');
        const scrollTop = $(window).scrollTop();

        if (scrollTop > 50) {
            navbar.addClass('scrolled');
            navbar.css({
                'background': 'rgba(255, 255, 255, 0.95)',
                'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.1)'
            });
        } else {
            navbar.removeClass('scrolled');
            navbar.css({
                'background': 'rgba(255, 255, 255, 0.1)',
                'box-shadow': 'none'
            });
        }
    }

    // Handle parallax effect
    handleParallaxEffect() {
        const scrollTop = $(window).scrollTop();
        const heroElements = $('.floating-card');
        
        heroElements.each(function(index) {
            const speed = 0.1 + (index * 0.05);
            const yPos = -(scrollTop * speed);
            $(this).css('transform', `translateY(${yPos}px)`);
        });
    }

    // Handle window resize
    handleWindowResize() {
        // Recalculate any size-dependent elements
        const windowWidth = $(window).width();
        
        if (windowWidth < 768) {
            $('.hero-actions').addClass('flex-column');
        } else {
            $('.hero-actions').removeClass('flex-column');
        }
    }

    // Show feature detail modal
    showFeatureDetail(featureName) {
        const feature = this.features.find(f => f.title === featureName);
        if (!feature) return;

        // Remove existing modal
        $('.feature-modal').remove();

        const modal = $(`
            <div class="feature-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10002;
                animation: fadeIn 0.3s ease-out;
            ">
                <div class="feature-modal-content" style="
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 24px;
                    padding: 3rem;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                    color: #2c3e50;
                    animation: slideInUp 0.4s ease-out;
                ">
                    <button class="feature-modal-close" style="
                        position: absolute;
                        top: 1rem;
                        right: 1rem;
                        background: none;
                        border: none;
                        font-size: 2rem;
                        cursor: pointer;
                        color: #666;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        transition: all 0.3s ease;
                    ">×</button>
                    
                    <div class="feature-modal-header mb-4">
                        <div class="feature-modal-icon" style="
                            width: 80px;
                            height: 80px;
                            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 1.5rem;
                            font-size: 2rem;
                            color: white;
                        ">
                            <i class="${feature.icon}"></i>
                        </div>
                        <h3 class="text-center mb-3" style="color: #2c3e50; font-weight: 700;">
                            ${feature.title}
                        </h3>
                    </div>
                    
                    <div class="feature-modal-body">
                        <p style="font-size: 1.1rem; line-height: 1.7; margin-bottom: 2rem; color: #555;">
                            ${feature.description}
                        </p>
                        
                        <div class="feature-benefits mb-4">
                            <h5 style="color: #2c3e50; margin-bottom: 1rem;">Key Benefits:</h5>
                            <ul style="list-style: none; padding: 0;">
                                ${this.getFeatureBenefits(feature.category).map(benefit => 
                                    `<li style="padding: 0.5rem 0; display: flex; align-items: center;">
                                        <i class="fas fa-check-circle" style="color: #4CAF50; margin-right: 0.75rem;"></i>
                                        ${benefit}
                                    </li>`
                                ).join('')}
                            </ul>
                        </div>
                        
                        <div class="text-center">
                            <button class="btn btn-primary-custom btn-lg" onclick="window.authManager.showToast('Feature coming soon!', 'info'); $('.feature-modal').remove();">
                                <i class="fas fa-rocket me-2"></i>
                                Try It Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        $('body').append(modal);

        // Close handlers
        modal.find('.feature-modal-close').on('click', () => {
            this.closeFeatureModal();
        });

        modal.on('click', (e) => {
            if (e.target === modal[0]) {
                this.closeFeatureModal();
            }
        });

        // Close on escape
        $(document).on('keydown.feature-modal', (e) => {
            if (e.key === 'Escape') {
                this.closeFeatureModal();
            }
        });
    }

    // Close feature modal
    closeFeatureModal() {
        $('.feature-modal').css('animation', 'fadeOut 0.3s ease-out');
        setTimeout(() => {
            $('.feature-modal').remove();
            $(document).off('keydown.feature-modal');
        }, 300);
    }

    // Get feature benefits based on category
    getFeatureBenefits(category) {
        const benefits = {
            hr: [
                'Streamlined approval workflow',
                'Real-time status tracking',
                'Calendar integration',
                'Automated notifications'
            ],
            productivity: [
                'Version control system',
                'Collaborative editing',
                'Advanced search capabilities',
                'Cloud synchronization'
            ],
            social: [
                'Organizational chart view',
                'Contact information management',
                'Skills and expertise tracking',
                'Inter-department communication'
            ],
            analytics: [
                'Real-time performance metrics',
                'Customizable dashboards',
                'Export capabilities',
                'Predictive insights'
            ],
            communication: [
                'Personalized notification preferences',
                'Multi-channel delivery',
                'Priority-based filtering',
                'Integration with external tools'
            ],
            technology: [
                'Cross-platform compatibility',
                'Offline functionality',
                'Progressive web app features',
                'Native mobile experience'
            ]
        };

        return benefits[category] || ['Enhanced productivity', 'Improved user experience', 'Seamless integration', 'Advanced features'];
    }

    // Initialize scroll animations and other effects
    initializeAnimations() {
        // Add intersection observer for fade-in animations
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fade-in');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px'
            });

            // Observe feature cards and other elements
            $('.feature-card, .quick-action-card').each(function() {
                observer.observe(this);
            });
        }

        // Add custom CSS for animations
        $('<style>').text(`
            .animate-fade-in {
                animation: fadeInUp 0.8s ease-out forwards;
            }
            
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .feature-modal-close:hover {
                background: rgba(0, 0, 0, 0.1) !important;
                transform: scale(1.1);
            }
            
            .feature-actions {
                padding-top: 1rem;
                margin-top: auto;
            }
            
            .glass-button {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .glass-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
        `).appendTo('head');

        console.log('Animations initialized');
    }

    // Utility method to show loading spinner
    showLoading(element) {
        const spinner = $(`
            <div class="loading-spinner" style="
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top: 3px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
            </div>
        `);

        $(element).html(spinner);

        // Add spin animation if not already added
        if (!$('#spin-animation').length) {
            $('<style id="spin-animation">').text(`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `).appendTo('head');
        }
    }

    // Utility method to hide loading spinner
    hideLoading(element) {
        $(element).find('.loading-spinner').remove();
    }
}

// Initialize app when DOM is ready
$(document).ready(() => {
    window.deerHubApp = new DeerHubApp();
});

// Add smooth scrolling easing
$.easing.easeInOutCubic = function (x, t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t*t + b;
    return c/2*((t-=2)*t*t + 2) + b;
};

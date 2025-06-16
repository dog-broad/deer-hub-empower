
/**
 * DEER Hub News Ticker System
 * Handles loading and displaying announcements
 */

class TickerManager {
    constructor() {
        this.announcements = [];
        this.currentIndex = 0;
        this.intervalId = null;
        this.tickerSpeed = 4000; // 4 seconds per message
        this.init();
    }

    async init() {
        await this.loadAnnouncements();
        this.startTicker();
        this.bindEvents();
    }

    // Load announcements from JSON file
    async loadAnnouncements() {
        try {
            // For now, use static data. In production, this would load from data/announcements.json
            this.announcements = [
                {
                    msg: "🎉 Welcome to the new DEER Hub platform! Explore all the enhanced features.",
                    date: "2025-06-16",
                    priority: "high"
                },
                {
                    msg: "📅 Monthly team meeting scheduled for Friday at 3:00 PM in Conference Room A.",
                    date: "2025-06-15",
                    priority: "medium"
                },
                {
                    msg: "🏖️ Summer vacation policy updates are now available in the HR portal.",
                    date: "2025-06-14",
                    priority: "medium"
                },
                {
                    msg: "🔒 Security reminder: Please update your passwords and enable 2FA.",
                    date: "2025-06-13",
                    priority: "high"
                },
                {
                    msg: "🎯 Q2 performance reviews begin next week. Check your calendar for scheduled meetings.",
                    date: "2025-06-12",
                    priority: "medium"
                },
                {
                    msg: "☕ New coffee machine installed in the break room. Enjoy premium blends!",
                    date: "2025-06-11",
                    priority: "low"
                },
                {
                    msg: "📚 Professional development budget increased by 25% for all employees.",
                    date: "2025-06-10",
                    priority: "high"
                }
            ];

            // Sort by priority and date
            this.announcements.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                }
                return new Date(b.date) - new Date(a.date);
            });

            console.log('Announcements loaded:', this.announcements.length);
        } catch (error) {
            console.error('Error loading announcements:', error);
            // Fallback message
            this.announcements = [{
                msg: "Welcome to DEER Hub - Your employee engagement platform",
                date: new Date().toISOString().split('T')[0],
                priority: "medium"
            }];
        }
    }

    // Start the ticker animation
    startTicker() {
        if (this.announcements.length === 0) return;

        const tickerContainer = $('#ticker-messages');
        tickerContainer.empty();

        // Create ticker content
        this.announcements.forEach((announcement, index) => {
            const messageElement = $(`
                <div class="ticker-message" data-index="${index}">
                    <span class="ticker-date">[${this.formatDate(announcement.date)}]</span>
                    <span class="ticker-text">${announcement.msg}</span>
                </div>
            `);
            tickerContainer.append(messageElement);
        });

        // Start continuous scrolling
        this.startContinuousScroll();
    }

    // Start continuous horizontal scrolling
    startContinuousScroll() {
        const tickerContainer = $('#ticker-messages');
        const tickerContent = $('.ticker-content');
        
        // Clone messages for seamless loop
        const originalMessages = tickerContainer.html();
        tickerContainer.html(originalMessages + originalMessages);

        // Calculate total width
        let totalWidth = 0;
        tickerContainer.find('.ticker-message').each(function() {
            totalWidth += $(this).outerWidth(true);
        });

        // Set initial position
        let currentPosition = tickerContent.width();
        tickerContainer.css('transform', `translateX(${currentPosition}px)`);

        // Animate scrolling
        const scroll = () => {
            currentPosition -= 1; // Adjust speed here (higher = faster)
            
            if (currentPosition <= -totalWidth / 2) {
                currentPosition = tickerContent.width();
            }
            
            tickerContainer.css('transform', `translateX(${currentPosition}px)`);
            requestAnimationFrame(scroll);
        };

        requestAnimationFrame(scroll);
    }

    // Bind event listeners
    bindEvents() {
        const tickerContainer = $('.ticker-content');
        
        // Pause on hover
        tickerContainer.on('mouseenter', () => {
            $('#ticker-messages').css('animation-play-state', 'paused');
        });

        // Resume on mouse leave
        tickerContainer.on('mouseleave', () => {
            $('#ticker-messages').css('animation-play-state', 'running');
        });

        // Click to show full message
        $(document).on('click', '.ticker-message', (e) => {
            const index = $(e.currentTarget).data('index');
            const announcement = this.announcements[index];
            if (announcement) {
                this.showAnnouncementDetail(announcement);
            }
        });
    }

    // Show announcement detail in modal-like display
    showAnnouncementDetail(announcement) {
        // Remove existing detail if any
        $('.announcement-detail').remove();

        const detail = $(`
            <div class="announcement-detail" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
                z-index: 10001;
                color: #2c3e50;
                animation: fadeInScale 0.3s ease-out;
            ">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <h5 class="mb-0">📢 Announcement</h5>
                    <button class="btn-close-detail" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: #666;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 50%;
                        transition: all 0.2s ease;
                    " title="Close">×</button>
                </div>
                <div class="announcement-meta mb-3" style="
                    padding: 0.5rem 1rem;
                    background: rgba(102, 126, 234, 0.1);
                    border-radius: 8px;
                    font-size: 0.9rem;
                    color: #667eea;
                ">
                    <i class="fas fa-calendar me-2"></i>
                    ${this.formatDate(announcement.date)}
                    <span class="priority-badge ms-2 px-2 py-1 rounded" style="
                        background: ${this.getPriorityColor(announcement.priority)};
                        color: white;
                        font-size: 0.8rem;
                        text-transform: uppercase;
                    ">${announcement.priority}</span>
                </div>
                <div class="announcement-text" style="
                    font-size: 1.1rem;
                    line-height: 1.6;
                    color: #2c3e50;
                ">${announcement.msg}</div>
            </div>
        `);

        // Add backdrop
        const backdrop = $(`
            <div class="announcement-backdrop" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                animation: fadeIn 0.3s ease-out;
            "></div>
        `);

        $('body').append(backdrop).append(detail);

        // Close handlers
        detail.find('.btn-close-detail, .announcement-backdrop').on('click', () => {
            this.closeAnnouncementDetail();
        });

        backdrop.on('click', () => {
            this.closeAnnouncementDetail();
        });

        // Close on escape key
        $(document).on('keydown.announcement', (e) => {
            if (e.key === 'Escape') {
                this.closeAnnouncementDetail();
            }
        });
    }

    // Close announcement detail
    closeAnnouncementDetail() {
        $('.announcement-detail').css('animation', 'fadeOutScale 0.3s ease-out');
        $('.announcement-backdrop').css('animation', 'fadeOut 0.3s ease-out');
        
        setTimeout(() => {
            $('.announcement-detail, .announcement-backdrop').remove();
            $(document).off('keydown.announcement');
        }, 300);
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit'
        });
    }

    // Get priority color
    getPriorityColor(priority) {
        const colors = {
            high: '#f44336',
            medium: '#ff9800', 
            low: '#4CAF50'
        };
        return colors[priority] || colors.medium;
    }

    // Add new announcement (for future API integration)
    addAnnouncement(announcement) {
        this.announcements.unshift(announcement);
        this.startTicker(); // Restart ticker with new content
    }

    // Clear all announcements
    clearAnnouncements() {
        this.announcements = [];
        $('#ticker-messages').empty();
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}

// Add CSS animations
$('<style>').text(`
    .ticker-message {
        cursor: pointer;
        transition: all 0.3s ease;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
    }
    
    .ticker-message:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
    }
    
    .ticker-date {
        font-weight: 600;
        margin-right: 0.5rem;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
    }
    
    .ticker-text {
        font-weight: 500;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes fadeInScale {
        from { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.9);
        }
        to { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1);
        }
    }
    
    @keyframes fadeOutScale {
        from { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1);
        }
        to { 
            opacity: 0; 
            transform: translate(-50%, -50%) scale(0.9);
        }
    }
    
    .btn-close-detail:hover {
        background: rgba(0, 0, 0, 0.1) !important;
        transform: scale(1.1);
    }
`).appendTo('head');

// Initialize ticker when DOM is ready
$(document).ready(() => {
    window.tickerManager = new TickerManager();
});

class App {
    constructor() {
        this.currentPage = 'dashboard';
        this.modules = {};
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;

        console.log(`%c🛡️ ${APP_CONFIG.name} v${APP_CONFIG.version}`, 
            'color: #2563eb; font-size: 20px; font-weight: bold;');
        console.log('%cProfessional Linux Security Defense System', 
            'color: #64748b; font-size: 12px;');

        this.initializeModules();
        this.setupEventListeners();
        this.showPage('dashboard');
        
        this.isInitialized = true;
        console.log('✅ Application initialized successfully');
    }

    initializeModules() {
        try {
            this.modules.dashboard = new DashboardModule();
            firewallModule = new FirewallModule();
            usersModule = new UsersModule();
            servicesModule = new ServicesModule();
            logsModule = new LogsModule();
            intrusionModule = new IntrusionModule();
            vulnerabilityModule = new VulnerabilityModule();
            networkModule = new NetworkModule();
            backupModule = new BackupModule();
            settingsModule = new SettingsModule();

            console.log('📦 All modules initialized:', Object.keys(this.modules).length);
        } catch (error) {
            console.error('❌ Error initializing modules:', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal-overlay');
                modals.forEach(modal => modal.remove());
            }
        });

        window.addEventListener('beforeunload', () => {
            this.destroy();
        });

        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.querySelector('.sidebar-overlay');

        if (mobileMenuBtn && sidebar && sidebarOverlay) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                sidebarOverlay.classList.toggle('active');
            });

            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('active');
            });
        }

        window.addEventListener('resize', Utils.debounce(() => {
            if (window.innerWidth > 992) {
                sidebar?.classList.remove('open');
                sidebarOverlay?.classList.remove('active');
            }
        }, 250));
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        const targetPage = document.getElementById(`page-${pageId}`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageId) {
                item.classList.add('active');
            }
        });

        this.currentPage = pageId;
        
        eventBus.emit('page:change', { page: pageId });
        
        if (window.innerWidth <= 992) {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            sidebar?.classList.remove('open');
            overlay?.classList.remove('active');
        }

        history.pushState({ page: pageId }, '', `#${pageId}`);
    }

    destroy() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        console.log('🧹 Application cleanup completed');
    }
}

function showPage(pageId) {
    if (window.app) {
        window.app.showPage(pageId);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();

    const hash = window.location.hash.slice(1);
    if (hash && ['dashboard', 'firewall', 'users', 'services', 'logs', 'intrusion', 'vulnerability', 'network', 'backup', 'settings'].includes(hash)) {
        showPage(hash);
    }

    window.addEventListener('popstate', (event) => {
        if (event.state?.page) {
            showPage(event.state.page);
        }
    });
});

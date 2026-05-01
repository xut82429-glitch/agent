const APP_CONFIG = {
    version: '2.0.0',
    name: 'Linux安全防控系统',
    nameEn: 'Linux Security Defense System',
    
    theme: {
        primary: '#2563eb',
        primaryDark: '#1d4ed8',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        bgDark: '#0f172a',
        bgCard: '#1e293b',
        bgHover: '#334155',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8',
        border: '#475569'
    },
    
    refreshInterval: {
        dashboard: 5000,
        network: 3000,
        logs: 2000,
        intrusion: 1000
    },
    
    security: {
        maxScore: 100,
        warningThreshold: 70,
        criticalThreshold: 50
    },
    
    pagination: {
        defaultPageSize: 10,
        pageSizeOptions: [10, 20, 50, 100]
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}

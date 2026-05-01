const i18n = {
    currentLocale: 'zh-CN',
    locales: {
        'zh-CN': {
            appName: 'Linux安全防控系统',
            appSubtitle: 'Professional Security Defense System',
            
            // 导航
            nav: {
                dashboard: '仪表盘',
                firewall: '防火墙管理',
                users: '用户权限',
                services: '服务监控',
                logs: '日志审计',
                intrusion: '入侵检测',
                vulnerability: '漏洞扫描',
                network: '网络监控',
                backup: '备份恢复',
                settings: '安全设置',
                docker: '容器管理',
                kubernetes: 'K8s集群',
                cloud: '云平台'
            },
            
            // 通用
            common: {
                loading: '加载中...',
                error: '错误',
                success: '成功',
                warning: '警告',
                info: '信息',
                confirm: '确认',
                cancel: '取消',
                save: '保存',
                delete: '删除',
                edit: '编辑',
                add: '添加',
                search: '搜索',
                refresh: '刷新',
                export: '导出',
                import: '导入',
                noData: '暂无数据',
                total: '总计',
                actions: '操作',
                status: '状态',
                all: '全部'
            },
            
            // 状态
            status: {
                online: '在线',
                offline: '离线',
                running: '运行中',
                stopped: '已停止',
                active: '活跃',
                inactive: '非活跃',
                enabled: '启用',
                disabled: '禁用',
                locked: '已锁定',
                unlocked: '未锁定',
                normal: '正常',
                warning: '警告',
                critical: '严重',
                resolved: '已处理',
                pending: '待处理'
            },
            
            // 仪表盘
            dashboard: {
                title: '安全仪表盘',
                securityScore: '安全评分',
                cpuUsage: 'CPU使用率',
                memoryUsage: '内存使用',
                diskUsage: '磁盘使用',
                networkTraffic: '网络流量',
                uploadSpeed: '上传速度',
                downloadSpeed: '下载速度',
                recentEvents: '最近安全事件',
                quickActions: '快速操作',
                systemStatus: '系统状态'
            },
            
            // 防火墙
            firewall: {
                title: '防火墙管理',
                totalRules: '总规则数',
                activeRules: '启用规则',
                blockedConnections: '已阻止连接',
                todayAttacks: '今日攻击数',
                addRule: '添加规则',
                editRule: '编辑规则',
                deleteRule: '删除规则',
                protocol: '协议',
                sourceAddress: '源地址',
                targetPort: '目标端口',
                action: '动作',
                accept: '允许(ACCEPT)',
                drop: '丢弃(DROP)',
                reject: '拒绝(REJECT)'
            },
            
            // 消息提示
            messages: {
                saveSuccess: '保存成功！',
                deleteSuccess: '删除成功！',
                copySuccess: '复制到剪贴板！',
                operationSuccess: '操作成功！',
                confirmDelete: '确定要删除吗？此操作不可撤销。',
                networkError: '网络连接失败，请检查网络设置',
                permissionDenied: '权限不足，无法执行此操作',
                dataLoadError: '数据加载失败，请重试'
            },
            
            // 时间格式
            time: {
                justNow: '刚刚',
                minutesAgo: '{n}分钟前',
                hoursAgo: '{n}小时前',
                daysAgo: '{n}天前',
                ago: '前'
            }
        },
        
        'en-US': {
            appName: 'Linux Security System',
            appSubtitle: 'Professional Security Defense System',
            
            nav: {
                dashboard: 'Dashboard',
                firewall: 'Firewall',
                users: 'Users & Permissions',
                services: 'Services Monitor',
                logs: 'Log Audit',
                intrusion: 'Intrusion Detection',
                vulnerability: 'Vulnerability Scanner',
                network: 'Network Monitor',
                backup: 'Backup & Recovery',
                settings: 'Security Settings',
                docker: 'Docker Containers',
                kubernetes: 'Kubernetes',
                cloud: 'Cloud Platform'
            },
            
            common: {
                loading: 'Loading...',
                error: 'Error',
                success: 'Success',
                warning: 'Warning',
                info: 'Info',
                confirm: 'Confirm',
                cancel: 'Cancel',
                save: 'Save',
                delete: 'Delete',
                edit: 'Edit',
                add: 'Add',
                search: 'Search',
                refresh: 'Refresh',
                export: 'Export',
                import: 'Import',
                noData: 'No data available',
                total: 'Total',
                actions: 'Actions',
                status: 'Status',
                all: 'All'
            },
            
            status: {
                online: 'Online',
                offline: 'Offline',
                running: 'Running',
                stopped: 'Stopped',
                active: 'Active',
                inactive: 'Inactive',
                enabled: 'Enabled',
                disabled: 'Disabled',
                locked: 'Locked',
                unlocked: 'Unlocked',
                normal: 'Normal',
                warning: 'Warning',
                critical: 'Critical',
                resolved: 'Resolved',
                pending: 'Pending'
            },
            
            dashboard: {
                title: 'Security Dashboard',
                securityScore: 'Security Score',
                cpuUsage: 'CPU Usage',
                memoryUsage: 'Memory Usage',
                diskUsage: 'Disk Usage',
                networkTraffic: 'Network Traffic',
                uploadSpeed: 'Upload Speed',
                downloadSpeed: 'Download Speed',
                recentEvents: 'Recent Security Events',
                quickActions: 'Quick Actions',
                systemStatus: 'System Status'
            },
            
            firewall: {
                title: 'Firewall Management',
                totalRules: 'Total Rules',
                activeRules: 'Active Rules',
                blockedConnections: 'Blocked Connections',
                todayAttacks: "Today's Attacks",
                addRule: 'Add Rule',
                editRule: 'Edit Rule',
                deleteRule: 'Delete Rule',
                protocol: 'Protocol',
                sourceAddress: 'Source Address',
                targetPort: 'Target Port',
                action: 'Action',
                accept: 'Accept',
                drop: 'Drop',
                reject: 'Reject'
            },
            
            messages: {
                saveSuccess: 'Saved successfully!',
                deleteSuccess: 'Deleted successfully!',
                copySuccess: 'Copied to clipboard!',
                operationSuccess: 'Operation successful!',
                confirmDelete: 'Are you sure you want to delete? This cannot be undone.',
                networkError: 'Network connection failed. Please check your network.',
                permissionDenied: 'Permission denied. Cannot perform this action.',
                dataLoadError: 'Failed to load data. Please try again.'
            },
            
            time: {
                justNow: 'Just now',
                minutesAgo: '{n} min ago',
                hoursAgo: '{n} hours ago',
                daysAgo: '{n} days ago',
                ago: 'ago'
            }
        }
    },

    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.locales[this.currentLocale];
        
        for (const k of keys) {
            value = value?.[k];
            if (!value) break;
        }

        if (!value) {
            console.warn(`[i18n] Missing translation for key: ${key}`);
            return key;
        }

        return Object.entries(params).reduce(
            (str, [k, v]) => str.replace(`{${k}}`, v),
            value
        );
    },

    setLocale(locale) {
        if (this.locales[locale]) {
            this.currentLocale = locale;
            localStorage.setItem('locale', locale);
            eventBus.emit('locale:changed', { locale });
        }
    },

    getLocale() {
        return this.currentLocale;
    },

    getAvailableLocales() {
        return Object.keys(this.locales);
    },

    init() {
        const savedLocale = localStorage.getItem('locale');
        if (savedLocale && this.locales[savedLocale]) {
            this.currentLocale = savedLocale;
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18n;
}

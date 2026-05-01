class SettingsModule {
    constructor() {
        this.settings = {};
        this.init();
    }

    init() {
        this.render();
        this.loadSettings();
        eventBus.on('settings:refresh', () => this.loadSettings());
    }

    render() {
        const container = document.getElementById('page-settings');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>⚙️ 安全设置</h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="settingsModule.saveAllSettings()">💾 保存所有设置</button>
                    <button class="btn btn-outline" onclick="settingsModule.resetToDefault()">↩️ 重置默认</button>
                </div>
            </div>

            <div class="tabs" style="margin-bottom: 24px;">
                <button class="tab active" onclick="settingsModule.switchTab('password', this)">密码策略</button>
                <button class="tab" onclick="settingsModule.switchTab('ssh', this)">SSH配置</button>
                <button class="tab" onclick="settingsModule.switchTab('firewall', this)">防火墙策略</button>
                <button class="tab" onclick="settingsModule.switchTab('system', this)">系统加固</button>
                <button class="tab" onclick="settingsModule.switchTab('notification', this)">通知设置</button>
            </div>

            <div id="settingsContent">
                <!-- Password Policy Tab -->
                <div id="tab-password" class="settings-tab">
                    <div class="grid grid-2">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">🔐 密码复杂度要求</h3>
                            </div>
                            <div class="form-group">
                                <label class="form-label">最小密码长度</label>
                                <input type="number" class="form-input" id="minPasswordLength" value="12" min="6" max="32">
                            </div>
                            <div class="form-group">
                                <label class="form-label">密码过期天数</label>
                                <input type="number" class="form-input" id="passwordExpiryDays" value="90" min="1" max="365">
                            </div>
                            <div class="form-group">
                                <label class="form-label">密码历史保留数量</label>
                                <input type="number" class="form-input" id="passwordHistoryCount" value="5" min="0" max="24">
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="requireUppercase" checked style="width: 18px; height: 18px;">
                                    <span>要求包含大写字母</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="requireLowercase" checked style="width: 18px; height: 18px;">
                                    <span>要求包含小写字母</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="requireNumbers" checked style="width: 18px; height: 18px;">
                                    <span>要求包含数字</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="requireSpecialChars" checked style="width: 18px; height: 18px;">
                                    <span>要求包含特殊字符 (!@#$%^&*)</span>
                                </label>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">🔒 账户锁定策略</h3>
                            </div>
                            <div class="form-group">
                                <label class="form-label">登录失败次数阈值</label>
                                <input type="number" class="form-input" id="maxLoginAttempts" value="5" min="1" max="20">
                                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">超过此次数将锁定账户</div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">账户锁定时间 (分钟)</label>
                                <input type="number" class="form-input" id="lockoutDuration" value="30" min="1" max="1440">
                            </div>
                            <div class="form-group">
                                <label class="form-label">管理员账户解锁方式</label>
                                <select class="form-select" id="adminUnlockMethod">
                                    <option value="auto">自动解锁 (超时后)</option>
                                    <option value="manual">仅手动解锁</option>
                                    <option value="both">自动+手动均可</option>
                                </select>
                            </div>
                            <div style="margin-top: 20px; padding: 16px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-md);">
                                <strong style="color: var(--warning);">⚠️ 安全提示</strong>
                                <p style="font-size: 13px; margin-top: 8px; line-height: 1.5;">
                                    建议将最小密码长度设置为至少12位，并启用所有复杂度要求。
                                    定期强制更换密码可有效降低凭据泄露风险。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SSH Configuration Tab -->
                <div id="tab-ssh" class="settings-tab hidden">
                    <div class="grid grid-2">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">🔑 SSH基本设置</h3>
                            </div>
                            <div class="form-group">
                                <label class="form-label">SSH端口</label>
                                <input type="number" class="form-input" id="sshPort" value="22" min="1" max="65535">
                                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">建议修改默认端口以提高安全性</div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">允许 root 登录</label>
                                <select class="form-select" id="permitRootLogin">
                                    <option value="no">禁止 (推荐)</option>
                                    <option value="prohibit-password">禁止密码登录</option>
                                    <option value="yes">允许</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">认证方式</label>
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="checkbox" id="enablePubkeyAuth" checked style="width: 18px; height: 18px;">
                                        <span>公钥认证 (推荐)</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="checkbox" id="enablePasswordAuth" style="width: 18px; height: 18px;">
                                        <span>密码认证</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                        <input type="checkbox" id="enableTwoFactor" checked style="width: 18px; height: 18px;">
                                        <span>双因素认证 (2FA)</span>
                                    </label>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">最大认证尝试次数</label>
                                <input type="number" class="form-input" id="maxAuthTries" value="3" min="1" max="10">
                            </div>
                            <div class="form-group">
                                <label class="form-label">登录超时时间 (秒)</label>
                                <input type="number" class="form-input" id="loginGraceTime" value="60" min="10" max="600">
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">🛡️ SSH安全加固</h3>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="disableEmptyPasswords" checked style="width: 18px; height: 18px;">
                                    <span>禁止空密码登录</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="enableX11Forwarding" style="width: 18px; height: 18px;">
                                    <span>启用X11转发</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="allowTcpForwarding" checked style="width: 18px; height: 18px;">
                                    <span>允许TCP转发</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="form-label">允许的用户/组 (留空表示全部)</label>
                                <textarea class="form-textarea" id="allowedUsers" placeholder="例如: admin,@developers" rows="2"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">拒绝的用户/组</label>
                                <textarea class="form-textarea" id="deniedUsers" placeholder="例如: guest,testuser" rows="2"></textarea>
                            </div>
                            <div style="margin-top: 20px; padding: 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md);">
                                <strong style="color: var(--success);">✅ 最佳实践</strong>
                                <p style="font-size: 13px; margin-top: 8px; line-height: 1.5;">
                                    强烈建议禁用密码登录，仅使用SSH密钥认证。
                                    修改默认端口并限制允许登录的用户可以显著提高安全性。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Firewall Policy Tab -->
                <div id="tab-firewall" class="settings-tab hidden">
                    <div class="grid grid-2">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">🔥 默认防火墙策略</h3>
                            </div>
                            <div class="form-group">
                                <label class="form-label">入站流量默认策略</label>
                                <select class="form-input" id="defaultInputPolicy">
                                    <option value="DROP">DROP (丢弃，推荐)</option>
                                    <option value="REJECT">REJECT (拒绝)</option>
                                    <option value="ACCEPT">ACCEPT (接受)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">出站流量默认策略</label>
                                <select class="form-input" id="defaultOutputPolicy">
                                    <option value="ACCEPT">ACCEPT (接受，推荐)</option>
                                    <option value="DROP">DROP (丢弃)</option>
                                    <option value="REJECT">REJECT (拒绝)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">启用日志记录</label>
                                <select class="form-input" id="enableFirewallLog">
                                    <option value="all">记录所有被拒绝的数据包</option>
                                    <option value="dropped">仅记录被丢弃的数据包</option>
                                    <option value="none">禁用日志</option>
                                </select>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">🚫 自动封禁规则</h3>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="enableAutoBan" checked style="width: 18px; height: 18px;">
                                    <span>启用自动IP封禁</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="form-label">失败尝试次数阈值</label>
                                <input type="number" class="form-input" id="banThreshold" value="5" min="1" max="20">
                            </div>
                            <div class="form-group">
                                <label class="form-label">检测时间窗口 (秒)</label>
                                <input type="number" class="form-input" id="banWindow" value="600" min="60" max="3600">
                            </div>
                            <div class="form-group">
                                <label class="form-label">封禁持续时间 (秒)</label>
                                <input type="number" class="form-input" id="banDuration" value="3600" min="60" max="86400">
                            </div>
                            <div class="form-group">
                                <label class="form-label">最大封禁IP数量</label>
                                <input type="number" class="form-input" id="maxBannedIPs" value="100" min="10" max="1000">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- System Hardening Tab -->
                <div id="tab-system" class="settings-tab hidden">
                    <div class="grid grid-2">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">🐧 内核安全参数</h3>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="enableIpForwarding" style="width: 18px; height: 18px;">
                                    <span>启用IP转发</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="disableSrcRouting" checked style="width: 18px; height: 18px;">
                                    <span>禁止源路由 (推荐)</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="enableSynCookies" checked style="width: 18px; height: 18px;">
                                    <span>启用SYN cookies防护</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="enableLogMartians" checked style="width: 18px; height: 18px;">
                                    <span>记录可疑数据包</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="form-label">最大文件描述符数</label>
                                <input type="number" class="form-input" id="maxFileDescriptors" value="65535" min="1024" max="1048576">
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">🔒 文件系统安全</h3>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="enableExecShield" checked style="width: 18px; height: 18px;">
                                    <span>启用 ExecShield 保护</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="enableAslr" checked style="width: 18px; height: 18px;">
                                    <span>启用 ASLR (地址空间布局随机化)</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="restrictCoreDumps" checked style="width: 18px; height: 18px;">
                                    <span>限制核心转储</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="form-label">文件权限掩码 (umask)</label>
                                <select class="form-select" id="fileUmask">
                                    <option value="077">077 (最严格)</option>
                                    <option value="027" selected>027 (推荐)</option>
                                    <option value="022">022 (标准)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notification Settings Tab -->
                <div id="tab-notification" class="settings-tab hidden">
                    <div class="grid grid-2">
                        <div class="card">
                            <div class="card-header">
                                <3 class="card-title">📧 告警通知配置</h3>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="enableEmailAlerts" checked style="width: 18px; height: 18px;">
                                    <span>启用邮件告警</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="form-label">通知邮箱</label>
                                <input type="email" class="form-input" id="alertEmail" value="admin@example.com" placeholder="admin@example.com">
                            </div>
                            <div class="form-group">
                                <label class="form-label">告警级别阈值</label>
                                <select class="form-select" id="alertLevelThreshold">
                                    <option value="critical">仅严重 (Critical)</option>
                                    <option value="high" selected>严重+高危 (Critical+High)</option>
                                    <option value="medium">中等及以上 (Medium+)</option>
                                    <option value="all">所有级别</option>
                                </select>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">🔔 通知频率控制</h3>
                            </div>
                            <div class="form-group">
                                <label class="form-label">相同告警最小间隔 (分钟)</label>
                                <input type="number" class="form-input" id="alertCooldown" value="30" min="1" max="1440">
                                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">防止告警轰炸</div>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="enableDailyReport" checked style="width: 18px; height: 18px;">
                                    <span>发送每日安全报告</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="enableWeeklyReport" checked style="width: 18px; height: 18px;">
                                    <span>发送每周安全摘要</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    switchTab(tabId, element) {
        document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
        element.classList.add('active');

        document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.add('hidden'));
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    }

    loadSettings() {
        console.log('Settings loaded');
    }

    saveAllSettings() {
        Utils.showToast('正在保存所有安全设置...', 'info');
        setTimeout(() => {
            Utils.showToast('所有设置已保存成功！部分更改可能需要重启服务才能生效。', 'success');
        }, 1500);
    }

    resetToDefault() {
        if (confirm('确定要将所有设置重置为默认值吗？\n\n此操作不可撤销！')) {
            Utils.showToast('设置已重置为默认值', 'warning');
            location.reload();
        }
    }

    destroy() {
        eventBus.off('settings:refresh');
    }
}

let settingsModule;

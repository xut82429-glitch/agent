// v3.0 测试框架 - 单元测试示例

const TestRunner = {
    tests: [],
    passed: 0,
    failed: 0,

    describe(name, fn) {
        console.log(`\n📋 ${name}`);
        fn();
    },

    it(name, fn) {
        this.tests.push({ name, fn });
        try {
            fn();
            console.log(`  ✅ ${name}`);
            this.passed++;
        } catch (error) {
            console.log(`  ❌ ${name}`);
            console.log(`     Error: ${error.message}`);
            this.failed++;
        }
    },

    assertEqual(actual, expected) {
        if (actual !== expected) {
            throw new Error(`Expected "${expected}" but got "${actual}"`);
        }
    },

    assertTrue(condition) {
        if (!condition) {
            throw new Error('Expected condition to be true');
        }
    },

    assertFalse(condition) {
        if (condition) {
            throw new Error('Expected condition to be false');
        }
    },

    assertNotNull(value) {
        if (value === null || value === undefined) {
            throw new Error('Expected value not to be null/undefined');
        }
    },

    runAll() {
        console.log('\n' + '═'.repeat(50));
        console.log('🧪 Running Tests...');
        console.log('═'.repeat(50) + '\n');

        const startTime = performance.now();

        this.tests.forEach(test => test.fn());

        const duration = (performance.now() - startTime).toFixed(2);

        console.log('\n' + '═'.repeat(50));
        console.log('📊 Test Results:');
        console.log(`   ✅ Passed: ${this.passed}`);
        console.log(`   ❌ Failed: ${this.failed}`);
        console.log(`   ⏱️  Duration: ${duration}ms`);
        console.log(`   📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
        console.log('═'.repeat(50) + '\n');

        return { passed: this.passed, failed: this.failed };
    }
};

// ===== 核心工具函数测试 =====

TestRunner.describe('Utils 工具函数', () => {

    TestRunner.it('formatDate 应该正确格式化日期', () => {
        const date = new Date('2026-05-01T14:30:00');
        const formatted = Utils.formatDate(date);
        TestRunner.assertTrue(formatted.includes('2026-05-01'));
        TestRunner.assertTrue(formatted.includes('14:30:00'));
    });

    TestRunner.it('formatBytes 应该正确格式化字节数', () => {
        TestRunner.assertEqual(Utils.formatBytes(1024), '1.00 KB');
        TestRunner.assertEqual(Utils.formatBytes(1048576), '1.00 MB');
        TestRunner.assertEqual(Utils.formatBytes(1073741824), '1.00 GB');
    });

    TestRunner.it('generateId 应该生成唯一ID', () => {
        const id1 = Utils.generateId();
        const id2 = Utils.generateId();
        TestRunner.assertTrue(id1.startsWith('id_'));
        TestRunner.assertTrue(id1 !== id2);
    });

    TestRunner.it('debounce 应该延迟执行', async () => {
        let callCount = 0;
        const debouncedFn = Utils.debounce(() => callCount++, 100);
        
        debouncedFn();
        debouncedFn();
        debouncedFn();
        
        TestRunner.assertEqual(callCount, 0);
        
        await new Promise(resolve => setTimeout(resolve, 150));
        TestRunner.assertEqual(callCount, 1);
    });
});

// ===== EventBus 测试 =====

TestRunner.describe('EventBus 事件总线', () => {

    TestRunner.it('应该能够注册和触发事件', () => {
        let receivedData = null;
        eventBus.on('test:event', (data) => receivedData = data);
        eventBus.emit('test:event', { value: 'hello' });
        
        TestRunner.assertNotNull(receivedData);
        TestRunner.assertEqual(receivedData.value, 'hello');
        
        eventBus.off('test:event');
    });

    TestRunner.it('once 应该只触发一次', () => {
        let count = 0;
        eventBus.once('test:once', () => count++);
        
        eventBus.emit('test:once');
        eventBus.emit('test:once');
        
        TestRunner.assertEqual(count, 1);
        
        eventBus.off('test:once');
    });

    TestRunner.it('off 应该移除事件监听器', () => {
        let count = 0;
        const handler = () => count++;
        
        eventBus.on('test:off', handler);
        eventBus.emit('test:off');
        eventBus.off('test:off', handler);
        eventBus.emit('test:off');
        
        TestRunner.assertEqual(count, 1);
    });
});

// ===== i18n 测试 =====

TestRunner.describe('i18n 国际化系统', () => {

    TestRunner.it('应该返回正确的翻译文本', () => {
        i18n.setLocale('zh-CN');
        TestRunner.assertEqual(i18n.t('nav.dashboard'), '仪表盘');
        TestRunner.assertEqual(i18n.t('common.loading'), '加载中...');
    });

    TestRunner.it('应该支持参数替换', () => {
        const result = i18n.t('time.minutesAgo', { n: 5 });
        TestRunner.assertEqual(result, '5分钟前');
    });

    TestRunner.it('应该处理缺失的翻译键', () => {
        const result = i18n.t('nonexistent.key');
        TestRunner.assertEqual(result, 'nonexistent.key');
    });

    TestRunner.it('应该支持切换语言', () => {
        i18n.setLocale('zh-CN');
        TestRunner.assertEqual(i18n.getLocale(), 'zh-CN');
        
        i18n.setLocale('en-US');
        TestRunner.assertEqual(i18n.getLocale(), 'en-US');
        TestRunner.assertEqual(i18n.t('nav.dashboard'), 'Dashboard');
        
        // 恢复默认
        i18n.setLocale('zh-CN');
    });
});

// ===== 配置测试 =====

TestRunner.describe('APP_CONFIG 应用配置', () => {

    TestRunner.it('应该包含版本信息', () => {
        TestRunner.assertEqual(APP_CONFIG.version, '2.0.0');
        TestRunner.assertTrue(APP_CONFIG.name.length > 0);
    });

    TestRunner.it('应该包含主题配置', () => {
        TestRunner assertNotNull(APP_CONFIG.theme.primary);
        TestRunner.assertNotNull(APP_CONFIG.theme.bgDark);
    });

    TestRunner.it('应该包含刷新间隔配置', () => {
        TestRunner.assertTrue(APP_CONFIG.refreshInterval.dashboard > 0);
        TestRunner.assertTrue(APP_CONFIG.refreshInterval.network > 0);
    });
});

// 运行所有测试
if (typeof window !== 'undefined') {
    window.runTests = () => TestRunner.runAll();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestRunner;
}

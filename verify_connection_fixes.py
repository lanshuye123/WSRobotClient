#!/usr/bin/env python3
"""
验证连接状态管理的关键修复
"""

import os
import re


def check_file(filepath, patterns):
    """检查文件中是否包含特定模式"""
    if not os.path.exists(filepath):
        print(f"❌ 文件不存在: {filepath}")
        return False

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    all_found = True
    for pattern_name, pattern in patterns.items():
        if re.search(pattern, content, re.MULTILINE | re.DOTALL):
            print(f"  ✓ {pattern_name}")
        else:
            print(f"  ✗ {pattern_name}")
            all_found = False

    return all_found


def main():
    print("=== 验证连接状态管理修复 ===")
    print()

    # 检查关键修复
    checks = {
        "1. 用户主动断开标识": {
            "file": "frontend/src/composables/useWebSocket.ts",
            "patterns": {
                "isManualDisconnect标志": r"let isManualDisconnect = false",
                "disconnect中设置标志": r"isManualDisconnect = true",
                "onclose中检查标志": r"if \(isManualDisconnect\)",
                "重置标志": r"isManualDisconnect = false",
            },
        },
        "2. 连接ID管理": {
            "file": "frontend/src/composables/useWebSocket.ts",
            "patterns": {
                "currentConnectionId": r"let currentConnectionId: string \| null = null",
                "生成连接ID": r"const connectionId = Date\.now\(\)\.toString\(\)",
                "连接ID检查": r"if \(currentConnectionId !== connectionId\)",
                "清理旧连接": r"cleanupPreviousConnection",
            },
        },
        "3. 统一状态管理": {
            "file": "frontend/src/composables/useWebSocket.ts",
            "patterns": {
                "updateConnectionStatus函数": r"const updateConnectionStatus = \(status:",
                "状态同步": r"isConnected\.value = status === 'connected'",
                "robotStore状态更新": r"robotStore\.setConnectionStatus\(status\)",
            },
        },
        "4. 连接清理逻辑": {
            "file": "frontend/src/composables/useWebSocket.ts",
            "patterns": {
                "resetConnection函数": r"const resetConnection = \(\) =>",
                "重置所有状态": r"currentConnectionId = null",
                "停止定时器": r"stopHeartbeat\(\)",
                "清除重连定时器": r"if \(reconnectTimeout\)",
            },
        },
        "5. ConnectionBar优化": {
            "file": "frontend/src/components/ConnectionBar.vue",
            "patterns": {
                "使用resetConnection": r"resetConnection\(\)",
                "完全断开逻辑": r"console\.log\('连接已完全断开并重置'\)",
                "连接中指示器": r"connecting-indicator",
            },
        },
        "6. Store状态管理": {
            "file": "frontend/src/stores/robot.ts",
            "patterns": {
                "forceConnectionStatus": r"forceConnectionStatus\(status:",
                "状态清理": r"clearRobot\(\)",
                "连接状态重置": r"this\.connectionStatus = 'disconnected'",
            },
        },
    }

    all_passed = True
    for check_name, check_info in checks.items():
        print(f"{check_name}:")
        filepath = check_info["file"]
        patterns = check_info["patterns"]

        if check_file(filepath, patterns):
            print(f"  ✅ 通过")
        else:
            print(f"  ❌ 失败")
            all_passed = False
        print()

    if all_passed:
        print("✅ 所有关键修复都已实施")
        print()
        print("测试建议:")
        print("1. 运行 ./test_connection_fixes.sh 启动服务")
        print("2. 访问 http://localhost:5173")
        print("3. 按照测试步骤验证修复效果")
        print()
        print("预期行为:")
        print("- 用户断开连接后不会自动重连")
        print("- 切换机械臂时不会出现连接交替")
        print("- 连接状态同步一致")
        print("- 快速操作时连接稳定")
    else:
        print("❌ 部分修复未完全实施")
        print("请检查上述失败的项目")


if __name__ == "__main__":
    main()

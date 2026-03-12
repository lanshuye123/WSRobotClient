#!/usr/bin/env python3
"""
验证机械臂控制助手的关键修复
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
    print("=== 验证机械臂控制助手修复 ===")
    print()

    # 检查关键修复
    checks = {
        "1. ThreeViewer场景清理修复": {
            "file": "frontend/src/components/ThreeViewer.vue",
            "patterns": {
                "递归清理函数": r"const cleanupObject = \(obj: THREE\.Object3D\) => {",
                "几何体清理": r"obj\.geometry\.dispose\(\)",
                "材质清理": r"obj\.material\.dispose\(\)",
                "构建状态锁": r"let isBuilding = false",
            },
        },
        "2. Store状态锁修复": {
            "file": "frontend/src/stores/robot.ts",
            "patterns": {
                "状态锁集合": r"const sendingCommands = new Set<string>\(\)",
                "发送命令检查": r"sendingCommands\.has\(jointId\)",
                "添加状态锁": r"sendingCommands\.add\(jointId\)",
                "移除状态锁": r"sendingCommands\.delete\([^)]+\)",
            },
        },
        "3. WebSocket心跳机制": {
            "file": "frontend/src/composables/useWebSocket.ts",
            "patterns": {
                "心跳间隔": r"const HEARTBEAT_INTERVAL = 30000",
                "启动心跳": r"const startHeartbeat = \(\) => {",
                "停止心跳": r"const stopHeartbeat = \(\) => {",
                "处理pong": r"const handlePong = \(timestamp: number\) => {",
            },
        },
        "4. 后端ping/pong支持": {
            "file": "mock-server/main.py",
            "patterns": {
                "ping消息处理": r'"type" in data and data\["type"\] == "ping"',
                "pong响应": r'"type": "pong"',
            },
        },
        "5. 防抖优化": {
            "file": "frontend/src/utils/debounce.ts",
            "patterns": {
                "带立即执行的防抖": r"debounceWithImmediate",
                "尾随防抖": r"debounceTrailing",
                "保存最后参数": r"let lastArgs: Parameters<T> \| null = null",
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
        print("1. 运行 ./test_fixes.sh 启动服务")
        print("2. 访问 http://localhost:5173")
        print("3. 测试两个模型、角度重置和连接稳定性问题")
    else:
        print("❌ 部分修复未完全实施")
        print("请检查上述失败的项目")


if __name__ == "__main__":
    main()

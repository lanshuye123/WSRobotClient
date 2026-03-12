#!/bin/bash

echo "=== 机械臂控制助手修复测试 ==="
echo ""

# 停止可能正在运行的服务
echo "1. 停止现有服务..."
pkill -f "python main.py" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# 启动后端服务
echo "2. 启动后端服务..."
cd mock-server
python main.py &
BACKEND_PID=$!
sleep 3

echo "后端服务已启动 (PID: $BACKEND_PID)"
echo "监听端口: 8000"
echo ""

# 启动前端服务
echo "3. 启动前端服务..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
sleep 5

echo "前端服务已启动 (PID: $FRONTEND_PID)"
echo "监听端口: 5173"
echo ""

echo "=== 测试步骤 ==="
echo ""
echo "1. 打开浏览器访问: http://localhost:5173"
echo "2. 连接WebSocket: ws://localhost:8000/ws/six_axis"
echo "3. 测试以下功能:"
echo ""
echo "   A. 两个模型问题测试:"
echo "      - 连接后应该只显示一个3D机械臂模型"
echo "      - 断开连接后重新连接，应该只显示一个新模型"
echo ""
echo "   B. 角度重置问题测试:"
echo "      - 拖动一个关节的滑块，观察角度变化"
echo "      - 然后拖动另一个关节的滑块"
echo "      - 检查第一个关节的角度是否保持稳定，不会重置"
echo ""
echo "   C. 连接稳定性测试:"
echo "      - 连续操作多个关节"
echo "      - 观察控制台是否有频繁断开连接的消息"
echo "      - 检查心跳机制是否正常工作"
echo ""
echo "4. 打开浏览器开发者工具，查看控制台输出:"
echo "   - 应该看到连接成功的消息"
echo "   - 应该看到关节角度发送和确认的消息"
echo "   - 应该看到心跳消息（每30秒）"
echo ""

echo "按 Ctrl+C 停止测试"
echo ""

# 等待用户中断
trap "echo ''; echo '停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '测试完成'; exit" INT
wait
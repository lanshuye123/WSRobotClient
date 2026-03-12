#!/bin/bash

echo "=== 连接状态管理修复测试 ==="
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
echo "2. 打开浏览器开发者工具控制台"
echo ""
echo "3. 测试自动重连问题修复:"
echo "   - 连接WebSocket: ws://localhost:8000/ws/six_axis"
echo "   - 等待连接成功"
echo "   - 点击'断开'按钮"
echo "   - 检查控制台: 应该看到'用户主动断开连接，不进行重连'"
echo "   - 验证: 连接不应该自动重新建立"
echo ""
echo "4. 测试连接会话切换问题修复:"
echo "   - 连接6轴机械臂: ws://localhost:8000/ws/six_axis"
echo "   - 点击'断开'按钮"
echo "   - 连接SCARA机器人: 切换选择框到'SCARA机器人'，点击'连接'"
echo "   - 检查控制台: 应该看到连接ID变化，旧连接事件被忽略"
echo "   - 验证: 应该只有SCARA机器人的连接活跃，不会出现交替连接"
echo ""
echo "5. 测试快速切换连接:"
echo "   - 快速在两种机械臂类型间切换连接"
echo "   - 检查控制台: 应该看到连接ID正确管理，旧连接被清理"
echo "   - 验证: 连接状态应该稳定，不会出现多个连接竞争"
echo ""
echo "6. 测试意外断开重连:"
echo "   - 保持连接状态"
echo "   - 手动停止后端服务: kill $BACKEND_PID"
echo "   - 检查控制台: 应该看到重连尝试（指数退避）"
echo "   - 重新启动后端: cd mock-server && python main.py &"
echo "   - 验证: 应该自动重连成功"
echo ""

echo "按 Ctrl+C 停止测试"
echo ""

# 等待用户中断
trap "echo ''; echo '停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '测试完成'; exit" INT
wait
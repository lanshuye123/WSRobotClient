#!/bin/bash

echo "=== 机械臂控制助手修复测试 ==="
echo ""

# 启动后端服务
echo "1. 启动后端服务..."
cd mock-server
python main.py &
BACKEND_PID=$!
sleep 3

echo "后端服务已启动 (PID: $BACKEND_PID)"
echo ""

# 启动前端服务
echo "2. 启动前端服务..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
sleep 5

echo "前端服务已启动 (PID: $FRONTEND_PID)"
echo ""

echo "=== 测试说明 ==="
echo "1. 打开浏览器访问: http://localhost:5173"
echo "2. 连接WebSocket: ws://localhost:8000/ws/six_axis"
echo "3. 测试以下功能:"
echo "   - 连接/断开连接"
echo "   - 拖动关节滑块，观察3D模型变化"
echo "   - 检查控制台是否有WebSocket消息发送"
echo "   - 断开后重新连接，检查3D模型是否清理"
echo ""

echo "按 Ctrl+C 停止测试"
echo ""

# 等待用户中断
trap "echo ''; echo '停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '测试完成'; exit" INT
wait
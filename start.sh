#!/bin/bash

echo "启动机械臂控制助手..."

# 检查是否在后端目录
if [ ! -f "mock-server/main.py" ]; then
    echo "错误：请在项目根目录运行此脚本"
    exit 1
fi

# 启动后端服务
echo "启动后端服务..."
cd mock-server
python3 -m venv venv 2>/dev/null || echo "虚拟环境已存在"
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1
python main.py &
BACKEND_PID=$!

# 等待后端启动
echo "等待后端服务启动..."
sleep 3

# 启动前端服务
echo "启动前端服务..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "机械臂控制助手已启动！"
echo ""
echo "前端应用：http://localhost:5173"
echo "后端服务：http://localhost:8000"
echo ""
echo "WebSocket连接地址："
echo "- 6轴工业机械臂：ws://localhost:8000/ws/six_axis"
echo "- SCARA机器人：ws://localhost:8000/ws/scara"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "========================================"

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '服务已停止'; exit" INT
wait
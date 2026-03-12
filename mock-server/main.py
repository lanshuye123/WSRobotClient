from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
from robot_config import SIX_AXIS_ROBOT, SCARA_ROBOT

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws/{robot_type}")
async def websocket_endpoint(websocket: WebSocket, robot_type: str = "six_axis"):
    await websocket.accept()

    if robot_type == "scara":
        robot_config = SCARA_ROBOT
    else:
        robot_config = SIX_AXIS_ROBOT

    await websocket.send_json(robot_config)

    joint_states = {joint["id"]: joint["default"] for joint in robot_config["joints"]}

    try:
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)

            if "id" in data and "angel" in data:
                joint_id = data["id"]
                target_angle = data["angel"]

                if joint_id in joint_states:
                    joint_states[joint_id] = target_angle

                    await websocket.send_json(
                        {
                            "type": "move_ack",
                            "joint": joint_id,
                            "angle": target_angle,
                            "status": "success",
                        }
                    )
            elif "type" in data and data["type"] == "ping":
                # 响应心跳消息
                await websocket.send_json(
                    {"type": "pong", "timestamp": data.get("timestamp", 0)}
                )
            else:
                print(f"收到未知消息: {data}")

    except WebSocketDisconnect:
        print(f"Client disconnected for robot: {robot_type}")
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
    except Exception as e:
        print(f"错误: {e}")


@app.get("/api/robots")
async def get_robot_list():
    return {
        "robots": [
            {"id": "six_axis", "name": "6轴工业机械臂"},
            {"id": "scara", "name": "SCARA机器人"},
        ]
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

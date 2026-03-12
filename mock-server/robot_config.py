from typing import List, Dict, Any

SIX_AXIS_ROBOT = {
    "id": "robot_6dof_001",
    "joints": [
        {
            "id": "base",
            "range": [-180, 180],
            "default": 0,
            "type": "flex_w",
            "next": "shoulder",
        },
        {
            "id": "shoulder",
            "range": [-90, 90],
            "default": 45,
            "type": "joint",
            "next": "elbow",
        },
        {
            "id": "elbow",
            "range": [-135, 135],
            "default": -30,
            "type": "joint",
            "next": "wrist1",
        },
        {
            "id": "wrist1",
            "range": [-180, 180],
            "default": 0,
            "type": "flex_v",
            "next": "wrist2",
        },
        {
            "id": "wrist2",
            "range": [-90, 90],
            "default": 0,
            "type": "flex_v",
            "next": "gripper",
        },
        {
            "id": "gripper",
            "range": [0, 100],
            "default": 50,
            "type": "gripper",
            "next": None,
        },
    ],
}

SCARA_ROBOT = {
    "id": "scara_001",
    "joints": [
        {
            "id": "waist",
            "range": [-170, 170],
            "default": 0,
            "type": "flex_w",
            "next": "arm1",
        },
        {
            "id": "arm1",
            "range": [-150, 150],
            "default": 30,
            "type": "joint",
            "next": "arm2",
        },
        {
            "id": "arm2",
            "range": [-150, 150],
            "default": -45,
            "type": "joint",
            "next": "wrist",
        },
        {
            "id": "wrist",
            "range": [-360, 360],
            "default": 0,
            "type": "flex_v",
            "next": "gripper",
        },
        {
            "id": "gripper",
            "range": [0, 100],
            "default": 30,
            "type": "gripper",
            "next": None,
        },
    ],
}

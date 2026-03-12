export interface Joint {
  id: string
  range: [number, number]
  default: number
  type: "joint" | "flex_w" | "flex_v" | "gripper"
  next?: string
}

export interface InitResponse {
  id: string
  joints: Joint[]
}

export interface MoveRequest {
  id: string
  angel: number
}

export interface MoveAck {
  type: "move_ack"
  joint: string
  angle: number
  status: "success" | "error"
}

export type WebSocketMessage = InitResponse | MoveAck

export interface JointState extends Joint {
  currentAngle: number
}
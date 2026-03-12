/**
 * 关节配置
 * 在实现上，继承或实现了这个Joint的接口或类应该能维持并记录当前的角度，但是这个不在配置文件中体现
 */
declare interface Joint{
    id: string, // 关节id
    range: number[],  // 长度为2的数组，角度最小值与最大值
    default: number // 复位时的关节默认角度
    type: "joint"|"flex_w"|"flex_v"|"gripper" // 一般关节、水平轴旋转底座、垂直轴旋转底座、夹爪
    next?: string // 在设计上连接的下一个关节
}


/**
 * 机械臂端下发的配置文件包
 */
declare interface InitResponse{
    id: string, // 机械臂id
    joints: Joint[]
}

/**
 * 浏览器端上传的关节角度调整请求
 */
declare interface MoveRequest{
    id: string, // 关节id
    angel: number // 角度
}
/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 带立即执行选项的防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @param immediate 是否立即执行
 * @returns 防抖后的函数
 */
export function debounceWithImmediate<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null
  let lastCallTime: number = 0
  let lastArgs: Parameters<T> | null = null
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    lastArgs = args
    
    if (immediate && (!lastCallTime || now - lastCallTime > delay)) {
      // 立即执行
      fn(...args)
      lastCallTime = now
    } else {
      // 延迟执行
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          fn(...lastArgs)
          lastArgs = null
        }
        timeoutId = null
        lastCallTime = Date.now()
      }, delay)
    }
  }
}

/**
 * 优化的防抖函数，确保最后一次调用总是被执行
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounceTrailing<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null
  let lastArgs: Parameters<T> | null = null
  
  return (...args: Parameters<T>) => {
    lastArgs = args
    
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      if (lastArgs) {
        fn(...lastArgs)
        lastArgs = null
      }
      timeoutId = null
    }, delay)
  }
}
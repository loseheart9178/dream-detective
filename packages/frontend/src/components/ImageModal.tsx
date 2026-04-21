import { useState, useEffect, useCallback } from 'react'

interface ImageModalProps {
  src: string
  alt?: string
  onClose: () => void
}

export default function ImageModal({ src, alt = '图片', onClose }: ImageModalProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // 禁止背景滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // 缩放处理
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.min(Math.max(prev * delta, 0.5), 4))
  }, [])

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  // 拖拽中
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }, [isDragging, dragStart])

  // 拖拽结束
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 重置
  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // 双击重置
  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2)
    } else {
      handleReset()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/90" />

      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors"
        aria-label="关闭"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 工具栏 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-slate-800/90 rounded-full px-4 py-2 backdrop-blur-sm">
        <button
          onClick={(e) => { e.stopPropagation(); setScale(prev => Math.min(prev * 1.2, 4)) }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          aria-label="放大"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setScale(prev => Math.max(prev * 0.8, 0.5)) }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          aria-label="缩小"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleReset() }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          aria-label="重置"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <div className="w-px h-6 bg-slate-600 mx-1" />
        <span className="text-white text-sm font-mono min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* 图片容器 */}
      <div
        className="relative max-w-[90vw] max-h-[85vh] cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* 加载状态 */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 rounded-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-400" />
          </div>
        )}

        {/* 错误状态 */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 rounded-lg p-8">
            <svg className="w-16 h-16 text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-400">图片加载失败</p>
          </div>
        )}

        {/* 图片 */}
        <img
          src={src}
          alt={alt}
          className={`max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
            isLoading && !hasError ? 'opacity-0' : 'opacity-100'
          }`}
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          onLoad={() => setIsLoading(false)}
          onError={() => { setIsLoading(false); setHasError(true); }}
          draggable={false}
        />

        {/* 图片信息 */}
        {!isLoading && !hasError && (
          <div className="absolute -bottom-10 left-0 right-0 text-center">
            <p className="text-slate-400 text-sm">{alt}</p>
          </div>
        )}
      </div>
    </div>
  )
}

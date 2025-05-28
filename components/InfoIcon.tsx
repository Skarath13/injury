'use client'

import { useState, useRef, useEffect } from 'react'

interface InfoIconProps {
  content: string
  className?: string
}

export default function InfoIcon({ content, className = '' }: InfoIconProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [shouldOpenLeft, setShouldOpenLeft] = useState(false)
  const iconRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isHovered && iconRef.current) {
      const iconRect = iconRef.current.getBoundingClientRect()
      const screenWidth = window.innerWidth
      
      // If icon is on the right half of the screen, open tooltip to the left
      setShouldOpenLeft(iconRect.left > screenWidth / 2)
    }
  }, [isHovered])

  const getTooltipClasses = () => {
    const baseClasses = "absolute z-50 w-64 p-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg bottom-full mb-2"
    
    if (shouldOpenLeft) {
      return `${baseClasses} right-0`
    } else {
      return `${baseClasses} left-0`
    }
  }

  const getArrowClasses = () => {
    const baseClasses = "absolute w-3 h-3 bg-white border-b border-gray-200 transform rotate-45 -bottom-1.5"
    
    if (shouldOpenLeft) {
      return `${baseClasses} border-r right-2`
    } else {
      return `${baseClasses} border-l left-2`
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <div
        ref={iconRef}
        className={`ml-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-blue-500 rounded-full cursor-help ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        i
      </div>
      {isHovered && (
        <div className={getTooltipClasses()}>
          <div className={getArrowClasses()}></div>
          {content}
        </div>
      )}
    </div>
  )
}
import React from 'react'

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Memuat...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Spinner */}
      <div className="relative">
        <div className="w-20 h-20 border-4 border-amber-500/20 rounded-full"></div>
        <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full absolute top-0 left-0 animate-spin"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 bg-amber-500/20 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Message */}
      <div className="mt-6 text-center">
        <p className="text-lg font-medium mb-2">{message}</p>
        <p className="text-sm text-gray-400">Harap tunggu sebentar</p>
      </div>
      
      {/* Dots Animation */}
      <div className="flex gap-2 mt-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export default LoadingSpinner

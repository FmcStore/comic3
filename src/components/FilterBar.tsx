import React from 'react'

interface FilterBarProps {
  activeFilter: 'all' | 'ongoing' | 'completed'
  onFilterChange: (filter: 'all' | 'ongoing' | 'completed') => void
}

const FilterBar: React.FC<FilterBarProps> = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'Semua', icon: 'fas fa-globe', color: 'gray' },
    { id: 'ongoing', label: 'Ongoing', icon: 'fas fa-fire', color: 'green' },
    { id: 'completed', label: 'Selesai', icon: 'fas fa-check-circle', color: 'blue' },
  ]

  return (
    <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-2xl w-fit">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id as any)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300
              ${isActive 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <i className={filter.icon}></i>
            <span>{filter.label}</span>
            {isActive && (
              <i className="fas fa-chevron-down text-xs ml-1"></i>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default FilterBar

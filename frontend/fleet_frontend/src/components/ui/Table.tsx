import React, { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

interface TableHeaderProps {
  children: ReactNode
  className?: string
}

interface TableBodyProps {
  children: ReactNode
  className?: string
}

interface TableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

interface TableCellProps {
  children: ReactNode
  className?: string
  colSpan?: number
  align?: 'left' | 'center' | 'right'
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        {children}
      </table>
    </div>
  )
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '' }) => {
  return (
    <thead className={`bg-gray-50 ${className}`}>
      <tr>{children}</tr>
    </thead>
  )
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
      {children}
    </tbody>
  )
}

export const TableRow: React.FC<TableRowProps> = ({ children, className = '', onClick }) => {
  return (
    <tr 
      className={`${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  className = '', 
  colSpan,
  align = 'left'
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <td 
      className={`px-6 py-4 whitespace-nowrap ${alignClasses[align]} ${className}`}
      colSpan={colSpan}
    >
      {children}
    </td>
  )
}

export const TableHeadCell: React.FC<TableCellProps> = ({ 
  children, 
  className = '', 
  colSpan,
  align = 'left'
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <th 
      className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${alignClasses[align]} ${className}`}
      colSpan={colSpan}
    >
      {children}
    </th>
  )
}
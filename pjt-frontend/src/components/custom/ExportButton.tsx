import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, FileImage } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ExportButtonProps {
  onExport: (format: 'json' | 'pdf' | 'csv' | 'excel') => void;
  disabled?: boolean;
}

export function ExportButton({ onExport, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'json' | 'pdf' | 'csv' | 'excel') => {
    setIsExporting(true)
    try {
      await onExport(format)
    } finally {
      setIsExporting(false)
    }
  }

  const exportOptions = [
    { format: 'json' as const, label: 'JSON', icon: FileText },
    { format: 'pdf' as const, label: 'PDF', icon: FileImage },
    { format: 'csv' as const, label: 'CSV', icon: FileSpreadsheet },
    { format: 'excel' as const, label: 'Excel', icon: FileSpreadsheet },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={disabled || isExporting}
          className="w-full bg-gradient-to-r from-black to-gray-500 text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44">
        {exportOptions.map(({ format, label, icon: Icon }) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Icon className="h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

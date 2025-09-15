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
        <Button variant="outline" disabled={disabled || isExporting} className="text-sm">
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {exportOptions.map(({ format, label, icon: Icon }) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
            className="cursor-pointer"
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
import { Controller } from 'react-hook-form'
import { Search } from 'lucide-react'
import { useState, useMemo } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface ServiceSelectorProps {
  control: any;
  services: { id: string; name: string; price: number }[];
  errors: any;
}

export function ServiceSelector({ control, services, errors }: ServiceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredServices = useMemo(() => {
    if (!searchTerm) {return services}
    return services.filter(service => 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [services, searchTerm])
  
  return (
    <div>
      <Label className="text-sm">Serviços</Label>
      
      {services.length > 5 && (
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            placeholder="Pesquisar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-7 text-xs pl-7"
          />
        </div>
      )}
      
      <Controller
        name="serviceIds"
        control={control}
        render={({ field }) => (
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
            {filteredServices.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                {searchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço disponível'}
              </p>
            ) : (
              filteredServices.map((s) => (
                <div key={s.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                  <Checkbox
                    checked={field.value.includes(s.id)}
                    onCheckedChange={(checked) => {
                      const set = new Set(field.value)
                      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                      checked ? set.add(s.id) : set.delete(s.id)
                      field.onChange(Array.from(set))
                    }}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-medium truncate">{s.name}</span>
                      <span className="text-[#D4AF37] font-semibold text-xs ml-2">R$ {s.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      />
      {errors.serviceIds && (
        <p className="text-xs text-red-500">{errors.serviceIds.message}</p>
      )}
    </div>
  )
}
interface Service {
  id: string
  name: string
  price: number
}

interface SimpleServiceSelectorProps {
  services: Service[]
  selectedServiceIds: string[]
  onChange: (serviceIds: string[]) => void
  error?: string
  label?: string
}

export function SimpleServiceSelector({
  services,
  selectedServiceIds,
  onChange,
  error,
  label = 'Serviços',
}: SimpleServiceSelectorProps) {
  const handleToggle = (serviceId: string) => {
    const isSelected = selectedServiceIds.includes(serviceId)
    const newList = isSelected
      ? selectedServiceIds.filter((id) => id !== serviceId)
      : [...selectedServiceIds, serviceId]
    onChange(newList)
  }

  return (
    <div>
      <label className='block text-sm font-medium text-foreground mb-3'>
        {label}
      </label>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        {services.map((service) => {
          const selected = selectedServiceIds.includes(service.id)
          return (
            <div
              key={service.id}
              onClick={() => handleToggle(service.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleToggle(service.id)
                }
              }}
              role='checkbox'
              aria-checked={selected}
              tabIndex={0}
              className={`border rounded-xl p-4 cursor-pointer transition-all ${
                selected
                  ? 'border-primary bg-accent/20'
                  : 'border-border hover:border-primary hover:bg-accent/10'
              }`}>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    checked={selected}
                    onChange={() => handleToggle(service.id)}
                    className='w-4 h-4 text-primary rounded pointer-events-none'
                    tabIndex={-1}
                    aria-hidden='true'
                  />
                  <div>
                    <p className='font-medium text-foreground'>
                      {service.name}
                    </p>
                  </div>
                </div>
                <span className='font-semibold text-primary'>
                  R$ {service.price.toFixed(2)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      {error && <p className='text-xs text-destructive mt-1'>{error}</p>}
    </div>
  )
}

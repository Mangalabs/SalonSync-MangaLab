import { useState } from 'react'

import { ServiceTable } from '@/components/custom/service/ServiceTable'

export default function Services() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <ServiceTable />
    </div>
  )
}

import React from 'react'
import { useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { BookingFlow } from '@/components/booking/BookingFlow'
import { useBranchBySlug } from '@/hooks/usePublicBooking'

const queryClient = new QueryClient()

function BookingContent() {
  const { businessSlug, branchSlug } = useParams()
  const decodedBranchSlug = branchSlug ? decodeURIComponent(branchSlug) : ''
  const { data: branch, isLoading, error } = useBranchBySlug(decodedBranchSlug)

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (error || !branch) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-4'>
            Filial não encontrada
          </h1>
          <p className='text-gray-600'>
            A filial "{decodedBranchSlug}" não foi encontrada
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='bg-card border-b border-border shadow-sm'>
        <div className='max-w-6xl mx-auto px-4 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              {/* Logo placeholder */}
              <div className='w-12 h-12 bg-primary rounded-xl flex items-center justify-center'>
                <span className='text-primary-foreground font-bold text-lg'>
                  {(branch.owner?.businessName || branch.owner?.name)?.charAt(
                    0,
                  )}
                </span>
              </div>
              <div>
                <h1 className='text-2xl font-bold text-foreground'>
                  {branch.owner?.businessName || branch.owner?.name}
                </h1>
                <p className='text-muted-foreground'>{branch.name}</p>
              </div>
            </div>
            <div className='text-right text-sm text-muted-foreground'>
              {branch.address && <p>{branch.address}</p>}
              {branch.phone && <p>{branch.phone}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-6xl mx-auto px-4 py-8'>
        <BookingFlow
          branchId={branch.id}
          businessName={branch.owner?.businessName || branch.owner?.name || ''}
          branchName={branch.name}
        />
      </div>
    </div>
  )
}

export default function BookingPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <BookingContent />
    </QueryClientProvider>
  )
}

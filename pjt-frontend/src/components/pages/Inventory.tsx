import { useState } from 'react'
import {
  PlusCircle,
  Package,
  RefreshCw,
  Filter,
  Calendar,
  Search,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ProductForm } from '@/components/custom/products/ProductForm'
import { ProfessionalProductForm } from '@/components/custom/products/ProfessionalProductForm'
import { SaleProductTable } from '@/components/custom/products/SaleProductTable'
import { ProfessionalProductTable } from '@/components/custom/products/ProfessionalProductTable'
import { InventoryMovementTable } from '@/components/custom/inventory/InventoryMovementTable'
import { StockMovementForm } from '@/components/custom/forms/StockMovementForm'

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<'sale-products' | 'professional-products' | 'movements'>(
    'sale-products',
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [movementFilter, setMovementFilter] = useState<
    'all' | 'entrada' | 'saida' | 'ajuste' | 'transferencia' | 'perda' | 'uso-profissional'
  >('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })
  const [productOpen, setProductOpen] = useState(false)
  const [professionalProductOpen, setProfessionalProductOpen] = useState(false)
  const [movementOpen, setMovementOpen] = useState(false)

  return (
    <div className='space-y-6 p-3 sm:p-6'>
      <div className='bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border'>
        <h1 className='text-lg sm:text-xl font-semibold mb-4 text-foreground'>
          Estoque
        </h1>

        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3 sm:gap-0'>
          <div className='flex flex-wrap gap-1 bg-muted p-1 rounded-xl'>
            <button
              onClick={() => {
                setActiveTab('sale-products')
                setSearchTerm('')
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                activeTab === 'sale-products'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-primary cursor-pointer'
              }`}>
              <Package className='w-4 h-4 inline-block mr-2' />
              Venda
            </button>
            <button
              onClick={() => {
                setActiveTab('professional-products')
                setSearchTerm('')
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                activeTab === 'professional-products'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-primary cursor-pointer'
              }`}>
              <Package className='w-4 h-4 inline-block mr-2 text-purple-600' />
              Profissional
            </button>
            <button
              onClick={() => {
                setActiveTab('movements')
                setSearchTerm('')
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center  ${
                activeTab === 'movements'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-primary cursor-pointer'
              }`}>
              <RefreshCw className='w-4 h-4 inline-block mr-2' />
              Movimentações
            </button>
          </div>

          <div className='flex flex-wrap gap-2'>
            {activeTab === 'sale-products' ? (
              <Dialog open={productOpen} onOpenChange={setProductOpen}>
                <DialogTrigger asChild>
                  <Button className='bg-primary text-secondary py-3 px-4 rounded-xl font-medium hover:opacity-80 transition-opacity cursor-pointer'>
                    <PlusCircle className='w-4 h-4' />
                    Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-[95vw] max-h-[90vh] overflow-y-auto bg-card'>
                  <DialogHeader>
                    <DialogTitle>Novo Produto para Venda</DialogTitle>
                  </DialogHeader>
                  <ProductForm onSuccess={() => setProductOpen(false)} />
                </DialogContent>
              </Dialog>
            ) : activeTab === 'professional-products' ? (
              <Dialog open={professionalProductOpen} onOpenChange={setProfessionalProductOpen}>
                <DialogTrigger asChild>
                  <Button className='bg-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-purple-700 transition-colors cursor-pointer'>
                    <PlusCircle className='w-4 h-4' />
                    Novo Produto Profissional
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-[95vw] max-h-[90vh] overflow-y-auto bg-card'>
                  <DialogHeader>
                    <DialogTitle>Novo Produto Profissional</DialogTitle>
                  </DialogHeader>
                  <ProfessionalProductForm onSuccess={() => setProfessionalProductOpen(false)} />
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
                <DialogTrigger asChild>
                  <Button
                    className='bg-primary
                text-secondary
                py-3 px-4 rounded-xl font-medium 
                hover:opacity-80 transition-opacity'>
                    <PlusCircle className='w-4 h-4' />
                    Nova Movimentação
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-[95vw] max-h-[90vh] overflow-y-auto bg-card'>
                  <DialogHeader>
                    <DialogTitle>Registrar Movimentação</DialogTitle>
                  </DialogHeader>
                  <StockMovementForm onSuccess={() => setMovementOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {activeTab === 'movements' && (
          <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6 items-center'>
            <div className='relative w-full sm:max-w-xs flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5' />
              <input
                type='text'
                placeholder='Buscar movimentações...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 sm:py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-sm sm:text-base text-foreground placeholder:text-muted-foreground'
              />
            </div>

            <div className='relative w-full sm:w-auto'>
              <Filter className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <select
                value={movementFilter}
                onChange={(e) => setMovementFilter(e.target.value as any)}
                className='w-full sm:w-auto pl-10 pr-4 py-2 sm:py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-sm sm:text-base appearance-none min-w-[150px] text-foreground'>
                <option value='all'>Todos os tipos</option>
                <option value='entrada'>Entrada</option>
                <option value='saida'>Saída</option>
                <option value='ajuste'>Ajuste</option>
                <option value='transferencia'>Transferência</option>
                <option value='perda'>Perda</option>
                <option value='uso-profissional'>Uso Profissional</option>
              </select>
            </div>

            <div className='flex flex-wrap gap-2 items-center w-full sm:w-auto'>
              <Calendar className='w-4 h-4 text-muted-foreground' />
              <input
                type='date'
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className='px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-sm sm:text-base text-foreground'
              />
              <span className='text-muted-foreground text-sm'>até</span>
              <input
                type='date'
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className='px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-sm sm:text-base text-foreground'
              />
            </div>
          </div>
        )}

        <div className='overflow-x-auto'>
          {activeTab === 'sale-products' ? (
            <SaleProductTable />
          ) : activeTab === 'professional-products' ? (
            <ProfessionalProductTable />
          ) : (
            <InventoryMovementTable
              searchTerm={searchTerm}
              filter={movementFilter}
              dateRange={dateRange}
            />
          )}
        </div>
      </div>
    </div>
  )
}

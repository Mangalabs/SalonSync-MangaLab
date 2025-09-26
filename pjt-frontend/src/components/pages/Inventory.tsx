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
import { ProductTable } from '@/components/custom/products/ProductTable'
import { InventoryMovementTable } from '@/components/custom/inventory/InventoryMovementTable'
import { StockMovementForm } from '@/components/custom/forms/StockMovementForm'

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<'products' | 'movements'>('products')
  const [searchTerm, setSearchTerm] = useState('')
  const [movementFilter, setMovementFilter] = useState<'all' | 'entrada' | 'saida' | 'ajuste' | 'transferencia' | 'perda'>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [productOpen, setProductOpen] = useState(false)
  const [movementOpen, setMovementOpen] = useState(false)

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border">
        <h1 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">
          Estoque
        </h1>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3 sm:gap-0">
          <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('products')
                setSearchTerm('')
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                activeTab === 'products'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-primary cursor-pointer'
              }`}
            >
              <Package className="w-4 h-4 inline-block mr-2" />
              Produtos
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
              }`}
            >
              <RefreshCw className="w-4 h-4 inline-block mr-2" />
              Movimentações
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeTab === 'products' ? (
              <Dialog open={productOpen} onOpenChange={setProductOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-secondary hover:text-secondary-foreground px-3 sm:px-4 py-2 text-sm sm:text-base cursor-pointer">
                    <PlusCircle className="w-4 h-4" />
                    Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-md sm:max-w-lg bg-card text-foreground">
                  <DialogHeader>
                    <DialogTitle>Novo Produto</DialogTitle>
                  </DialogHeader>
                  <ProductForm onSuccess={() => setProductOpen(false)} />
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-secondary hover:text-secondary-foreground px-3 sm:px-4 py-2 text-sm sm:text-base cursor-pointer">
                    <PlusCircle className="w-4 h-4" />
                    Nova Movimentação
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-md sm:max-w-lg bg-card text-foreground">
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
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6 items-center">
            <div className="relative w-full sm:max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar movimentações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-sm sm:text-base text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <select
                value={movementFilter}
                onChange={(e) => setMovementFilter(e.target.value as any)}
                className="w-full sm:w-auto pl-10 pr-4 py-2 sm:py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-sm sm:text-base appearance-none min-w-[150px] text-foreground"
              >
                <option value="all">Todos os tipos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="ajuste">Ajuste</option>
                <option value="transferencia">Transferência</option>
                <option value="perda">Perda</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-sm sm:text-base text-foreground"
              />
              <span className="text-muted-foreground text-sm">até</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-sm sm:text-base text-foreground"
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {activeTab === 'products' ? (
            <ProductTable />
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

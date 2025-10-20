import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  ShoppingCart,
  CreditCard,
  UserPlus,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import axios from '@/lib/axios'
import { useUser } from '@/contexts/UserContext'
import { useBranch } from '@/contexts/BranchContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ClientForm } from '@/components/custom/client/ClientForm'

interface Product {
  id: string
  name: string
  category: string
  salePrice: number
  currentStock: number
  minStock: number
  unit: string
}

interface CartItem extends Product {
  quantity: number
}

export default function Sales() {
  const queryClient = useQueryClient()
  const { user, isAdmin, isProfessional } = useUser()
  const { activeBranch } = useBranch()

  const [carts, setCarts] = useState<{ [branchId: string]: CartItem[] }>({})
  const cart = activeBranch ? carts[activeBranch.id] || [] : []

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('CASH')

  const [openClientDialog, setOpenClientDialog] = useState(false)
  const [editingClient, setEditingClient] = useState<any | null>(null)

  useEffect(() => {
    if (!activeBranch) {
      return
    }
    setCarts((prev) => ({
      ...prev,
      [activeBranch.id]: prev[activeBranch.id] || [],
    }))
  }, [activeBranch?.id])

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery<Product[]>({
    queryKey: ['products', activeBranch?.id],
    queryFn: async () => {
      const res = await axios.get('/api/products')
      return res.data
    },
    enabled: !!activeBranch,
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', activeBranch?.id],
    queryFn: async () => {
      if (!activeBranch?.id) {
        return []
      }
      const res = await axios.get(`/api/clients?branchId=${activeBranch.id}`)
      return res.data
    },
    enabled: !!activeBranch,
  })

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', activeBranch?.id],
    queryFn: async () => {
      if (!activeBranch?.id) {
        return []
      }
      const res = await axios.get(
        `/api/professionals?branchId=${activeBranch.id}`
      )
      return res.data
    },
    enabled: !!activeBranch,
  })

  const currentProfessionalId = useMemo(() => {
    if (isProfessional && !isAdmin && user?.name && professionals.length > 0) {
      const currentProfessional = professionals.find(
        (p: any) => p.name === user.name
      )
      return currentProfessional?.id || ''
    }
    return ''
  }, [isProfessional, isAdmin, user?.name, professionals])

  const addToCart = (product: Product) => {
    if (!activeBranch) {
      return
    }
    const existingItem = cart.find((item) => item.id === product.id)
    const updatedCart = existingItem
      ? cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [...cart, { ...product, quantity: 1 }]
    setCarts({ ...carts, [activeBranch.id]: updatedCart })
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (!activeBranch) {
      return
    }
    let updatedCart: CartItem[]
    if (newQuantity <= 0) {
      updatedCart = cart.filter((item) => item.id !== productId)
    } else {
      updatedCart = cart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    }
    setCarts({ ...carts, [activeBranch.id]: updatedCart })
  }

  const removeFromCart = (productId: string) => {
    if (!activeBranch) {
      return
    }
    const updatedCart = cart.filter((item) => item.id !== productId)
    setCarts({ ...carts, [activeBranch.id]: updatedCart })
  }

  const subtotal = cart.reduce(
    (acc, item) => acc + Number(item.salePrice) * item.quantity,
    0
  )
  const categories = [
    'all',
    ...Array.from(new Set(products.map((p) => p.category))),
  ]

  const createSale = useMutation({
    mutationFn: async () => {
      if (!activeBranch?.id) {
        throw new Error('Filial não selecionada')
      }
      if (cart.length === 0) {
        throw new Error('Carrinho vazio')
      }

      const headers = { 'x-branch-id': activeBranch.id }
      const promises = cart.map((item) =>
        axios.post(
          `/api/products/${item.id}/adjust`,
          {
            type: 'OUT',
            quantity: item.quantity,
            unitCost: item.salePrice,
            reason: `Venda de produto${
              selectedClient ? ` - Cliente: ${selectedClient}` : ''
            }`,
            reference: selectedClient
              ? `Cliente: ${selectedClient}`
              : undefined,
            soldById: currentProfessionalId || undefined,
          },
          { headers }
        )
      )

      await Promise.all(promises)
    },
    onSuccess: () => {
      toast.success('Venda registrada com sucesso!')
      setCarts({ ...carts, [activeBranch.id]: [] })
      queryClient.invalidateQueries({
        queryKey: ['products', activeBranch?.id],
      })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registrar venda')
    },
  })

  const getStockBadge = (product: Product) => {
    let status: 'low' | 'normal' | 'good' = 'good'
    if (product.currentStock <= product.minStock) {
      status = 'low'
    } else if (product.currentStock <= product.minStock * 2) {
      status = 'normal'
    }

    const config = {
      low: 'bg-destructive/20 text-destructive',
      normal: 'bg-secondary/30 text-secondary-foreground',
      good: 'bg-primary/20 text-primary',
    }
    return (
      <span
        className={`text-xs px-2 py-1 rounded-full font-medium ${config[status]}`}
      >
        {product.currentStock} {product.unit}
      </span>
    )
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className='container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-3 sm:p-6'>
      <div className='lg:col-span-2 bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6'>
          <h3 className='text-base sm:text-lg font-semibold text-foreground'>
            Catálogo de Produtos
          </h3>
          <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <input
                type='text'
                placeholder='Buscar produtos...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-sm bg-input'
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className='w-full sm:w-auto px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-sm bg-input'
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Todas as categorias' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='border border-gray-200 rounded-xl p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <div className='w-12 h-12 bg-gray-200 rounded-lg animate-pulse' />
                  <div className='h-5 w-16 bg-gray-200 rounded-full animate-pulse' />
                </div>
                <div className='h-5 w-24 bg-gray-200 rounded mb-1 animate-pulse' />
                <div className='h-4 w-16 bg-gray-200 rounded mb-2 animate-pulse' />
                <div className='flex justify-between items-center mb-3'>
                  <div className='h-6 w-20 bg-gray-200 rounded animate-pulse' />
                </div>
                <div className='h-10 w-full bg-gray-200 rounded-lg animate-pulse' />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className='text-center text-destructive'>
            Erro ao carregar produtos
          </p>
        ) : !filteredProducts.length ? (
          <p className='text-center text-muted-foreground'>
            Nenhum produto encontrado
          </p>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${
              filteredProducts.length > 9
                ? 'max-h-[600px] overflow-y-auto pr-2'
                : ''
            }`}
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className='border border-border rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col bg-card'
              >
                <div className='flex items-center justify-between mb-3'>
                  <div className='w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex items-center justify-center'>
                    <ShoppingCart className='text-primary w-5 h-5 sm:w-6 sm:h-6' />
                  </div>
                  {getStockBadge(product)}
                </div>
                <h4 className='font-semibold text-foreground mb-1 truncate'>
                  {product.name}
                </h4>
                <p className='text-sm text-muted-foreground mb-2'>
                  {product.category}
                </p>
                <div className='flex justify-between items-center mb-3'>
                  <span className='text-base sm:text-lg font-bold text-primary'>
                    R$ {Number(product.salePrice).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className='mt-auto w-full bg-muted text-foreground py-2 px-4 rounded-lg font-medium hover:opacity-60 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer'
                >
                  <ShoppingCart className='w-4 h-4' />
                  Adicionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='space-y-6'>
        <div className='bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border'>
          <h4 className='font-semibold text-foreground mb-4'>
            Carrinho de Compras
          </h4>
          <div
            className={`space-y-3 mb-4 ${
              cart.length > 5 ? 'max-h-64 overflow-y-auto pr-2' : ''
            }`}
          >
            {cart.length === 0 ? (
              <div className='text-center py-6 sm:py-8 text-muted-foreground'>
                <ShoppingCart className='w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50' />
                <p>Carrinho vazio</p>
                <p className='text-xs sm:text-sm'>
                  Adicione produtos para começar a venda
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className='flex items-center justify-between p-3 border border-border rounded-lg gap-2'
                >
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-foreground truncate'>
                      {item.name}
                    </p>
                    <p className='text-xs sm:text-sm text-muted-foreground'>
                      R$ {Number(item.salePrice).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <div className='flex items-center gap-1 sm:gap-2'>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className='w-6 h-6 bg-muted rounded-full flex items-center justify-center text-foreground hover:bg-hover cursor-pointer'
                    >
                      <Minus className='w-3 h-3' />
                    </button>
                    <span className='w-6 sm:w-8 text-center font-semibold text-sm'>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className='w-6 h-6 bg-muted rounded-full flex items-center justify-center text-foreground hover:bg-hover cursor-pointer'
                    >
                      <Plus className='w-3 h-3' />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className='ml-1 sm:ml-2 text-destructive hover:opacity-80 cursor-pointer'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className='border-t border-border pt-4'>
            <div className='space-y-2 mb-4 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Subtotal:</span>
                <span className='font-semibold'>
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Desconto:</span>
                <span className='font-semibold'>R$ 0,00</span>
              </div>
              <div className='border-t border-border pt-2 flex justify-between text-sm sm:text-base'>
                <span className='font-semibold text-foreground'>Total:</span>
                <span className='font-bold text-primary text-base sm:text-lg'>
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
            <button
              disabled={cart.length === 0}
              onClick={() => createSale.mutate()}
              className='w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground py-3 px-4 rounded-xl font-medium hover:opacity-50 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base'
            >
              <CreditCard className='w-4 h-4' />
              Finalizar Venda
            </button>
          </div>
        </div>

        <div className='bg-card rounded-2xl p-4 sm:p-6 shadow-sm border border-border'>
          <h4 className='font-semibold text-foreground mb-4'>
            Dados do Comprador
          </h4>
          <div className='space-y-4'>
            {/* Cliente Selecionado */}
            {selectedClient ? (
              <div className='bg-muted rounded-lg p-3 flex items-center justify-between'>
                <div>
                  <p className='font-medium text-foreground'>{selectedClient.name}</p>
                  {selectedClient.phone && (
                    <p className='text-sm text-muted-foreground'>{selectedClient.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className='text-destructive hover:opacity-80 cursor-pointer'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
            ) : (
              <div>
                <div className='relative mb-3'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4' />
                  <input
                    type='text'
                    placeholder='Buscar cliente...'
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className='w-full pl-10 pr-4 py-2 sm:py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring text-sm bg-input'
                  />
                </div>

                {clientSearch && (
                  <div className='max-h-32 overflow-y-auto text-sm border border-border rounded-lg mb-3'>
                    {clients
                      .filter((c: any) =>
                        c.name.toLowerCase().includes(clientSearch.toLowerCase())
                      )
                      .map((client: any) => (
                        <div
                          key={client.id}
                          onClick={() => {
                            setSelectedClient(client)
                            setClientSearch('')
                          }}
                          className='p-2 hover:bg-muted cursor-pointer border-b border-border last:border-b-0'
                        >
                          <p className='font-medium'>{client.name}</p>
                          {client.phone && (
                            <p className='text-xs text-muted-foreground'>{client.phone}</p>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                <Dialog open={openClientDialog} onOpenChange={setOpenClientDialog}>
                  <Button
                    className='w-full text-sm text-secondary hover:opacity-80 font-medium border border-border py-2 px-4 rounded-xl hover:bg-hover transition-colors flex items-center justify-center gap-2 cursor-pointer'
                    onClick={() => {
                      setEditingClient(null)
                      setOpenClientDialog(true)
                    }}
                  >
                    <UserPlus className='w-4 h-4' />
                    Novo Cliente
                  </Button>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                      </DialogTitle>
                    </DialogHeader>
                    <ClientForm
                      initialData={editingClient}
                      onSuccess={() => {
                        setOpenClientDialog(false)
                        queryClient.invalidateQueries({
                          queryKey: ['clients', activeBranch?.id],
                        })
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Forma de Pagamento */}
            <div>
              <label className='block text-sm font-medium text-foreground mb-2'>
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className='w-full p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
              >
                <option value='CASH'>Dinheiro</option>
                <option value='CARD'>Cartão</option>
                <option value='PIX'>PIX</option>
                <option value='TRANSFER'>Transferência</option>
                <option value='OTHER'>Outros</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

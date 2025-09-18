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
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  useEffect(() => {
    if (!activeBranch) {return}
    setCarts((prev) => ({
      ...prev,
      [activeBranch.id]: prev[activeBranch.id] || [],
    }))
  }, [activeBranch?.id])

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
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
      if (!activeBranch?.id) {return []}
      const res = await axios.get(`/api/clients?branchId=${activeBranch.id}`)
      return res.data
    },
    enabled: !!activeBranch,
  })

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', activeBranch?.id],
    queryFn: async () => {
      if (!activeBranch?.id) {return []}
      const res = await axios.get(`/api/professionals?branchId=${activeBranch.id}`)
      return res.data
    },
    enabled: !!activeBranch,
  })

  const currentProfessionalId = useMemo(() => {
    if (isProfessional && !isAdmin && user?.name && professionals.length > 0) {
      const currentProfessional = professionals.find((p: any) => p.name === user.name)
      return currentProfessional?.id || ''
    }
    return ''
  }, [isProfessional, isAdmin, user?.name, professionals])

  const addToCart = (product: Product) => {
    if (!activeBranch) {return}
    const existingItem = cart.find((item) => item.id === product.id)
    const updatedCart = existingItem
      ? cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
      )
      : [...cart, { ...product, quantity: 1 }]
    setCarts({ ...carts, [activeBranch.id]: updatedCart })
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (!activeBranch) {return}
    let updatedCart: CartItem[]
    if (newQuantity <= 0) {
      updatedCart = cart.filter((item) => item.id !== productId)
    } else {
      updatedCart = cart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item,
      )
    }
    setCarts({ ...carts, [activeBranch.id]: updatedCart })
  }

  const removeFromCart = (productId: string) => {
    if (!activeBranch) {return}
    const updatedCart = cart.filter((item) => item.id !== productId)
    setCarts({ ...carts, [activeBranch.id]: updatedCart })
  }

  const subtotal = cart.reduce((acc, item) => acc + Number(item.salePrice) * item.quantity, 0)
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))]

  const createSale = useMutation({
    mutationFn: async () => {
      if (!activeBranch?.id) {throw new Error('Filial não selecionada')}
      if (cart.length === 0) {throw new Error('Carrinho vazio')}

      const headers = { 'x-branch-id': activeBranch.id }
      const promises = cart.map((item) =>
        axios.post(
          `/api/products/${item.id}/adjust`,
          {
            type: 'OUT',
            quantity: item.quantity,
            unitCost: item.salePrice,
            reason: `Venda de produto${selectedClient ? ` - Cliente: ${selectedClient}` : ''}`,
            reference: selectedClient ? `Cliente: ${selectedClient}` : undefined,
            soldById: currentProfessionalId || undefined,
          },
          { headers },
        ),
      )

      await Promise.all(promises)
    },
    onSuccess: () => {
      toast.success('Venda registrada com sucesso!')
      setCarts({ ...carts, [activeBranch.id]: [] })
      queryClient.invalidateQueries({ queryKey: ['products', activeBranch?.id] })
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
      low: 'bg-red-100 text-red-700',
      normal: 'bg-yellow-100 text-yellow-700',
      good: 'bg-green-100 text-green-700',
    }
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${config[status]}`}>
        {product.currentStock} {product.unit}
      </span>
    )
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Catálogo de Produtos</h3>
          <div className="flex space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
          <p className="text-center text-gray-500">Carregando produtos...</p>
        ) : error ? (
          <p className="text-center text-red-500">Erro ao carregar produtos</p>
        ) : !filteredProducts.length ? (
          <p className="text-center text-gray-500">Nenhum produto encontrado</p>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${filteredProducts.length > 9 ? 'max-h-[600px] overflow-y-auto' : ''}`}>
            {filteredProducts.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="text-purple-600 w-6 h-6" />
                  </div>
                  {getStockBadge(product)}
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">{product.name}</h4>
                <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-purple-600">
                    R$ {Number(product.salePrice).toFixed(2).replace('.', ',')} cada
                  </span>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-purple-100 text-purple-700 py-2 px-4 rounded-lg font-medium hover:bg-purple-200 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-4">Carrinho de Compras</h4>
          <div className={`space-y-3 mb-4 ${cart.length > 5 ? 'max-h-64 overflow-y-auto' : ''}`}>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Carrinho vazio</p>
                <p className="text-sm">Adicione produtos para começar a venda</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">R$ {Number(item.salePrice).toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t pt-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Desconto:</span>
                <span className="font-semibold">R$ 0,00</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">Total:</span>
                  <span className="font-bold text-purple-600 text-lg">
                    R$ {subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
            <button
              disabled={cart.length === 0}
              onClick={() => createSale.mutate()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Finalizar Venda
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="font-semibold text-gray-800 mb-4">Cliente <span className=' text-gray-400'>(Opcional)</span></h4>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button className="w-full text-sm text-purple-600 hover:text-purple-800 font-medium border border-purple-200 py-2 px-4 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              Novo Cliente
            </button>
            <div className={`max-h-40 overflow-y-auto text-sm ${clients.length > 5 ? 'max-h-64' : ''}`}>
              {clients
                .filter((c: any) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                .map((client: any) => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client.name)}
                    className={`p-2 rounded cursor-pointer ${selectedClient === client.name ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    {client.name}
                  </div>
                ))}
            </div>
            {!selectedClient && (
              <div className="text-center text-sm text-gray-500 py-4">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Nenhum cliente selecionado</p>
              </div>
            )}
            {selectedClient && (
              <p className="text-sm text-green-600 font-medium">Cliente selecionado: {selectedClient}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

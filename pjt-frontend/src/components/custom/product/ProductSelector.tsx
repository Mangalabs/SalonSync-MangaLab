import { useState } from 'react'
import { Search, Plus, Minus } from 'lucide-react'

interface Product {
  id: string
  name: string
  salePrice: string | number
  currentStock: string | number
  unit?: string
}

interface ProductWithQuantity {
  productId: string
  quantity: number
}

interface ProductSelectorProps {
  products: Product[]
  selectedProducts: ProductWithQuantity[]
  onChange: (products: ProductWithQuantity[]) => void
  error?: string
  label?: string
}

export function ProductSelector({
  products,
  selectedProducts,
  onChange,
  error,
  label = 'Produtos',
}: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getProductQuantity = (productId: string): number => {
    const found = selectedProducts.find((p) => p.productId === productId)
    return found?.quantity || 0
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove produto se quantidade for 0
      onChange(selectedProducts.filter((p) => p.productId !== productId))
    } else {
      // Verifica estoque
      const product = products.find((p) => p.id === productId)
      const stock = Number(product?.currentStock || 0)

      if (quantity > stock) {
        alert(`Estoque insuficiente! Disponível: ${stock}`)
        return
      }

      const exists = selectedProducts.find((p) => p.productId === productId)
      if (exists) {
        // Atualiza quantidade
        onChange(
          selectedProducts.map((p) =>
            p.productId === productId ? { ...p, quantity } : p
          )
        )
      } else {
        // Adiciona novo produto
        onChange([...selectedProducts, { productId, quantity }])
      }
    }
  }

  const incrementQuantity = (productId: string) => {
    const currentQty = getProductQuantity(productId)
    handleQuantityChange(productId, currentQty + 1)
  }

  const decrementQuantity = (productId: string) => {
    const currentQty = getProductQuantity(productId)
    if (currentQty > 0) {
      handleQuantityChange(productId, currentQty - 1)
    }
  }

  const calculateSubtotal = (product: Product, quantity: number): number => {
    const price = Number(product.salePrice)
    return price * quantity
  }

  const totalAmount = selectedProducts.reduce((sum, sp) => {
    const product = products.find((p) => p.id === sp.productId)
    if (product) {
      return sum + calculateSubtotal(product, sp.quantity)
    }
    return sum
  }, 0)

  return (
    <div>
      <div className='flex items-center justify-between mb-3'>
        <label className='block text-sm font-medium text-foreground'>
          {label}
        </label>
        {selectedProducts.length > 0 && (
          <span className='text-sm font-semibold text-primary'>
            Total: R$ {totalAmount.toFixed(2)}
          </span>
        )}
      </div>

      {/* Campo de busca */}
      <div className='relative mb-4'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
        <input
          type='text'
          placeholder='Buscar produto...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='w-full pl-10 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
        />
      </div>

      {/* Grid de produtos */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto'>
        {filteredProducts.map((product) => {
          const quantity = getProductQuantity(product.id)
          const price = Number(product.salePrice)
          const stock = Number(product.currentStock)
          const subtotal = calculateSubtotal(product, quantity)
          const isOutOfStock = stock <= 0

          return (
            <div
              key={product.id}
              className={`border rounded-xl p-4 transition-all ${
                quantity > 0
                  ? 'border-primary bg-accent/20'
                  : isOutOfStock
                  ? 'border-border bg-muted/50 opacity-60'
                  : 'border-border hover:border-primary hover:bg-accent/10'
              }`}>
              <div className='space-y-3'>
                {/* Info do produto */}
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <p className='font-medium text-foreground'>
                      {product.name}
                    </p>
                    <p className='text-sm text-muted-foreground mt-1'>
                      R$ {price.toFixed(2)} / {product.unit || 'un'}
                    </p>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      Estoque: {stock} {product.unit || 'un'}
                    </p>
                  </div>
                  {quantity > 0 && (
                    <span className='text-sm font-semibold text-primary'>
                      R$ {subtotal.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Controles de quantidade */}
                {!isOutOfStock && (
                  <div className='flex items-center space-x-2'>
                    <button
                      type='button'
                      onClick={() => decrementQuantity(product.id)}
                      disabled={quantity === 0}
                      className='w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
                      <Minus className='w-4 h-4' />
                    </button>
                    <input
                      type='number'
                      min='0'
                      max={stock}
                      value={quantity || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        handleQuantityChange(product.id, val)
                      }}
                      placeholder='0'
                      className='w-16 text-center px-2 py-1.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground'
                    />
                    <button
                      type='button'
                      onClick={() => incrementQuantity(product.id)}
                      disabled={quantity >= stock}
                      className='w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
                      <Plus className='w-4 h-4' />
                    </button>
                    <span className='text-xs text-muted-foreground'>
                      {product.unit || 'un'}
                    </span>
                  </div>
                )}

                {isOutOfStock && (
                  <p className='text-xs text-destructive font-medium'>
                    Sem estoque
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <p className='text-sm text-muted-foreground text-center py-8'>
          Nenhum produto encontrado
        </p>
      )}

      {error && <p className='text-xs text-destructive mt-2'>{error}</p>}
    </div>
  )
}

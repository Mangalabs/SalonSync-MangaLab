import React, { useState } from 'react'
import { Copy, ExternalLink, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useBranch } from '@/contexts/BranchContext'
import { useUser } from '@/contexts/UserContext'

export function BookingLinkGenerator() {
  const { activeBranch } = useBranch()
  const { user } = useUser()
  const [copied, setCopied] = useState(false)

  if (!activeBranch || !user?.businessName) {
    return null
  }

  const bookingUrl = `${window.location.origin}/booking/${user.businessName}/${activeBranch.name}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      toast.success('Link copiado para a área de transferência!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Agendamento - ${user.businessName}`,
          text: `Agende seu horário em ${user.businessName} - ${activeBranch.name}`,
          url: bookingUrl
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      copyToClipboard()
    }
  }

  const openInNewTab = () => {
    window.open(bookingUrl, '_blank')
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Share2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Link de Agendamento</h3>
          <p className="text-sm text-muted-foreground">Compartilhe com seus clientes</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-sm font-medium text-foreground mb-2">Filial Ativa:</p>
          <p className="text-sm text-muted-foreground">{user.businessName} - {activeBranch.name}</p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-sm font-medium text-foreground mb-2">Link de Agendamento:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={bookingUrl}
              readOnly
              className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-xl hover:opacity-80 transition-opacity"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copiado!' : 'Copiar Link'}
          </button>
          
          <button
            onClick={shareLink}
            className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 px-4 rounded-xl hover:opacity-80 transition-opacity"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </button>
          
          <button
            onClick={openInNewTab}
            className="flex items-center justify-center gap-2 border border-border py-2 px-4 rounded-xl hover:bg-muted transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Testar
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800 font-medium mb-1">Como usar:</p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Envie este link para seus clientes via WhatsApp, SMS ou email</li>
            <li>• O cliente poderá agendar diretamente sem precisar ligar</li>
            <li>• Todos os agendamentos aparecerão no seu painel administrativo</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
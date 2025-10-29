import { useState } from 'react'
import {
  HelpCircle,
  Calendar,
  Users,
  DollarSign,
  Package,
  BarChart3,
  ChevronRight,
  Play,
  BookOpen,
  MessageCircle,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('')

  const helpSections = [
    {
      id: 'getting-started',
      title: 'Primeiros Passos',
      icon: Play,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      items: [
        {
          title: 'Como configurar minha primeira filial',
          content: 'Acesse "Configurações" no menu lateral. Preencha nome da filial, endereço, telefone e horários de funcionamento. Essas informações aparecerão nos links de agendamento público.',
        },
        {
          title: 'Cadastrando profissionais',
          content: 'Vá em "Profissionais" e clique "Novo Profissional". Defina nome, telefone, função (cabeleireiro, manicure, etc.) e percentual de comissão. A comissão é calculada automaticamente quando atendimentos são confirmados.',
        },
        {
          title: 'Criando serviços',
          content: 'Em "Serviços", adicione nome do serviço, preço e duração (15-180 minutos). A duração é usada para calcular horários disponíveis e próxima disponibilidade na fila de atendimento.',
        },
      ],
    },
    {
      id: 'appointments',
      title: 'Agendamentos',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      items: [
        {
          title: 'Como criar um agendamento',
          content: 'Na "Agenda", clique "Agendar Atendimento". Selecione cliente (ou cadastre novo), escolha profissional e serviço. O sistema mostra apenas horários disponíveis baseados na duração do serviço e agenda do profissional.',
        },
        {
          title: 'Visualização Calendário vs Fila',
          content: 'Use o toggle no topo da Agenda. Calendário: visão mensal tradicional. Fila: visualização em tempo real por profissional, mostra status (livre, próximo, atrasado, ocupado) e próxima disponibilidade.',
        },
        {
          title: 'Confirmando atendimentos',
          content: 'Clique no botão verde ✓ no agendamento. Selecione método de pagamento (Dinheiro, Cartão, PIX, Transferência, Outros). Isso gera automaticamente receita no financeiro e comissão para o profissional.',
        },
      ],
    },
    {
      id: 'clients',
      title: 'Clientes',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      items: [
        {
          title: 'Cadastrando clientes',
          content: 'Em "Clientes", clique "Novo Cliente". Preencha nome (obrigatório), telefone e email. O telefone usa máscara automática brasileira. Clientes podem ser selecionados rapidamente durante agendamentos.',
        },
        {
          title: 'Gerando link de agendamento',
          content: 'Em "Configurações", use o "Gerador de Link de Agendamento" para criar links públicos. Clientes podem agendar sozinhos via URL: /booking/{filial}/{unidade}. O sistema mostra apenas horários disponíveis.',
        },
      ],
    },
    {
      id: 'financial',
      title: 'Financeiro',
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      items: [
        {
          title: 'Dashboard financeiro',
          content: 'O painel mostra receita do mês, despesas, lucro líquido e gráficos de tendência. Apenas atendimentos CONFIRMADOS contam para receita. Comissões são calculadas automaticamente.',
        },
        {
          title: 'Registrando receitas e despesas',
          content: 'Em "Financeiro", use "Nova Receita" ou "Nova Despesa". Preencha descrição, valor, categoria e método de pagamento. Receitas de atendimentos são geradas automaticamente na confirmação.',
        },
        {
          title: 'Sistema de comissões',
          content: 'Comissões são calculadas pelo percentual definido no profissional. Geradas automaticamente quando atendimento é confirmado. Aparecem como despesa no financeiro com referência ao atendimento.',
        },
        {
          title: 'Histórico de transações',
          content: 'Todas as movimentações ficam registradas com data, descrição, valor e categoria. Atendimentos confirmados geram automaticamente receita + comissão vinculadas.',
        },
      ],
    },
    {
      id: 'inventory',
      title: 'Estoque',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      items: [
        {
          title: 'Cadastrando produtos',
          content: 'Em "Estoque", clique "Novo Produto". Preencha nome, código (opcional), preço de compra, preço de venda, quantidade inicial e estoque mínimo para alertas.',
        },
        {
          title: 'Movimentações de estoque',
          content: 'Registre ENTRADA (compras), SAÍDA (vendas/uso) e AJUSTE (correções). Cada movimentação fica registrada com data, quantidade, motivo e usuário responsável.',
        },
        {
          title: 'Integração com financeiro',
          content: 'Movimentações de estoque podem gerar automaticamente transações financeiras. Compras viram despesas, vendas viram receitas, mantendo controle integrado.',
        },
      ],
    },
    {
      id: 'reports',
      title: 'Relatórios',
      icon: BarChart3,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      items: [
        {
          title: 'Dashboard principal',
          content: 'Mostra resumo do mês: receita, despesas, lucro, agendamentos de hoje, próximos agendamentos. Gráficos de tendência mensal e ranking de profissionais por receita.',
        },
        {
          title: 'Fila de atendimento',
          content: 'Visualização em tempo real: status de cada profissional, próxima disponibilidade calculada pela duração dos serviços, agendamentos atrasados destacados em vermelho.',
        },
        {
          title: 'Histórico de agendamentos',
          content: 'Lista todos os atendimentos com filtros por data, profissional e status. Mostra método de pagamento, cliente, serviço e valor. Permite confirmar atendimentos pendentes.',
        },
      ],
    },
  ]

  const quickActions = [
    {
      title: 'Criar Agendamento',
      description: 'Agende um novo atendimento',
      icon: Calendar,
      color: 'bg-blue-600',
    },
    {
      title: 'Cadastrar Cliente',
      description: 'Adicione um novo cliente',
      icon: Users,
      color: 'bg-purple-600',
    },
    {
      title: 'Nova Receita',
      description: 'Registre uma receita',
      icon: DollarSign,
      color: 'bg-green-600',
    },
    {
      title: 'Adicionar Produto',
      description: 'Cadastre um produto no estoque',
      icon: Package,
      color: 'bg-orange-600',
    },
  ]

  const filteredSections = helpSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.items.some(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Ajuda</h1>
          <p className="text-gray-600 mt-1">
            Aprenda a usar todas as funcionalidades da plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            <BookOpen className="h-3 w-3 mr-1" />
            Guias Disponíveis
          </Badge>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <HelpCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar por tópicos, funcionalidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-green-600" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{action.title}</h4>
                  <p className="text-xs text-gray-600">{action.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Help Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${section.bgColor}`}>
                  <section.icon className={`h-4 w-4 ${section.color}`} />
                </div>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {section.items.map((item, index) => (
                  <AccordionItem key={index} value={`${section.id}-${index}`}>
                    <AccordionTrigger className="text-left text-sm">
                      {item.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-gray-600">
                      {item.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Support Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Precisa de mais ajuda?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-gray-600 mb-4">
                Não encontrou o que procurava? Nossa equipe de suporte está pronta para ajudar.
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> suporte@salonsync.com</p>
                <p><strong>WhatsApp:</strong> (11) 99999-9999</p>
                <p><strong>Horário:</strong> Segunda a Sexta, 9h às 18h</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-4 w-4 mr-2" />
                Falar no WhatsApp
              </Button>
              <Button variant="outline">
                Enviar Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
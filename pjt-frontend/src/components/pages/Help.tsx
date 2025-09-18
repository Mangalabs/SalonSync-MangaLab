import { useState } from 'react'
import {
  HelpCircle,
  Calendar,
  Users,
  DollarSign,
  Package,
  BarChart3,
  Settings,
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
          content: 'Aprenda a configurar sua filial, adicionar informações básicas e personalizar as configurações iniciais.',
        },
        {
          title: 'Cadastrando profissionais',
          content: 'Veja como adicionar profissionais, definir funções e configurar comissões.',
        },
        {
          title: 'Criando serviços',
          content: 'Configure os serviços oferecidos, preços e vincule aos profissionais.',
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
          content: 'Passo a passo para criar novos agendamentos, selecionar profissionais e serviços.',
        },
        {
          title: 'Gerenciando horários disponíveis',
          content: 'Configure horários de funcionamento e gerencie a disponibilidade dos profissionais.',
        },
        {
          title: 'Confirmando atendimentos',
          content: 'Aprenda a confirmar atendimentos realizados e gerar comissões automaticamente.',
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
          content: 'Como adicionar novos clientes com informações de contato e histórico.',
        },
        {
          title: 'Histórico de atendimentos',
          content: 'Visualize o histórico completo de atendimentos de cada cliente.',
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
          title: 'Controle de receitas e despesas',
          content: 'Gerencie todas as movimentações financeiras, categorizando receitas e despesas.',
        },
        {
          title: 'Despesas fixas',
          content: 'Configure despesas recorrentes como aluguel, salários e contas mensais.',
        },
        {
          title: 'Relatórios financeiros',
          content: 'Analise a performance financeira com relatórios detalhados e gráficos.',
        },
        {
          title: 'Sistema de comissões',
          content: 'Entenda como funciona o cálculo automático de comissões dos profissionais.',
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
          content: 'Adicione produtos ao estoque com preços, códigos e informações detalhadas.',
        },
        {
          title: 'Controle de movimentações',
          content: 'Gerencie entradas, saídas e ajustes de estoque com rastreabilidade completa.',
        },
        {
          title: 'Alertas de estoque mínimo',
          content: 'Configure alertas para produtos com estoque baixo.',
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
          title: 'Dashboard e métricas',
          content: 'Entenda os indicadores principais e como interpretar os dados do dashboard.',
        },
        {
          title: 'Relatórios de performance',
          content: 'Analise a performance dos profissionais e serviços mais procurados.',
        },
        {
          title: 'Exportando dados',
          content: 'Aprenda a exportar relatórios em PDF e Excel para análises externas.',
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
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
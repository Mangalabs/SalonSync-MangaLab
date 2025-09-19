import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Bot } from 'lucide-react'

import axios from '@/lib/axios'
import { useBranch } from '@/contexts/BranchContext'
import { ExportButton } from '@/components/custom/ExportButton'
import { ExportService } from '@/services/exportService'

export default function Reports() {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
  )
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedBranch, setSelectedBranch] = useState<string>('all')
  const { branches } = useBranch()
  const [loadingReport, setLoadingReport] = useState(false)
  const [loadingInsight, setLoadingInsight] = useState(false)

  const formatPeriodLabel = () => {
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`
  }

  const { data: reportData, refetch } = useQuery({
    queryKey: ['consolidated-report', startDate, endDate, selectedBranch],
    queryFn: async () => {
      setLoadingReport(true)
      try {
        const params = new URLSearchParams({ startDate, endDate })
        if (selectedBranch !== 'all') { params.append('branchId', selectedBranch) }

        const [financialRes, appointmentsRes, professionalsRes, stockRes] = await Promise.all([
          axios.get(`/api/financial/summary?${params}`),
          axios.get(`/api/appointments?${params}`),
          axios.get(`/api/professionals${selectedBranch !== 'all' ? `?branchId=${selectedBranch}` : ''}`),
          axios.get(`/api/inventory/movements?${params}`),
        ])

        const filteredProfessionals = professionalsRes.data
        const commissionsPromises = filteredProfessionals.map((prof: any) =>
          axios
            .get(`/api/professionals/${prof.id}/commission?startDate=${startDate}&endDate=${endDate}`)
            .then((res) => ({ professional: prof, commission: res.data }))
            .catch(() => ({ professional: prof, commission: null })),
        )
        const commissionsData = await Promise.all(commissionsPromises)

        const stockMovements = stockRes.data || []
        const stockSummary = {
          totalPurchases: stockMovements.filter((m: any) => m.type === 'IN').reduce((sum: number, m: any) => sum + m.quantity * Number(m.unitCost), 0),
          totalSales: stockMovements.filter((m: any) => m.type === 'OUT').reduce((sum: number, m: any) => sum + m.quantity * Number(m.unitCost), 0),
          totalMovements: stockMovements.length,
        }

        const branch =
          selectedBranch === 'all' ? { name: 'Todas as Filiais' } : branches.find((b) => b.id === selectedBranch)

        const servicesCount: Record<string, number> = {}
        appointmentsRes.data.forEach((a: any) => {
          if (selectedBranch !== 'all' && a.branchId !== selectedBranch) { return }
          a.appointmentServices?.forEach((s: any) => {
            const name = s.service?.name || 'Desconhecido'
            servicesCount[name] = (servicesCount[name] || 0) + 1
          })
        })
        const topServices = Object.entries(servicesCount)
          .map(([name, appointments]) => ({ name, appointments }))
          .sort((a, b) => b.appointments - a.appointments)
          .slice(0, 5)

        return {
          financial: financialRes.data,
          stock: { movements: stockMovements, summary: stockSummary },
          professionals: commissionsData.filter((item) => item.commission),
          branchName: branch?.name || 'Filial Selecionada',
          period: { startDate, endDate, label: formatPeriodLabel() },
          appointments: appointmentsRes.data,
          topServices,
        }
      } finally {
        setLoadingReport(false)
      }
    },
    enabled: false,
  })

  const { data: insights, refetch: refetchInsights } = useQuery({
    queryKey: ['insight-query', startDate, endDate, selectedBranch],
    queryFn: async () => {
      setLoadingInsight(true)
      try {
        const params = new URLSearchParams({ startDate, endDate })
        if (selectedBranch !== 'all') { params.append('branchId', selectedBranch) }
        const res = await axios.get(`/api/ai/insights?${params}`)
        return res.data.map((item: string) => {
          const [title, description] = item.split(':')
          return { title, description }
        })
      } finally {
        setLoadingInsight(false)
      }
    },
    enabled: false,
  })

  const handleGenerateReport = () => refetch()
  const handleGenerateInsight = () => refetchInsights()

  const handleExportReport = (format: 'json' | 'pdf' | 'csv' | 'excel') => {
    if (!reportData) { return }
    switch (format) {
      case 'json': ExportService.exportJSON(reportData); break
      case 'pdf': ExportService.exportPDF(reportData); break
      case 'csv': ExportService.exportCSV(reportData); break
      case 'excel': ExportService.exportExcel(reportData); break
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros de Relatório</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl mt-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filial</label>
            <select className="w-full p-3 border border-gray-200 rounded-xl" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
              <option value="all">Todas as Filiais</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <button
            className={'w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2'}
            onClick={handleGenerateReport}
            disabled={loadingReport}
          >
            {loadingReport ? 'Gerando...' : <><Search className="w-4 h-4" /> Gerar Relatório</>}
          </button>
          {reportData && (
            <button
              className="w-full bg-blue-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 mt-2"
              onClick={handleGenerateInsight}
              disabled={loadingInsight}
            >
              {loadingInsight ? 'Gerando Insight...' : <><Bot size={20} /> Gerar Sugestões da IA</>}
            </button>
          )}
          {reportData && <ExportButton onExport={handleExportReport} />}
        </div>
      </div>

      {reportData && (
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{reportData.branchName} - {reportData.period.label}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-green-50 border-green-200 p-4 rounded-xl border">
              <p className="text-green-600 font-semibold">Receitas</p>
              <p className="text-2xl font-bold text-green-700">R$ {reportData.financial.totalIncome?.toFixed(2) || '0,00'}</p>
            </div>
            <div className="bg-red-50 border-red-200 p-4 rounded-xl border">
              <p className="text-red-600 font-semibold">Despesas</p>
              <p className="text-2xl font-bold text-red-700">R$ {reportData.financial.totalExpenses?.toFixed(2) || '0,00'}</p>
            </div>
            <div className="bg-blue-50 border-blue-200 p-4 rounded-xl border">
              <p className="text-blue-600 font-semibold">Investimentos</p>
              <p className="text-2xl font-bold text-blue-700">R$ {reportData.financial.totalInvestments?.toFixed(2) || '0,00'}</p>
            </div>
            <div className="bg-purple-50 border-purple-200 p-4 rounded-xl border">
              <p className="text-purple-600 font-semibold">Lucro Líquido</p>
              <p className={`text-2xl font-bold ${reportData.financial.netProfit >= 0 ? 'text-[#D4AF37]' : 'text-red-600'}`}>R$ {reportData.financial.netProfit?.toFixed(2) || '0,00'}</p>
            </div>
            <div className="bg-orange-50 border-orange-200 p-4 rounded-xl border">
              <p className="text-orange-600 font-semibold">Atendimentos</p>
              <p className="text-2xl font-bold text-orange-700">{reportData.appointments?.length || 0}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Top 5 Serviços Mais Realizados</h4>
            <div className="space-y-2">
              {reportData.topServices.map((service, i) => (
                <div key={i} className="flex justify-between items-center py-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-semibold">{i + 1}</span>
                    <span className="text-gray-600">{service.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{service.appointments} atendimentos</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {insights && (
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sugestões da IA</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {insights.map((insight) => (
              <div key={insight.title} className="bg-purple-50 border-purple-200 border rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="text-sm font-semibold text-purple-700 mb-2">{insight.title}</div>
                <div className="text-xs text-gray-700 flex-1">{insight.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

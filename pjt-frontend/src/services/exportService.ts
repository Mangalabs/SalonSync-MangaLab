import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ReportData {
  branchName: string;
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  financial: {
    totalIncome: number;
    totalExpenses: number;
    totalInvestments: number;
    netProfit: number;
    appointmentRevenue: number;
  };
  stock: {
    summary: {
      totalPurchases: number;
      totalSales: number;
      totalMovements: number;
    };
    movements: any[];
  };
  professionals: any[];
}

export class ExportService {
  static exportJSON(data: ReportData): void {
    const reportContent = {
      filial: data.branchName,
      periodo: data.period.label,
      dataGeracao: new Date().toLocaleDateString('pt-BR'),
      resumoFinanceiro: {
        receitas: data.financial.totalIncome,
        despesas: data.financial.totalExpenses,
        investimentos: data.financial.totalInvestments,
        lucroLiquido: data.financial.netProfit,
        receitaAtendimentos: data.financial.appointmentRevenue,
      },
      movimentacaoEstoque: {
        totalCompras: data.stock.summary.totalPurchases,
        totalVendas: data.stock.summary.totalSales,
        totalMovimentacoes: data.stock.summary.totalMovements,
      },
      profissionais: data.professionals.map((item: any) => ({
        nome: item.professional.name,
        atendimentos: item.commission.summary.totalAppointments,
        receita: item.commission.summary.totalRevenue,
        comissao: item.commission.summary.totalCommission,
        percentualComissao: item.commission.professional.commissionRate,
      })),
    }

    this.downloadFile(
      JSON.stringify(reportContent, null, 2),
      'application/json',
      this.generateFileName(data, 'json'),
    )
  }

  static exportPDF(data: ReportData): void {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('Relatório Consolidado', 20, 20)
    
    doc.setFontSize(12)
    doc.text(`Filial: ${data.branchName}`, 20, 35)
    doc.text(`Período: ${data.period.label}`, 20, 45)
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, 55)

    let yPosition = 70

    // Financial Summary
    doc.setFontSize(16)
    doc.text('Resumo Financeiro', 20, yPosition)
    yPosition += 15

    const financialData = [
      ['Receitas', `R$ ${data.financial.totalIncome.toFixed(2)}`],
      ['Despesas', `R$ ${data.financial.totalExpenses.toFixed(2)}`],
      ['Investimentos', `R$ ${data.financial.totalInvestments.toFixed(2)}`],
      ['Lucro Líquido', `R$ ${data.financial.netProfit.toFixed(2)}`],
      ['Receita Atendimentos', `R$ ${data.financial.appointmentRevenue.toFixed(2)}`],
    ]

    autoTable(doc, {
      startY: yPosition,
      head: [['Item', 'Valor']],
      body: financialData,
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 20

    // Stock Summary
    doc.setFontSize(16)
    doc.text('Movimentação de Estoque', 20, yPosition)
    yPosition += 15

    const stockData = [
      ['Total Compras', `R$ ${data.stock.summary.totalPurchases.toFixed(2)}`],
      ['Total Vendas', `R$ ${data.stock.summary.totalSales.toFixed(2)}`],
      ['Total Movimentações', data.stock.summary.totalMovements.toString()],
    ]

    autoTable(doc, {
      startY: yPosition,
      head: [['Item', 'Valor']],
      body: stockData,
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 20

    // Professionals Performance
    if (data.professionals.length > 0) {
      doc.setFontSize(16)
      doc.text('Performance dos Profissionais', 20, yPosition)
      yPosition += 15

      const professionalsData = data.professionals.map((item: any) => [
        item.professional.name,
        item.commission.summary.totalAppointments.toString(),
        `R$ ${item.commission.summary.totalRevenue.toFixed(2)}`,
        `R$ ${item.commission.summary.totalCommission.toFixed(2)}`,
        `${item.commission.professional.commissionRate}%`,
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Profissional', 'Atendimentos', 'Receita', 'Comissão', '%']],
        body: professionalsData,
        theme: 'grid',
        headStyles: { fillColor: [212, 175, 55] },
      })
    }

    doc.save(this.generateFileName(data, 'pdf'))
  }

  static exportCSV(data: ReportData): void {
    let csvContent = 'Relatório Consolidado\n'
    csvContent += `Filial,${data.branchName}\n`
    csvContent += `Período,${data.period.label}\n`
    csvContent += `Data de Geração,${new Date().toLocaleDateString('pt-BR')}\n\n`

    // Financial Summary
    csvContent += 'Resumo Financeiro\n'
    csvContent += 'Item,Valor\n'
    csvContent += `Receitas,${data.financial.totalIncome.toFixed(2)}\n`
    csvContent += `Despesas,${data.financial.totalExpenses.toFixed(2)}\n`
    csvContent += `Investimentos,${data.financial.totalInvestments.toFixed(2)}\n`
    csvContent += `Lucro Líquido,${data.financial.netProfit.toFixed(2)}\n`
    csvContent += `Receita Atendimentos,${data.financial.appointmentRevenue.toFixed(2)}\n\n`

    // Stock Summary
    csvContent += 'Movimentação de Estoque\n'
    csvContent += 'Item,Valor\n'
    csvContent += `Total Compras,${data.stock.summary.totalPurchases.toFixed(2)}\n`
    csvContent += `Total Vendas,${data.stock.summary.totalSales.toFixed(2)}\n`
    csvContent += `Total Movimentações,${data.stock.summary.totalMovements}\n\n`

    // Professionals Performance
    if (data.professionals.length > 0) {
      csvContent += 'Performance dos Profissionais\n'
      csvContent += 'Profissional,Atendimentos,Receita,Comissão,Percentual\n'
      data.professionals.forEach((item: any) => {
        csvContent += `${item.professional.name},${item.commission.summary.totalAppointments},${item.commission.summary.totalRevenue.toFixed(2)},${item.commission.summary.totalCommission.toFixed(2)},${item.commission.professional.commissionRate}%\n`
      })
    }

    this.downloadFile(csvContent, 'text/csv', this.generateFileName(data, 'csv'))
  }

  static exportExcel(data: ReportData): void {
    // Para Excel, vamos usar CSV com separador de ponto e vírgula
    let csvContent = 'Relatório Consolidado\n'
    csvContent += `Filial;${data.branchName}\n`
    csvContent += `Período;${data.period.label}\n`
    csvContent += `Data de Geração;${new Date().toLocaleDateString('pt-BR')}\n\n`

    // Financial Summary
    csvContent += 'Resumo Financeiro\n'
    csvContent += 'Item;Valor\n'
    csvContent += `Receitas;${data.financial.totalIncome.toFixed(2).replace('.', ',')}\n`
    csvContent += `Despesas;${data.financial.totalExpenses.toFixed(2).replace('.', ',')}\n`
    csvContent += `Investimentos;${data.financial.totalInvestments.toFixed(2).replace('.', ',')}\n`
    csvContent += `Lucro Líquido;${data.financial.netProfit.toFixed(2).replace('.', ',')}\n`
    csvContent += `Receita Atendimentos;${data.financial.appointmentRevenue.toFixed(2).replace('.', ',')}\n\n`

    // Stock Summary
    csvContent += 'Movimentação de Estoque\n'
    csvContent += 'Item;Valor\n'
    csvContent += `Total Compras;${data.stock.summary.totalPurchases.toFixed(2).replace('.', ',')}\n`
    csvContent += `Total Vendas;${data.stock.summary.totalSales.toFixed(2).replace('.', ',')}\n`
    csvContent += `Total Movimentações;${data.stock.summary.totalMovements}\n\n`

    // Professionals Performance
    if (data.professionals.length > 0) {
      csvContent += 'Performance dos Profissionais\n'
      csvContent += 'Profissional;Atendimentos;Receita;Comissão;Percentual\n'
      data.professionals.forEach((item: any) => {
        csvContent += `${item.professional.name};${item.commission.summary.totalAppointments};${item.commission.summary.totalRevenue.toFixed(2).replace('.', ',')};${item.commission.summary.totalCommission.toFixed(2).replace('.', ',')};${item.commission.professional.commissionRate}%\n`
      })
    }

    this.downloadFile(csvContent, 'text/csv', this.generateFileName(data, 'xlsx'))
  }

  private static downloadFile(content: string, mimeType: string, filename: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  private static generateFileName(data: ReportData, extension: string): string {
    const branchSlug = data.branchName.toLowerCase().replace(/\s+/g, '-')
    return `relatorio-${branchSlug}-${data.period.startDate}-${data.period.endDate}.${extension}`
  }
}
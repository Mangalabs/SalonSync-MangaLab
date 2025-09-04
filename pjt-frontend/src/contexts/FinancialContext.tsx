import { createContext, useContext, useState, type ReactNode } from 'react'

interface FinancialContextType {
  startDate: string;
  endDate: string;
  branchFilter: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setBranchFilter: (branch: string) => void;
  resetToToday: () => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined)

export function FinancialProvider({ children }: { children: ReactNode }) {
  const today = new Date().toISOString().split('T')[0]
  
  const [startDate, setStartDateState] = useState(() => localStorage.getItem('financial-start-date') || today)
  
  const [endDate, setEndDateState] = useState(() => localStorage.getItem('financial-end-date') || today)
  
  const [branchFilter, setBranchFilterState] = useState(() => {
    const saved = localStorage.getItem('financial-branch-filter') || 'all'
    console.log('FinancialContext initial branchFilter:', saved)
    return saved
  })

  const setStartDate = (date: string) => {
    setStartDateState(date)
    localStorage.setItem('financial-start-date', date)
  }

  const setEndDate = (date: string) => {
    setEndDateState(date)
    localStorage.setItem('financial-end-date', date)
  }

  const setBranchFilter = (branch: string) => {
    console.log('FinancialContext setBranchFilter:', branch)
    setBranchFilterState(branch)
    localStorage.setItem('financial-branch-filter', branch)
  }

  const resetToToday = () => {
    setStartDate(today)
    setEndDate(today)
  }

  return (
    <FinancialContext.Provider
      value={{
        startDate,
        endDate,
        branchFilter,
        setStartDate,
        setEndDate,
        setBranchFilter,
        resetToToday,
      }}
    >
      {children}
    </FinancialContext.Provider>
  )
}

export function useFinancial() {
  const context = useContext(FinancialContext)
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider')
  }
  return context
}
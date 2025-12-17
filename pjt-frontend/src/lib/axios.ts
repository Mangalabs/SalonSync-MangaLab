import axios from 'axios'
import { toast } from 'sonner'

axios.defaults.baseURL = import.meta.env.VITE_API_URL
axios.defaults.timeout = 10000 // 10 segundos

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const activeBranchId = localStorage.getItem('activeBranchId')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const fullUrl = config.baseURL ? config.baseURL + config.url : config.url
  const urlHasBranchId =
    fullUrl?.includes('branchId=') || config.params?.branchId

  if (config.headers['x-skip-branch-header']) {
    delete config.headers['x-skip-branch-header']
  } else if (
    activeBranchId &&
    !config.headers['x-branch-id'] &&
    !urlHasBranchId
  ) {
    config.headers['x-branch-id'] = activeBranchId
  }
  return config
})

function getErrorMessage(error: any): string {
  if (!navigator.onLine) {
    return 'Sem conexão com a internet. Verifique sua conexão e tente novamente.'
  }

  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  }

  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return 'A operação demorou muito para responder. Tente novamente.'
  }

  if (error.response) {
    const status = error.response.status
    const data = error.response.data

    const extractMessage = (data: any): string | null => {
      if (!data) return null

      if (typeof data.message === 'string') {
        return data.message
      }

      if (typeof data.message === 'object' && data.message !== null) {
        if (typeof data.message.message === 'string') {
          return data.message.message
        }
        if (typeof data.message.error === 'string') {
          return data.message.error
        }
      }

      if (Array.isArray(data.message)) {
        return data.message.filter((m) => typeof m === 'string').join(', ')
      }

      return null
    }

    switch (status) {
      case 400:
        return (
          extractMessage(data) ||
          'Dados inválidos. Verifique as informações e tente novamente.'
        )
      case 401:
        return 'Sessão expirada. Você será redirecionado para o login.'
      case 403:
        return 'Você não tem permissão para realizar esta ação.'
      case 404:
        return 'Recurso não encontrado. A página ou dados podem ter sido removidos.'
      case 409:
        return (
          extractMessage(data) || 'Conflito de dados. Verifique as informações.'
        )
      case 422:
        return (
          extractMessage(data) ||
          'Dados inválidos. Verifique os campos obrigatórios.'
        )
      case 429:
        return 'Muitas tentativas. Aguarde um momento e tente novamente.'
      case 500:
        return 'Erro interno do servidor. Nossa equipe foi notificada.'
      case 502:
      case 503:
      case 504:
        return 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.'
      default:
        return (
          extractMessage(data) ||
          `Erro ${status}: Algo deu errado. Tente novamente.`
        )
    }
  }

  return error.message || 'Erro inesperado. Tente novamente.'
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = getErrorMessage(error)

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      toast.error('Sessão expirada. Redirecionando para o login...')
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
      return Promise.reject(error)
    }

    if (
      !error.config?.headers?.['x-silent-error'] &&
      !error.config?.headers?.['X-Skip-Toast']
    ) {
      toast.error(errorMessage)
    }

    error.userMessage = errorMessage
    return Promise.reject(error)
  }
)

export default axios

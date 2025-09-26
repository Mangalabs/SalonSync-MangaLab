import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_URL

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const activeBranchId = localStorage.getItem('activeBranchId')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const fullUrl = config.baseURL ? config.baseURL + config.url : config.url
  const urlHasBranchId = fullUrl?.includes('branchId=') || config.params?.branchId
  
  
  if (config.headers['x-skip-branch-header']) {
    delete config.headers['x-skip-branch-header']
  } else if (activeBranchId && !config.headers['x-branch-id'] && !urlHasBranchId) {
    config.headers['x-branch-id'] = activeBranchId
  }
  return config
})

axios.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

export default axios

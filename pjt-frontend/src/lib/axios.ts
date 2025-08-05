import axios from 'axios';

// Configurar baseURL
axios.defaults.baseURL = 'http://localhost:3000';

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const activeBranchId = localStorage.getItem('activeBranchId');
  
  console.log('🔍 Axios Request:', {
    url: config.url,
    method: config.method,
    token: token ? 'Present' : 'Missing',
    branchId: activeBranchId || 'Missing'
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (activeBranchId) {
    config.headers['x-branch-id'] = activeBranchId;
  }
  
  return config;
});

axios.interceptors.response.use(
  (response) => {
    console.log('✅ Axios Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('❌ Axios Error:', error.response?.status, error.config?.url, error.response?.data);
    return Promise.reject(error);
  }
);

export default axios;
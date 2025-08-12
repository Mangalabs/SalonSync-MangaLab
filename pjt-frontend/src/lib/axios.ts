import axios from "axios";

// Configurar baseURL
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const activeBranchId = localStorage.getItem("activeBranchId");

  console.log("🔍 Axios Request:", {
    url: config.url,
    method: config.method,
    token: token ? "Present" : "Missing",
    branchId: activeBranchId || "Missing",
    existingBranchHeader: config.headers["x-branch-id"] || "None",
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Sempre enviar x-branch-id se disponível, a menos que já esteja definido
  if (activeBranchId && !config.headers["x-branch-id"]) {
    config.headers["x-branch-id"] = activeBranchId;
  }

  return config;
});

axios.interceptors.response.use(
  (response) => {
    console.log("✅ Axios Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;

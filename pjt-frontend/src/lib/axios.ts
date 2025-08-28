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

  // Verificar se a URL já contém branchId como parâmetro
  const fullUrl = config.baseURL ? config.baseURL + config.url : config.url;
  const urlHasBranchId = fullUrl?.includes('branchId=') || config.params?.branchId;
  
  // Log para debug ANTES de modificar headers
  console.log("🔍 Axios Request Analysis:", {
    url: config.url,
    fullUrl,
    method: config.method,
    urlHasBranchId,
    existingHeader: config.headers["x-branch-id"],
    activeBranchId,
    params: config.params
  });
  
  // Verificar se deve pular o header automático
  if (config.headers["x-skip-branch-header"]) {
    console.log("⚠️ Skipping x-branch-id header - x-skip-branch-header present");
    delete config.headers["x-skip-branch-header"];
  } else if (activeBranchId && !config.headers["x-branch-id"] && !urlHasBranchId) {
    config.headers["x-branch-id"] = activeBranchId;
    console.log("✅ Added x-branch-id header:", activeBranchId);
  } else if (urlHasBranchId) {
    console.log("⚠️ Skipping x-branch-id header - URL has branchId parameter");
  }
  
  // Log final
  console.log("🔍 Final request:", {
    "x-branch-id": config.headers["x-branch-id"],
    url: config.url,
    method: config.method
  });

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

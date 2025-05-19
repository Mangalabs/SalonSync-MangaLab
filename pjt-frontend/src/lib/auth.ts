export function isAuthenticated(): boolean {
  return !!localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
}

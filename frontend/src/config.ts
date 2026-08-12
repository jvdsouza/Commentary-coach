export const featureFlags = {
  devPanel: import.meta.env.DEV,
}

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URLS,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
})

// Optional: Global Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error?.response || error)
    return Promise.reject(error)
  }
)

export default api
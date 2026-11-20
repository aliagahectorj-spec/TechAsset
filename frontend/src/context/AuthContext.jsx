import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, getToken, setToken, setUnauthorizedHandler } from '../lib/api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!getToken())

  const logout = useCallback(() => { setToken(null); setUser(null) }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!getToken()) return
    api.get('/auth/me').then(setUser).catch(logout).finally(() => setLoading(false))
  }, [logout])

  const login = async (correo, password) => {
    const res = await api.post('/auth/login', { correo, password })
    setToken(res.token)
    setUser(res.usuario)
    return res.usuario
  }

  const hasRole = (...roles) => !!user && roles.includes(user.rol)

  return <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>{children}</AuthContext.Provider>
}

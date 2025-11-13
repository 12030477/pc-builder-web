import React, { createContext, useContext, useReducer, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext()

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        isAdmin: action.payload.user.is_admin === 1
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isAdmin: false
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isAdmin: false
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        dispatch({ type: 'LOGIN_FAILURE' })
        return
      }

      const response = await api.get('/auth/verify')

      if (response.data.success) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: response.data.user }
        })
      } else {
        localStorage.removeItem('token')
        dispatch({ type: 'LOGIN_FAILURE' })
      }
    } catch (error) {
      localStorage.removeItem('token')
      dispatch({ type: 'LOGIN_FAILURE' })
    }
  }

  const login = async (email, password) => {
    try {
      dispatch({ type: 'LOGIN_START' })
      
      const response = await api.post('/auth/login', {
        email,
        password
      })

      if (response.data.success || response.data.status === 'success') {
        localStorage.setItem('token', response.data.token)
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: response.data.user }
        })
        return { success: true }
      } else {
        dispatch({ type: 'LOGIN_FAILURE' })
        return { success: false, message: response.data.message }
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' })
      const errorMessage = error.response?.data?.message || 
                          (error.code === 'ECONNREFUSED' 
                            ? 'Cannot connect to server. Make sure backend is running on port 5000.'
                            : 'Login failed')
      return { 
        success: false, 
        message: errorMessage
      }
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password
      })

      if (response.data.success || response.data.status === 'success') {
        return { success: true, message: response.data.message }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    dispatch({ type: 'LOGOUT' })
  }

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData })
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

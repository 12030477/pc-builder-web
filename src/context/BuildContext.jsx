import React, { createContext, useContext, useReducer } from 'react'

const BuildContext = createContext()

const initialState = {
  selectedComponents: {},
  totalPrice: 0,
  compatibilityStatus: 'Compatible',
  compatibilityIssues: [],
  isLoading: false,
  error: null
}

const buildReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'SELECT_COMPONENT':
      const newSelectedComponents = {
        ...state.selectedComponents,
        [action.payload.category]: action.payload.component
      }
      return {
        ...state,
        selectedComponents: newSelectedComponents,
        totalPrice: calculateTotalPrice(newSelectedComponents),
        isLoading: false
      }
    case 'REMOVE_COMPONENT':
      const updatedComponents = { ...state.selectedComponents }
      delete updatedComponents[action.payload]
      return {
        ...state,
        selectedComponents: updatedComponents,
        totalPrice: calculateTotalPrice(updatedComponents)
      }
    case 'RESET_BUILD':
      return {
        ...state,
        selectedComponents: {},
        totalPrice: 0,
        compatibilityStatus: 'Compatible',
        compatibilityIssues: []
      }
    case 'SET_COMPATIBILITY':
      return {
        ...state,
        compatibilityStatus: action.payload.status,
        compatibilityIssues: action.payload.issues || []
      }
    case 'LOAD_BUILD':
      return {
        ...state,
        selectedComponents: action.payload.components || {},
        totalPrice: action.payload.totalPrice || 0,
        isLoading: false
      }
    default:
      return state
  }
}

const calculateTotalPrice = (components) => {
  return Object.values(components).reduce((total, component) => {
    return total + (component.price || 0)
  }, 0)
}

export const BuildProvider = ({ children }) => {
  const [state, dispatch] = useReducer(buildReducer, initialState)

  const selectComponent = (category, component) => {
    dispatch({
      type: 'SELECT_COMPONENT',
      payload: { category, component }
    })
  }

  const removeComponent = (category) => {
    dispatch({
      type: 'REMOVE_COMPONENT',
      payload: category
    })
  }

  const resetBuild = () => {
    dispatch({ type: 'RESET_BUILD' })
  }

  const setCompatibility = (status, issues = []) => {
    dispatch({
      type: 'SET_COMPATIBILITY',
      payload: { status, issues }
    })
  }

  const loadBuild = (buildData) => {
    dispatch({
      type: 'LOAD_BUILD',
      payload: buildData
    })
  }

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  const value = {
    ...state,
    selectComponent,
    removeComponent,
    resetBuild,
    setCompatibility,
    loadBuild,
    setLoading,
    setError
  }

  return (
    <BuildContext.Provider value={value}>
      {children}
    </BuildContext.Provider>
  )
}

export const useBuild = () => {
  const context = useContext(BuildContext)
  if (!context) {
    throw new Error('useBuild must be used within a BuildProvider')
  }
  return context
}

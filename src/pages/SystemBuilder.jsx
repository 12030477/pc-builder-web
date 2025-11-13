import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useBuild } from '../context/BuildContext'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import api from '../utils/api'
import { 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  X,
  Plus,
  DollarSign,
  LogIn
} from 'lucide-react'

const SystemBuilder = () => {
  const { 
    selectedComponents, 
    totalPrice, 
    compatibilityStatus, 
    compatibilityIssues,
    selectComponent, 
    removeComponent, 
    resetBuild,
    setLoading,
    loadBuild
  } = useBuild()
  
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const buildId = searchParams.get('build_id')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentComponentType, setCurrentComponentType] = useState(null)
  const [availableComponents, setAvailableComponents] = useState([])
  const [buildName, setBuildName] = useState('')
  const [buildVisibility, setBuildVisibility] = useState('private')
  const [isLoadingBuild, setIsLoadingBuild] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Ref to track if build is currently being loaded to prevent infinite loops
  const isLoadingRef = useRef(false)
  const loadedBuildIdRef = useRef(null)
  const hasLoadedDraftRef = useRef(false)
  const savedStateBeforeEditRef = useRef(null) // Save state before entering edit mode

  const componentTypes = [
    { key: 'CPU', label: 'CPU', required: true },
    { key: 'Motherboard', label: 'Motherboard', required: true },
    { key: 'RAM', label: 'Memory', required: true },
    { key: 'GPU', label: 'Graphics Card', required: true },
    { key: 'Storage', label: 'Storage', required: true },
    { key: 'PSU', label: 'Power Supply', required: true },
    { key: 'Case', label: 'Case', required: true },
    { key: 'Cooler', label: 'CPU Cooler', required: true }
  ]

  // CRITICAL: Clear build context immediately on mount if no buildId
  // This MUST run FIRST, before any restoration, to prevent edit mode components from showing
  // BuildContext persists across navigation, so we must clear it explicitly
  useEffect(() => {
    // Get buildId from URL on mount (before any async operations)
    const urlParams = new URLSearchParams(window.location.search)
    const urlBuildId = urlParams.get('build_id')
    
    // If no buildId in URL, immediately clear everything
    // This ensures edit mode components don't persist when navigating back
    if (!urlBuildId) {
      console.log('[SystemBuilder] No buildId - clearing context immediately')
      resetBuild()
      setBuildName('')
      setBuildVisibility('private')
      setIsEditMode(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run ONLY on mount - synchronously clear

  // Persist build state to localStorage (only when not in edit mode and not currently loading)
  useEffect(() => {
    // Skip if we're currently loading a build or if we're in edit mode
    if (isLoadingRef.current || isEditMode || buildId) {
      return
    }
    
    // Only save if there's actual content to save
    if (Object.keys(selectedComponents).length > 0 || buildName.trim()) {
      const buildState = {
        selectedComponents,
        buildName,
        buildVisibility,
        timestamp: Date.now()
      }
      localStorage.setItem('pcbuilder_draft_build', JSON.stringify(buildState))
    }
  }, [selectedComponents, buildName, buildVisibility, buildId, isEditMode])

  // Load build data when build_id is present (edit mode) or restore from localStorage
  useEffect(() => {
    const loadBuildData = async () => {
      // Prevent multiple simultaneous loads
      if (isLoadingRef.current) {
        return
      }
      
      if (!buildId) {
        // No build_id - Check if we should restore from localStorage (only once)
        if (hasLoadedDraftRef.current) {
          return
        }
        
        hasLoadedDraftRef.current = true
        isLoadingRef.current = true
        
        // ALWAYS clear build context first (BuildContext persists across navigation)
        // This ensures edit mode components don't persist
        resetBuild()
        setBuildName('')
        setBuildVisibility('private')
        
        // Small delay to ensure reset happens before restoration
        await new Promise(resolve => setTimeout(resolve, 0))
        
        try {
          // FIRST: Check if we were in edit mode (navigated away from edit mode)
          const wasInEditMode = localStorage.getItem('pcbuilder_in_edit_mode')
          
          if (wasInEditMode) {
            // We were in edit mode - clear the flag
            localStorage.removeItem('pcbuilder_in_edit_mode')
            
            // Check for pre-edit draft (saved before entering edit mode)
            const preEditDraft = localStorage.getItem('pcbuilder_pre_edit_draft')
            
            if (preEditDraft) {
              try {
                const draft = JSON.parse(preEditDraft)
                // Only restore if it's marked as pre-edit state
                if (draft.isPreEditState && draft.selectedComponents) {
                  // Restore the state from before edit mode
                  if (Object.keys(draft.selectedComponents).length > 0) {
                    const totalPrice = Object.values(draft.selectedComponents).reduce((total, component) => {
                      return total + (component.price || 0) * (component.quantity || 1)
                    }, 0)
                    loadBuild({
                      components: draft.selectedComponents,
                      totalPrice: totalPrice
                    })
                  }
                  setBuildName(draft.buildName || '')
                  setBuildVisibility(draft.buildVisibility || 'private')
                  // Move to main draft storage and remove pre-edit draft
                  localStorage.setItem('pcbuilder_draft_build', JSON.stringify({
                    selectedComponents: draft.selectedComponents,
                    buildName: draft.buildName || '',
                    buildVisibility: draft.buildVisibility || 'private',
                    timestamp: Date.now()
                  }))
                  localStorage.removeItem('pcbuilder_pre_edit_draft')
                  setIsEditMode(false)
                  isLoadingRef.current = false
                  return
                }
              } catch (error) {
                console.error('Error restoring pre-edit draft:', error)
                localStorage.removeItem('pcbuilder_pre_edit_draft')
              }
            }
            // If no pre-edit draft or error, we already cleared above - just return
            setIsEditMode(false)
            isLoadingRef.current = false
            return
          }
          
          // SECOND: Check for pre-edit draft (in case flag wasn't set but draft exists)
          const preEditDraft = localStorage.getItem('pcbuilder_pre_edit_draft')
          if (preEditDraft) {
            try {
              const draft = JSON.parse(preEditDraft)
              if (draft.isPreEditState && draft.selectedComponents) {
                // Restore pre-edit state
                if (Object.keys(draft.selectedComponents).length > 0) {
                  const totalPrice = Object.values(draft.selectedComponents).reduce((total, component) => {
                    return total + (component.price || 0) * (component.quantity || 1)
                  }, 0)
                  loadBuild({
                    components: draft.selectedComponents,
                    totalPrice: totalPrice
                  })
                }
                setBuildName(draft.buildName || '')
                setBuildVisibility(draft.buildVisibility || 'private')
                localStorage.setItem('pcbuilder_draft_build', JSON.stringify({
                  selectedComponents: draft.selectedComponents,
                  buildName: draft.buildName || '',
                  buildVisibility: draft.buildVisibility || 'private',
                  timestamp: Date.now()
                }))
                localStorage.removeItem('pcbuilder_pre_edit_draft')
                setIsEditMode(false)
                isLoadingRef.current = false
                return
              }
            } catch (error) {
              localStorage.removeItem('pcbuilder_pre_edit_draft')
            }
          }
          
          // THIRD: Check for guest build (saved when trying to save without login)
          const guestBuild = localStorage.getItem('pcbuilder_guest_build')
          const savedDraft = localStorage.getItem('pcbuilder_draft_build')
          
          // Prioritize guest build if it exists (user just logged in)
          const buildToRestore = guestBuild || savedDraft
          
          if (buildToRestore) {
            try {
              const draft = JSON.parse(buildToRestore)
              // Restore components if any (we already cleared above)
              if (draft.selectedComponents && Object.keys(draft.selectedComponents).length > 0) {
                const totalPrice = Object.values(draft.selectedComponents).reduce((total, component) => {
                  return total + (component.price || 0) * (component.quantity || 1)
                }, 0)
                loadBuild({
                  components: draft.selectedComponents,
                  totalPrice: totalPrice
                })
              }
              // Restore build name and visibility
              if (draft.buildName) setBuildName(draft.buildName)
              if (draft.buildVisibility) setBuildVisibility(draft.buildVisibility)
              
              // If this was a guest build and user is now authenticated, migrate to draft
              if (guestBuild && isAuthenticated) {
                // Move guest build to draft build so it persists
                localStorage.setItem('pcbuilder_draft_build', guestBuild)
                localStorage.removeItem('pcbuilder_guest_build')
                toast.success('Your build has been restored!', { id: 'build-restored', duration: 2000 })
              }
            } catch (error) {
              console.error('Error restoring draft build:', error)
              localStorage.removeItem('pcbuilder_draft_build')
              localStorage.removeItem('pcbuilder_guest_build')
              // Already cleared above
            }
          }
          // If no draft, we already cleared everything above - just ensure fields are empty
          if (!buildToRestore) {
            setBuildName('')
            setBuildVisibility('private')
          }
          setIsEditMode(false)
        } finally {
          isLoadingRef.current = false
        }
        return
      }

      // Check if this build is already loaded
      if (loadedBuildIdRef.current === buildId) {
        return
      }

      // Check if user is authenticated
      if (!isAuthenticated) {
        toast.error('Please sign in to edit builds', { id: 'auth-error' })
        navigate('/signin')
        return
      }

      // Save current state before entering edit mode
      // Always save to localStorage so it persists even if component unmounts
      const currentState = {
        selectedComponents: selectedComponents,
        buildName: buildName,
        buildVisibility: buildVisibility,
        timestamp: Date.now(),
        isPreEditState: true
      }
      
      // Save to localStorage - this will persist even if component unmounts
      localStorage.setItem('pcbuilder_pre_edit_draft', JSON.stringify(currentState))
      
      // Also save to ref for immediate access
      savedStateBeforeEditRef.current = {
        selectedComponents: { ...selectedComponents },
        buildName: buildName,
        buildVisibility: buildVisibility,
        totalPrice: totalPrice
      }
      
      // Mark that we're entering edit mode (persist in localStorage)
      localStorage.setItem('pcbuilder_in_edit_mode', buildId)

      // Set loading flag to prevent multiple simultaneous loads
      isLoadingRef.current = true
      setIsLoadingBuild(true)
      setIsEditMode(true)

      try {
        const response = await api.get(`/builds/${buildId}`)
        
        if (response.data.status === 'success') {
          const build = response.data.build
          const components = response.data.components || []

          // Check if user owns this build
          if (build.user_id !== user?.user_id) {
            toast.error('You can only edit your own builds', { id: 'auth-error' })
            navigate('/search-builds?view=private')
            isLoadingRef.current = false
            return
          }

          // Set build name and visibility
          setBuildName(build.name)
          setBuildVisibility(build.is_public ? 'public' : 'private')

          // Transform components to match BuildContext format
          // Map category names from database to component type keys
          const categoryMapping = {
            'CPU': 'CPU',
            'Motherboard': 'Motherboard',
            'Memory': 'RAM',
            'RAM': 'RAM',
            'Graphics Card': 'GPU',
            'GPU': 'GPU',
            'Storage': 'Storage',
            'Power Supply': 'PSU',
            'PSU': 'PSU',
            'Case': 'Case',
            'CPU Cooler': 'Cooler',
            'Cooler': 'Cooler'
          }
          
          const componentsByCategory = {}
          components.forEach(comp => {
            const category = comp.category || 'Other'
            // Map category name to component type key
            const componentKey = categoryMapping[category] || category
            
            // Only add if it's a recognized component type
            if (componentTypes.some(type => type.key === componentKey)) {
              componentsByCategory[componentKey] = {
                component_id: comp.component_id,
                name: comp.name,
                price: parseFloat(comp.price) || 0,
                quantity: comp.quantity || 1,
                manufacturer: comp.manufacturer,
                model: comp.model,
                category: comp.category,
                specs: comp.socket_type || comp.ram_type || comp.model || ''
              }
            }
          })

          // Calculate total price
          const totalPrice = components.reduce((sum, comp) => {
            return sum + (parseFloat(comp.price) || 0) * (comp.quantity || 1)
          }, 0)

          // Load build into context (this will update selectedComponents)
          loadBuild({
            components: componentsByCategory,
            totalPrice: totalPrice
          })

          // Mark this build as loaded
          loadedBuildIdRef.current = buildId
          // Persist edit mode flag in localStorage
          localStorage.setItem('pcbuilder_in_edit_mode', buildId)
          
          toast.success('Build loaded successfully', { id: 'build-loaded', duration: 2000 })
        } else {
          toast.error('Failed to load build', { id: 'load-error' })
          // Clear edit mode flag on error
          localStorage.removeItem('pcbuilder_in_edit_mode')
          localStorage.removeItem('pcbuilder_pre_edit_draft')
          navigate('/search-builds?view=private')
        }
      } catch (error) {
        console.error('Error loading build:', error)
        // Clear edit mode flag on error
        localStorage.removeItem('pcbuilder_in_edit_mode')
        localStorage.removeItem('pcbuilder_pre_edit_draft')
        toast.error(error.response?.data?.message || 'Failed to load build', { id: 'load-error' })
        navigate('/search-builds?view=private')
      } finally {
        setIsLoadingBuild(false)
        isLoadingRef.current = false
      }
    }

    loadBuildData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, isAuthenticated, user?.user_id])

  // Reset loaded build ID when buildId changes to null (leaving edit mode via Cancel button)
  // Note: When navigating away, component unmounts, so refs reset. We use localStorage flags instead.
  useEffect(() => {
    // Only run when transitioning from edit mode (buildId was set, now it's null)
    if (!buildId && loadedBuildIdRef.current !== null) {
      // Clear the loaded build reference
      loadedBuildIdRef.current = null
      setIsEditMode(false)
      // Clear edit mode flag immediately (Cancel button clicked)
      localStorage.removeItem('pcbuilder_in_edit_mode')
      // Reset draft loading flag
      hasLoadedDraftRef.current = false
    }
  }, [buildId])

  // Helper function to calculate total price
  const calculateTotalPrice = (components) => {
    return Object.values(components).reduce((total, component) => {
      return total + (component.price || 0) * (component.quantity || 1)
    }, 0)
  }

  const openComponentModal = async (componentType) => {
    setCurrentComponentType(componentType)
    setLoading(true)
    
    try {
      // Build query parameters for compatibility filtering
      const params = new URLSearchParams()
      params.append('component_type', componentType)
      
      if (selectedComponents.CPU) params.append('cpu_id', selectedComponents.CPU.component_id)
      if (selectedComponents.Motherboard) params.append('motherboard_id', selectedComponents.Motherboard.component_id)
      if (selectedComponents.RAM) params.append('ram_id', selectedComponents.RAM.component_id)
      
      const response = await fetch(`/api/components/filtered?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.status === 'success' && data.components) {
        setAvailableComponents(data.components)
        setIsModalOpen(true)
      } else {
        console.error('API response:', data)
        toast.error(data.message || 'Failed to load components', { id: 'load-error' })
      }
    } catch (error) {
      console.error('Error loading components:', error)
      toast.error(`Error loading components: ${error.message}`, { id: 'load-error' })
    } finally {
      setLoading(false)
    }
  }

  const handleComponentSelect = (component) => {
    selectComponent(currentComponentType, component)
    setIsModalOpen(false)
    // Use a consistent toast ID to replace previous component selection toasts
    toast.success(`${component.name} selected`, {
      id: 'component-selected',
      duration: 1200,
    })
  }

  const handleCreateBuild = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save draft build to localStorage for guest users
      const draftBuild = {
        selectedComponents,
        buildName,
        buildVisibility,
        timestamp: Date.now()
      }
      localStorage.setItem('pcbuilder_guest_build', JSON.stringify(draftBuild))
      toast.error('Please sign in to save your build', { id: 'auth-error' })
      navigate('/signin', { state: { from: { pathname: '/system-builder' } } })
      return
    }

    if (!buildName.trim()) {
      toast.error('Please enter a build name', { id: 'validation-error' })
      return
    }

    const requiredComponents = componentTypes.filter(type => type.required)
    const missingComponents = requiredComponents.filter(type => !selectedComponents[type.key])
    
    if (missingComponents.length > 0) {
      toast.error('Please select all required components before saving', { id: 'validation-error' })
      return
    }

    try {
      const componentsArray = Object.values(selectedComponents).map(comp => ({
        component_id: comp.component_id,
        quantity: comp.quantity || 1
      }))

      let response
      if (isEditMode && buildId) {
        // Update existing build
        response = await api.put(`/builds/${buildId}`, {
          name: buildName,
          components: componentsArray,
          total_price: totalPrice,
          is_public: buildVisibility === 'public',
          is_submitted: true
        })

        if (response.data.status === 'success') {
          toast.success('Build updated successfully!', { id: 'build-action', duration: 2000 })
          // Clear localStorage after successful update
          localStorage.removeItem('pcbuilder_draft_build')
          localStorage.removeItem('pcbuilder_guest_build')
          navigate('/search-builds?view=private')
        } else {
          toast.error(response.data.message || 'Failed to update build', { id: 'build-error' })
        }
      } else {
        // Create new build
        response = await api.post('/builds', {
          name: buildName,
          components: componentsArray,
          total_price: totalPrice,
          is_public: buildVisibility === 'public',
          is_submitted: true
        })

        if (response.data.status === 'success') {
          toast.success('Build created successfully!', { id: 'build-action', duration: 2000 })
          // Clear localStorage after successful save
          localStorage.removeItem('pcbuilder_draft_build')
          localStorage.removeItem('pcbuilder_guest_build')
        resetBuild()
        setBuildName('')
          navigate('/search-builds?view=private')
      } else {
          toast.error(response.data.message || 'Failed to create build', { id: 'build-error' })
        }
      }
    } catch (error) {
      console.error('Error saving build:', error)
      if (error.response?.status === 401) {
        // Save draft build for guest users
        const draftBuild = {
          selectedComponents,
          buildName,
          buildVisibility,
          timestamp: Date.now()
        }
        localStorage.setItem('pcbuilder_guest_build', JSON.stringify(draftBuild))
        toast.error('Please sign in to save your build', { id: 'auth-error' })
        navigate('/signin', { state: { from: { pathname: '/system-builder' } } })
      } else {
        toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} build`, { id: 'build-error' })
      }
    }
  }

  // Handle cancel in edit mode
  const handleCancel = () => {
    // Clear edit mode flag
    localStorage.removeItem('pcbuilder_in_edit_mode')
    // The pre-edit draft will be restored when component remounts with buildId = null
    navigate('/search-builds?view=private')
  }

  // Show loading state while building is being loaded
  if (isLoadingBuild) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading build...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ paddingTop: '180px', paddingBottom: '40px' }}>
      <div className="container mx-auto px-5" style={{ maxWidth: '1200px' }}>
          {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-10" style={{ color: '#0d6efd' }}>
            {isEditMode ? 'Edit Build' : 'System Builder'}
            </h1>
          <div className="text-center text-xl mb-10 text-white">
            Compatibility: <span className={`font-bold ${
              compatibilityStatus === 'Compatible' ? 'text-blue-400' : 'text-red-500'
              }`}>
                {compatibilityStatus}
              </span>
            </div>
          </div>

          {/* Compatibility Issues */}
          {compatibilityIssues.length > 0 && (
          <div className="mb-5 p-4 rounded-lg border" style={{ 
            background: '#222', 
            borderColor: '#1E90FF',
            color: '#fff'
          }}>
            <h4 className="mb-2.5" style={{ color: '#0d6efd' }}>Compatibility Issues:</h4>
            <ul className="ml-5 list-disc text-white">
                {compatibilityIssues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

        {/* Components List */}
        <div className="rounded-lg p-8 mb-8" style={{ background: '#181a1b', color: '#fff' }}>
            {componentTypes.map((type) => (
            <div 
              key={type.key} 
              className="flex items-center py-4 border-b border-gray-700 last:border-b-0"
            >
              <div className="font-bold text-white w-40 flex-shrink-0">
                {type.label}:
              </div>
              {selectedComponents[type.key] ? (
                <div className="flex items-center flex-1 ml-5">
                  <div className="flex-1">
                    <div className="text-white font-bold" style={{ color: '#1E90FF' }}>
                      {selectedComponents[type.key].name}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      ${selectedComponents[type.key].price}
                      {selectedComponents[type.key].specs && ` - ${selectedComponents[type.key].specs}`}
                    </div>
                  </div>
                    <button
                      onClick={() => removeComponent(type.key)}
                    className="ml-4 text-red-400 hover:text-red-300 transition-colors"
                    title="Remove component"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openComponentModal(type.key)}
                  className="ml-5 text-left px-5 py-2.5 rounded border-none cursor-pointer text-sm transition-colors min-w-[200px]"
                  style={{
                    background: '#0d6efd',
                    color: 'white'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#1566b2'}
                  onMouseLeave={(e) => e.target.style.background = '#0d6efd'}
                >
                  Select A {type.label}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total Price */}
        <div className="text-center text-3xl text-white my-8">
          Price: $<span>{totalPrice.toFixed(2)}</span>
          </div>

          {/* Build Actions */}
        {!isAuthenticated && (
          <div className="mb-5 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <LogIn size={20} />
              <span className="font-semibold">Sign in to save your build</span>
            </div>
            <p className="text-gray-400 text-sm">
              You can browse and select components as a guest, but you need to sign in to save your build.
            </p>
            <button
              onClick={() => navigate('/signin', { state: { from: { pathname: '/system-builder' } } })}
              className="mt-3 px-4 py-2 rounded text-white font-semibold"
              style={{ background: '#0d6efd' }}
            >
              Sign In
            </button>
          </div>
        )}

        <div 
          className="mt-8 p-6 rounded-xl flex flex-wrap items-center gap-5"
          style={{
            background: '#23272b',
            border: '2px solid #0d6efd',
            boxShadow: '0 2px 16px rgba(0,0,0,0.1)'
          }}
        >
                <input
                  type="text"
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
            placeholder="Build Name (must be unique)"
            disabled={!isAuthenticated}
            className="flex-1 px-3 py-3 rounded border text-base max-w-[320px] mr-3"
            style={{
              background: '#222',
              color: '#fff',
              border: '1.5px solid #374151'
            }}
          />
                <select
                  value={buildVisibility}
                  onChange={(e) => setBuildVisibility(e.target.value)}
            disabled={!isAuthenticated}
            className="px-3 py-3 rounded border text-base mr-3"
            style={{
              background: '#222',
              color: '#fff',
              border: '1.5px solid #374151'
            }}
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
           {isEditMode ? (
             <button
               onClick={handleCancel}
               className="px-6 py-3 rounded text-white font-semibold min-w-[120px]"
               style={{ background: '#6c757d' }}
               onMouseEnter={(e) => e.target.style.background = '#5a6268'}
               onMouseLeave={(e) => e.target.style.background = '#6c757d'}
             >
               Cancel
             </button>
           ) : (
                <button
               onClick={() => {
                 resetBuild()
                 setBuildName('')
                 setBuildVisibility('private')
                 localStorage.removeItem('pcbuilder_draft_build')
                 localStorage.removeItem('pcbuilder_guest_build')
               }}
               className="px-6 py-3 rounded text-white font-semibold min-w-[120px]"
               style={{ background: '#1E90FF' }}
               onMouseEnter={(e) => e.target.style.background = '#1566b2'}
               onMouseLeave={(e) => e.target.style.background = '#1E90FF'}
                >
                  Reset Build
                </button>
           )}
                <button
                  onClick={handleCreateBuild}
             disabled={!isAuthenticated}
             className="px-6 py-3 rounded text-white font-bold text-lg min-w-[140px]"
             style={{ 
               background: isAuthenticated ? '#0d6efd' : '#4a5568',
               cursor: isAuthenticated ? 'pointer' : 'not-allowed'
             }}
             onMouseEnter={(e) => {
               if (isAuthenticated) e.target.style.background = '#1566b2'
             }}
             onMouseLeave={(e) => {
               if (isAuthenticated) e.target.style.background = '#0d6efd'
             }}
           >
             {isAuthenticated ? (isEditMode ? 'Update Build' : 'Create Build') : 'Sign In to Save'}
                </button>
        </div>
      </div>

      {/* Component Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                Select {componentTypes.find(t => t.key === currentComponentType)?.label}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {availableComponents.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No components available
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableComponents.map((component) => (
                    <div
                      key={component.component_id}
                      onClick={() => handleComponentSelect(component)}
                      className="card p-4 cursor-pointer hover:border-blue-500 transition-colors duration-200"
                    >
                      <div className="text-white font-medium mb-2">
                        {component.name}
                      </div>
                      <div className="text-blue-400 font-semibold mb-2">
                        ${component.price}
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {component.specs || component.model}
                      </div>
                      <div className="text-xs text-gray-500">
                        {component.manufacturer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemBuilder

import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Eye, Copy, Trash2, Lock, Globe, Edit, Heart, Share2, Filter, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

const SearchBuilds = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialViewMode = searchParams.get('view') === 'private' ? 'private' : 'public'
  
  const [builds, setBuilds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('updated')
  const [viewMode, setViewMode] = useState(initialViewMode) // 'public' or 'private'
  const [deleteModal, setDeleteModal] = useState({ show: false, buildId: null, buildName: '' })
  const [showFilters, setShowFilters] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const filtersInitializedRef = useRef(false)
  
  // Load filters from localStorage or URL params on mount (SYNCHRONOUSLY before fetchBuilds)
  // Initialize filters state directly from localStorage/URL to avoid race condition
  const [filters, setFilters] = useState(() => {
    // Try localStorage first
    const savedFilters = localStorage.getItem('pcbuilder_search_filters')
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters)
      } catch (error) {
        console.error('Error loading filters from localStorage:', error)
      }
    }
    // Fall back to URL params
    const urlMinPrice = searchParams.get('minPrice')
    const urlMaxPrice = searchParams.get('maxPrice')
    const urlCpuBrand = searchParams.get('cpuBrand')
    const urlBudget = searchParams.get('budget')
    if (urlMinPrice || urlMaxPrice || urlCpuBrand || urlBudget) {
      return {
        minPrice: urlMinPrice || '',
        maxPrice: urlMaxPrice || '',
        cpuBrand: urlCpuBrand || '',
        budget: urlBudget === 'true'
      }
    }
    // Default empty filters
    return {
      minPrice: '',
      maxPrice: '',
      cpuBrand: '',
      budget: false
    }
  })
  
  // Sync filters with URL params on mount (after state is initialized)
  useEffect(() => {
    if (filtersInitializedRef.current) return // Already initialized
    filtersInitializedRef.current = true
    
    // Update URL params to reflect loaded filters
    const newParams = new URLSearchParams(searchParams)
    if (filters.minPrice) newParams.set('minPrice', filters.minPrice)
    else newParams.delete('minPrice')
    if (filters.maxPrice) newParams.set('maxPrice', filters.maxPrice)
    else newParams.delete('maxPrice')
    if (filters.cpuBrand) newParams.set('cpuBrand', filters.cpuBrand)
    else newParams.delete('cpuBrand')
    if (filters.budget) newParams.set('budget', 'true')
    else newParams.delete('budget')
    
    // Only update if params changed
    const currentParams = searchParams.toString()
    const newParamsStr = newParams.toString()
    if (currentParams !== newParamsStr) {
      setSearchParams(newParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only on mount
  
  // Save filters to localStorage and URL params whenever they change (after initial load)
  useEffect(() => {
    if (!filtersInitializedRef.current) return // Skip until initialized
    
    // Save to localStorage
    localStorage.setItem('pcbuilder_search_filters', JSON.stringify(filters))
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams)
    if (filters.minPrice) {
      newParams.set('minPrice', filters.minPrice)
    } else {
      newParams.delete('minPrice')
    }
    if (filters.maxPrice) {
      newParams.set('maxPrice', filters.maxPrice)
    } else {
      newParams.delete('maxPrice')
    }
    if (filters.cpuBrand) {
      newParams.set('cpuBrand', filters.cpuBrand)
    } else {
      newParams.delete('cpuBrand')
    }
    if (filters.budget) {
      newParams.set('budget', 'true')
    } else {
      newParams.delete('budget')
    }
    
    // Only update URL if params actually changed to avoid infinite loops
    const currentParams = searchParams.toString()
    const newParamsStr = newParams.toString()
    if (currentParams !== newParamsStr) {
      setSearchParams(newParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]) // Only depend on filters, not searchParams to avoid loops

  // Sync viewMode with URL params on mount and when URL changes
  useEffect(() => {
    const viewParam = searchParams.get('view')
    if (viewParam === 'private' && viewMode !== 'private') {
      setViewMode('private')
    } else if (viewParam !== 'private' && viewMode !== 'public') {
      setViewMode('public')
    }
  }, [searchParams])

  // Use individual filter values as dependencies to ensure React detects changes
  useEffect(() => {
    fetchBuilds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, sortBy, viewMode, isAuthenticated, filters.minPrice, filters.maxPrice, filters.cpuBrand, filters.budget])

  const fetchBuilds = async () => {
    setIsLoading(true)
    try {
      let response
      if (viewMode === 'private' && isAuthenticated) {
        // Fetch user's builds (both public and private) with filters
        const params = new URLSearchParams()
        // Add price filters - check for valid numbers
        if (filters.minPrice && filters.minPrice !== '' && filters.minPrice !== '0') {
          const minPriceNum = parseFloat(filters.minPrice)
          if (!isNaN(minPriceNum) && minPriceNum > 0) {
            params.append('minPrice', minPriceNum.toString())
          }
        }
        if (filters.maxPrice && filters.maxPrice !== '' && filters.maxPrice !== '0') {
          const maxPriceNum = parseFloat(filters.maxPrice)
          if (!isNaN(maxPriceNum) && maxPriceNum > 0) {
            params.append('maxPrice', maxPriceNum.toString())
          }
        }
        if (filters.cpuBrand && filters.cpuBrand !== '') {
          params.append('cpuBrand', filters.cpuBrand)
        }
        if (filters.budget === true || filters.budget === 'true') {
          params.append('budget', 'true')
        }
        const queryString = params.toString()
        const url = `/builds/my${queryString ? `?${queryString}` : ''}`
        response = await api.get(url)
      } else {
        // Fetch public builds
        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        params.append('sort', sortBy)
        // Add price filters - check for valid numbers
        if (filters.minPrice && filters.minPrice !== '' && filters.minPrice !== '0') {
          const minPriceNum = parseFloat(filters.minPrice)
          if (!isNaN(minPriceNum) && minPriceNum > 0) {
            params.append('minPrice', minPriceNum.toString())
          }
        }
        if (filters.maxPrice && filters.maxPrice !== '' && filters.maxPrice !== '0') {
          const maxPriceNum = parseFloat(filters.maxPrice)
          if (!isNaN(maxPriceNum) && maxPriceNum > 0) {
            params.append('maxPrice', maxPriceNum.toString())
          }
        }
        if (filters.cpuBrand && filters.cpuBrand !== '') {
          params.append('cpuBrand', filters.cpuBrand)
        }
        if (filters.budget === true || filters.budget === 'true') {
          params.append('budget', 'true')
        }
        response = await api.get(`/builds/search?${params.toString()}`)
      }

      if (response.data.status === 'success') {
        let fetchedBuilds = response.data.builds || []
        
        // If viewing private builds, apply search term filter on frontend
        // (Price and CPU filters are now handled by backend)
        if (viewMode === 'private' && searchTerm) {
          fetchedBuilds = fetchedBuilds.filter(build =>
            build.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            build.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        // Ensure like_count and user_liked are set
        fetchedBuilds.forEach(build => {
          build.like_count = build.like_count || 0
          build.user_liked = build.user_liked || false
        })

        // Sort builds
        fetchedBuilds.sort((a, b) => {
          switch (sortBy) {
            case 'price':
              return a.total_price - b.total_price
            case 'name':
              return a.name.localeCompare(b.name)
            case 'popular':
              return (b.like_count || 0) - (a.like_count || 0)
            default:
              return new Date(b.updated_at) - new Date(a.updated_at)
          }
        })

        setBuilds(fetchedBuilds)
      }
    } catch (error) {
      console.error('Error fetching builds:', error)
      toast.error('Failed to load builds', { id: 'load-error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDuplicate = async (buildId) => {
    if (!isAuthenticated) {
      toast.error('Please login to duplicate builds', { id: 'auth-error' })
      navigate('/signin')
      return
    }

    try {
      const response = await api.post(`/builds/${buildId}/duplicate`)
      if (response.data.status === 'success') {
        toast.success('Build duplicated successfully!', { id: 'build-action', duration: 1500 })
        fetchBuilds()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to duplicate build', { id: 'build-error' })
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.buildId) return

    try {
      const response = await api.delete(`/builds/${deleteModal.buildId}`)
      if (response.data.status === 'success') {
        toast.success('Build deleted successfully', { id: 'build-action', duration: 1500 })
        setDeleteModal({ show: false, buildId: null, buildName: '' })
        fetchBuilds()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete build', { id: 'build-error' })
    }
  }

  const handleToggleVisibility = async (buildId, currentVisibility) => {
    try {
      const response = await api.put(`/builds/${buildId}/visibility`, {
        is_public: !currentVisibility
      })
      if (response.data.status === 'success') {
        toast.success(response.data.message, { id: 'visibility-action', duration: 1500 })
        fetchBuilds()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update build visibility', { id: 'visibility-error' })
    }
  }

  const handleLike = async (buildId, currentlyLiked) => {
    if (!isAuthenticated) {
      toast.error('Please login to like builds', { id: 'auth-error' })
      navigate('/signin')
      return
    }

    // Check if user is trying to like their own build
    const build = builds.find(b => b.build_id === buildId)
    if (build && build.user_id === user?.user_id) {
      toast.error('You cannot like your own build', { id: 'like-error', duration: 2000 })
      return
    }

    try {
      console.log('Attempting to like build:', buildId)
      const response = await api.post(`/builds/${buildId}/like`)
      console.log('Like response:', response.data)
      
      if (response.data.status === 'success') {
        // Update the build in the list
        setBuilds(prevBuilds =>
          prevBuilds.map(build =>
            build.build_id === buildId
              ? {
                  ...build,
                  like_count: parseInt(response.data.likeCount) || 0,
                  user_liked: response.data.userLiked || false
                }
              : build
          )
        )
        // Show simple success message - like count is already displayed in UI
        toast.success(`Build ${response.data.userLiked ? 'liked' : 'unliked'}`, { 
          id: 'like-action', 
          duration: 1200 
        })
      } else {
        toast.error(response.data.message || 'Failed to like build', { id: 'like-error' })
      }
    } catch (error) {
      console.error('Like error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      console.error('Error config:', error.config?.url)
      
      if (error.response?.status === 404) {
        toast.error('Build not found', { id: 'like-error' })
      } else if (error.response?.status === 403) {
        toast.error(error.response?.data?.message || 'Cannot like this build', { id: 'like-error' })
      } else if (error.response?.status === 401) {
        toast.error('Please login to like builds', { id: 'auth-error' })
        navigate('/signin')
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message, { id: 'like-error' })
      } else if (error.message) {
        toast.error(`Failed to like build: ${error.message}`, { id: 'like-error' })
      } else {
        toast.error('Failed to like build. Please try again.', { id: 'like-error' })
      }
    }
  }

  const handleShare = async (buildId, buildName) => {
    try {
      // Fetch full build details including components
      const response = await api.get(`/builds/${buildId}`)
      
      if (response.data.status !== 'success') {
        toast.error('Failed to load build details', { id: 'share-error' })
        return
      }

      const build = response.data.build
      const components = response.data.components || []

      // Format build details as text
      let shareText = `👤 Creator: ${build.user_name}\n`
      shareText += `💰 Total Price: $${parseFloat(build.total_price).toLocaleString()}\n\n`
      
      // Group components by category
      const componentsByCategory = {}
      components.forEach(comp => {
        const category = comp.category || 'Other'
        if (!componentsByCategory[category]) {
          componentsByCategory[category] = []
        }
        componentsByCategory[category].push(comp)
      })

      // Add components list
      shareText += `📦 Components:\n`
      shareText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      Object.keys(componentsByCategory).sort().forEach(category => {
        shareText += `\n${category}:\n`
        componentsByCategory[category].forEach(comp => {
          const quantity = comp.quantity > 1 ? ` (x${comp.quantity})` : ''
          const price = comp.price ? ` - $${parseFloat(comp.price).toLocaleString()}` : ''
          shareText += `  • ${comp.name}${quantity}${price}\n`
          if (comp.manufacturer) {
            shareText += `    Manufacturer: ${comp.manufacturer}\n`
          }
          if (comp.model) {
            shareText += `    Model: ${comp.model}\n`
          }
        })
      })

      shareText += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      shareText += `\nShared from PC Builder`

      // Try to use Web Share API if available (mobile)
      if (navigator.share && navigator.share !== undefined) {
        try {
          await navigator.share({
            title: `PC Build: ${build.name}`,
            text: shareText
          })
          toast.success('Build shared!', { id: 'share-action', duration: 1500 })
          return
        } catch (shareError) {
          // User cancelled share - fall through to clipboard
          if (shareError.name === 'AbortError') {
            return
          }
        }
      }
      
      // Fallback to copying to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText)
        toast.success('Build details copied to clipboard!', { id: 'share-action', duration: 1500 })
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = shareText
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '0'
        textArea.style.width = '2em'
        textArea.style.height = '2em'
        textArea.style.padding = '0'
        textArea.style.border = 'none'
        textArea.style.outline = 'none'
        textArea.style.boxShadow = 'none'
        textArea.style.background = 'transparent'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          toast.success('Build details copied to clipboard!', { id: 'share-action', duration: 1500 })
        } catch (err) {
          toast.error('Failed to copy. Please select and copy manually.', { id: 'share-error' })
        }
        document.body.removeChild(textArea)
      }
    } catch (error) {
      console.error('Share error:', error)
      toast.error(error.response?.data?.message || 'Failed to share build details', { id: 'share-error' })
    }
  }

  const isMyBuild = (build) => {
    return isAuthenticated && user && build.user_id === user.user_id
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8 px-2">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gradient mb-3 md:mb-4">
              Search Builds
            </h1>
            <p className="text-gray-400 text-sm md:text-base lg:text-lg px-2">
              {viewMode === 'public' 
                ? 'Discover amazing PC builds from our community'
                : 'Manage your personal PC builds'
              }
            </p>
          </div>

          {/* View Mode Toggle */}
          {isAuthenticated && (
            <div className="flex justify-center gap-2 md:gap-4 mb-4 md:mb-6 px-2">
              <button
                onClick={() => {
                  setViewMode('public')
                  setSearchParams({ view: 'public' })
                }}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm md:text-base flex items-center ${
                  viewMode === 'public'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Globe size={16} className="md:w-5 md:h-5 mr-1.5 md:mr-2" />
                <span className="whitespace-nowrap">Community</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('private')
                  setSearchParams({ view: 'private' })
                }}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors duration-200 text-sm md:text-base flex items-center ${
                  viewMode === 'private'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Lock size={16} className="md:w-5 md:h-5 mr-1.5 md:mr-2" />
                <span className="whitespace-nowrap">My Builds</span>
              </button>
            </div>
          )}

          {/* Search and Filter Bar */}
          <div className="card p-4 md:p-6 mb-6 md:mb-8">
            {/* Mobile: Stacked layout */}
            <div className="flex flex-col md:hidden gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search builds..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-9 text-sm w-full"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn ${showFilters || filters.minPrice || filters.maxPrice || filters.cpuBrand || filters.budget ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center gap-2 text-sm px-3 py-2`}
                >
                  <Filter size={16} />
                  <span>Filters</span>
                  {((filters.minPrice || filters.maxPrice) || filters.cpuBrand || filters.budget) && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {((filters.minPrice || filters.maxPrice) ? 1 : 0) + (filters.cpuBrand ? 1 : 0) + (filters.budget ? 1 : 0)}
                    </span>
                  )}
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input text-sm"
                >
                  <option value="updated">Last Updated</option>
                  <option value="popular">Most Popular</option>
                  <option value="price">Price (Low to High)</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Tablet/Desktop: All on one line */}
            <div className="hidden md:flex items-stretch gap-2 lg:gap-3">
              <div className="flex-[2] relative min-w-[250px] lg:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={20} />
                <input
                  type="text"
                  placeholder="Search builds..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 lg:pl-11 pr-4 py-3 text-base lg:text-lg w-full h-full"
                  style={{ minHeight: '42px' }}
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${showFilters || filters.minPrice || filters.maxPrice || filters.cpuBrand || filters.budget ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center gap-1.5 lg:gap-2 text-xs lg:text-sm px-3 lg:px-4 py-2 lg:py-2.5 flex-shrink-0 whitespace-nowrap h-auto`}
              >
                <Filter size={18} className="lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="hidden xl:inline">Filters</span>
                {((filters.minPrice || filters.maxPrice) || filters.cpuBrand || filters.budget) && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 flex-shrink-0 ml-0.5">
                    {((filters.minPrice || filters.maxPrice) ? 1 : 0) + (filters.cpuBrand ? 1 : 0) + (filters.budget ? 1 : 0)}
                  </span>
                )}
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input text-xs lg:text-sm px-3 lg:px-4 py-2 lg:py-2.5 flex-shrink-0 w-[140px] lg:w-[160px] h-auto overflow-hidden text-ellipsis"
                style={{ minHeight: '42px' }}
              >
                <option value="updated">Last Updated</option>
                <option value="popular">Most Popular</option>
                <option value="price">Price (Low to High)</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {/* Price Range */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">Min Price ($)</label>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className="input text-sm md:text-base"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">Max Price ($)</label>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className="input text-sm md:text-base"
                      min="0"
                    />
                  </div>
                  {/* CPU Brand */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">CPU Brand</label>
                <select
                      value={filters.cpuBrand}
                      onChange={(e) => setFilters({ ...filters, cpuBrand: e.target.value })}
                  className="input text-sm md:text-base"
                >
                      <option value="">All CPUs</option>
                      <option value="intel">Intel</option>
                      <option value="amd">AMD</option>
                </select>
              </div>
                  {/* Budget PC */}
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">Quick Filter</label>
                    <button
                      onClick={() => {
                        if (filters.budget) {
                          // Turning off budget filter
                          setFilters({ ...filters, budget: false })
                        } else {
                          // Turning on budget filter - clear price range if set
                          setFilters({ ...filters, budget: true, minPrice: '', maxPrice: '' })
                        }
                      }}
                      className={`w-full btn ${filters.budget ? 'btn-primary' : 'btn-secondary'} text-xs md:text-sm px-3 py-2`}
                    >
                      {filters.budget ? '✓ Budget PC (<$1000)' : 'Budget PC (<$1000)'}
                    </button>
            </div>
                </div>
                {/* Clear Filters */}
                {(filters.minPrice || filters.maxPrice || filters.cpuBrand || filters.budget) && (
                  <div className="mt-3 md:mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        const clearedFilters = { minPrice: '', maxPrice: '', cpuBrand: '', budget: false }
                        setFilters(clearedFilters)
                        // Clear from localStorage
                        localStorage.removeItem('pcbuilder_search_filters')
                        // The effect will update URL params (and preserve view param)
                        toast.success('Filters cleared', { id: 'filter-action', duration: 1200 })
                      }}
                      className="btn btn-secondary flex items-center gap-2 text-xs md:text-sm px-3 py-2"
                    >
                      <X size={14} className="md:w-4 md:h-4" />
                      <span>Clear Filters</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Builds Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="card p-6 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : builds.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-white mb-2">No builds found</h3>
              <p className="text-gray-400 mb-6">
                {viewMode === 'public'
                  ? 'Try adjusting your search criteria or create your own build'
                  : 'You don\'t have any builds yet. Create your first build!'
                }
              </p>
              <Link to="/system-builder" className="btn btn-primary">
                Create New Build
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {builds.map((build) => {
                const isOwnedByMe = isMyBuild(build)
                const likeCount = build.like_count || 0
                const userLiked = build.user_liked || false

                const isOwnBuild = isAuthenticated && user && build.user_id === user.user_id

                return (
                  <div key={build.build_id} className={`card p-4 md:p-5 hover:transform hover:scale-[1.02] transition-all duration-300 flex flex-col ${viewMode === 'public' && isOwnBuild ? 'ring-2 ring-blue-500 ring-opacity-70 bg-gray-800/60' : ''}`}>
                    {/* Header */}
                    <div className="mb-3 md:mb-4">
                      <div className="flex items-start justify-between mb-2 md:mb-3 gap-2">
                        <h3 className="text-lg md:text-xl font-bold text-white break-words flex-1 min-w-0" title={build.name}>{build.name}</h3>
                        {viewMode === 'public' && isOwnBuild && (
                          <span className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600/40 text-blue-200 text-sm md:text-base rounded-full font-semibold flex-shrink-0 border border-blue-500/30">
                            ⭐ Yours
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap mb-2 md:mb-3">
                        {build.is_public ? (
                          <span className="px-3 md:px-4 py-1.5 md:py-2 bg-green-600/20 text-green-400 text-sm md:text-base rounded-full flex items-center gap-1.5">
                            <Globe size={14} className="md:w-5 md:h-5" />
                            <span>Public</span>
                          </span>
                        ) : (
                          <span className="px-3 md:px-4 py-1.5 md:py-2 bg-yellow-600/20 text-yellow-400 text-sm md:text-base rounded-full flex items-center gap-1.5">
                            <Lock size={14} className="md:w-5 md:h-5" />
                            <span>Private</span>
                          </span>
                        )}
                        {/* Always show like count */}
                        <span className="px-3 md:px-4 py-1.5 md:py-2 bg-pink-600/20 text-pink-400 text-sm md:text-base rounded-full flex items-center gap-1.5">
                          <Heart size={14} className={`md:w-5 md:h-5 ${likeCount > 0 ? 'fill-pink-400' : ''}`} />
                          <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
                        </span>
                    </div>
                  </div>
                  
                    {/* Build Details - Compact */}
                    <div className="bg-gray-800/30 rounded-lg p-3 md:p-4 mb-3 md:mb-4 space-y-2.5 md:space-y-3">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-400 text-sm md:text-base font-medium">Price:</span>
                        <span className="text-blue-400 font-bold text-lg md:text-xl">${parseFloat(build.total_price).toLocaleString()}</span>
                    </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-400 text-sm md:text-base font-medium">Creator:</span>
                        <span className="text-white text-sm md:text-base font-medium truncate ml-2 flex-1 text-right">{build.user_name}</span>
                    </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-400 text-sm md:text-base font-medium">Updated:</span>
                        <span className="text-gray-300 text-sm md:text-base">{new Date(build.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                    {/* Action Buttons - Single Row */}
                    <div className="mt-auto pt-3 border-t border-gray-700">
                      {/* Show management buttons if this is the user's own build */}
                      {isOwnBuild ? (
                        // My Own Build: Show management buttons (View, Edit, Toggle, Share, Delete) - All on one line, evenly distributed
                        <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                          <Link
                            to={`/build/${build.build_id}?from=${viewMode === 'private' ? 'my-builds' : 'community-builds'}&view=${viewMode}`}
                            className="btn btn-primary flex items-center justify-center text-sm md:text-base px-3 md:px-4 py-2 md:py-2.5 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none border-0"
                            title="View build"
                          >
                            <Eye size={16} className="md:w-5 md:h-5" />
                          </Link>
                          <Link
                            to={`/system-builder?build_id=${build.build_id}`}
                            className="btn btn-secondary flex items-center justify-center text-sm md:text-base px-3 md:px-4 py-2 md:py-2.5 focus:ring-2 focus:ring-gray-500 focus:ring-offset-0 focus:outline-none border-0"
                            title="Edit build"
                          >
                            <Edit size={16} className="md:w-5 md:h-5" />
                          </Link>
                          <button
                            onClick={() => handleToggleVisibility(build.build_id, build.is_public)}
                            className={`btn ${build.is_public ? 'btn-secondary' : 'btn-primary'} flex items-center justify-center text-sm md:text-base px-3 md:px-4 py-2 md:py-2.5 focus:ring-2 focus:ring-offset-0 focus:outline-none border-0 ${build.is_public ? 'focus:ring-gray-500' : 'focus:ring-blue-500'}`}
                            title={build.is_public ? 'Make Private' : 'Make Public'}
                          >
                            {build.is_public ? <Lock size={16} className="md:w-5 md:h-5" /> : <Globe size={16} className="md:w-5 md:h-5" />}
                          </button>
                          <button
                            onClick={() => handleShare(build.build_id, build.name)}
                            className="btn btn-secondary flex items-center justify-center text-sm md:text-base px-3 md:px-4 py-2 md:py-2.5 focus:ring-2 focus:ring-gray-500 focus:ring-offset-0 focus:outline-none border-0"
                            title="Share build"
                          >
                            <Share2 size={16} className="md:w-5 md:h-5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ show: true, buildId: build.build_id, buildName: build.name })}
                            className="btn btn-danger flex items-center justify-center text-sm md:text-base px-3 md:px-4 py-2 md:py-2.5 focus:ring-2 focus:ring-red-500 focus:ring-offset-0 focus:outline-none border-0"
                            title="Delete build"
                          >
                            <Trash2 size={16} className="md:w-5 md:h-5" />
                          </button>
                        </div>
                      ) : (
                        // Other User's Build: Show view/interaction buttons (View, Like, Share, Duplicate)
                        <div className="flex gap-2 md:gap-3 flex-wrap">
                          <Link
                            to={`/build/${build.build_id}?from=community-builds&view=public`}
                            className="btn btn-primary flex items-center justify-center gap-1.5 text-sm md:text-base px-4 md:px-5 py-2.5 md:py-3 min-w-[44px] md:min-w-[50px]"
                            title="View build"
                          >
                            <Eye size={16} className="md:w-5 md:h-5" />
                          </Link>
                          {/* Like button - only show for builds that are not owned by current user */}
                          <button
                            onClick={() => {
                              if (!isAuthenticated) {
                                toast.error('Please login to like builds')
                                navigate('/signin')
                                return
                              }
                              handleLike(build.build_id, userLiked)
                            }}
                            className={`btn ${userLiked && isAuthenticated ? 'btn-danger' : 'btn-secondary'} flex items-center justify-center gap-1.5 text-sm md:text-base px-4 md:px-5 py-2.5 md:py-3 min-w-[44px] md:min-w-[50px]`}
                            title={isAuthenticated ? (userLiked ? 'Unlike' : 'Like') : 'Login to like'}
                          >
                            <Heart size={16} className={`md:w-5 md:h-5 ${userLiked && isAuthenticated ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleShare(build.build_id, build.name)}
                            className="btn btn-secondary flex items-center justify-center gap-1.5 text-sm md:text-base px-4 md:px-5 py-2.5 md:py-3 min-w-[44px] md:min-w-[50px]"
                            title="Share build"
                          >
                            <Share2 size={16} className="md:w-5 md:h-5" />
                          </button>
                          {isAuthenticated && (
                            <button
                              onClick={() => handleDuplicate(build.build_id)}
                              className="btn btn-secondary flex items-center justify-center gap-1.5 text-sm md:text-base px-4 md:px-5 py-2.5 md:py-3 min-w-[44px] md:min-w-[50px]"
                              title="Duplicate build"
                            >
                              <Copy size={16} className="md:w-5 md:h-5" />
                            </button>
                          )}
                        </div>
                      )}
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteModal({ show: false, buildId: null, buildName: '' })
            }
          }}
        >
          <div 
            className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon and Title */}
            <div className="flex items-start gap-4 mb-4 md:mb-6">
              <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-600/20 flex items-center justify-center">
                <Trash2 className="text-red-400" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2 break-words">
                  Delete Build?
                </h2>
                <p className="text-gray-400 text-sm md:text-base break-words">
                  Are you sure you want to delete <span className="text-white font-semibold">{deleteModal.buildName}</span>? 
                </p>
                <p className="text-red-400 text-xs md:text-sm mt-2 font-medium">
                  ⚠️ This action cannot be undone.
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 justify-end mt-6 md:mt-8">
              <button
                onClick={() => setDeleteModal({ show: false, buildId: null, buildName: '' })}
                className="btn btn-secondary text-sm md:text-base px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger text-sm md:text-base px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                <span>Delete Build</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBuilds

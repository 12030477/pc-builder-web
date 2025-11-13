import React, { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Heart, Edit, Trash2, Copy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ViewBuild = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [build, setBuild] = useState(null)
  const [components, setComponents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Check if this is the user's own build
  const isOwnBuild = isAuthenticated && user && build && build.user_id === user.user_id
  
  // Get the source view from URL params (where user came from)
  const fromView = searchParams.get('from') || 'community-builds' // default to community
  const viewMode = searchParams.get('view') || 'public' // default to public
  
  // Build the back URL based on where user came from
  const getBackUrl = () => {
    const baseUrl = '/search-builds'
    const params = new URLSearchParams()
    
    // Add view parameter
    if (fromView === 'my-builds' || viewMode === 'private') {
      params.set('view', 'private')
    } else {
      params.set('view', 'public')
    }
    
    // Restore filters from localStorage
    const savedFilters = localStorage.getItem('pcbuilder_search_filters')
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters)
        if (filters.minPrice) params.set('minPrice', filters.minPrice)
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
        if (filters.cpuBrand) params.set('cpuBrand', filters.cpuBrand)
        if (filters.budget) params.set('budget', 'true')
      } catch (error) {
        console.error('Error restoring filters:', error)
      }
    }
    
    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }

  useEffect(() => {
    fetchBuild()
  }, [id])

  const fetchBuild = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/builds/${id}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        setBuild(data.build)
        setComponents(data.components || [])
      } else {
        setError(data.message || 'Build not found')
      }
    } catch (error) {
      setError('Error loading build')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Build Not Found</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <Link to={getBackUrl()} className="btn btn-primary">
            {fromView === 'my-builds' ? 'Back to My Builds' : 'Back to Community Builds'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container py-4 md:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
            <Link
              to={getBackUrl()}
              className="flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm md:text-base"
            >
              <ArrowLeft size={18} className="mr-2 flex-shrink-0" />
              <span className="truncate">Back to {fromView === 'my-builds' ? 'My Builds' : 'Community Builds'}</span>
            </Link>
            
            <div className="flex flex-wrap gap-2">
              {/* Only show Like button if this is NOT the user's own build */}
              {!isOwnBuild && (
                <button className="btn btn-secondary flex items-center text-xs md:text-sm px-3 py-2">
                  <Heart size={14} className="mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline">Like</span>
              </button>
              )}
              <button className="btn btn-secondary flex items-center text-xs md:text-sm px-3 py-2">
                <Share2 size={14} className="mr-1.5 md:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </button>
              {isAuthenticated && (
                <button className="btn btn-secondary flex items-center text-xs md:text-sm px-3 py-2">
                  <Copy size={14} className="mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline">Duplicate</span>
              </button>
              )}
            </div>
          </div>

          {/* Build Info */}
          <div className="card p-4 md:p-8 mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 break-words">{build.name}</h1>
                <p className="text-gray-400 text-sm md:text-base">Created by {build.user_name}</p>
              </div>
              <div className="text-left md:text-right">
                <div className="text-2xl md:text-3xl font-bold text-blue-400">${parseFloat(build.total_price).toLocaleString()}</div>
                <p className="text-gray-400 text-sm md:text-base">Total Price</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 md:gap-4">
              <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm ${
                build.is_public ? 'bg-green-600' : 'bg-gray-600'
              }`}>
                {build.is_public ? 'Public' : 'Private'}
              </span>
              <span className="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm bg-blue-600">
                {build.is_submitted ? 'Completed' : 'Draft'}
              </span>
              <span className="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm bg-gray-600">
                Updated: {new Date(build.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Components Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {components.map((component) => (
              <div key={component.component_id} className="card p-4 md:p-6">
                <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-1.5 md:mb-2 break-words">{component.name}</h3>
                    <p className="text-gray-400 text-sm md:text-base mb-1.5 md:mb-2">{component.category}</p>
                    <p className="text-gray-400 text-sm md:text-base truncate">{component.model}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-blue-400 font-semibold text-base md:text-lg">${parseFloat(component.price).toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">Qty: {component.quantity}</div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3 md:mb-4">
                  <div className="text-gray-400 text-sm md:text-base">
                    <strong>Manufacturer:</strong> <span className="break-words">{component.manufacturer}</span>
                  </div>
                  {component.specs && (
                    <div className="text-gray-400 text-sm md:text-base break-words">
                      <strong>Specs:</strong> {component.specs}
                    </div>
                  )}
                  {component.vendor_link && (
                    <a
                      href={component.vendor_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm md:text-base inline-block break-all"
                    >
                      View Product →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Build Summary */}
          <div className="card p-4 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Build Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Components</h3>
                <div className="space-y-2">
                  {components.map((component) => (
                    <div key={component.component_id} className="flex justify-between gap-2">
                      <span className="text-gray-400 text-sm md:text-base break-words flex-1">{component.name}</span>
                      <span className="text-white text-sm md:text-base flex-shrink-0 ml-2">${parseFloat(component.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Totals</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm md:text-base">Subtotal:</span>
                    <span className="text-white text-sm md:text-base">${parseFloat(build.total_price).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-600 pt-2">
                    <span className="text-white font-semibold text-sm md:text-base">Total:</span>
                    <span className="text-blue-400 font-bold text-base md:text-lg">${parseFloat(build.total_price).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewBuild

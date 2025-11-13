import React, { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Heart, Edit, Trash2, Copy } from 'lucide-react'

const ViewBuild = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [build, setBuild] = useState(null)
  const [components, setComponents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
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
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to={getBackUrl()}
              className="flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to {fromView === 'my-builds' ? 'My Builds' : 'Community Builds'}
            </Link>
            
            <div className="flex space-x-4">
              <button className="btn btn-secondary flex items-center">
                <Heart size={16} className="mr-2" />
                Like
              </button>
              <button className="btn btn-secondary flex items-center">
                <Share2 size={16} className="mr-2" />
                Share
              </button>
              <button className="btn btn-secondary flex items-center">
                <Copy size={16} className="mr-2" />
                Duplicate
              </button>
            </div>
          </div>

          {/* Build Info */}
          <div className="card p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{build.name}</h1>
                <p className="text-gray-400">Created by {build.user_name}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-400">${build.total_price}</div>
                <p className="text-gray-400">Total Price</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <span className={`px-3 py-1 rounded-full text-sm ${
                build.is_public ? 'bg-green-600' : 'bg-gray-600'
              }`}>
                {build.is_public ? 'Public' : 'Private'}
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-blue-600">
                {build.is_submitted ? 'Completed' : 'Draft'}
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-gray-600">
                Updated: {new Date(build.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Components Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {components.map((component) => (
              <div key={component.component_id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{component.name}</h3>
                    <p className="text-gray-400 text-sm mb-2">{component.category}</p>
                    <p className="text-gray-400 text-sm">{component.model}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-400 font-semibold">${component.price}</div>
                    <div className="text-gray-400 text-sm">Qty: {component.quantity}</div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="text-gray-400 text-sm">
                    <strong>Manufacturer:</strong> {component.manufacturer}
                  </div>
                  {component.specs && (
                    <div className="text-gray-400 text-sm">
                      <strong>Specs:</strong> {component.specs}
                    </div>
                  )}
                  {component.vendor_link && (
                    <a
                      href={component.vendor_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View Product →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Build Summary */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Build Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Components</h3>
                <div className="space-y-2">
                  {components.map((component) => (
                    <div key={component.component_id} className="flex justify-between">
                      <span className="text-gray-400">{component.name}</span>
                      <span className="text-white">${component.price}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Totals</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-white">${build.total_price}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-600 pt-2">
                    <span className="text-white font-semibold">Total:</span>
                    <span className="text-blue-400 font-bold text-lg">${build.total_price}</span>
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

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Edit, Trash2, Share2, Lock, Globe } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../utils/api'

const MyBuilds = () => {
  const [builds, setBuilds] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ show: false, buildId: null, buildName: '' })

  useEffect(() => {
    fetchMyBuilds()
  }, [])

  const fetchMyBuilds = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/builds/my')
      if (response.data.status === 'success') {
        setBuilds(response.data.builds || [])
      } else {
        toast.error('Failed to load builds', { id: 'build-load-error' })
      }
    } catch (error) {
      console.error('Error fetching builds:', error)
      toast.error('Failed to load builds. Please try again.', { id: 'build-load-error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBuild = async () => {
    if (!deleteModal.buildId) return
    
    try {
      const response = await api.delete(`/builds/${deleteModal.buildId}`)
      if (response.data.status === 'success') {
        toast.success('Build deleted successfully', { id: 'build-action', duration: 1500 })
        setDeleteModal({ show: false, buildId: null, buildName: '' })
        setBuilds(builds.filter(build => build.build_id !== deleteModal.buildId))
      } else {
        toast.error(response.data.message || 'Failed to delete build', { id: 'build-error' })
      }
    } catch (error) {
      console.error('Error deleting build:', error)
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
        fetchMyBuilds()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update build visibility', { id: 'visibility-error' })
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-2">
                My Builds
              </h1>
              <p className="text-gray-400 text-lg">
                Manage your PC builds and configurations
              </p>
            </div>
            <Link
              to="/system-builder"
              className="btn btn-primary mt-4 md:mt-0 flex items-center"
            >
              <Plus size={20} className="mr-2" />
              Create New Build
            </Link>
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
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-2xl font-bold text-white mb-2">No builds yet</h3>
              <p className="text-gray-400 mb-6">
                Start building your dream PC with our system builder
              </p>
              <Link to="/system-builder" className="btn btn-primary">
                Create Your First Build
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {builds.map((build) => (
                <div key={build.build_id} className="card p-4 md:p-5 hover:transform hover:scale-[1.02] transition-all duration-300 flex flex-col">
                  {/* Header */}
                  <div className="mb-3 md:mb-4">
                    <div className="flex items-start justify-between mb-2 md:mb-3 gap-2">
                      <h3 className="text-lg md:text-xl font-bold text-white break-words flex-1 min-w-0" title={build.name}>{build.name}</h3>
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
                    </div>
                  </div>
                  
                  {/* Build Details - Compact */}
                  <div className="bg-gray-800/30 rounded-lg p-3 md:p-4 mb-3 md:mb-4 space-y-2.5 md:space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-400 text-sm md:text-base font-medium">Price:</span>
                      <span className="text-blue-400 font-bold text-lg md:text-xl">${parseFloat(build.total_price).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-400 text-sm md:text-base font-medium">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs md:text-sm ${
                        build.is_submitted 
                          ? 'bg-green-600 text-white' 
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {build.is_submitted ? 'Completed' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-gray-400 text-sm md:text-base font-medium">Updated:</span>
                      <span className="text-gray-300 text-sm md:text-base">{new Date(build.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Single Row, All on One Line */}
                  <div className="mt-auto pt-3 border-t border-gray-700">
                    <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                      <Link
                        to={`/build/${build.build_id}?from=my-builds&view=private`}
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
                  </div>
                </div>
              ))}
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
                onClick={handleDeleteBuild}
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

export default MyBuilds

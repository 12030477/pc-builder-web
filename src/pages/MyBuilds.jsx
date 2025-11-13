import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Edit, Trash2, Copy, Share2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

const MyBuilds = () => {
  const [builds, setBuilds] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMyBuilds()
  }, [])

  const fetchMyBuilds = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/builds/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      
      if (data.status === 'success') {
        setBuilds(data.builds || [])
      }
    } catch (error) {
      console.error('Error fetching builds:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBuild = async (buildId) => {
    if (!window.confirm('Are you sure you want to delete this build?')) return
    
    try {
      const response = await fetch(`/api/builds/${buildId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        toast.success('Build deleted successfully')
        setBuilds(builds.filter(build => build.build_id !== buildId))
      } else {
        toast.error(data.message || 'Failed to delete build')
      }
    } catch (error) {
      toast.error('Error deleting build')
    }
  }

  const handleDuplicateBuild = async (buildId) => {
    try {
      const response = await fetch(`/api/builds/${buildId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        toast.success('Build duplicated successfully')
        fetchMyBuilds()
      } else {
        toast.error(data.message || 'Failed to duplicate build')
      }
    } catch (error) {
      toast.error('Error duplicating build')
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
                <div key={build.build_id} className="card p-6 hover:transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{build.name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDuplicateBuild(build.build_id)}
                        className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
                        title="Duplicate"
                      >
                        <Copy size={18} />
                      </button>
                      <button className="text-gray-400 hover:text-blue-400 transition-colors duration-200" title="Share">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-blue-400 font-semibold">${build.total_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        build.is_submitted 
                          ? 'bg-green-600 text-white' 
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {build.is_submitted ? 'Completed' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Visibility:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        build.is_public 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-600 text-white'
                      }`}>
                        {build.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Updated:</span>
                      <span className="text-white">{new Date(build.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      to={`/build/${build.build_id}`}
                      className="btn btn-primary flex-1 flex items-center justify-center"
                    >
                      <Eye size={16} className="mr-2" />
                      View
                    </Link>
                    <Link
                      to={`/system-builder?edit=${build.build_id}`}
                      className="btn btn-secondary flex items-center justify-center"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDeleteBuild(build.build_id)}
                      className="btn btn-danger flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyBuilds

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Package, 
  Wrench, 
  MessageSquare, 
  Key,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Search,
  Mail,
  CheckCircle,
  XCircle
} from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('components')
  const [stats, setStats] = useState({
    users: 0,
    components: 0,
    builds: 0,
    comments: 0,
    resets: 0
  })
  const [components, setComponents] = useState([])
  const [builds, setBuilds] = useState([])
  const [users, setUsers] = useState([])
  const [comments, setComments] = useState([])
  const [resets, setResets] = useState([])
  const [categories, setCategories] = useState([])
  const [manufacturers, setManufacturers] = useState([])
  const [compatComponents, setCompatComponents] = useState({ cpu: [], ram: [], motherboard: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showAddComponent, setShowAddComponent] = useState(false)
  const [showEditComponent, setShowEditComponent] = useState(false)
  const [showDeleteComponent, setShowDeleteComponent] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [showDeleteUser, setShowDeleteUser] = useState(false)
  const [showEditBuild, setShowEditBuild] = useState(false)
  const [showDeleteBuild, setShowDeleteBuild] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')

  // Form states
  const [componentForm, setComponentForm] = useState({
    name: '',
    category_id: '',
    manufacturer_id: '',
    model: '',
    price: '',
    stock: '0',
    vendor_link: '',
    socket_type: '',
    ram_type: '',
    compat_cpu: [],
    compat_ram: [],
    compat_motherboard: []
  })

  useEffect(() => {
    fetchDashboardData()
    fetchCategoriesAndManufacturers()
  }, [])

  // Fetch compatibility components when modal opens (regardless of category selection)
  useEffect(() => {
    if (showAddComponent || showEditComponent) {
      fetchCompatibilityComponents()
    }
  }, [showAddComponent, showEditComponent])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/admin/dashboard')
      if (response.data.status === 'success') {
        setStats(response.data.stats)
        setComponents(response.data.components || [])
        setBuilds(response.data.builds || [])
        setUsers(response.data.users || [])
        setComments(response.data.comments || [])
        setResets(response.data.resets || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data', { id: 'admin-load-error' })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategoriesAndManufacturers = async () => {
    try {
      const [catRes, manRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/manufacturers')
      ])
      if (catRes.data.status === 'success') {
        setCategories(catRes.data.categories || [])
      }
      if (manRes.data.status === 'success') {
        setManufacturers(manRes.data.manufacturers || [])
      }
    } catch (error) {
      console.error('Error fetching categories/manufacturers:', error)
    }
  }

  const fetchCompatibilityComponents = async () => {
    try {
      console.log('[AdminDashboard] Fetching compatibility components...')
      const [cpuRes, ramRes, mbRes] = await Promise.all([
        api.get('/admin/components/compatibility?type=cpu').catch(err => {
          console.error('[AdminDashboard] Error fetching CPUs:', err)
          console.error('[AdminDashboard] Error response:', err.response?.data)
          return { data: { status: 'error', components: [], message: err.message } }
        }),
        api.get('/admin/components/compatibility?type=ram').catch(err => {
          console.error('[AdminDashboard] Error fetching RAM:', err)
          console.error('[AdminDashboard] Error response:', err.response?.data)
          return { data: { status: 'error', components: [], message: err.message } }
        }),
        api.get('/admin/components/compatibility?type=motherboard').catch(err => {
          console.error('[AdminDashboard] Error fetching Motherboards:', err)
          console.error('[AdminDashboard] Error response:', err.response?.data)
          return { data: { status: 'error', components: [], message: err.message } }
        })
      ])
      
      console.log('[AdminDashboard] Raw API responses:', {
        cpu: { status: cpuRes.data?.status, count: cpuRes.data?.components?.length, data: cpuRes.data },
        ram: { status: ramRes.data?.status, count: ramRes.data?.components?.length, data: ramRes.data },
        motherboard: { status: mbRes.data?.status, count: mbRes.data?.components?.length, data: mbRes.data }
      })
      
      const compatData = {
        cpu: cpuRes.data?.status === 'success' ? (cpuRes.data.components || []) : [],
        ram: ramRes.data?.status === 'success' ? (ramRes.data.components || []) : [],
        motherboard: mbRes.data?.status === 'success' ? (mbRes.data.components || []) : []
      }
      
      console.log('[AdminDashboard] Compatibility components loaded:', {
        cpu: compatData.cpu.length,
        ram: compatData.ram.length,
        motherboard: compatData.motherboard.length,
        cpuSample: compatData.cpu.slice(0, 3).map(c => ({ id: c.component_id, name: c.name })),
        ramSample: compatData.ram.slice(0, 3).map(r => ({ id: r.component_id, name: r.name })),
        mbSample: compatData.motherboard.slice(0, 3).map(m => ({ id: m.component_id, name: m.name }))
      })
      
      if (compatData.cpu.length === 0 && compatData.ram.length === 0 && compatData.motherboard.length === 0) {
        console.warn('[AdminDashboard] WARNING: All compatibility component arrays are empty!')
        console.warn('[AdminDashboard] This might mean:')
        console.warn('[AdminDashboard] 1. No components exist in the database for these categories')
        console.warn('[AdminDashboard] 2. The API endpoints are not working correctly')
        console.warn('[AdminDashboard] 3. There is an authentication/authorization issue')
      }
      
      setCompatComponents(compatData)
    } catch (error) {
      console.error('[AdminDashboard] Error fetching compatibility components:', error)
      toast.error('Failed to load compatibility components', { id: 'admin-error' })
      // Set empty arrays on error
      setCompatComponents({ cpu: [], ram: [], motherboard: [] })
    }
  }

  const handleAddComponent = async (e) => {
    e.preventDefault()
    try {
      // Ensure compatibility arrays are properly formatted (arrays of numbers)
      const formData = {
        ...componentForm,
        compat_cpu: Array.isArray(componentForm.compat_cpu) ? componentForm.compat_cpu.filter(id => id).map(id => parseInt(id)) : [],
        compat_ram: Array.isArray(componentForm.compat_ram) ? componentForm.compat_ram.filter(id => id).map(id => parseInt(id)) : [],
        compat_motherboard: Array.isArray(componentForm.compat_motherboard) ? componentForm.compat_motherboard.filter(id => id).map(id => parseInt(id)) : []
      }
      const response = await api.post('/admin/components', formData)
      if (response.data.status === 'success') {
        toast.success('Component added successfully', { id: 'admin-action', duration: 1500 })
        setShowAddComponent(false)
        resetComponentForm()
        fetchDashboardData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add component', { id: 'admin-error' })
    }
  }

  const handleEditComponent = async (e) => {
    e.preventDefault()
    try {
      // Ensure compatibility arrays are properly formatted (arrays of numbers)
      const formData = {
        ...componentForm,
        compat_cpu: Array.isArray(componentForm.compat_cpu) ? componentForm.compat_cpu.filter(id => id).map(id => parseInt(id)) : [],
        compat_ram: Array.isArray(componentForm.compat_ram) ? componentForm.compat_ram.filter(id => id).map(id => parseInt(id)) : [],
        compat_motherboard: Array.isArray(componentForm.compat_motherboard) ? componentForm.compat_motherboard.filter(id => id).map(id => parseInt(id)) : []
      }
      const response = await api.put(`/admin/components/${selectedItem.component_id}`, formData)
      if (response.data.status === 'success') {
        toast.success('Component updated successfully', { id: 'admin-action', duration: 1500 })
        setShowEditComponent(false)
        resetComponentForm()
        fetchDashboardData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update component', { id: 'admin-error' })
    }
  }

  const handleDeleteComponent = async () => {
    try {
      const response = await api.delete(`/admin/components/${selectedItem.component_id}`)
      if (response.data.status === 'success') {
        toast.success('Component deleted successfully', { id: 'admin-action', duration: 1500 })
        setShowDeleteComponent(false)
        setSelectedItem(null)
        fetchDashboardData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete component', { id: 'admin-error' })
    }
  }

  const openEditComponent = async (component) => {
    try {
      const response = await api.get(`/admin/components/${component.component_id}`)
      if (response.data.status === 'success') {
        const comp = response.data.component
        setComponentForm({
          name: comp.name,
          category_id: comp.category_id,
          manufacturer_id: comp.manufacturer_id,
          model: comp.model || '',
          price: comp.price,
          stock: comp.stock || 0,
          vendor_link: comp.vendor_link || '',
          socket_type: comp.socket_type || '',
          ram_type: comp.ram_type || '',
          compat_cpu: comp.compatibility?.cpu ? comp.compatibility.cpu.map(id => parseInt(id)) : [],
          compat_ram: comp.compatibility?.ram ? comp.compatibility.ram.map(id => parseInt(id)) : [],
          compat_motherboard: comp.compatibility?.motherboard ? comp.compatibility.motherboard.map(id => parseInt(id)) : []
        })
        setSelectedItem(comp)
        setShowEditComponent(true)
        // Fetch compatibility components for this category
        await fetchCompatibilityComponents()
      }
    } catch (error) {
      toast.error('Failed to load component data', { id: 'admin-error' })
    }
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    try {
      const response = await api.put(`/admin/users/${selectedItem.user_id}`, {
        name: selectedItem.name,
        email: selectedItem.email,
        is_admin: selectedItem.is_admin ? 1 : 0
      })
      if (response.data.status === 'success') {
        toast.success('User updated successfully', { id: 'admin-action', duration: 1500 })
        setShowEditUser(false)
        setSelectedItem(null)
        fetchDashboardData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user', { id: 'admin-error' })
    }
  }

  const handleDeleteUser = async () => {
    try {
      const response = await api.delete(`/admin/users/${selectedItem.user_id}`)
      if (response.data.status === 'success') {
        toast.success('User deleted successfully', { id: 'admin-action', duration: 1500 })
        setShowDeleteUser(false)
        setSelectedItem(null)
        fetchDashboardData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user', { id: 'admin-error' })
    }
  }

  const handleEditBuild = async (e) => {
    e.preventDefault()
    try {
      const response = await api.put(`/admin/builds/${selectedItem.build_id}`, {
        name: selectedItem.name,
        is_public: selectedItem.is_public ? 1 : 0,
        is_submitted: selectedItem.is_submitted ? 1 : 0
      })
      if (response.data.status === 'success') {
        toast.success('Build updated successfully', { id: 'admin-action', duration: 1500 })
        setShowEditBuild(false)
        setSelectedItem(null)
        fetchDashboardData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update build', { id: 'admin-error' })
    }
  }

  const handleDeleteBuild = async () => {
    try {
      const response = await api.delete(`/admin/builds/${selectedItem.build_id}`)
      if (response.data.status === 'success') {
        toast.success('Build deleted successfully', { id: 'admin-action', duration: 1500 })
        setShowDeleteBuild(false)
        setSelectedItem(null)
        fetchDashboardData()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete build', { id: 'admin-error' })
    }
  }

  const handleMarkRead = async (messageId) => {
    try {
      const response = await api.put(`/admin/contact-messages/${messageId}/read`)
      if (response.data.status === 'success') {
        toast.success('Message marked as read', { id: 'admin-action', duration: 1500 })
        fetchDashboardData()
      }
    } catch (error) {
      toast.error('Failed to mark message as read', { id: 'admin-error' })
    }
  }

  const handleReply = async (e) => {
    e.preventDefault()
    try {
      // Open Gmail with pre-filled email
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedItem.email)}&su=${encodeURIComponent('Re: ' + selectedItem.subject)}&body=${encodeURIComponent(replyMessage)}`
      window.open(gmailUrl, '_blank')
      
      // Mark as replied
      const response = await api.put(`/admin/contact-messages/${selectedItem.id}/replied`)
      if (response.data.status === 'success') {
        toast.success('Reply sent and message marked as replied', { id: 'admin-action', duration: 1500 })
        setShowReplyModal(false)
        setReplyMessage('')
        setSelectedItem(null)
        fetchDashboardData()
      }
    } catch (error) {
      toast.error('Failed to mark message as replied', { id: 'admin-error' })
    }
  }

  const handleDeleteComment = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return
    try {
      const response = await api.delete(`/admin/contact-messages/${messageId}`)
      if (response.data.status === 'success') {
        toast.success('Message deleted successfully', { id: 'admin-action', duration: 1500 })
        fetchDashboardData()
      }
    } catch (error) {
      toast.error('Failed to delete message', { id: 'admin-error' })
    }
  }

  const handleDeleteReset = async (token) => {
    if (!window.confirm('Are you sure you want to delete this password reset request?')) return
    try {
      const response = await api.delete(`/admin/password-resets/${token}`)
      if (response.data.status === 'success') {
        toast.success('Password reset request deleted successfully', { id: 'admin-action', duration: 1500 })
        fetchDashboardData()
      }
    } catch (error) {
      toast.error('Failed to delete password reset request', { id: 'admin-error' })
    }
  }

  const resetComponentForm = () => {
    setComponentForm({
      name: '',
      category_id: '',
      manufacturer_id: '',
      model: '',
      price: '',
      stock: '0',
      vendor_link: '',
      socket_type: '',
      ram_type: '',
      compat_cpu: [],
      compat_ram: [],
      compat_motherboard: []
    })
  }

  const getCategoryName = (categoryId) => {
    if (!categoryId) return ''
    // Normalize categoryId to number for comparison
    const catIdNum = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId
    // Find category by comparing as both string and number
    const cat = categories.find(c => {
      const cIdNum = typeof c.category_id === 'string' ? parseInt(c.category_id, 10) : c.category_id
      return cIdNum === catIdNum || String(c.category_id) === String(categoryId)
    })
    const categoryName = cat?.name || ''
    console.log('[AdminDashboard] getCategoryName:', { categoryId, categoryIdType: typeof categoryId, catIdNum, categoryName, found: !!cat })
    return categoryName
  }

  const getManufacturerName = (manufacturerId) => {
    const man = manufacturers.find(m => m.manufacturer_id === manufacturerId)
    return man?.name || ''
  }

  const shouldShowSocketType = () => {
    const catName = getCategoryName(componentForm.category_id)?.toLowerCase() || ''
    return catName.includes('cpu') || catName.includes('motherboard')
  }

  const shouldShowRamType = () => {
    const catName = getCategoryName(componentForm.category_id)?.toLowerCase() || ''
    return catName.includes('ram')
  }

  const shouldShowCompatFields = () => {
    if (!componentForm.category_id) {
      console.log('[AdminDashboard] shouldShowCompatFields: No category_id')
      return false
    }
    const catName = getCategoryName(componentForm.category_id)?.toLowerCase() || ''
    const shouldShow = ['cpu', 'ram', 'motherboard'].includes(catName)
    console.log('[AdminDashboard] shouldShowCompatFields:', { category_id: componentForm.category_id, catName, categories: categories.length, shouldShow, compatComponentsLoaded: compatComponents.cpu?.length || 0 })
    return shouldShow
  }

  const filteredComponents = components.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(c.category_id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getManufacturerName(c.manufacturer_id)?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredBuilds = builds.filter(b =>
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredComments = comments.filter(c =>
    c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.message?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredResets = resets.filter(r =>
    r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.token?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const tabs = [
    { id: 'components', label: 'Components', icon: <Package size={20} /> },
    { id: 'builds', label: 'Builds', icon: <Wrench size={20} /> },
    { id: 'users', label: 'Users', icon: <Users size={20} /> },
    { id: 'comments', label: 'Comments', icon: <MessageSquare size={20} /> },
    { id: 'resets', label: 'Password Resets', icon: <Key size={20} /> }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Admin Dashboard
            </h1>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
            <div className="card p-6 text-center">
              <Users className="mx-auto mb-2 text-blue-400" size={32} />
              <div className="text-2xl font-bold text-white">{stats.users}</div>
              <div className="text-gray-400">Users</div>
            </div>
            <div className="card p-6 text-center">
              <Package className="mx-auto mb-2 text-blue-400" size={32} />
              <div className="text-2xl font-bold text-white">{stats.components}</div>
              <div className="text-gray-400">Components</div>
            </div>
            <div className="card p-6 text-center">
              <Wrench className="mx-auto mb-2 text-blue-400" size={32} />
              <div className="text-2xl font-bold text-white">{stats.builds}</div>
              <div className="text-gray-400">Builds</div>
            </div>
            <div className="card p-6 text-center">
              <MessageSquare className="mx-auto mb-2 text-blue-400" size={32} />
              <div className="text-2xl font-bold text-white">{stats.comments}</div>
              <div className="text-gray-400">Comments (Unread)</div>
            </div>
            <div className="card p-6 text-center">
              <Key className="mx-auto mb-2 text-blue-400" size={32} />
              <div className="text-2xl font-bold text-white">{stats.resets}</div>
              <div className="text-gray-400">Reset Requests</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSearchTerm('')
                }}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="card p-6">
            {/* Components Tab */}
            {activeTab === 'components' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Components</h2>
                  <button
                    onClick={() => {
                      resetComponentForm()
                      setShowAddComponent(true)
                    }}
                    className="btn btn-primary flex items-center"
                  >
                    <Plus size={20} className="mr-2" />
                    Add Component
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredComponents.map((component) => (
                    <div key={component.component_id} className="card p-4">
                      <h3 className="font-semibold text-white mb-2">{component.name}</h3>
                      <div className="text-blue-400 font-semibold mb-2">${component.price}</div>
                      <div className="text-gray-400 text-sm mb-1">
                        Category: {component.category_name}
                      </div>
                      <div className="text-gray-400 text-sm mb-1">
                        Manufacturer: {component.manufacturer_name}
                      </div>
                      <div className="text-gray-400 text-sm mb-4">
                        Model: {component.model || 'N/A'}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditComponent(component)}
                          className="btn btn-secondary flex-1 flex items-center justify-center"
                        >
                          <Edit size={16} className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(component)
                            setShowDeleteComponent(true)
                          }}
                          className="btn btn-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Builds Tab */}
            {activeTab === 'builds' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Builds</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBuilds.map((build) => (
                    <div key={build.build_id} className="card p-4">
                      <h3 className="font-semibold text-white mb-2">{build.name}</h3>
                      <div className="text-blue-400 font-semibold mb-2">${build.total_price}</div>
                      <div className="text-gray-400 text-sm mb-1">By: {build.user_name}</div>
                      <div className="text-gray-400 text-sm mb-1">
                        Public: {build.is_public ? 'Yes' : 'No'}
                      </div>
                      <div className="text-gray-400 text-sm mb-4">
                        Submitted: {build.is_submitted ? 'Yes' : 'No'}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedItem(build)
                            setShowEditBuild(true)
                          }}
                          className="btn btn-secondary flex-1 flex items-center justify-center"
                        >
                          <Edit size={16} className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(build)
                            setShowDeleteBuild(true)
                          }}
                          className="btn btn-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Users</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => (
                    <div key={user.user_id} className="card p-4">
                      <h3 className="font-semibold text-white mb-2">{user.name}</h3>
                      <div className="text-gray-400 text-sm mb-2">{user.email}</div>
                      <div className="text-gray-400 text-sm mb-4">
                        Admin: {user.is_admin ? 'Yes' : 'No'}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedItem({ ...user })
                            setShowEditUser(true)
                          }}
                          className="btn btn-secondary flex-1 flex items-center justify-center"
                        >
                          <Edit size={16} className="mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(user)
                            setShowDeleteUser(true)
                          }}
                          className="btn btn-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Contact Messages</h2>
                <div className="space-y-4">
                  {filteredComments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`card p-4 ${
                        !comment.is_read ? 'border-2 border-blue-500' : 'opacity-75'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white">{comment.subject}</h3>
                        <div className="flex gap-2">
                          {!comment.is_read && (
                            <span className="px-2 py-1 bg-yellow-600 rounded text-xs">Unread</span>
                          )}
                          {comment.is_replied && (
                            <span className="px-2 py-1 bg-green-600 rounded text-xs">Replied</span>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm mb-2">
                        From: {comment.name} ({comment.email})
                      </div>
                      <div className="text-gray-300 mb-4 whitespace-pre-wrap">{comment.message}</div>
                      <div className="text-gray-400 text-xs mb-4">
                        Date: {new Date(comment.created_at).toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        {!comment.is_read && (
                          <button
                            onClick={() => handleMarkRead(comment.id)}
                            className="btn btn-secondary"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedItem(comment)
                            setReplyMessage('')
                            setShowReplyModal(true)
                          }}
                          className="btn btn-secondary"
                        >
                          <Mail size={16} className="mr-1" />
                          Reply
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="btn btn-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Password Resets Tab */}
            {activeTab === 'resets' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Password Reset Requests</h2>
                <div className="space-y-4">
                  {filteredResets.map((reset) => (
                    <div key={reset.token} className="card p-4">
                      <div className="text-white font-semibold mb-2">{reset.email}</div>
                      <div className="text-gray-400 text-sm mb-1">
                        Token: <span className="font-mono text-xs break-all">{reset.token}</span>
                      </div>
                      <div className="text-gray-400 text-sm mb-4">
                        Expires: {new Date(reset.expires_at).toLocaleString()}
                      </div>
                      <button
                        onClick={() => handleDeleteReset(reset.token)}
                        className="btn btn-danger"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Component Modal */}
      {showAddComponent && (
        <Modal
          title="Add Component"
          onClose={() => {
            setShowAddComponent(false)
            resetComponentForm()
          }}
        >
          <form onSubmit={handleAddComponent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                required
                value={componentForm.name}
                onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                required
                value={componentForm.category_id}
                onChange={(e) => setComponentForm({ ...componentForm, category_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Manufacturer *</label>
              <select
                required
                value={componentForm.manufacturer_id}
                onChange={(e) => setComponentForm({ ...componentForm, manufacturer_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                <option value="">Select Manufacturer</option>
                {manufacturers.map(man => (
                  <option key={man.manufacturer_id} value={man.manufacturer_id}>{man.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model *</label>
              <input
                type="text"
                required
                value={componentForm.model}
                onChange={(e) => setComponentForm({ ...componentForm, model: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            {shouldShowSocketType() && (
              <div>
                <label className="block text-sm font-medium mb-1">Socket Type</label>
                <input
                  type="text"
                  value={componentForm.socket_type}
                  onChange={(e) => setComponentForm({ ...componentForm, socket_type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
            )}
            {shouldShowRamType() && (
              <div>
                <label className="block text-sm font-medium mb-1">RAM Type</label>
                <input
                  type="text"
                  value={componentForm.ram_type}
                  onChange={(e) => setComponentForm({ ...componentForm, ram_type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Price *</label>
              <input
                type="number"
                step="0.01"
                required
                value={componentForm.price}
                onChange={(e) => setComponentForm({ ...componentForm, price: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input
                type="number"
                min="0"
                value={componentForm.stock}
                onChange={(e) => setComponentForm({ ...componentForm, stock: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vendor Link</label>
              <input
                type="url"
                value={componentForm.vendor_link}
                onChange={(e) => setComponentForm({ ...componentForm, vendor_link: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            {shouldShowCompatFields() && (
              <>
                {getCategoryName(componentForm.category_id)?.toLowerCase() !== 'cpu' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Compatible CPUs</label>
                    <select
                      multiple
                      size={5}
                      value={componentForm.compat_cpu && componentForm.compat_cpu.length > 0 ? componentForm.compat_cpu.map(id => String(id)) : []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                        setComponentForm({
                          ...componentForm,
                          compat_cpu: selected
                        })
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    >
                      {compatComponents.cpu && compatComponents.cpu.length > 0 ? (
                        compatComponents.cpu.map(cpu => (
                          <option key={cpu.component_id} value={String(cpu.component_id)}>{cpu.name}</option>
                        ))
                      ) : (
                        <option value="" disabled>No CPUs available</option>
                      )}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                )}
                {getCategoryName(componentForm.category_id)?.toLowerCase() !== 'ram' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Compatible RAM</label>
                    <select
                      multiple
                      size={5}
                      value={componentForm.compat_ram && componentForm.compat_ram.length > 0 ? componentForm.compat_ram.map(id => String(id)) : []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                        setComponentForm({
                          ...componentForm,
                          compat_ram: selected
                        })
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    >
                      {compatComponents.ram && compatComponents.ram.length > 0 ? (
                        compatComponents.ram.map(ram => (
                          <option key={ram.component_id} value={String(ram.component_id)}>{ram.name}</option>
                        ))
                      ) : (
                        <option value="" disabled>No RAM available</option>
                      )}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                )}
                {getCategoryName(componentForm.category_id)?.toLowerCase() !== 'motherboard' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Compatible Motherboards</label>
                    <select
                      multiple
                      size={5}
                      value={componentForm.compat_motherboard && componentForm.compat_motherboard.length > 0 ? componentForm.compat_motherboard.map(id => String(id)) : []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                        setComponentForm({
                          ...componentForm,
                          compat_motherboard: selected
                        })
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    >
                      {compatComponents.motherboard && compatComponents.motherboard.length > 0 ? (
                        compatComponents.motherboard.map(mb => (
                          <option key={mb.component_id} value={String(mb.component_id)}>{mb.name}</option>
                        ))
                      ) : (
                        <option value="" disabled>No Motherboards available</option>
                      )}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                )}
              </>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddComponent(false)
                  resetComponentForm()
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Component
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Component Modal */}
      {showEditComponent && selectedItem && (
        <Modal
          title="Edit Component"
          onClose={() => {
            setShowEditComponent(false)
            setSelectedItem(null)
            resetComponentForm()
          }}
        >
          <form onSubmit={handleEditComponent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                required
                value={componentForm.name}
                onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                required
                value={componentForm.category_id}
                onChange={(e) => setComponentForm({ ...componentForm, category_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Manufacturer *</label>
              <select
                required
                value={componentForm.manufacturer_id}
                onChange={(e) => setComponentForm({ ...componentForm, manufacturer_id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                <option value="">Select Manufacturer</option>
                {manufacturers.map(man => (
                  <option key={man.manufacturer_id} value={man.manufacturer_id}>{man.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model *</label>
              <input
                type="text"
                required
                value={componentForm.model}
                onChange={(e) => setComponentForm({ ...componentForm, model: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            {shouldShowSocketType() && (
              <div>
                <label className="block text-sm font-medium mb-1">Socket Type</label>
                <input
                  type="text"
                  value={componentForm.socket_type}
                  onChange={(e) => setComponentForm({ ...componentForm, socket_type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
            )}
            {shouldShowRamType() && (
              <div>
                <label className="block text-sm font-medium mb-1">RAM Type</label>
                <input
                  type="text"
                  value={componentForm.ram_type}
                  onChange={(e) => setComponentForm({ ...componentForm, ram_type: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Price *</label>
              <input
                type="number"
                step="0.01"
                required
                value={componentForm.price}
                onChange={(e) => setComponentForm({ ...componentForm, price: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input
                type="number"
                min="0"
                value={componentForm.stock}
                onChange={(e) => setComponentForm({ ...componentForm, stock: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vendor Link</label>
              <input
                type="url"
                value={componentForm.vendor_link}
                onChange={(e) => setComponentForm({ ...componentForm, vendor_link: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            {shouldShowCompatFields() && (
              <>
                {getCategoryName(componentForm.category_id)?.toLowerCase() !== 'cpu' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Compatible CPUs</label>
                    <select
                      multiple
                      size={5}
                      value={componentForm.compat_cpu && componentForm.compat_cpu.length > 0 ? componentForm.compat_cpu.map(id => String(id)) : []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                        setComponentForm({
                          ...componentForm,
                          compat_cpu: selected
                        })
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    >
                      {compatComponents.cpu && compatComponents.cpu.length > 0 ? (
                        compatComponents.cpu.map(cpu => (
                          <option key={cpu.component_id} value={String(cpu.component_id)}>{cpu.name}</option>
                        ))
                      ) : (
                        <option value="" disabled>No CPUs available</option>
                      )}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                )}
                {getCategoryName(componentForm.category_id)?.toLowerCase() !== 'ram' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Compatible RAM</label>
                    <select
                      multiple
                      size={5}
                      value={componentForm.compat_ram && componentForm.compat_ram.length > 0 ? componentForm.compat_ram.map(id => String(id)) : []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                        setComponentForm({
                          ...componentForm,
                          compat_ram: selected
                        })
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    >
                      {compatComponents.ram && compatComponents.ram.length > 0 ? (
                        compatComponents.ram.map(ram => (
                          <option key={ram.component_id} value={String(ram.component_id)}>{ram.name}</option>
                        ))
                      ) : (
                        <option value="" disabled>No RAM available</option>
                      )}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                )}
                {getCategoryName(componentForm.category_id)?.toLowerCase() !== 'motherboard' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Compatible Motherboards</label>
                    <select
                      multiple
                      size={5}
                      value={componentForm.compat_motherboard && componentForm.compat_motherboard.length > 0 ? componentForm.compat_motherboard.map(id => String(id)) : []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                        setComponentForm({
                          ...componentForm,
                          compat_motherboard: selected
                        })
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    >
                      {compatComponents.motherboard && compatComponents.motherboard.length > 0 ? (
                        compatComponents.motherboard.map(mb => (
                          <option key={mb.component_id} value={String(mb.component_id)}>{mb.name}</option>
                        ))
                      ) : (
                        <option value="" disabled>No Motherboards available</option>
                      )}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                )}
              </>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowEditComponent(false)
                  setSelectedItem(null)
                  resetComponentForm()
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Component Modal */}
      {showDeleteComponent && selectedItem && (
        <Modal
          title="Delete Component"
          onClose={() => {
            setShowDeleteComponent(false)
            setSelectedItem(null)
          }}
        >
          <p className="mb-4">
            Are you sure you want to delete <strong>{selectedItem.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowDeleteComponent(false)
                setSelectedItem(null)
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleDeleteComponent} className="btn btn-danger">
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditUser && selectedItem && (
        <Modal
          title="Edit User"
          onClose={() => {
            setShowEditUser(false)
            setSelectedItem(null)
          }}
        >
          <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                required
                value={selectedItem.name}
                onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                required
                value={selectedItem.email}
                onChange={(e) => setSelectedItem({ ...selectedItem, email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Admin</label>
              <select
                value={selectedItem.is_admin ? 1 : 0}
                onChange={(e) => setSelectedItem({ ...selectedItem, is_admin: e.target.value === '1' })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowEditUser(false)
                  setSelectedItem(null)
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete User Modal */}
      {showDeleteUser && selectedItem && (
        <Modal
          title="Delete User"
          onClose={() => {
            setShowDeleteUser(false)
            setSelectedItem(null)
          }}
        >
          <p className="mb-4">
            Are you sure you want to delete user <strong>{selectedItem.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowDeleteUser(false)
                setSelectedItem(null)
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleDeleteUser} className="btn btn-danger">
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Build Modal */}
      {showEditBuild && selectedItem && (
        <Modal
          title="Edit Build"
          onClose={() => {
            setShowEditBuild(false)
            setSelectedItem(null)
          }}
        >
          <form onSubmit={handleEditBuild} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                required
                value={selectedItem.name}
                onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Public</label>
              <select
                value={selectedItem.is_public ? 1 : 0}
                onChange={(e) => setSelectedItem({ ...selectedItem, is_public: e.target.value === '1' })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Submitted</label>
              <select
                value={selectedItem.is_submitted ? 1 : 0}
                onChange={(e) => setSelectedItem({ ...selectedItem, is_submitted: e.target.value === '1' })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowEditBuild(false)
                  setSelectedItem(null)
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Build Modal */}
      {showDeleteBuild && selectedItem && (
        <Modal
          title="Delete Build"
          onClose={() => {
            setShowDeleteBuild(false)
            setSelectedItem(null)
          }}
        >
          <p className="mb-4">
            Are you sure you want to delete build <strong>{selectedItem.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowDeleteBuild(false)
                setSelectedItem(null)
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button onClick={handleDeleteBuild} className="btn btn-danger">
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedItem && (
        <Modal
          title="Reply to Message"
          onClose={() => {
            setShowReplyModal(false)
            setSelectedItem(null)
            setReplyMessage('')
          }}
        >
          <form onSubmit={handleReply} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <input
                type="email"
                value={selectedItem.email}
                disabled
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                type="text"
                value={`Re: ${selectedItem.subject}`}
                disabled
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message *</label>
              <textarea
                required
                rows={6}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                placeholder="Type your reply message here..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowReplyModal(false)
                  setSelectedItem(null)
                  setReplyMessage('')
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Mail size={16} className="mr-1" />
                Send Reply
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// Modal Component
const Modal = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default AdminDashboard

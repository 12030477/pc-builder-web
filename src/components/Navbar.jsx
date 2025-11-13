import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X, User, LogOut, Wrench, Search, Info, Mail } from 'lucide-react'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [navbarVisible, setNavbarVisible] = useState(true)
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Handle scroll behavior for mobile
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (window.innerWidth <= 600) {
        if (currentScrollY > lastScrollY && currentScrollY > 24) {
          setNavbarVisible(false)
        } else {
          setNavbarVisible(true)
        }
      } else {
        setNavbarVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 600) {
        setNavbarVisible(true)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMobileMenuOpen(false)
  }

  const getInitials = (name) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <nav className={`navbar transition-all duration-300 ${navbarVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
      <div className="container">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/Images/pcbuild.png" 
              alt="PC Build Logo" 
              className="h-8 w-8 rounded-full object-cover"
            />
          </Link>

          {/* Mobile Title - Center */}
          <div className="md:hidden flex-1 flex justify-center">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gradient mb-0">
                PC Builder
              </h1>
              <p className="text-xs text-gray-400 font-medium">
                Build Your Dream PC
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/system-builder" 
              className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-blue-600/20"
            >
              <Wrench size={16} />
              <span>System Builder</span>
            </Link>
            <Link 
              to="/search-builds" 
              className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-blue-600/20"
            >
              <Search size={16} />
              <span>Search Builds</span>
            </Link>
            <Link 
              to="/about" 
              className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-blue-600/20"
            >
              <Info size={16} />
              <span>About Us</span>
            </Link>
            <Link 
              to="/contact" 
              className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-blue-600/20"
            >
              <Mail size={16} />
              <span>Contact Us</span>
            </Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-3">
                  <span className="text-blue-400 font-medium">
                    Hello, {user.name}{isAdmin && ' (Admin)'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-white hover:text-red-400 transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-red-600/20"
                    title="Logout"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <Link 
                to="/signin" 
                className="btn btn-primary"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:bg-gray-700/50 transition-all duration-200 group"
            aria-label="Toggle mobile menu"
          >
            <div className="relative w-6 h-6">
              {/* Hamburger lines */}
              <span 
                className={`absolute top-1 left-0 w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 top-3' : 'top-1'
                }`}
              />
              <span 
                className={`absolute top-3 left-0 w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span 
                className={`absolute top-5 left-0 w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 top-3' : 'top-5'
                }`}
              />
            </div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-lg bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-700 animate-slide-down">
            <div className="flex flex-col space-y-1 mt-4">
              <Link 
                to="/system-builder" 
                className="flex items-center space-x-3 text-white hover:text-blue-400 transition-all duration-200 px-4 py-3 rounded-xl hover:bg-blue-600/20 hover:shadow-lg hover:shadow-blue-500/10 group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors duration-200">
                  <Wrench size={18} className="text-blue-400" />
                </div>
                <span className="font-medium">System Builder</span>
              </Link>
              <Link 
                to="/search-builds" 
                className="flex items-center space-x-3 text-white hover:text-blue-400 transition-all duration-200 px-4 py-3 rounded-xl hover:bg-blue-600/20 hover:shadow-lg hover:shadow-blue-500/10 group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors duration-200">
                  <Search size={18} className="text-blue-400" />
                </div>
                <span className="font-medium">Search Builds</span>
              </Link>
              <Link 
                to="/about" 
                className="flex items-center space-x-3 text-white hover:text-blue-400 transition-all duration-200 px-4 py-3 rounded-xl hover:bg-blue-600/20 hover:shadow-lg hover:shadow-blue-500/10 group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors duration-200">
                  <Info size={18} className="text-blue-400" />
                </div>
                <span className="font-medium">About Us</span>
              </Link>
              <Link 
                to="/contact" 
                className="flex items-center space-x-3 text-white hover:text-blue-400 transition-all duration-200 px-4 py-3 rounded-xl hover:bg-blue-600/20 hover:shadow-lg hover:shadow-blue-500/10 group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors duration-200">
                  <Mail size={18} className="text-blue-400" />
                </div>
                <span className="font-medium">Contact Us</span>
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link 
                    to="/my-builds" 
                    className="flex items-center space-x-3 text-white hover:text-blue-400 transition-all duration-200 px-4 py-3 rounded-xl hover:bg-blue-600/20 hover:shadow-lg hover:shadow-blue-500/10 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors duration-200">
                      <User size={18} className="text-blue-400" />
                    </div>
                    <span className="font-medium">My Builds</span>
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className="flex items-center space-x-3 text-white hover:text-blue-400 transition-all duration-200 px-4 py-3 rounded-xl hover:bg-blue-600/20 hover:shadow-lg hover:shadow-blue-500/10 group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-600/20 group-hover:bg-yellow-600/30 transition-colors duration-200">
                        <span className="text-yellow-400 text-lg">⚡</span>
                      </div>
                      <span className="font-medium">Admin Dashboard</span>
                    </Link>
                  )}
                </>
              )}
              
              <div className="border-t border-gray-700 pt-3 mt-3">
                {isAuthenticated ? (
                  <div className="px-4 py-3">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-600/20">
                        <User size={18} className="text-green-400" />
                      </div>
                      <div>
                        <div className="text-blue-400 font-medium text-sm">
                          {user.name}
                        </div>
                        {isAdmin && (
                          <div className="text-yellow-400 text-xs font-medium">
                            Administrator
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-2 text-white hover:text-red-400 transition-all duration-200 px-4 py-2 rounded-xl hover:bg-red-600/20 hover:shadow-lg hover:shadow-red-500/10 group"
                    >
                      <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-600/20 group-hover:bg-red-600/30 transition-colors duration-200">
                        <LogOut size={14} className="text-red-400" />
                      </div>
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                ) : (
                  <Link 
                    to="/signin" 
                    className="block w-full btn btn-primary text-center py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X, User, LogOut, Wrench, Search, Info, Mail } from 'lucide-react'

// Helper function to detect device type (works on both server and client)
// Universal tablet detection: covers ALL tablets in the 640px-1070px range
const getDeviceType = () => {
  if (typeof window === 'undefined') {
    // Default to desktop on server-side rendering
    return { isMobile: false, isTablet: false }
  }
  const width = window.innerWidth || window.screen?.width || 1920
  // Mobile: < 640px (phones)
  // Tablet: >= 640px and <= 1070px (ALL tablets, any orientation, any device)
  // Desktop: > 1070px (large screens)
  const isMobile = width < 640
  const isTablet = width >= 640 && width <= 1070
  return {
    isMobile,
    isTablet
  }
}

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [navbarVisible, setNavbarVisible] = useState(true)
  const [expandedIcon, setExpandedIcon] = useState(null) // For tablet mode icon expansion
  const [deviceType, setDeviceType] = useState(() => getDeviceType()) // Initialize with current width
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isMobile = deviceType.isMobile
  const isTablet = deviceType.isTablet

  // Detect device type based on width (universal tablet detection)
  // This ensures ALL tablets (640px-1070px) use the tablet layout
  useEffect(() => {
    let resizeTimer
    let orientationTimer
    
    const checkDeviceType = () => {
      // Use multiple sources to get width (for reliability)
      const width = window.innerWidth || 
                   document.documentElement.clientWidth || 
                   window.screen?.width || 
                   1920
      
      // UNIVERSAL TABLET RANGE: >= 640px and <= 1070px
      // This covers ALL tablets: iPad, iPad Mini, iPad Air, Android tablets, etc.
      // Mobile: < 640px (phones)
      // Tablet: >= 640px and <= 1070px (ALL tablets, any orientation)
      // Desktop: > 1070px (large screens)
      const newType = {
        isMobile: width < 640,
        isTablet: width >= 640 && width <= 1070
      }
      
      // Always update state (React will optimize re-renders)
      setDeviceType(prev => {
        // Only trigger re-render if changed
        if (prev.isMobile !== newType.isMobile || prev.isTablet !== newType.isTablet) {
          return newType
        }
        return prev
      })
      
      // Close mobile menu if we're not on mobile
      if (!newType.isMobile && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
      
      // Close expanded icon when switching out of tablet mode
      if (!newType.isTablet && expandedIcon) {
        setExpandedIcon(null)
      }
    }

    // Debounced resize handler (prevents too many checks)
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(checkDeviceType, 100)
    }

    // Handle orientation change (tablets often rotate)
    const handleOrientationChange = () => {
      clearTimeout(orientationTimer)
      // Small delay to allow browser to update dimensions
      orientationTimer = setTimeout(checkDeviceType, 150)
    }

    // Check immediately on mount (critical for first render)
    checkDeviceType()

    // Also check after a brief delay to catch any timing issues
    const mountTimer = setTimeout(checkDeviceType, 100)

    // Listen for resize and orientation changes
    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('load', checkDeviceType)

    return () => {
      clearTimeout(resizeTimer)
      clearTimeout(orientationTimer)
      clearTimeout(mountTimer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('load', checkDeviceType)
    }
  }, [isMobileMenuOpen, expandedIcon])

  // Handle scroll behavior for mobile/tablet
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (window.innerWidth <= 1070) {
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

  // Close expanded icon when clicking outside (tablet mode)
  useEffect(() => {
    if (expandedIcon && isTablet) {
      const handleClickOutside = (e) => {
        // Check if click is outside the navbar tablet navigation area
        const tabletNav = document.querySelector('.tablet-nav-container')
        const tabletAuth = document.querySelector('.tablet-auth-container')
        if (
          (tabletNav && !tabletNav.contains(e.target)) &&
          (tabletAuth && !tabletAuth.contains(e.target))
        ) {
          setExpandedIcon(null)
        }
      }

      // Add event listener with a small delay to avoid immediate closure
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)
      }, 100)

      return () => {
        clearTimeout(timer)
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [expandedIcon, isTablet])

  // Handle tablet icon click - expand to show text, or navigate if already expanded
  const handleTabletIconClick = (e, iconId, path) => {
    e.preventDefault()
    e.stopPropagation()
    if (expandedIcon === iconId) {
      // If already expanded, navigate
      navigate(path)
      setExpandedIcon(null)
    } else {
      // Expand this icon (collapse others)
      setExpandedIcon(iconId)
    }
  }

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
        <div className="flex items-center justify-between h-12 gap-2 md:gap-0">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 flex-shrink-0">
            <img 
              src="/Images/pcbuild.png" 
              alt="PC Build Logo" 
              className="h-8 w-8 rounded-full object-cover"
            />
          </Link>

          {/* Mobile Title - Center (shows only on mobile <640px) */}
          {isMobile && (
            <Link to="/" className="flex-1 flex justify-center min-w-0">
              <div className="text-center cursor-pointer hover:opacity-80 transition-opacity duration-200">
                <h1 className="text-xl font-bold text-gradient mb-0">
                  PC Builder
                </h1>
                <p className="text-xs text-gray-400 font-medium">
                  Build Your Dream PC
                </p>
              </div>
            </Link>
          )}

          {/* Tablet Navigation - Expandable Icons (shows on tablet 640px-1070px) */}
          {isTablet && (
            <div className="tablet-nav-container flex items-center space-x-1.5 flex-shrink-0">
            {/* System Builder */}
            <div className="relative">
              <button
                onClick={(e) => handleTabletIconClick(e, 'system-builder', '/system-builder')}
                className={`flex items-center justify-center text-white hover:text-blue-400 transition-all duration-300 rounded-lg hover:bg-blue-600/20 ${
                  expandedIcon === 'system-builder'
                    ? 'w-auto px-3 bg-blue-600/20'
                    : 'w-10 h-10'
                }`}
                title={expandedIcon === 'system-builder' ? '' : 'System Builder'}
              >
                <Wrench size={20} className="flex-shrink-0" />
                {expandedIcon === 'system-builder' && (
                  <span className="ml-2 text-sm font-medium whitespace-nowrap animate-fade-in">
                    System Builder
                  </span>
                )}
              </button>
            </div>

            {/* Search Builds */}
            <div className="relative">
              <button
                onClick={(e) => handleTabletIconClick(e, 'search-builds', '/search-builds')}
                className={`flex items-center justify-center text-white hover:text-blue-400 transition-all duration-300 rounded-lg hover:bg-blue-600/20 ${
                  expandedIcon === 'search-builds'
                    ? 'w-auto px-3 bg-blue-600/20'
                    : 'w-10 h-10'
                }`}
                title={expandedIcon === 'search-builds' ? '' : 'Search Builds'}
              >
                <Search size={20} className="flex-shrink-0" />
                {expandedIcon === 'search-builds' && (
                  <span className="ml-2 text-sm font-medium whitespace-nowrap animate-fade-in">
                    Search Builds
                  </span>
                )}
              </button>
            </div>

            {/* About Us */}
            <div className="relative">
              <button
                onClick={(e) => handleTabletIconClick(e, 'about', '/about')}
                className={`flex items-center justify-center text-white hover:text-blue-400 transition-all duration-300 rounded-lg hover:bg-blue-600/20 ${
                  expandedIcon === 'about'
                    ? 'w-auto px-3 bg-blue-600/20'
                    : 'w-10 h-10'
                }`}
                title={expandedIcon === 'about' ? '' : 'About Us'}
              >
                <Info size={20} className="flex-shrink-0" />
                {expandedIcon === 'about' && (
                  <span className="ml-2 text-sm font-medium whitespace-nowrap animate-fade-in">
                    About Us
                  </span>
                )}
              </button>
            </div>

            {/* Contact Us */}
            <div className="relative">
              <button
                onClick={(e) => handleTabletIconClick(e, 'contact', '/contact')}
                className={`flex items-center justify-center text-white hover:text-blue-400 transition-all duration-300 rounded-lg hover:bg-blue-600/20 ${
                  expandedIcon === 'contact'
                    ? 'w-auto px-3 bg-blue-600/20'
                    : 'w-10 h-10'
                }`}
                title={expandedIcon === 'contact' ? '' : 'Contact Us'}
              >
                <Mail size={20} className="flex-shrink-0" />
                {expandedIcon === 'contact' && (
                  <span className="ml-2 text-sm font-medium whitespace-nowrap animate-fade-in">
                    Contact Us
                  </span>
                )}
              </button>
            </div>
          </div>
          )}

          {/* Desktop Navigation - Full with Text (shows only for >1070px) */}
          {!isMobile && !isTablet && (
            <div className="flex items-center space-x-4 lg:space-x-6 flex-shrink-0">
            <Link 
              to="/system-builder" 
              className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors duration-200 px-2 lg:px-3 py-2 rounded-lg hover:bg-blue-600/20 whitespace-nowrap"
            >
              <Wrench size={16} />
              <span className="text-sm lg:text-base">System Builder</span>
            </Link>
            <Link 
              to="/search-builds" 
              className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors duration-200 px-2 lg:px-3 py-2 rounded-lg hover:bg-blue-600/20 whitespace-nowrap"
            >
              <Search size={16} />
              <span className="text-sm lg:text-base">Search Builds</span>
            </Link>
            <Link 
              to="/about" 
              className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors duration-200 px-2 lg:px-3 py-2 rounded-lg hover:bg-blue-600/20 whitespace-nowrap"
            >
              <Info size={16} />
              <span className="text-sm lg:text-base">About Us</span>
            </Link>
            <Link 
              to="/contact" 
              className="flex items-center space-x-2 text-white hover:text-blue-400 transition-colors duration-200 px-2 lg:px-3 py-2 rounded-lg hover:bg-blue-600/20 whitespace-nowrap"
            >
              <Mail size={16} />
              <span className="text-sm lg:text-base">Contact Us</span>
            </Link>
          </div>
          )}

          {/* Tablet Auth - Expandable Icons (shows on tablet 640px-1070px) */}
          {isTablet && (
            <div className="tablet-auth-container flex items-center space-x-1.5 flex-shrink-0">
            {isAuthenticated ? (
              <>
                {/* User/Admin Icon */}
                <div className="relative">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={(e) => handleTabletIconClick(e, 'admin', '/admin')}
                        className={`flex items-center justify-center text-yellow-400 hover:text-yellow-300 transition-all duration-300 rounded-lg hover:bg-yellow-600/20 ${
                          expandedIcon === 'admin'
                            ? 'w-auto px-3 bg-yellow-600/20'
                            : 'w-10 h-10'
                        }`}
                        title={expandedIcon === 'admin' ? '' : `${user.name} (Admin)`}
                      >
                        <span className="text-lg">⚡</span>
                        {expandedIcon === 'admin' && (
                          <span className="ml-2 text-sm font-medium whitespace-nowrap animate-fade-in">
                            {user.name}
                          </span>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => handleTabletIconClick(e, 'user', '/my-builds')}
                        className={`flex items-center justify-center text-green-400 hover:text-green-300 transition-all duration-300 rounded-lg hover:bg-green-600/20 ${
                          expandedIcon === 'user'
                            ? 'w-auto px-3 bg-green-600/20'
                            : 'w-8 h-8 rounded-full bg-green-600/20'
                        }`}
                        title={expandedIcon === 'user' ? '' : user.name}
                      >
                        <User size={16} className="flex-shrink-0" />
                        {expandedIcon === 'user' && (
                          <span className="ml-2 text-sm font-medium whitespace-nowrap animate-fade-in">
                            {user.name}
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-10 h-10 text-white hover:text-red-400 transition-colors duration-200 rounded-lg hover:bg-red-600/20"
                  title="Logout"
                  onMouseEnter={() => setExpandedIcon(null)}
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <Link 
                to="/signin" 
                className="flex items-center justify-center w-10 h-10 text-white hover:text-blue-400 transition-colors duration-200 rounded-lg hover:bg-blue-600/20"
                title="Login"
              >
                <User size={20} />
              </Link>
            )}
          </div>
          )}

          {/* Desktop Auth - Full with Text (shows only for >1070px) */}
          {!isMobile && !isTablet && (
            <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 lg:space-x-3">
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      className="text-blue-400 font-medium hover:text-yellow-400 transition-colors duration-200 px-2 lg:px-3 py-2 rounded-lg hover:bg-yellow-600/20 cursor-pointer flex items-center space-x-1 group whitespace-nowrap"
                      title="Click to go to Admin Dashboard"
                    >
                      <span className="text-sm lg:text-base">Hello, {user.name}</span>
                      <span className="text-yellow-400 group-hover:text-yellow-300 text-sm lg:text-base">(Admin)</span>
                      <span className="text-yellow-400 text-xs">⚡</span>
                    </Link>
                  ) : (
                    <span className="text-blue-400 font-medium text-sm lg:text-base whitespace-nowrap">
                      Hello, {user.name}
                    </span>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1.5 lg:space-x-2 text-white hover:text-red-400 transition-colors duration-200 px-2 lg:px-3 py-2 rounded-lg hover:bg-red-600/20 whitespace-nowrap"
                    title="Logout"
                  >
                    <LogOut size={14} className="lg:w-4 lg:h-4" />
                    <span className="text-sm lg:text-base">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <Link 
                to="/signin" 
                className="btn btn-primary text-sm lg:text-base px-3 lg:px-4 whitespace-nowrap"
              >
                Login
              </Link>
            )}
          </div>
          )}

          {/* Mobile Menu Button (shows only on mobile <640px) */}
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:bg-gray-700/50 transition-all duration-200"
              aria-label="Toggle mobile menu"
              type="button"
            >
              {isMobileMenuOpen ? (
                <X size={24} className="text-white transition-transform duration-300" />
              ) : (
                <Menu size={24} className="text-white transition-transform duration-300" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu - Rendered as portal outside nav (shows only on mobile <640px) */}
      {isMobileMenuOpen && isMobile && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 z-[9998]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu */}
          <div 
            className="fixed left-0 right-0 bottom-0 bg-black z-[9999] overflow-y-auto shadow-2xl"
            style={{ top: '48px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col space-y-2">
                <Link 
                  to="/system-builder" 
                  className="flex items-center space-x-3 text-white hover:text-blue-400 transition-all duration-200 px-4 py-3 rounded-xl hover:bg-blue-600/20 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors duration-200 flex-shrink-0">
                    <Wrench size={20} className="text-blue-400" />
                  </div>
                  <span className="font-medium text-base">System Builder</span>
                </Link>
                <Link 
                  to="/search-builds" 
                  className="flex items-center space-x-3 text-white hover:text-blue-400 transition-all duration-200 px-4 py-3 rounded-xl hover:bg-blue-600/20 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors duration-200 flex-shrink-0">
                    <Search size={20} className="text-blue-400" />
                  </div>
                  <span className="font-medium text-base">Search Builds</span>
                </Link>
                <Link 
                  to="/about" 
                  className="flex items-center space-x-3 text-white hover:text-blue-400 transition-all duration-200 px-4 py-3 rounded-xl hover:bg-blue-600/20 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors duration-200 flex-shrink-0">
                    <Info size={20} className="text-blue-400" />
                  </div>
                  <span className="font-medium text-base">About Us</span>
                </Link>
                <Link 
                  to="/contact" 
                  className="flex items-center space-x-3 text-white hover:text-blue-400 transition-all duration-200 px-4 py-3 rounded-xl hover:bg-blue-600/20 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors duration-200 flex-shrink-0">
                    <Mail size={20} className="text-blue-400" />
                  </div>
                  <span className="font-medium text-base">Contact Us</span>
                </Link>
                
                {isAuthenticated && (
                  <Link 
                    to="/my-builds" 
                    className="flex items-center space-x-3 text-white hover:text-blue-400 transition-all duration-200 px-4 py-3 rounded-xl hover:bg-blue-600/20 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 transition-colors duration-200 flex-shrink-0">
                      <User size={20} className="text-blue-400" />
                    </div>
                    <span className="font-medium text-base">My Builds</span>
                  </Link>
                )}
                
                <div className="border-t border-gray-700 pt-4 mt-2">
                  {isAuthenticated ? (
                    <div>
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 mb-4 p-3 rounded-xl hover:bg-yellow-600/20 transition-all duration-200 group cursor-pointer"
                          title="Click to go to Admin Dashboard"
                        >
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-600/20 group-hover:bg-yellow-600/30 transition-colors duration-200 flex-shrink-0">
                            <span className="text-yellow-400 text-lg">⚡</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-yellow-400 font-medium text-sm truncate group-hover:text-yellow-300">
                              {user.name}
                            </div>
                            <div className="text-yellow-400 text-xs font-medium">
                              Administrator - Tap to Dashboard
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center space-x-3 mb-4 px-3">
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-600/20 flex-shrink-0">
                            <User size={20} className="text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-blue-400 font-medium text-sm truncate">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 text-white hover:text-red-400 transition-all duration-200 px-4 py-3 rounded-xl hover:bg-red-600/20 group"
                      >
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-600/20 group-hover:bg-red-600/30 transition-colors duration-200">
                          <LogOut size={16} className="text-red-400" />
                        </div>
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  ) : (
                    <Link 
                      to="/signin" 
                      className="block w-full btn btn-primary text-center py-3 rounded-xl font-semibold"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </nav>
  )
}

export default Navbar

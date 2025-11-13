import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { isAuthenticated, isAdmin } = useAuth()

  const images = [
    'PC (1).jpg',
    'PC (2).jpg',
    'PC (3).jpg',
    'PC (4).jpg',
    'PC (5).jpg',
    'PC (6).jpg',
    'PC (7).jpg',
    'PC (8).jpg',
    'PC (9).jpg',
    'PC (10).jpg',
    'PC (11).jpg',
    'PC (12).jpg'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center">
      {/* Main Content Card */}
      <div className="card mt-40 max-w-2xl w-[95vw] text-center p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-400 mb-6">
          PC Builder
        </h1>
        
        <hr className="border-gray-600 mb-8" />
        
        {/* Image Container */}
        <div className="w-full flex justify-center items-center my-8">
          <img
            id="slideshow"
            src={`/Images/${images[currentImageIndex]}`}
            alt="PC Build"
            className="max-w-full h-auto object-contain rounded-2xl shadow-2xl border-2 border-gray-700 bg-gray-800 transition-none"
            style={{ maxHeight: '400px' }}
          />
        </div>
        
        <div className="text-center text-xl md:text-2xl text-blue-400 mt-6 italic tracking-wide">
          On this site, you can create builds, find information about PC parts, and more. 
          Start building your dream PC today!
        </div>
      </div>

      {/* Admin Dashboard Button */}
      {isAuthenticated && isAdmin && (
        <Link
          to="/admin"
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-blue-600 transition-colors duration-200 z-50 max-w-[95vw] whitespace-nowrap"
          title="Go to Admin Dashboard"
        >
          ⚡ Admin Dashboard
        </Link>
      )}

      {/* Features Section */}
      <div className="container mt-20 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card p-6 text-center">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-bold text-white mb-3">System Builder</h3>
            <p className="text-gray-400 mb-4">
              Build your dream PC with our intuitive system builder. Check compatibility and create the perfect build.
            </p>
            <Link to="/system-builder" className="btn btn-primary">
              Start Building
            </Link>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-3">Search Builds</h3>
            <p className="text-gray-400 mb-4">
              Discover thousands of user-created builds. Get inspiration and learn from the community.
            </p>
            <Link to="/search-builds" className="btn btn-primary">
              Browse Builds
            </Link>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-xl font-bold text-white mb-3">Expert Advice</h3>
            <p className="text-gray-400 mb-4">
              Get professional recommendations and compatibility checking for all your PC components.
            </p>
            <Link to="/about" className="btn btn-primary">
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="container mb-16">
        <div className="card p-8 text-center bg-gradient-to-r from-blue-600 to-blue-800">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Build Your PC?
          </h2>
          <p className="text-blue-100 mb-6 text-lg">
            Join thousands of PC builders who trust our platform for their computer building needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/system-builder" className="btn bg-white text-blue-600 hover:bg-gray-100">
              Start Building Now
            </Link>
            <Link to="/search-builds" className="btn border-2 border-white text-white hover:bg-white hover:text-blue-600">
              Explore Builds
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home

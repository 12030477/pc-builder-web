import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Wrench, 
  Search, 
  Save, 
  Database, 
  Users, 
  Target,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

const About = () => {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="container py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-6">
            About PC Builder
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto opacity-90">
            Empowering PC enthusiasts with the ultimate tools to build their dream computers
          </p>
        </div>

        {/* Mission Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-12 md:p-16 mb-16 text-center shadow-2xl">
          <div className="flex justify-center mb-6">
            <Target size={48} className="text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Our Mission
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
            To empower PC enthusiasts and builders with the tools and knowledge they need to create their dream computers. 
            We believe everyone deserves access to quality PC building resources.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <div>
            <h2 className="text-4xl font-bold text-blue-400 mb-8">
              What We Do
            </h2>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              PC Builder is your ultimate destination for building custom computers. Whether you're a seasoned builder 
              or just starting your PC journey, we provide comprehensive tools and resources to help you create the perfect system.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              Our platform combines cutting-edge technology with user-friendly design to make PC building accessible to everyone, 
              from beginners to experts.
            </p>
          </div>
          
          <div>
            <h2 className="text-4xl font-bold text-blue-400 mb-8">
              Why Choose Us
            </h2>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              With years of experience in the PC building community, we understand the challenges builders face. 
              Our platform is designed to eliminate guesswork and provide confidence in every component choice.
            </p>
            <p className="text-lg text-gray-300 leading-relaxed">
              From real-time compatibility checking to detailed component specifications, we ensure your build process 
              is smooth and successful.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="card p-8 text-center hover:transform hover:scale-105 transition-all duration-300">
            <div className="flex justify-center mb-6">
              <Wrench size={48} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              System Builder
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Our intuitive system builder helps you select compatible components and create your dream PC build with real-time compatibility checking.
            </p>
          </div>
          
          <div className="card p-8 text-center hover:transform hover:scale-105 transition-all duration-300">
            <div className="flex justify-center mb-6">
              <Search size={48} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              Build Search
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Discover thousands of user-created builds, get inspiration, and learn from the community's experiences and recommendations.
            </p>
          </div>
          
          <div className="card p-8 text-center hover:transform hover:scale-105 transition-all duration-300">
            <div className="flex justify-center mb-6">
              <Save size={48} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              Build Management
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Save, edit, and manage your builds. Share them with the community or keep them private for your personal reference.
            </p>
          </div>
          
          <div className="card p-8 text-center hover:transform hover:scale-105 transition-all duration-300">
            <div className="flex justify-center mb-6">
              <Database size={48} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              Component Database
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Access a comprehensive database of PC components with detailed specifications, reviews, and compatibility information.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="card p-12 md:p-16 mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-400 mb-8">
            Our Team
          </h2>
          <p className="text-lg text-gray-300 mb-6 max-w-4xl mx-auto leading-relaxed">
            We are a passionate team of PC enthusiasts, developers, and tech experts dedicated to making PC building 
            accessible to everyone. Our combined experience spans decades in the computer hardware industry.
          </p>
          <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
            From gaming rigs to workstation builds, from budget-friendly systems to high-end configurations, we understand 
            the diverse needs of our community and strive to provide the best tools and resources for every builder.
          </p>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-12 md:p-16 text-center shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Join Our Community
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Whether you're building your first PC or your hundredth, we're here to support your journey. 
            Join thousands of builders who trust PC Builder for their computer building needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/system-builder" 
              className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg"
            >
              Start Building Today
              <ArrowRight size={20} className="ml-2" />
            </Link>
            <Link 
              to="/search-builds" 
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              Explore Community Builds
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About

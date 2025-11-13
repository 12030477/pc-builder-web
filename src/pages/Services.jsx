import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Wrench, 
  Search, 
  Save, 
  Database, 
  Users, 
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick
} from 'lucide-react'

const Services = () => {
  const features = [
    {
      icon: <Wrench size={32} />,
      title: "System Builder",
      description: "Build your dream PC with our intuitive drag-and-drop interface. Real-time compatibility checking ensures all components work together perfectly.",
      features: [
        "Real-time compatibility checking",
        "Component filtering and search",
        "Price tracking and calculations",
        "Build templates and presets"
      ]
    },
    {
      icon: <Search size={32} />,
      title: "Build Discovery",
      description: "Explore thousands of community-created builds. Find inspiration, compare configurations, and learn from experienced builders.",
      features: [
        "Advanced search and filtering",
        "Build ratings and reviews",
        "Community recommendations",
        "Build sharing and export"
      ]
    },
    {
      icon: <Database size={32} />,
      title: "Component Database",
      description: "Access our comprehensive database of PC components with detailed specifications, reviews, and compatibility information.",
      features: [
        "Extensive component catalog",
        "Detailed specifications",
        "User reviews and ratings",
        "Price comparison across retailers"
      ]
    },
    {
      icon: <Shield size={32} />,
      title: "Compatibility Engine",
      description: "Our advanced compatibility engine ensures your components work together perfectly, preventing costly mistakes.",
      features: [
        "Hardware compatibility checking",
        "Power consumption calculations",
        "Physical dimension verification",
        "BIOS compatibility warnings"
      ]
    },
    {
      icon: <Users size={32} />,
      title: "Community Features",
      description: "Connect with other PC builders, share your builds, and get expert advice from the community.",
      features: [
        "Build sharing and collaboration",
        "Community forums and discussions",
        "Expert recommendations",
        "Build challenges and contests"
      ]
    },
    {
      icon: <Save size={32} />,
      title: "Build Management",
      description: "Save, organize, and manage all your PC builds in one place. Keep track of your builds and share them with others.",
      features: [
        "Unlimited build storage",
        "Build versioning and history",
        "Private and public builds",
        "Build export and sharing"
      ]
    }
  ]

  const stats = [
    { number: "50,000+", label: "Components in Database" },
    { number: "100,000+", label: "User Builds Created" },
    { number: "1M+", label: "Compatibility Checks" },
    { number: "10,000+", label: "Active Users" }
  ]

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="container py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-6">
            Our Services & Features
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto opacity-90">
            Everything you need to build, manage, and share your perfect PC
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="card p-6 text-center">
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="card p-8 hover:transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="text-blue-400 mr-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.features.map((item, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-300">
                    <CheckCircle size={16} className="text-green-400 mr-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Component Categories */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-blue-400 mb-12 text-center">
            Component Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="card p-6 text-center hover:transform hover:scale-105 transition-all duration-300">
              <Cpu size={48} className="text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">CPUs</h3>
              <p className="text-gray-400 text-sm">Processors from Intel & AMD</p>
            </div>
            <div className="card p-6 text-center hover:transform hover:scale-105 transition-all duration-300">
              <Monitor size={48} className="text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">GPUs</h3>
              <p className="text-gray-400 text-sm">Graphics cards for gaming & work</p>
            </div>
            <div className="card p-6 text-center hover:transform hover:scale-105 transition-all duration-300">
              <MemoryStick size={48} className="text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">RAM</h3>
              <p className="text-gray-400 text-sm">Memory modules for performance</p>
            </div>
            <div className="card p-6 text-center hover:transform hover:scale-105 transition-all duration-300">
              <HardDrive size={48} className="text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Storage</h3>
              <p className="text-gray-400 text-sm">SSDs and HDDs for capacity</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-12 md:p-16 text-center shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of PC builders who trust our platform. Start building your dream PC today with our comprehensive tools and community support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/system-builder" 
              className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg"
            >
              <Wrench size={20} className="mr-2" />
              Start Building Now
              <ArrowRight size={20} className="ml-2" />
            </Link>
            <Link 
              to="/search-builds" 
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              <Search size={20} className="mr-2" />
              Explore Builds
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Services

import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'
import SystemBuilder from './pages/SystemBuilder'
import SearchBuilds from './pages/SearchBuilds'
import MyBuilds from './pages/MyBuilds'
import AdminDashboard from './pages/AdminDashboard'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ViewBuild from './pages/ViewBuild'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
          <div className="min-h-screen bg-black">
            <Navbar />
            <main className="pt-16">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                
                {/* Public Routes - System Builder (guests can browse, login required to save) */}
                <Route path="/system-builder" element={<SystemBuilder />} />
                
                {/* Protected Routes */}
                <Route path="/search-builds" element={
                  <ProtectedRoute>
                    <SearchBuilds />
                  </ProtectedRoute>
                } />
                <Route path="/my-builds" element={
                  <ProtectedRoute>
                    <MyBuilds />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/build/:id" element={<ViewBuild />} />
                
                {/* 404 Route */}
                <Route path="*" element={
                  <div className="container py-20 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">404 - Page Not Found</h1>
                    <p className="text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
                    <a href="/" className="btn btn-primary">Go Home</a>
                  </div>
                } />
              </Routes>
            </main>
            <Toaster 
              position="top-right"
              limit={1}
              gutter={8}
              toastOptions={{
                duration: 2000,
                style: {
                  background: '#1f2937',
                  color: '#f9fafb',
                  border: '1px solid #374151',
                },
                success: {
                  duration: 1500,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#f9fafb',
                  },
                },
                error: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#f9fafb',
                  },
                },
              }}
            />
          </div>
        </Router>
  )
}

export default App

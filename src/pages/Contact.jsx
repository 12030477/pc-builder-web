import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { 
  Mail, 
  Clock, 
  Phone, 
  MapPin,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from 'lucide-react'

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Thank you for your message! We will get back to you within 24-48 hours.', { id: 'contact-success', duration: 3000 })
        reset()
      } else {
        toast.error(result.message || 'Failed to send message. Please try again.', { id: 'contact-error' })
      }
    } catch (error) {
      toast.error('Sorry, there was an error sending your message. Please try again later.', { id: 'contact-error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const subjects = [
    'General Inquiry',
    'Technical Support',
    'Feature Request',
    'Bug Report',
    'Partnership',
    'Other'
  ]

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="container py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-6">
            Contact Us
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto opacity-90">
            Get in touch with our team. We're here to help with any questions about PC building.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Information */}
          <div className="card p-8 md:p-12">
            <h3 className="text-2xl font-bold text-blue-400 mb-8 flex items-center">
              <Mail className="mr-3" size={28} />
              Get in Touch
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-white font-semibold mb-2">Email:</p>
                <a 
                  href="mailto:support@pcpartpicker.com" 
                  className="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center"
                >
                  <Mail size={16} className="mr-2" />
                  support@pcpartpicker.com
                </a>
              </div>

              {/* Business Hours */}
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-6">
                <h4 className="text-blue-400 mb-4 flex items-center">
                  <Clock size={20} className="mr-2" />
                  Business Hours
                </h4>
                <div className="space-y-2 text-gray-300">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                  <p>Saturday: 10:00 AM - 4:00 PM EST</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>

              <div>
                <p className="text-white font-semibold mb-2">Response Time:</p>
                <p className="text-gray-400">
                  We typically respond within 24-48 hours during business days.
                </p>
              </div>

              {/* Social Links */}
              <div className="mt-8">
                <h4 className="text-white font-semibold mb-4 flex items-center">
                  <Send size={20} className="mr-2" />
                  Follow Us
                </h4>
                <div className="flex space-x-4">
                  <a 
                    href="https://www.facebook.com/GamersNexus/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-600/30 transition-colors duration-200"
                    title="Facebook"
                  >
                    <Facebook size={20} />
                  </a>
                  <a 
                    href="https://x.com/linustech" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-600/30 transition-colors duration-200"
                    title="X (Twitter)"
                  >
                    <Twitter size={20} />
                  </a>
                  <a 
                    href="https://www.instagram.com/toastybros/?hl=en" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-600/30 transition-colors duration-200"
                    title="Instagram"
                  >
                    <Instagram size={20} />
                  </a>
                  <a 
                    href="https://www.youtube.com/@TechSource" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-600/30 transition-colors duration-200"
                    title="YouTube"
                  >
                    <Youtube size={20} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card p-8 md:p-12">
            <h3 className="text-2xl font-bold text-blue-400 mb-8 flex items-center">
              <Send className="mr-3" size={28} />
              Send us a Message
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-white font-semibold mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name', { required: 'Name is required' })}
                  className="input"
                  placeholder="Your full name"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-white font-semibold mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="input"
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="subject" className="block text-white font-semibold mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  {...register('subject', { required: 'Subject is required' })}
                  className="input"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <p className="text-red-400 text-sm mt-1">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-white font-semibold mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  rows={6}
                  {...register('message', { required: 'Message is required' })}
                  className="input resize-vertical"
                  placeholder="Please describe your inquiry in detail..."
                />
                {errors.message && (
                  <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn btn-primary py-4 text-lg font-semibold flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} className="mr-2" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact

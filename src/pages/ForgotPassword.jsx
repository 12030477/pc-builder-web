import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Mail, ArrowLeft, Send } from 'lucide-react'

const ForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setEmailSent(true)
        toast.success('Password reset email sent! Check your inbox.', { id: 'password-reset-success', duration: 3000 })
      } else {
        toast.error(result.message || 'Failed to send reset email. Please try again.', { id: 'password-reset-error' })
      }
    } catch (error) {
      toast.error('Sorry, there was an error sending the reset email. Please try again later.', { id: 'password-reset-error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center bg-green-600 rounded-full">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-white">
              Check Your Email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              We've sent a password reset link to your email address.
            </p>
          </div>

          <div className="card p-8 text-center">
            <div className="text-green-400 mb-4">
              <Mail size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Email Sent Successfully!
            </h3>
            <p className="text-gray-400 mb-6">
              Please check your email inbox and follow the instructions to reset your password. 
              The link will expire in 1 hour for security reasons.
            </p>
            <div className="space-y-4">
              <Link
                to="/signin"
                className="w-full btn btn-primary flex items-center justify-center"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Sign In
              </Link>
              <button
                onClick={() => setEmailSent(false)}
                className="w-full text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                Try a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-blue-600 rounded-full">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="input pl-10"
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn btn-primary py-3 text-lg font-semibold flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} className="mr-2" />
                    Send Reset Link
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/signin"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center justify-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Sign In
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400">
            Remember your password?{' '}
            <Link
              to="/signin"
              className="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

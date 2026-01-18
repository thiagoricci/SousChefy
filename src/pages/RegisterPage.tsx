import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Mail, ArrowLeft } from 'lucide-react'

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      await register({ email, password, name: name || undefined })
      toast({
        title: 'Account created!',
        description: 'Welcome to SousChefy!',
      })
      navigate('/app', { replace: true })
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.response?.data?.error || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-white flex flex-col p-6">
        <Button 
          variant="ghost" 
          className="self-start mb-6 p-0 hover:bg-transparent" 
          onClick={() => setShowEmailForm(false)}
        >
          <ArrowLeft className="w-6 h-6 mr-2" /> Back
        </Button>
        
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
          <div className="mb-8 text-center">
             <h1 className="text-3xl font-bold mb-2">Sign Up</h1>
             <p className="text-gray-500">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="h-12 bg-gray-50 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                 className="h-12 bg-gray-50 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
                 className="h-12 bg-gray-50 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="•••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
                 className="h-12 bg-gray-50 border-gray-200"
              />
            </div>
            
            <Button type="submit" className="w-full h-12 text-lg font-bold rounded-full mt-6" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between py-12 px-6 relative overflow-hidden">
      
      {/* Hero Image Section */}
      <div className="flex-1 flex items-center justify-center w-full my-4 relative">
        <div className="relative w-full max-w-sm">
            <img 
              src="/landing.png" 
              alt="SousChefy Cooking" 
              className="w-full h-auto object-contain"
            />
        </div>
      </div>

      {/* Bottom Content */}
      <div className="w-full max-w-md mx-auto text-center space-y-6 z-10 pb-6">
        <div className="space-y-2 mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Create an Account
          </h2>
          <p className="text-gray-500 text-base">
            Shop smarter and cook better with SousChefy.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-white text-base font-bold relative"
            onClick={() => setShowEmailForm(true)}
          >
            <span className="absolute left-6"><Mail className="w-5 h-5 mr-2" /></span>
            Continue with Email
          </Button>
        </div>

        <div className="pt-4">
            <p className="text-gray-500">
              Already have an account?{' '}
              <Link to="/login" state={{ showForm: true }} className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Mail, ArrowLeft } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(() => {
    return (location.state as { showForm?: boolean })?.showForm || false;
  })

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login({ email, password })
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      })
      navigate(from, { replace: true })
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.response?.data?.error || 'Please check your credentials and try again.',
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
             <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
             <p className="text-gray-500">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 bg-gray-50 border-gray-200"
              />
            </div>
            
            <Button type="submit" className="w-full h-12 text-lg font-bold rounded-full mt-6" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
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
              alt="SousChefy Welcome" 
              className="w-full h-auto object-contain"
            />
        </div>
      </div>

      {/* Bottom Content */}
      <div className="w-full max-w-md mx-auto text-center space-y-6 z-10 pb-6">
        <div className="space-y-2 mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome Back!
          </h2>
          <p className="text-gray-500 text-base">
            Continue your cooking journey
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
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Sign Up
              </Link>
            </p>
        </div>
      </div>
    </div>
  )
}

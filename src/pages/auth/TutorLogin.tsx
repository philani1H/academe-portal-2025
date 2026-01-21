import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Presentation, Users, Calendar, ArrowRight } from 'lucide-react';

const TutorLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Wait for login to complete and return user data
      await login(email, password, 'tutor');
      
      // Verify user has appropriate role
      // Note: We don't check for token in localStorage because we use HttpOnly cookies
      const storedUser = localStorage.getItem('user');
      
      if (!storedUser) {
        throw new Error('User data not received');
      }

      const userData = JSON.parse(storedUser);
      
      // Verify user has appropriate role
      if (userData.role === 'tutor' || userData.role === 'admin') {
        toast({
          title: "Welcome back!",
          description: "Login successful.",
        });
        
        // Small delay to ensure state updates before navigation
        setTimeout(() => {
          navigate('/tutors-dashboard');
        }, 100);
      } else {
        // Clear invalid credentials
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        toast({
          title: "Access Denied",
          description: "This account does not have tutor privileges.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // Clear any partial auth data on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
      
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Hero/Info */}
      <div className="hidden lg:flex w-1/2 bg-indigo-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-2xl font-bold mb-8">
            <Presentation className="h-8 w-8 text-indigo-400" />
            <span>Academe Portal</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Empower Your<br/>Students</h1>
          <p className="text-indigo-200 text-lg max-w-md">
            Manage your classes, schedule sessions, and share resources with ease.
          </p>
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-full">
              <Calendar className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold">Smart Scheduling</h3>
              <p className="text-sm text-indigo-300">Organize your teaching timetable</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/20 rounded-full">
              <Users className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <h3 className="font-semibold">Student Engagement</h3>
              <p className="text-sm text-indigo-300">Connect directly with your students</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-indigo-400">
          © {new Date().getFullYear()} Excellence Akademie. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Tutor Access</h2>
            <p className="text-gray-500 mt-2">Log in to manage your courses and students</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="tutor@excellence.co.za"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/contact-us" className="text-sm text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? 'Verifying...' : 'Access Dashboard'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Need technical support? </span>
            <Link to="/contact-us" className="font-medium text-indigo-600 hover:text-indigo-500">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorLogin;
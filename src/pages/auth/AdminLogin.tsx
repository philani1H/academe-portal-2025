import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { Shield, Settings, Activity, Lock, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const id = String(formData.get('username') || '').trim();
    const password = String(formData.get('password') || '').trim();
    
    if (!id || !password) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await apiFetch<{ success: boolean; user?: { username: string; role: string } }>('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: id, email: id, password }),
      });
      
      if (!res || (res as any)?.success === false) {
        setError('Invalid credentials');
        return;
      }
      
      const user = { id: id, email: id.includes('@') ? id : `${id}@local`, name: id, role: 'admin' } as any;
      try { localStorage.setItem('user', JSON.stringify(user)); } catch {}
      navigate('/admin');
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('Invalid credentials') || msg.includes('(401)')) {
        setError('Invalid credentials');
      } else {
        setError('System unavailable. Please check server status.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Hero/Info */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.8),rgba(0,0,0,0.4)),url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-2xl font-bold mb-8">
            <Shield className="h-8 w-8 text-emerald-500" />
            <span>Secure Admin</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">System<br/>Administration</h1>
          <p className="text-gray-300 text-lg max-w-md">
            Secure access for platform configuration, user management, and system monitoring.
          </p>
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-full">
              <Settings className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold">Configuration</h3>
              <p className="text-sm text-gray-400">Manage global site settings</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-full">
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold">Monitoring</h3>
              <p className="text-sm text-gray-400">Track system performance and logs</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
          Authorized personnel only. All activities are logged.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-gray-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Login</h2>
            <p className="text-gray-500 mt-2">Restricted access area</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="admin"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base bg-gray-900 hover:bg-gray-800" disabled={loading}>
              {loading ? 'Authenticating...' : 'Access Console'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            Secure Connection • 256-bit Encryption
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

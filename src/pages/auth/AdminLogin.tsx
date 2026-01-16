import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';

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
        setError('Server unavailable. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your admin username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;

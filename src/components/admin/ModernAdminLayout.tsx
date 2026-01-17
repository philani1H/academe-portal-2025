import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, Building, Bell, Calendar,
  Layout, DollarSign, Server, Settings, Menu, X, LogOut,
  User, Shield, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface ModernAdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user?: any;
  notificationCount?: number;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'from-blue-500 to-blue-600' },
  { id: 'tutors', label: 'Tutors', icon: Shield, color: 'from-purple-500 to-purple-600' },
  { id: 'students', label: 'Students', icon: Users, color: 'from-emerald-500 to-emerald-600' },
  { id: 'courses', label: 'Courses', icon: BookOpen, color: 'from-orange-500 to-orange-600' },
  { id: 'departments', label: 'Departments', icon: Building, color: 'from-pink-500 to-pink-600' },
  { id: 'timetable', label: 'Timetable', icon: Calendar, color: 'from-cyan-500 to-cyan-600' },
  { id: 'content', label: 'Content', icon: Layout, color: 'from-indigo-500 to-indigo-600' },
  { id: 'notifications', label: 'Notifications', icon: Bell, color: 'from-yellow-500 to-yellow-600' },
  { id: 'finance', label: 'Finance', icon: DollarSign, color: 'from-green-500 to-green-600' },
  { id: 'it_management', label: 'IT Management', icon: Server, color: 'from-red-500 to-red-600' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'from-gray-500 to-gray-600' },
];

export const ModernAdminLayout: React.FC<ModernAdminLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  user,
  notificationCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const NavItem = ({ item, isMobile = false }: { item: typeof navigationItems[0], isMobile?: boolean }) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    return (
      <motion.button
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          onTabChange(item.id);
          if (isMobile) setMobileMenuOpen(false);
        }}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
          ${isActive
            ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }
        `}
      >
        <div className={`
          p-2 rounded-lg transition-colors
          ${isActive
            ? 'bg-white/20'
            : 'bg-gray-100 dark:bg-gray-800'
          }
        `}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-medium">{item.label}</span>
        {isActive && (
          <motion.div
            layoutId="activeTab"
            className="ml-auto"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        )}
        {item.id === 'notifications' && notificationCount > 0 && (
          <Badge variant="destructive" className="ml-auto">
            {notificationCount}
          </Badge>
        )}
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg">Admin Panel</h2>
                        <p className="text-xs text-gray-500">Excellence Akademie</p>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="h-[calc(100vh-200px)] p-4">
                    <div className="space-y-2">
                      {navigationItems.map((item) => (
                        <NavItem key={item.id} item={item} isMobile />
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 border-2 border-blue-500">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {user?.name?.[0] || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@example.com'}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" size="sm">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notificationCount > 0 && (
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              </Button>
            )}
            <Avatar className="h-8 w-8 border-2 border-blue-500">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                {user?.name?.[0] || 'A'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="fixed left-0 top-0 bottom-0 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-r border-gray-200 dark:border-gray-800 shadow-2xl z-40">
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Admin Panel
                  </h1>
                  <p className="text-xs text-gray-500">Excellence Akademie</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <NavItem key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900 mb-3">
                <Avatar className="h-12 w-12 border-2 border-blue-500 shadow-md">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                    {user?.name?.[0] || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.name || 'Administrator'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@example.com'}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        <div className="pt-20 lg:pt-6 px-4 lg:px-8 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ModernAdminLayout;

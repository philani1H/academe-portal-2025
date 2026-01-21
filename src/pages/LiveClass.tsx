import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedLiveSession from '@/components/live-session/LiveSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function LiveClass() {
    const { user } = useAuth();
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [userRole, setUserRole] = useState<'tutor' | 'student'>('student');
    const [loading, setLoading] = useState(true);
    const [showJoinScreen, setShowJoinScreen] = useState(false);
    const [displayName, setDisplayName] = useState('');

    const courseId = searchParams.get('courseId') || undefined;
    const courseName = searchParams.get('courseName') || undefined;
    const category = searchParams.get('category') || undefined;
    const sessionName = searchParams.get('sessionName') || courseName || 'Live Class';
    const tutorName = searchParams.get('tutorName') || undefined;
    const fromStudent = searchParams.get('fromStudent') === 'true';
    const fromTutor = searchParams.get('fromTutor') === 'true';
    
    // Store entry point for proper navigation on leave
    const [entryPoint, setEntryPoint] = useState<string>('');
    
    useEffect(() => {
        // Determine where user came from for proper back navigation
        if (fromTutor) {
            setEntryPoint('/tutors-dashboard');
        } else if (fromStudent) {
            // Came from share link - store the current URL to return to join screen
            setEntryPoint('share-link');
        } else if (user?.role === 'tutor' || user?.role === 'admin') {
            setEntryPoint('/tutors-dashboard');
        } else if (user?.role === 'student') {
            setEntryPoint('/students');
        } else {
            setEntryPoint('/');
        }
    }, [fromStudent, fromTutor, user]);

    useEffect(() => {
        // If joining from tutor dashboard, always be a tutor
        if (fromTutor) {
            setUserRole('tutor');
            setLoading(false);
            return;
        }

        // If joining from student dashboard, always be a student
        if (fromStudent) {
            setUserRole('student');
            setLoading(false);
            return;
        }

        // Otherwise, determine role from auth context
        if (user) {
            if (user.role === 'tutor' || user.role === 'admin') {
                setUserRole('tutor');
            } else {
                setUserRole('student');
            }
        } else {
            // Fallback to localStorage if auth context is not available
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser.role === 'tutor' || parsedUser.role === 'admin') {
                        setUserRole('tutor');
                    } else {
                        setUserRole('student');
                    }
                } catch (e) {
                    console.error("Error parsing user", e);
                    setUserRole('student');
                }
            }
        }
        setLoading(false);
    }, [fromStudent, fromTutor, user]);

    useEffect(() => {
        // If user is authenticated (logged in from dashboard), auto-join without showing join screen
        if (user && user.name) {
            setDisplayName(user.name);
            setShowJoinScreen(false);
            return;
        }

        // Check localStorage for existing user data
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                // If we have a valid name (not generic), use it
                if (parsed.name && parsed.name !== 'Tutor' && parsed.name !== 'Student' && parsed.name !== 'Instructor' && parsed.name !== 'Anonymous') {
                    setDisplayName(parsed.name);
                    // Only auto-join if NOT from a share link (fromStudent=true means share link)
                    // Dashboard users don't have fromStudent in URL, OR if tutor is going live
                    if (!fromStudent || fromTutor) {
                        setShowJoinScreen(false);
                        return;
                    }
                }
            }
        } catch {
            // Ignore parse errors
        }

        // For share link users (fromStudent=true) without valid stored name, show join screen
        if (fromStudent) {
            setShowJoinScreen(true);
        } else if (!user && !fromTutor) {
            // For non-authenticated users not from share link and not tutor, show join screen
            setShowJoinScreen(true);
        }
    }, [fromStudent, fromTutor, user]);

    const handleJoin = () => {
        const name = displayName.trim();
        if (!name) return;

        let payload: any = { id: `guest-${Date.now()}`, name, role: userRole };
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                payload = { ...parsed, name, role: userRole };
            }
        } catch {
        }

        localStorage.setItem('user', JSON.stringify(payload));
        setShowJoinScreen(false);
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
    if (!sessionId) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Invalid Session ID</div>;

    if (showJoinScreen) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900 px-4">
                <div className="w-full max-w-md bg-gray-950/90 border border-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Join Live Session</h1>
                        <p className="text-sm text-gray-400">
                            {courseName ? `You were invited to join ${courseName}.` : 'You were invited to join a live class.'}
                        </p>
                        {tutorName && (
                            <p className="text-sm text-indigo-400">
                                Hosted by: <span className="font-semibold">{tutorName}</span>
                            </p>
                        )}
                    </div>
                    {/* Session Info Card */}
                    {(courseName || tutorName || category) && (
                        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 space-y-2">
                            {courseName && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-xs">Course:</span>
                                    <span className="text-white text-sm font-medium">{courseName}</span>
                                </div>
                            )}
                            {tutorName && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-xs">Instructor:</span>
                                    <span className="text-white text-sm font-medium">{tutorName}</span>
                                </div>
                            )}
                            {category && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-xs">Subject:</span>
                                    <span className="text-white text-sm font-medium">{category}</span>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-200">Your name</label>
                        <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name"
                            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                        />
                    </div>
                    <Button
                        onClick={handleJoin}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
                    >
                        Join Session
                    </Button>
                    <div className="text-xs text-gray-500 text-center">
                        By joining, you agree to follow the class rules and respect others.
                    </div>
                </div>
            </div>
        );
    }

    // Handle leave - navigate based on entry point
    const handleLeave = () => {
        console.log('[LiveClass] Leaving session, entry point:', entryPoint);
        toast.info("Leaving session...");
        
        if (entryPoint === 'share-link') {
            // User came from share link - redirect to home page instead of join screen
            // This provides better "Leave" feedback
            navigate('/');
        } else if (entryPoint) {
            // Navigate to stored entry point
            navigate(entryPoint);
        } else {
            // Fallback navigation
            if (userRole === 'tutor') {
                navigate('/tutors-dashboard');
            } else {
                navigate('/students');
            }
        }
    };

    return (
        <EnhancedLiveSession
            sessionId={sessionId}
            sessionName={sessionName}
            userRole={userRole}
            onLeave={handleLeave}
            courseId={courseId}
            courseName={courseName}
            category={category}
            tutorName={tutorName}
        />
    );
}

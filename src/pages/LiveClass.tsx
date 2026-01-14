import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedLiveSession from '@/components/live-session/LiveSession';

export default function LiveClass() {
    const { user } = useAuth();
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [userRole, setUserRole] = useState<'tutor' | 'student'>('student');
    const [loading, setLoading] = useState(true);

    const courseId = searchParams.get('courseId') || undefined;
    const courseName = searchParams.get('courseName') || undefined;
    const category = searchParams.get('category') || undefined;
    const sessionName = searchParams.get('sessionName') || 'Live Class';
    const fromStudent = searchParams.get('fromStudent') === 'true';
    const fromTutor = searchParams.get('fromTutor') === 'true';

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

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading...</div>;
    if (!sessionId) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Invalid Session ID</div>;

    return (
        <EnhancedLiveSession
            sessionId={sessionId}
            sessionName={sessionName}
            userRole={userRole}
            onLeave={() => navigate(userRole === 'tutor' ? '/tutors-dashboard' : '/students')}
            courseId={courseId}
            courseName={courseName}
            category={category}
        />
    );
}

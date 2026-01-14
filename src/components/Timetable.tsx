import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Plus, Trash2, Calendar } from "lucide-react";

interface TimetableEntry {
    id: string;
    day: string;
    time: string;
    courseName: string;
    tutorName: string;
    type: 'Lecture' | 'Tutorial' | 'Lab';
}

interface TimetableProps {
    userRole: 'student' | 'tutor' | 'admin';
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function Timetable({ userRole }: TimetableProps) {
    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<{id: string, name: string, tutorId: string}[]>([]);
    const [tutors, setTutors] = useState<{id: string, name: string}[]>([]);
    const [newEntry, setNewEntry] = useState<Partial<TimetableEntry>>({
        day: 'Monday',
        type: 'Lecture'
    });

    useEffect(() => {
        loadTimetable();
        if (userRole === 'admin' || userRole === 'tutor') {
            loadMetadata();
        }
    }, [userRole]);

    const loadMetadata = async () => {
        try {
            const [coursesRes, tutorsRes] = await Promise.all([
                apiFetch<any[]>('/api/courses'),
                apiFetch<any[]>('/api/admin/content/tutors')
            ]);
            setCourses(Array.isArray(coursesRes) ? coursesRes : []);
            setTutors(Array.isArray(tutorsRes) ? tutorsRes : []);
        } catch (error) {
            console.error('Failed to load metadata', error);
        }
    };

    const loadTimetable = async () => {
        try {
            const res = await apiFetch<any>('/api/timetable');
            if (Array.isArray(res)) {
                setEntries(res);
            } else if (res?.data) {
                setEntries(res.data);
            }
        } catch (error) {
            console.error('Failed to load timetable', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newEntry.time || !newEntry.courseName || !newEntry.tutorName) {
            toast.error("Please fill all fields");
            return;
        }

        const entry: TimetableEntry = {
            id: Date.now().toString(),
            day: newEntry.day || 'Monday',
            time: newEntry.time,
            courseName: newEntry.courseName,
            tutorName: newEntry.tutorName,
            type: newEntry.type || 'Lecture'
        };

        const updated = [...entries, entry];
        setEntries(updated);
        setNewEntry({ day: 'Monday', type: 'Lecture', time: '', courseName: '', tutorName: '' });
        
        await saveTimetable(updated);
    };

    const handleDelete = async (id: string) => {
        const updated = entries.filter(e => e.id !== id);
        setEntries(updated);
        await saveTimetable(updated);
    };

    const saveTimetable = async (updated: TimetableEntry[]) => {
        try {
            await apiFetch('/api/timetable', {
                method: 'POST',
                body: JSON.stringify({ timetable: updated })
            });
            toast.success("Timetable updated");
        } catch (error) {
            toast.error("Failed to save timetable");
        }
    };

    if (loading) return <div>Loading timetable...</div>;

    const canEdit = userRole === 'tutor' || userRole === 'admin';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Class Timetable
                </CardTitle>
            </CardHeader>
            <CardContent>
                {canEdit && (
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-4">
                        <h3 className="font-semibold">Add New Session</h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                            <Select value={newEntry.day} onValueChange={v => setNewEntry({...newEntry, day: v})}>
                                <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                                <SelectContent>
                                    {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Input 
                                placeholder="Time (e.g. 10:00 AM)" 
                                value={newEntry.time || ''} 
                                onChange={e => setNewEntry({...newEntry, time: e.target.value})} 
                            />
                            
                            <Select value={newEntry.courseName} onValueChange={(v) => {
                                const course = courses.find(c => c.name === v);
                                const tutor = course ? tutors.find(t => t.id === course.tutorId) : null;
                                setNewEntry({
                                    ...newEntry, 
                                    courseName: v,
                                    tutorName: tutor ? tutor.name : (newEntry.tutorName || '')
                                });
                            }}>
                                <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
                                <SelectContent>
                                    {courses.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Select value={newEntry.tutorName} onValueChange={v => setNewEntry({...newEntry, tutorName: v})}>
                                <SelectTrigger><SelectValue placeholder="Select Tutor" /></SelectTrigger>
                                <SelectContent>
                                    {tutors.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-2" /> Add</Button>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {DAYS.map(day => {
                        const dayEntries = entries.filter(e => e.day === day).sort((a, b) => a.time.localeCompare(b.time));
                        if (dayEntries.length === 0) return null;

                        return (
                            <div key={day} className="border rounded-lg p-4">
                                <h3 className="font-bold text-lg mb-3 text-primary">{day}</h3>
                                <div className="space-y-2">
                                    {dayEntries.map(entry => (
                                        <div key={entry.id} className="flex items-center justify-between bg-card p-3 rounded shadow-sm border">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                                <div className="font-medium text-blue-600">{entry.time}</div>
                                                <div className="font-semibold">{entry.courseName} <span className="text-xs text-muted-foreground ml-2">({entry.type})</span></div>
                                                <div className="text-sm text-muted-foreground">Tutor: {entry.tutorName}</div>
                                            </div>
                                            {canEdit && (
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {entries.length === 0 && <div className="text-center text-muted-foreground">No classes scheduled yet.</div>}
                </div>
            </CardContent>
        </Card>
    );
}

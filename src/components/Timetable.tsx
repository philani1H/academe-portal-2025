import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Calendar, Clock, User, Book, Plus, Trash2, Save, X, Download, Grid, Printer, AlertCircle, Wand2, Settings, Upload } from 'lucide-react';
import { apiFetch } from "@/lib/api";
import io from "socket.io-client";

const TutorTimetableManager = ({ userRole = 'admin' }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [timetable, setTimetable] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('combined');
  const [selectedTutor, setSelectedTutor] = useState('');
  const [editingSlot, setEditingSlot] = useState(null);
  const [showAutoSchedule, setShowAutoSchedule] = useState(false);
  const [autoScheduleConfig, setAutoScheduleConfig] = useState({
    startTime: '08:00',
    endTime: '17:00',
    classDuration: 60,
    breakDuration: 15,
    fillUnplaced: true
  });
  const [newClass, setNewClass] = useState({
    tutorId: '', tutorName: '', subject: '', courseName: '',
    grade: 'Grade 10', type: 'Group', students: '',
    startTime: '08:00', endTime: '09:00', day: ''
  });

  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const isCsv = file.name.endsWith('.csv');
    const isJson = file.name.endsWith('.json');

    if (!isCsv && !isJson) {
      alert("Please upload a .csv or .json file");
      return;
    }

    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const response = await fetch('/api/timetable/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Ensure auth
          },
          body: JSON.stringify({
            fileContent: content,
            fileType: isCsv ? 'csv' : 'json'
          })
        });

        const data = await response.json();
        if (data.success) {
          alert(data.message || `Successfully uploaded classes`);
          loadData(); // Reload timetable
        } else {
          alert(`Upload failed: ${data.error}`);
        }
      } catch (err) {
        console.error("Upload error:", err);
        alert("Failed to process file");
      } finally {
        setUploadLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const socketRef = useRef<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || window.location.origin;
    socketRef.current = io(SOCKET_SERVER_URL);
    const socket = socketRef.current;
    socket.on('timetable-updated', () => {
      loadData();
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tutorsRes, coursesRes, timetableRes] = await Promise.all([
        apiFetch('/api/admin/users?role=tutor'),
        apiFetch('/api/courses'),
        apiFetch('/api/timetable')
      ]);
      
      // Handle tutors response (now fetching system users with role='tutor')
      const tutorsData = tutorsRes?.data || tutorsRes || [];
      const tutorsList = Array.isArray(tutorsData) ? tutorsData.map((t: any) => {
        let subjects: string[] = [];

        if (Array.isArray(t.subjects)) {
          subjects = t.subjects;
        } else if (typeof t.subjects === 'string') {
          try {
            const parsed = JSON.parse(t.subjects);
            if (Array.isArray(parsed)) {
              subjects = parsed;
            } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.subjects)) {
              subjects = parsed.subjects;
            } else {
              subjects = t.subjects.split(/[|;,]/).map((s: string) => s.trim()).filter(Boolean);
            }
          } catch {
            subjects = t.subjects.split(/[|;,]/).map((s: string) => s.trim()).filter(Boolean);
          }
        }

        const departments = Array.isArray(t.departments) ? t.departments.filter(Boolean) : [];

        return {
          id: String(t.id), // System User ID (e.g., "8")
          name: t.name || 'Unknown Tutor',
          email: t.contactEmail || t.email || '',
          subjects,
          department: departments.length > 0 ? departments.join(', ') : (t.department || ''),
          order: typeof t.order === 'number' ? t.order : 0, // Users don't have order usually, default to 0
          systemUserId: String(t.id), // Same as ID since we are using system users
          hasSystemAccount: true,
        };
      }) : [];
      
      // Handle courses response
      const coursesData = Array.isArray(coursesRes) ? coursesRes : (coursesRes?.data || []);
      const coursesList = coursesData.map((c: any) => ({
        id: String(c.id || c.ID),
        name: c.name || c.title || 'Unknown Course',
        subject: c.subject || c.category || c.department || '',
        tutorId: String(c.tutorId || c.tutor_id || ''),
        department: c.department || c.category || '',
      }));
      
      // Handle timetable response
      const timetableData = timetableRes?.data || timetableRes || [];
      const timetableList = Array.isArray(timetableData) ? timetableData.map((entry: any) => ({
        id: String(entry.id),
        tutorId: String(entry.tutorId),
        tutorName: entry.tutorName || '',
        courseName: entry.courseName || '',
        subject: entry.subject || '',
        grade: entry.grade || 'Grade 12',
        type: entry.type || 'Group',
        students: entry.students || '',
        day: entry.day || '',
        startTime: entry.startTime || entry.time || '',
        endTime: entry.endTime || '',
      })) : [];
      
      setTutors(tutorsList);
      setCourses(coursesList);
      setTimetable(timetableList);
      
      if (tutorsList.length > 0) {
        setSelectedTutor(tutorsList[0].id);
      }
      
      showNotification(`Loaded ${tutorsList.length} tutors, ${coursesList.length} courses, ${timetableList.length} timetable entries`);
    } catch (error) {
      console.error('API Error:', error);
      showNotification('Failed to load data from API', 'error');
      // Set empty arrays on error
      setTutors([]);
      setCourses([]);
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    const n = document.createElement('div');
    n.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
  };

  const generateTimeSlots = (start = '08:00', end = '18:00', interval = 60) => {
    const slots = [];
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    let h = startHour, m = startMin;
    
    while (h < endHour || (h === endHour && m <= endMin)) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      m += interval;
      if (m >= 60) {
        h += Math.floor(m / 60);
        m = m % 60;
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots('08:00', '18:00', 60);

  const addMinutesToTime = (time, minutes) => {
    const [h, m] = time.split(':').map(Number);
    let totalMin = h * 60 + m + minutes;
    const newH = Math.floor(totalMin / 60);
    const newM = totalMin % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  };

  const addClass = async (day) => {
    if (!newClass.tutorId || !newClass.subject || !newClass.startTime || !newClass.endTime) {
      showNotification('Please fill all fields', 'error');
      return;
    }
    if (newClass.startTime >= newClass.endTime) {
      showNotification('End time must be after start', 'error');
      return;
    }

    const entry = { ...newClass, id: Date.now().toString(), day };
    const updated = [...timetable, entry];
    setTimetable(updated);
    setEditingSlot(null);
    resetNewClass();
    await saveTimetable(updated);
  };

  const deleteClass = async (id) => {
    if (!canEdit) return;
    const updated = timetable.filter(e => e.id !== id);
    setTimetable(updated);
    await saveTimetable(updated);
  };

  const saveTimetable = async (updated) => {
    try {
      await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetable: updated })
      });
      showNotification('Saved successfully');
    } catch (error) {
      showNotification('Save failed', 'error');
    }
  };

  const resetNewClass = () => {
    setNewClass({
      tutorId: viewMode === 'individual' ? selectedTutor : '',
      tutorName: '', subject: '', courseName: '',
      grade: 'Grade 12', type: 'Group', students: '',
      startTime: '08:00', endTime: '09:00', day: ''
    });
  };

  const startEdit = (day, startTime, tutorId) => {
    if (!canEdit) return;
    const tutor = tutors.find(t => t.id === tutorId);
    setEditingSlot(`${day}-${startTime}-${tutorId || 'new'}`);
    setNewClass({
      tutorId: tutorId || '', tutorName: tutor?.name || '', subject: '', courseName: '',
      grade: 'Grade 12', type: 'Group', students: '',
      startTime, endTime: addMinutesToTime(startTime, 60), day
    });
  };

  const getClassForSlot = (tutorId, day, time) => {
    return timetable.find(c => 
      c.tutorId === tutorId && c.day === day && c.startTime <= time && c.endTime > time
    );
  };

  const getClassesForSlot = (day, time) => {
    return timetable.filter(c => 
      c.day === day && c.startTime <= time && c.endTime > time
    );
  };

  const autoScheduleClasses = async () => {
    if (!canEdit) return;
    
    if (courses.length === 0) {
      showNotification('No courses available to schedule', 'error');
      return;
    }
    
    if (tutors.length === 0) {
      showNotification('No tutors available to schedule', 'error');
      return;
    }
    
    const { startTime, endTime, classDuration, breakDuration } = autoScheduleConfig;
    const newTimetable = [];
    const slots = generateTimeSlots(startTime, endTime, classDuration + breakDuration);
    
    if (slots.length === 0) {
      showNotification('No time slots available with current settings', 'error');
      return;
    }
    
    let slotIdx = 0;
    let dayIdx = 0;
    
    const normalize = (v: string) => v.trim().toLowerCase();

    const findTutorForCourse = (course: any) => {
      const rawTutorId = String(course.tutorId || '').trim();
      const subject = course.subject || course.department || 'General';

      if (rawTutorId) {
        const byUuid = tutors.find((t: any) => String(t.id) === rawTutorId);
        if (byUuid) return byUuid;

        const bySystemUserId = tutors.find((t: any) => t.systemUserId && String(t.systemUserId) === rawTutorId);
        if (bySystemUserId) return bySystemUserId;

        const byOrder = tutors.find((t: any) => String(t.order) === rawTutorId);
        if (byOrder) return byOrder;
      }

      const targetSubject = normalize(String(subject));
      const bySubject = tutors.find((t: any) =>
        Array.isArray(t.subjects) && t.subjects.some((s: string) => normalize(String(s)) === targetSubject)
      );
      if (bySubject) return bySubject;

      return null;
    };

    // Helper to check if a slot is valid for a tutor
    const isTutorFree = (tutorId: string, day: string, startTime: string, currentTimetable: any[]) => {
      return !currentTimetable.some(c => 
        c.tutorId === tutorId && 
        c.day === day && 
        c.startTime === startTime
      );
    };

    // Helper to find the best slot for a tutor (Load Balancing & Global Distribution)
    const findBestSlotForTutor = (tutorId: string, subject: string, grade: string, currentTimetable: any[]) => {
      // 1. Calculate load per day for this tutor
      const dayLoad = days.map(d => ({
        day: d,
        count: currentTimetable.filter(c => c.tutorId === tutorId && c.day === d).length
      }));

      // 2. Sort days by load (ascending)
      dayLoad.sort((a, b) => a.count - b.count);

      // 3. Find valid slots
      for (const { day } of dayLoad) {
        // Sort slots by quality:
        // Priority 1: Avoid Subject Clash (e.g. don't schedule 2 Math classes at same time)
        // Priority 2: Avoid Grade Overload (spread Grade 10-12 classes out)
        // Priority 3: Global Occupancy (spread across available rooms/resources)
        
        const sortedSlots = [...slots].sort((a, b) => {
           // Check Subject Clash
           const subjectClashA = currentTimetable.filter(c => c.day === day && c.startTime === a && normalize(c.subject || '') === normalize(subject)).length;
           const subjectClashB = currentTimetable.filter(c => c.day === day && c.startTime === b && normalize(c.subject || '') === normalize(subject)).length;
           if (subjectClashA !== subjectClashB) return subjectClashA - subjectClashB;

           // Check Grade Occupancy (how many classes for this grade are already in this slot)
           const gradeCountA = currentTimetable.filter(c => c.day === day && c.startTime === a && c.grade === grade).length;
           const gradeCountB = currentTimetable.filter(c => c.day === day && c.startTime === b && c.grade === grade).length;
           if (gradeCountA !== gradeCountB) return gradeCountA - gradeCountB;

           // Check Global Occupancy
           const globalCountA = currentTimetable.filter(c => c.day === day && c.startTime === a).length;
           const globalCountB = currentTimetable.filter(c => c.day === day && c.startTime === b).length;
           return globalCountA - globalCountB;
        });

        for (const slot of sortedSlots) {
          // Hard Constraint: Tutor must be free
          if (isTutorFree(tutorId, day, slot, currentTimetable)) {
             // Soft Constraint: Ideally don't schedule same subject at same time
             const subjectClash = currentTimetable.some(c => c.day === day && c.startTime === slot && normalize(c.subject || '') === normalize(subject));
             
             // If we have a clash, only proceed if we've run out of "clean" slots? 
             // For now, the sort puts non-clashing slots first. 
             // So if we pick a clashing slot, it implies all other slots are worse or full.
             // We'll accept it, but maybe we should try next day first?
             // The loop structure "For each day... For each slot" means we prioritize the *Tutor's* day balance first.
             // If Day 1 has a subject clash in all slots, we might pick it.
             // But Day 2 might be free.
             
             // Let's refine: We want to find the GLOBALLY best slot.
             // Instead of Day -> Slot loops, let's score ALL (day, slot) pairs and pick best.
             return { day, slot }; // Keeping it simple for now as sort handles most.
          }
        }
      }
      return null;
    };

    // Schedule each course
    courses.forEach((course, courseIdx) => {
      const tutor = findTutorForCourse(course);

      if (!tutor) {
        console.warn(`No tutor found for course ${course.name} (tutorId: ${course.tutorId})`);
        return;
      }

      const subject = course.subject || course.department || 'General';
      const grade = 'Grade 12'; // Default or derived from course

      // Find best slot for this tutor (spreads classes across days)
      const bestSlot = findBestSlotForTutor(String(tutor.id), subject, grade, newTimetable);
      
      if (bestSlot) {
        newTimetable.push({
          id: `auto-${Date.now()}-${courseIdx}`,
          tutorId: String(tutor.id),
          tutorName: tutor.name,
          courseName: course.name,
          subject: subject,
          grade: grade,
          type: 'Group',
          students: '',
          day: bestSlot.day,
          startTime: bestSlot.startTime || bestSlot.slot,
          endTime: addMinutesToTime(bestSlot.startTime || bestSlot.slot, classDuration)
        });
      } else {
        console.warn(`Could not find a slot for tutor ${tutor.name}`);
      }
    });

    // Handle Unplaced Tutors
    if (autoScheduleConfig.fillUnplaced) {
      const scheduledTutorIds = new Set(newTimetable.map(e => String(e.tutorId)));
      const unplacedTutors = tutors.filter(t => !scheduledTutorIds.has(String(t.id)));

      if (unplacedTutors.length > 0) {
        console.log(`Found ${unplacedTutors.length} unplaced tutors. Attempting to schedule...`);
        
        unplacedTutors.forEach((tutor, idx) => {
          // Find a suitable course for this tutor
          let targetCourse = courses.find(c => String(c.tutorId) === String(tutor.id));
          
          if (!targetCourse && tutor.subjects) {
             const tutorSubjects = Array.isArray(tutor.subjects) ? tutor.subjects : String(tutor.subjects).split(/[|;,]/);
             targetCourse = courses.find(c => 
               tutorSubjects.some(s => normalize(String(s)) === normalize(String(c.subject || c.department || '')))
             );
          }

          if (!targetCourse) {
             targetCourse = courses.find(c => /general|consultation|support/i.test(c.name));
          }

          // Fallback course object if nothing found
          const courseInfo = targetCourse || { 
            name: `${tutor.subjects?.[0] || 'General'} Consultation`, 
            subject: tutor.subjects?.[0] || 'General' 
          };

          const subject = courseInfo.subject || 'General';
          const grade = 'Grade 12';

          const bestSlot = findBestSlotForTutor(String(tutor.id), subject, grade, newTimetable);
            
          if (bestSlot) {
            newTimetable.push({
              id: `auto-fill-${Date.now()}-${idx}`,
              tutorId: String(tutor.id),
              tutorName: tutor.name,
              courseName: courseInfo.name,
              subject: courseInfo.subject,
              grade: 'Grade 12',
              type: 'One-on-One',
              students: 'Consultation',
              day: bestSlot.day,
              startTime: bestSlot.slot,
              endTime: addMinutesToTime(bestSlot.slot, classDuration)
            });
          }
        });
      }
    }

    if (newTimetable.length === 0) {
      showNotification('Could not schedule any classes. Check tutor assignments.', 'error');
      return;
    }

    setTimetable(newTimetable);
    await saveTimetable(newTimetable);
    setShowAutoSchedule(false);
    showNotification(`Auto-scheduled ${newTimetable.length} classes from ${courses.length} courses`);
  };

  const exportToExcel = () => {
    const activeTutors = viewMode === 'all' || viewMode === 'combined' ? tutors : tutors.filter(t => t.id === selectedTutor);
    const data: any[] = [];

    activeTutors.forEach(tutor => {
      const classes = timetable.filter(c => c.tutorId === tutor.id);
      if (classes.length > 0) {
        // Add a header row for the tutor (using a special object structure or just relying on the flow)
        // For better Excel structure, we'll just list all classes with Tutor column
        classes.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.startTime.localeCompare(b.startTime))
          .forEach(c => {
            data.push({
              Tutor: tutor.name,
              Day: c.day,
              Start: c.startTime,
              End: c.endTime,
              Course: c.courseName,
              Subject: c.subject,
              Grade: c.grade,
              Type: c.type,
              Students: c.students
            });
          });
      }
    });

    if (data.length === 0) {
      showNotification('No data to export', 'error');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    const wscols = [
      { wch: 20 }, // Tutor
      { wch: 15 }, // Day
      { wch: 10 }, // Start
      { wch: 10 }, // End
      { wch: 30 }, // Course
      { wch: 20 }, // Subject
      { wch: 15 }, // Grade
      { wch: 10 }, // Type
      { wch: 50 }  // Students
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable");
    XLSX.writeFile(wb, `Timetable_${new Date().toISOString().split('T')[0]}.xlsx`);
    showNotification('Excel exported successfully');
  };

  const exportToPDF = () => {
    const activeTutors = viewMode === 'all' || viewMode === 'combined' ? tutors : tutors.filter(t => t.id === selectedTutor);
    let html = `<!DOCTYPE html><html><head><title>Timetable</title><style>
      @page { size: landscape; margin: 1cm; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
      .header h1 { color: #4F46E5; margin: 0; font-size: 28px; }
      .header p { color: #666; margin: 5px 0 0; }
      .tutor-section { margin-bottom: 30px; page-break-inside: avoid; }
      h2 { color: #1e293b; border-left: 5px solid #4F46E5; padding-left: 10px; margin-bottom: 15px; font-size: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 14px; }
      th { background-color: #f8fafc; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
      tr:nth-child(even) { background-color: #f8fafc; }
      tr:hover { background-color: #f1f5f9; }
      .meta { font-size: 12px; color: #94a3b8; text-align: right; margin-top: 5px; }
    </style></head><body>
    <div class="header">
      <h1>Excellence Akademie</h1>
      <p>Official Timetable • Generated on ${new Date().toLocaleDateString()}</p>
    </div>`;
    
    activeTutors.forEach(tutor => {
      const classes = timetable.filter(c => c.tutorId === tutor.id);
      if (classes.length > 0) {
        html += `<div class="tutor-section"><h2>${tutor.name}</h2>
        <table>
          <thead>
            <tr>
              <th width="10%">Day</th>
              <th width="15%">Time</th>
              <th width="25%">Course</th>
              <th width="20%">Subject</th>
              <th width="10%">Grade</th>
              <th width="10%">Type</th>
              <th width="10%">Students</th>
            </tr>
          </thead>
          <tbody>`;
        
        classes.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.startTime.localeCompare(b.startTime))
          .forEach(c => {
            html += `<tr>
              <td><b>${c.day}</b></td>
              <td>${c.startTime} - ${c.endTime}</td>
              <td>${c.courseName}</td>
              <td>${c.subject}</td>
              <td>${c.grade}</td>
              <td><span style="background:${c.type === 'Group' ? '#e0e7ff;color:#3730a3' : '#dcfce7;color:#166534'};padding:2px 8px;border-radius:10px;font-size:11px">${c.type}</span></td>
              <td>${c.students || '-'}</td>
            </tr>`;
          });
        html += `</tbody></table></div>`;
      }
    });
    
    if (activeTutors.every(t => timetable.filter(c => c.tutorId === t.id).length === 0)) {
       html += `<div style="text-align:center;color:#666;margin-top:50px">No classes scheduled.</div>`;
    }

    html += `</body></html>`;
    const win = window.open('', '', 'width=1100,height=800');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const canEdit = userRole === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading from API...</p>
        </div>
      </div>
    );
  }

  const getSubjectColor = (subject: string) => {
    const colors = [
      'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
      'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
      'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
    ];
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const activeTutors = viewMode === 'all' || viewMode === 'combined' ? tutors : tutors.filter(t => t.id === selectedTutor);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Timetable Management</h1>
              <p className="text-sm text-gray-500 font-medium">
                {canEdit ? 'Admin Access' : 'View Only'} • Weekly Recurring Schedule
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-gray-100/80 p-1 rounded-xl flex items-center">
              {[
                { id: 'combined', label: 'Master View', icon: Grid },
                { id: 'all', label: 'By Tutor', icon: User },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    viewMode === mode.id
                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  <mode.icon className="w-4 h-4" />
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={exportToExcel} className="p-2.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Export to Excel">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={exportToPDF} className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Export to PDF">
                <Printer className="w-5 h-5" />
              </button>
              {canEdit && (
                <>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv,.json" 
                    onChange={handleFileUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploadLoading}
                    className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                    title="Upload Timetable (CSV/JSON)"
                  >
                    {uploadLoading ? <div className="animate-spin h-5 w-5 border-b-2 border-blue-600 rounded-full"></div> : <Upload className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setShowAutoSchedule(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md active:scale-95 font-medium"
                  >
                    <Wand2 className="w-4 h-4" />
                    Auto Schedule
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters & Alerts */}
        {!canEdit && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Read-Only Mode: Contact an administrator to make changes.</span>
          </div>
        )}

        {tutors.length === 0 && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <div className="flex-1">
              <span className="font-bold block">Connection Error</span>
              <span className="text-sm">Could not load tutors. This may be due to a database connection issue. Please refresh the page or try again later.</span>
            </div>
            <button onClick={loadData} className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm font-medium transition-colors">
              Retry
            </button>
          </div>
        )}

        {viewMode === 'all' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 w-fit">
            <Settings className="w-4 h-4 text-gray-400" />
            <select
              value={selectedTutor}
              onChange={(e) => setSelectedTutor(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
            >
              <option value="all">Filter: All Tutors</option>
              {tutors.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}



        {showAutoSchedule && canEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Settings className="w-6 h-6 text-indigo-600" />Auto Schedule
                </h2>
                <button onClick={() => setShowAutoSchedule(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Start Time</label>
                  <input type="time" value={autoScheduleConfig.startTime} onChange={(e) => setAutoScheduleConfig({...autoScheduleConfig, startTime: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">End Time</label>
                  <input type="time" value={autoScheduleConfig.endTime} onChange={(e) => setAutoScheduleConfig({...autoScheduleConfig, endTime: e.target.value})} className="w-full px-4 py-2 border-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Class Duration (min)</label>
                  <input type="number" min="15" max="180" step="15" value={autoScheduleConfig.classDuration} onChange={(e) => setAutoScheduleConfig({...autoScheduleConfig, classDuration: parseInt(e.target.value)})} className="w-full px-4 py-2 border-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Break Duration (min)</label>
                  <input type="number" min="0" max="60" step="5" value={autoScheduleConfig.breakDuration} onChange={(e) => setAutoScheduleConfig({...autoScheduleConfig, breakDuration: parseInt(e.target.value)})} className="w-full px-4 py-2 border-2 rounded-lg" />
                </div>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="fillUnplaced"
                    checked={autoScheduleConfig.fillUnplaced} 
                    onChange={(e) => setAutoScheduleConfig({...autoScheduleConfig, fillUnplaced: e.target.checked})} 
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="fillUnplaced" className="text-sm font-medium text-gray-700">
                    Auto-fill unplaced tutors (assign to matching/general courses)
                  </label>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Classes: {autoScheduleConfig.startTime} to {autoScheduleConfig.endTime}, 
                    {autoScheduleConfig.classDuration}min each, {autoScheduleConfig.breakDuration}min breaks
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={autoScheduleClasses} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold">
                    Generate
                  </button>
                  <button onClick={() => setShowAutoSchedule(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {viewMode === 'combined' ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Combined Schedule</h2>
                <p className="text-indigo-100 text-sm">All tutors and classes in one view</p>
              </div>
              
              {/* Unscheduled Tutors Warning */}
              {(() => {
                const scheduledTutorIds = new Set(timetable.map(c => String(c.tutorId)));
                const unscheduledTutors = tutors.filter(t => !scheduledTutorIds.has(String(t.id)));
                
                if (unscheduledTutors.length > 0) {
                  return (
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 text-xs border border-white/20 max-w-md">
                      <div className="font-bold flex items-center gap-1 mb-1 text-amber-300">
                        <AlertCircle className="w-3 h-3" />
                        {unscheduledTutors.length} Unplaced Tutors
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {unscheduledTutors.slice(0, 5).map(t => (
                          <span key={t.id} className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{t.name}</span>
                        ))}
                        {unscheduledTutors.length > 5 && <span className="opacity-70">+ {unscheduledTutors.length - 5} more</span>}
                      </div>
                      {canEdit && <div className="mt-1 text-[10px] opacity-80 italic">Use Auto Schedule to fill or manually add.</div>}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <thead>
                    <tr className="bg-indigo-500 text-white">
                      <th className="p-3 text-left border border-indigo-400 w-24">
                        <Clock className="w-4 h-4 inline mr-2" />Time
                      </th>
                      {days.map(day => <th key={day} className="p-3 text-center border border-indigo-400 w-48">{day}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(time => (
                      <tr key={time} className="hover:bg-gray-50">
                        <td className="p-2 border border-gray-200 font-medium text-gray-700 bg-gray-50 text-sm align-top">{time}</td>
                        {days.map(day => {
                          const classes = getClassesForSlot(day, time);
                          const isEditing = editingSlot === `${day}-${time}-new`;
                          
                          return (
                            <td key={day} className="p-2 border border-gray-200 align-top h-32">
                              <div className="flex flex-col gap-2">
                                {classes.map(cls => (
                                  <div key={cls.id} className="bg-white border-l-4 border-indigo-500 shadow-sm p-2 rounded text-xs hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                      <div className="font-bold text-indigo-700 truncate">{cls.tutorName}</div>
                                      {canEdit && (
                                        <button onClick={() => deleteClass(cls.id)} className="text-gray-400 hover:text-red-500">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="font-medium text-gray-800 truncate">{cls.courseName}</div>
                                    <div className="text-gray-500">{cls.startTime} - {cls.endTime}</div>
                                    <div className="flex gap-1 mt-1">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${cls.type === 'Group' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                        {cls.type}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                
                                {isEditing && canEdit && (
                                  <div className="space-y-2 p-2 bg-blue-50 rounded-lg shadow-inner">
                                    <select value={newClass.tutorId} onChange={(e) => {
                                      const t = tutors.find(x => x.id === e.target.value);
                                      setNewClass({...newClass, tutorId: e.target.value, tutorName: t?.name || ''});
                                    }} className="w-full px-2 py-1 text-xs border rounded">
                                      <option value="">Select Tutor</option>
                                      {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                    
                                    <select value={newClass.courseName} onChange={(e) => {
                                      const c = courses.find(x => x.name === e.target.value);
                                      setNewClass({...newClass, courseName: e.target.value, subject: c?.subject || c?.department || ''});
                                    }} className="w-full px-2 py-1 text-xs border rounded">
                                      <option value="">Select Course</option>
                                      {courses
                                        .filter(c => !newClass.tutorId || String(c.tutorId) === String(newClass.tutorId))
                                        .map(c => 
                                          <option key={c.id} value={c.name}>{c.name}</option>
                                        )}
                                    </select>

                                    <div className="flex gap-1">
                                      <input type="time" value={newClass.startTime} onChange={(e) => setNewClass({...newClass, startTime: e.target.value})} className="flex-1 px-1 py-1 text-xs border rounded" />
                                      <input type="time" value={newClass.endTime} onChange={(e) => setNewClass({...newClass, endTime: e.target.value})} className="flex-1 px-1 py-1 text-xs border rounded" />
                                    </div>

                                    <div className="flex gap-1">
                                      <button onClick={() => addClass(day)} className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">Save</button>
                                      <button onClick={() => setEditingSlot(null)} className="flex-1 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600">Cancel</button>
                                    </div>
                                  </div>
                                )}

                                {!isEditing && canEdit && (
                                  <button onClick={() => startEdit(day, time, '')} className="w-full py-1 text-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-dashed border-gray-300 text-xs transition-colors">
                                    <Plus className="w-3 h-3 inline mr-1" /> Add
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            activeTutors.map(tutor => {
            const tutorClasses = timetable.filter(c => c.tutorId === tutor.id);
            return (
              <div key={tutor.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
                  <h2 className="text-xl font-bold">{tutor.name}</h2>
                  <p className="text-indigo-100 text-sm">{tutor.subjects?.join(', ') || 'No subjects'}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-indigo-500 text-white">
                        <th className="p-3 text-left border border-indigo-400 min-w-[100px]">
                          <Clock className="w-4 h-4 inline mr-2" />Time
                        </th>
                        {days.map(day => <th key={day} className="p-3 text-center border border-indigo-400 min-w-[180px]">{day}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map(time => (
                        <tr key={time} className="hover:bg-gray-50">
                          <td className="p-2 border border-gray-200 font-medium text-gray-700 bg-gray-50 text-sm">{time}</td>
                          {days.map(day => {
                            const cls = getClassForSlot(tutor.id, day, time);
                            const isEditing = editingSlot === `${day}-${time}-${tutor.id}`;
                            if (cls && cls.startTime === time) {
                              return (
                                <td key={day} className="p-2 border border-gray-200">
                                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-3 rounded-lg">
                                    <div className="flex justify-between mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Book className="w-4 h-4" />
                                          <span className="font-semibold text-sm">{cls.courseName}</span>
                                        </div>
                                        <div className="text-xs">{cls.startTime} - {cls.endTime}</div>
                                      </div>
                                      {canEdit && (
                                        <button onClick={() => deleteClass(cls.id)} className="p-1 hover:bg-white/20 rounded">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="text-xs">
                                      <span className="bg-white/20 px-2 py-0.5 rounded mr-1">{cls.type}</span>
                                      <span className="bg-white/20 px-2 py-0.5 rounded">{cls.grade}</span>
                                      {cls.students && <div className="mt-1">{cls.students}</div>}
                                    </div>
                                  </div>
                                </td>
                              );
                            } else if (isEditing && canEdit) {
                              const selTutor = tutors.find(t => t.id === newClass.tutorId);
                              return (
                                <td key={day} className="p-2 border border-gray-200">
                                  <div className="space-y-2 p-2 bg-blue-50 rounded-lg">
                                    {viewMode === 'all' && (
                                      <select value={newClass.tutorId} onChange={(e) => {
                                        const t = tutors.find(x => x.id === e.target.value);
                                        setNewClass({...newClass, tutorId: e.target.value, tutorName: t?.name || ''});
                                      }} className="w-full px-2 py-1 text-sm border rounded">
                                        <option value="">Tutor</option>
                                        {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                      </select>
                                    )}
                                    <select value={newClass.courseName} onChange={(e) => {
                                      const c = courses.find(x => x.name === e.target.value);
                                      setNewClass({...newClass, courseName: e.target.value, subject: c?.subject || c?.department || ''});
                                    }} className="w-full px-2 py-1 text-sm border rounded">
                                      <option value="">Select Course</option>
                                      {courses
                                        .filter(c => !newClass.tutorId || String(c.tutorId) === String(newClass.tutorId))
                                        .map(c => 
                                          <option key={c.id} value={c.name}>{c.name}</option>
                                        )}
                                    </select>
                                    <div className="flex gap-2">
                                      <input type="time" value={newClass.startTime} onChange={(e) => setNewClass({...newClass, startTime: e.target.value})} className="flex-1 px-2 py-1 text-sm border rounded" />
                                      <input type="time" value={newClass.endTime} onChange={(e) => setNewClass({...newClass, endTime: e.target.value})} className="flex-1 px-2 py-1 text-sm border rounded" />
                                    </div>
                                    <div className="flex gap-2">
                                      <select value={newClass.grade} onChange={(e) => setNewClass({...newClass, grade: e.target.value})} className="flex-1 px-2 py-1 text-sm border rounded">
                                        <option>Grade 10</option>
                                        <option>Grade 11</option>
                                        <option>Grade 12</option>
                                      </select>
                                      <select value={newClass.type} onChange={(e) => setNewClass({...newClass, type: e.target.value})} className="flex-1 px-2 py-1 text-sm border rounded">
                                        <option>Group</option>
                                        <option>1-on-1</option>
                                      </select>
                                    </div>
                                    <input type="text" placeholder="Students" value={newClass.students} onChange={(e) => setNewClass({...newClass, students: e.target.value})} className="w-full px-2 py-1 text-sm border rounded" />
                                    <div className="flex gap-2">
                                      <button onClick={() => addClass(day)} className="flex-1 bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700">
                                        <Save className="w-3 h-3 inline" /> Save
                                      </button>
                                      <button onClick={() => setEditingSlot(null)} className="flex-1 bg-gray-500 text-white px-2 py-1 rounded text-sm hover:bg-gray-600">
                                        <X className="w-3 h-3 inline" /> Cancel
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              );
                            } else if (!cls && canEdit) {
                              return (
                                <td key={day} className="p-2 border border-gray-200">
                                  <button onClick={() => startEdit(day, time, tutor.id)} className="w-full min-h-[50px] flex items-center justify-center text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 rounded">
                                    <Plus className="w-5 h-5" />
                                  </button>
                                </td>
                              );
                            }
                            return <td key={day} className="p-2 border border-gray-200 bg-gray-50/50"></td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 p-4 border-t">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-indigo-600">{tutorClasses.length}</div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{tutorClasses.filter(c => c.type === 'Group').length}</div>
                      <div className="text-sm text-gray-600">Group</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{tutorClasses.filter(c => c.type === '1-on-1').length}</div>
                      <div className="text-sm text-gray-600">1-on-1</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
          </div>
      </div>
    </div>
  );
};

export default TutorTimetableManager;

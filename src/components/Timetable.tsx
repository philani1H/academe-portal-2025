import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Book, Plus, Trash2, Save, X, Download, Grid, Printer, AlertCircle, Wand2, Settings } from 'lucide-react';
import { apiFetch } from "@/lib/api";

const TutorTimetableManager = ({ userRole = 'admin' }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [timetable, setTimetable] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all');
  const [selectedTutor, setSelectedTutor] = useState('');
  const [editingSlot, setEditingSlot] = useState(null);
  const [showAutoSchedule, setShowAutoSchedule] = useState(false);
  const [autoScheduleConfig, setAutoScheduleConfig] = useState({
    startTime: '08:00',
    endTime: '17:00',
    classDuration: 60,
    breakDuration: 15
  });
  const [newClass, setNewClass] = useState({
    tutorId: '', tutorName: '', subject: '', courseName: '',
    grade: 'Grade 10', type: 'Group', students: '',
    startTime: '08:00', endTime: '09:00', day: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tutorsRes, coursesRes, timetableRes] = await Promise.all([
        fetch('/api/admin/content/tutors').then(r => r.json()),
        fetch('/api/courses').then(r => r.json()),
        fetch('/api/timetable').then(r => r.json())
      ]);
      
      setTutors(Array.isArray(tutorsRes) ? tutorsRes : []);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
      setTimetable(Array.isArray(timetableRes) ? timetableRes : (timetableRes?.data || []));
      
      if (tutorsRes && tutorsRes.length > 0) {
        setSelectedTutor(tutorsRes[0].id);
      }
    } catch (error) {
      console.error('API Error:', error);
      showNotification('Failed to load data from API', 'error');
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
      grade: 'Grade 10', type: 'Group', students: '',
      startTime: '08:00', endTime: '09:00', day: ''
    });
  };

  const startEdit = (day, startTime, tutorId) => {
    if (!canEdit) return;
    const tutor = tutors.find(t => t.id === tutorId);
    setEditingSlot(`${day}-${startTime}-${tutorId}`);
    setNewClass({
      tutorId, tutorName: tutor?.name || '', subject: '', courseName: '',
      grade: 'Grade 10', type: 'Group', students: '',
      startTime, endTime: addMinutesToTime(startTime, 60), day
    });
  };

  const getClassForSlot = (tutorId, day, time) => {
    return timetable.find(c => 
      c.tutorId === tutorId && c.day === day && c.startTime <= time && c.endTime > time
    );
  };

  const autoScheduleClasses = async () => {
    if (!canEdit) return;
    const { startTime, endTime, classDuration, breakDuration } = autoScheduleConfig;
    const newTimetable = [];
    const slots = generateTimeSlots(startTime, endTime, classDuration + breakDuration);
    
    let tutorIdx = 0, dayIdx = 0;
    courses.forEach((course) => {
      const tutor = tutors.find(t => t.id === course.tutorId);
      if (!tutor) return;
      const day = days[dayIdx % days.length];
      const slot = slots[tutorIdx % slots.length];
      if (slot) {
        newTimetable.push({
          id: `auto-${Date.now()}-${tutorIdx}`,
          tutorId: tutor.id,
          tutorName: tutor.name,
          courseName: course.name,
          subject: course.subject,
          grade: 'Grade 10',
          type: 'Group',
          students: '',
          day,
          startTime: slot,
          endTime: addMinutesToTime(slot, classDuration)
        });
      }
      tutorIdx++;
      if (tutorIdx % 3 === 0) dayIdx++;
    });

    setTimetable(newTimetable);
    await saveTimetable(newTimetable);
    setShowAutoSchedule(false);
    showNotification(`Auto-scheduled ${newTimetable.length} classes`);
  };

  const exportToExcel = () => {
    let csv = 'Excellence Akademie Timetable\n\n';
    const activeTutors = viewMode === 'all' ? tutors : tutors.filter(t => t.id === selectedTutor);
    activeTutors.forEach(tutor => {
      const classes = timetable.filter(c => c.tutorId === tutor.id);
      if (classes.length > 0) {
        csv += `\n${tutor.name}\n`;
        csv += 'Day,Start,End,Course,Subject,Grade,Type,Students\n';
        classes.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.startTime.localeCompare(b.startTime))
          .forEach(c => csv += `${c.day},${c.startTime},${c.endTime},${c.courseName},${c.subject},${c.grade},${c.type},"${c.students}"\n`);
      }
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Timetable_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showNotification('Excel exported');
  };

  const exportToPDF = () => {
    const activeTutors = viewMode === 'all' ? tutors : tutors.filter(t => t.id === selectedTutor);
    let html = `<!DOCTYPE html><html><head><title>Timetable</title><style>
      body{font-family:Arial;padding:20px}h1{color:#4F46E5}table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#4F46E5;color:white}
    </style></head><body><h1>Excellence Akademie</h1>`;
    activeTutors.forEach(tutor => {
      const classes = timetable.filter(c => c.tutorId === tutor.id);
      if (classes.length > 0) {
        html += `<h2>${tutor.name}</h2><table><tr><th>Day</th><th>Time</th><th>Course</th><th>Type</th></tr>`;
        classes.forEach(c => html += `<tr><td>${c.day}</td><td>${c.startTime}-${c.endTime}</td><td>${c.courseName}</td><td>${c.type}</td></tr>`);
        html += `</table>`;
      }
    });
    html += `</body></html>`;
    const win = window.open('', '', 'width=900,height=700');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
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

  const activeTutors = viewMode === 'all' ? tutors : tutors.filter(t => t.id === selectedTutor);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Tutor Timetable</h1>
                <p className="text-sm text-gray-500">{canEdit ? 'Admin Mode' : 'View Only'}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {canEdit && (
                <button onClick={() => setShowAutoSchedule(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                  <Wand2 className="w-4 h-4" />Auto Schedule
                </button>
              )}
              <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                <Download className="w-4 h-4" />Excel
              </button>
              <button onClick={exportToPDF} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                <Printer className="w-4 h-4" />PDF
              </button>
            </div>
          </div>

          {!canEdit && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Read-Only Access</p>
                <p className="text-sm text-yellow-700">Contact admin to make changes.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">View Mode</label>
              <div className="flex gap-2">
                <button onClick={() => setViewMode('all')} className={`flex-1 px-4 py-2 rounded-lg font-medium ${viewMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  <Grid className="w-4 h-4 inline mr-2" />All
                </button>
                <button onClick={() => setViewMode('individual')} className={`flex-1 px-4 py-2 rounded-lg font-medium ${viewMode === 'individual' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  <User className="w-4 h-4 inline mr-2" />Individual
                </button>
              </div>
            </div>
            {viewMode === 'individual' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Tutor</label>
                <select value={selectedTutor} onChange={(e) => setSelectedTutor(e.target.value)} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg">
                  {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

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
          {activeTutors.map(tutor => {
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
                                          <span className="font-semibold text-sm">{cls.courseName || cls.subject}</span>
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
                                      setNewClass({...newClass, courseName: e.target.value, subject: c?.subject || e.target.value});
                                    }} className="w-full px-2 py-1 text-sm border rounded">
                                      <option value="">Course</option>
                                      {courses.filter(c => !newClass.tutorId || c.tutorId === newClass.tutorId).map(c => 
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                      )}
                                      {selTutor?.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
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
          })}
        </div>
      </div>
    </div>
  );
};

export default TutorTimetableManager;
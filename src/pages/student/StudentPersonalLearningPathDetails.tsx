import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import { format } from 'date-fns';
import { PersonalLearningPathService, type PersonalLearningPathDetails, type CalendarDay } from '../../services/personalLearningPathService';

const StudentPersonalLearningPathDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pathDetails, setPathDetails] = useState<PersonalLearningPathDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<{[key: number]: boolean}>({});
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyLessons, setDailyLessons] = useState<any[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [loadingDailyLessons, setLoadingDailyLessons] = useState(false);
  const [activeSubPage, setActiveSubPage] = useState<'details' | 'modules' | 'calendar'>('details');

  useEffect(() => {
    if (id) {
      loadPathDetails(id);
    }
  }, [id]);

  useEffect(() => {
    loadCalendarData(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  useEffect(() => {
    loadDailyLessons(selectedDate);
  }, [selectedDate]);

  const loadPathDetails = async (pathId: string) => {
    try {
      setLoading(true);
      setError(null);
      const details = await PersonalLearningPathService.getPersonalLearningPathDetails(pathId);
      setPathDetails(details);
      
      // Initialize all modules as expanded
      const initialExpandedState: {[key: number]: boolean} = {};
      details.modules.forEach(module => {
        initialExpandedState[module.id] = true;
      });
      setExpandedModules(initialExpandedState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning path details');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarData = async (year: number, month: number) => {
    try {
      setLoadingCalendar(true);
      const data = await PersonalLearningPathService.getCalendarData(year, month);
      // Convert date strings back to Date objects
      const processedData = data.map(day => ({
        ...day,
        date: new Date(day.date)
      }));
      setCalendarData(processedData);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const loadDailyLessons = async (date: Date) => {
    try {
      setLoadingDailyLessons(true);
      const dateString = format(date, 'yyyy-MM-dd');
      const lessons = await PersonalLearningPathService.getDailyLessons(dateString);
      setDailyLessons(lessons);
    } catch (err) {
      console.error('Failed to load daily lessons:', err);
    } finally {
      setLoadingDailyLessons(false);
    }
  };

  const toggleModuleExpanded = (moduleId: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleLessonClick = (lessonId: number) => {
    navigate(`/student/dashboard/personal-path-lessons/${lessonId}`);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleToggleCompleted = async (lessonId: number, completed: boolean) => {
    try {
      await PersonalLearningPathService.updatePersonalLessonProgress(lessonId, completed);
      
      // Refresh path details
      if (id) {
        await loadPathDetails(id);
      }
      
      // Refresh daily lessons
      await loadDailyLessons(selectedDate);
    } catch (err) {
      console.error('Failed to update lesson progress:', err);
    }
  };

  const handleBackToLearningPaths = () => {
    navigate('/student/dashboard/learning-path');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon name="spinner-bold-duotone" size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading learning path details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !pathDetails) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <Icon name="danger-circle-bold-duotone" size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Learning Path</h2>
          <p className="text-gray-600 mb-4">{error || 'Learning path not found'}</p>
          <button 
            onClick={handleBackToLearningPaths}
            className="gradient-button text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to Learning Paths
          </button>
        </div>
      </div>
    );
  }

  const { path, modules } = pathDetails;
  
  // Calculate total lessons and completed lessons
  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const completedLessons = modules.reduce((sum, module) => 
    sum + module.lessons.filter(lesson => lesson.progress?.completed).length, 0);
  
  // Calculate progress percentage
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Generate calendar days
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  // Get day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Create calendar grid
  const calendarGrid = [];
  let dayCounter = 1;
  
  // Create weeks
  for (let i = 0; i < 6; i++) {
    const week = [];
    
    // Create days in a week
    for (let j = 0; j < 7; j++) {
      if ((i === 0 && j < firstDayOfMonth) || dayCounter > daysInMonth) {
        // Empty cell
        week.push(null);
      } else {
        // Valid day
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayCounter);
        const dateString = format(date, 'yyyy-MM-dd');
        const calendarDay = calendarData.find(day => 
          format(day.date, 'yyyy-MM-dd') === dateString
        );
        
        week.push({
          date,
          lessons: calendarDay?.lessons || []
        });
        
        dayCounter++;
      }
    }
    
    calendarGrid.push(week);
    
    // Break if we've reached the end of the month
    if (dayCounter > daysInMonth) {
      break;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button 
        onClick={handleBackToLearningPaths}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <Icon name="arrow-left-bold-duotone" size={20} />
        Back to Learning Paths
      </button>

      {/* Learning Path Header */}
      <div className="card p-8 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">{path.title}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(path.status)}`}>
                {path.status.charAt(0).toUpperCase() + path.status.slice(1)}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{path.description}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Overall Progress</span>
            <span className="text-sm font-medium text-gray-900">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-[#2727E6] h-3 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{completedLessons} of {totalLessons} lessons completed</span>
            <span>Created on {new Date(path.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="mb-8">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSubPage('details')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeSubPage === 'details'
                ? 'border-b-2 border-[#2727E6] text-[#2727E6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Path Details
          </button>
          <button
            onClick={() => setActiveSubPage('modules')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeSubPage === 'modules'
                ? 'border-b-2 border-[#2727E6] text-[#2727E6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Modules & Lessons
          </button>
          <button
            onClick={() => setActiveSubPage('calendar')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeSubPage === 'calendar'
                ? 'border-b-2 border-[#2727E6] text-[#2727E6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Study Calendar
          </button>
        </div>
      </div>

      {/* Path Details */}
      {activeSubPage === 'details' && (
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Path Details</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Path Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Learning Goal</p>
                  <p className="font-medium text-gray-900">{path.goal_topic}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Knowledge Level</p>
                  <p className="font-medium text-gray-900">{path.current_standing}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900">{new Date(path.start_date).toLocaleDateString()}</p>
                </div>
                {path.exam_date && (
                  <div>
                    <p className="text-sm text-gray-500">Target Exam Date</p>
                    <p className="font-medium text-gray-900">{new Date(path.exam_date).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium text-gray-900">{new Date(path.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-gray-900 capitalize">{path.status}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Path Structure</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total Modules</p>
                  <p className="font-medium text-gray-900">{modules.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Lessons</p>
                  <p className="font-medium text-gray-900">{totalLessons}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed Lessons</p>
                  <p className="font-medium text-gray-900">{completedLessons}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="font-medium text-gray-900">{progressPercentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created On</p>
                  <p className="font-medium text-gray-900">{new Date(path.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Path Description</h3>
            <p className="text-gray-700">{path.description}</p>
          </div>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use This Learning Path</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Follow Your Schedule</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Complete lessons according to the scheduled dates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use the calendar view to see your daily lessons</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Mark lessons as complete as you progress</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Maximize Learning</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Interact with the AI tutor for each lesson</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Generate and complete quizzes to test your knowledge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="check-circle-bold-duotone" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use flashcards for effective memorization</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modules and Lessons */}
      {activeSubPage === 'modules' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Path Content</h2>
          <div className="space-y-6">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="card p-0 overflow-hidden">
                {/* Module Header */}
                <div 
                  className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer"
                  onClick={() => toggleModuleExpanded(module.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#2727E6] rounded-full flex items-center justify-center text-white font-semibold">
                        {moduleIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600">{module.lessons.length} lessons</p>
                      </div>
                    </div>
                    <Icon 
                      name={expandedModules[module.id] ? "alt-arrow-up-bold-duotone" : "alt-arrow-down-bold-duotone"} 
                      size={20} 
                      className="text-gray-500"
                    />
                  </div>
                </div>
                
                {/* Module Lessons */}
                {expandedModules[module.id] && (
                  <div className="divide-y divide-gray-100">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div 
                        key={lesson.id} 
                        className={`p-4 cursor-pointer transition-all duration-200 ${
                          lesson.progress?.completed 
                            ? 'bg-green-50 hover:bg-green-100' 
                            : 'hover:bg-blue-50'
                        }`}
                        onClick={() => handleLessonClick(lesson.id)}
                      >
                        <div className="flex items-center gap-4 pl-11">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            lesson.progress?.completed 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {lesson.progress?.completed ? (
                              <Icon name="check-circle-bold-duotone" size={16} />
                            ) : (
                              <span className="text-xs font-semibold">{moduleIndex + 1}.{lessonIndex + 1}</span>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Icon name="clock-circle-bold-duotone" size={14} />
                                {lesson.duration}
                              </span>
                              {lesson.scheduled_date && (
                                <span className="flex items-center gap-1">
                                  <Icon name="calendar-bold-duotone" size={14} />
                                  {new Date(lesson.scheduled_date).toLocaleDateString()}
                                </span>
                              )}
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                                AI Tutor
                              </span>
                            </div>
                          </div>
                          
                          <Icon name="play-circle-bold-duotone" size={18} className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {activeSubPage === 'calendar' && (
        <div>
          <div className="card p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Study Calendar</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCalendarView('month')}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    calendarView === 'month' 
                      ? 'bg-[#2727E6] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Month
                </button>
                <button 
                  onClick={() => setCalendarView('week')}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    calendarView === 'week' 
                      ? 'bg-[#2727E6] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Week
                </button>
                <button 
                  onClick={() => setCalendarView('day')}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    calendarView === 'day' 
                      ? 'bg-[#2727E6] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Day
                </button>
              </div>
            </div>

            {/* Month Navigation */}
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={handlePreviousMonth}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <Icon name="arrow-left-bold-duotone" size={20} />
              </button>
              <h4 className="font-medium">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h4>
              <button 
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <Icon name="arrow-right-bold-duotone" size={20} />
              </button>
            </div>

            {/* Calendar Grid */}
            {loadingCalendar ? (
              <div className="h-64 flex items-center justify-center">
                <Icon name="spinner-bold-duotone" size={24} className="animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="mb-4">
                {/* Day Names */}
                <div className="grid grid-cols-7 mb-2">
                  {dayNames.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {calendarGrid.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 divide-x divide-gray-200 border-b border-gray-200 last:border-b-0">
                      {week.map((day, dayIndex) => (
                        <div 
                          key={dayIndex} 
                          className={`min-h-[80px] p-1 ${
                            day ? (
                              day.date.toDateString() === selectedDate.toDateString()
                                ? 'bg-blue-50'
                                : day.date.toDateString() === new Date().toDateString()
                                  ? 'bg-yellow-50'
                                  : ''
                            ) : 'bg-gray-50'
                          } ${day ? 'cursor-pointer' : ''}`}
                          onClick={() => day && handleDateClick(day.date)}
                        >
                          {day && (
                            <>
                              <div className="text-right mb-1">
                                <span className={`text-xs font-medium ${
                                  day.date.toDateString() === new Date().toDateString()
                                    ? 'bg-blue-600 text-white rounded-full w-5 h-5 inline-flex items-center justify-center'
                                    : 'text-gray-700'
                                }`}>
                                  {day.date.getDate()}
                                </span>
                              </div>
                              {day.lessons.length > 0 && (
                                <div className="space-y-1">
                                  {day.lessons.slice(0, 2).map(lesson => (
                                    <div 
                                      key={lesson.id}
                                      className={`text-xs p-1 rounded ${
                                        lesson.progress?.completed
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                      title={lesson.title}
                                    >
                                      <div className="truncate">{lesson.title}</div>
                                    </div>
                                  ))}
                                  {day.lessons.length > 2 && (
                                    <div className="text-xs text-gray-500 text-center">
                                      +{day.lessons.length - 2} more
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Daily To-Do List */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Daily To-Do: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            
            {loadingDailyLessons ? (
              <div className="h-32 flex items-center justify-center">
                <Icon name="spinner-bold-duotone" size={24} className="animate-spin text-blue-600" />
              </div>
            ) : dailyLessons.length === 0 ? (
              <div className="text-center py-6">
                <Icon name="check-circle-bold-duotone" size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No lessons scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dailyLessons.map(lesson => (
                  <div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={lesson.progress?.completed || false}
                      onChange={() => handleToggleCompleted(lesson.id, !lesson.progress?.completed)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${lesson.progress?.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{lesson.module.title}</span>
                        <span>{lesson.duration}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLessonClick(lesson.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Icon name="play-circle-bold-duotone" size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default StudentPersonalLearningPathDetails;
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Class } from '@/types';
import { classService } from '@/services/classService';
import { getSocket } from '@/services/socketService';
import {
  Plus,
  Users,
  Copy,
  Check,
  Settings,
  Play,
  Clock,
  BookOpen,
  Loader2,
  Trash2,
} from 'lucide-react';



const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function TeacherClasses() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [activeSessionClassCode, setActiveSessionClassCode] = useState<string>('');

  // Check for active session
  useEffect(() => {
    const checkActiveSession = () => {
      const activeSessionId = localStorage.getItem('activeSessionId');
      const classCode = localStorage.getItem('activeSessionClassCode');
      setHasActiveSession(!!activeSessionId);
      setActiveSessionClassCode(classCode || '');
    };

    checkActiveSession();
    const interval = setInterval(checkActiveSession, 1000);
    return () => clearInterval(interval);
  }, []);

  // New class form state
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassGroup, setNewClassGroup] = useState('');
  const [allowedRadius, setAllowedRadius] = useState([50]);

  const loadClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await classService.getMyClasses(1, 100);
      setClasses(response.data || []);
    } catch (error: any) {
      console.error('Failed to load classes:', error);
      if (!error.message?.includes('blocked') && !error.code?.includes('BLOCKED')) {
        showToast('error', 'Failed to load classes');
      }
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Listen for WebSocket events to auto-refresh
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleEnrollmentApproved = () => loadClasses();
    const handleEnrollmentRejected = () => loadClasses();
    const handleStudentRemoved = () => loadClasses();
    const handleClassCreated = (data: { className: string }) => {
      loadClasses();
      showToast('success', 'Class created', `${data.className} has been added`);
    };
    const handleEnrollmentRequest = (data: { className: string; studentName: string }) => {
      loadClasses();
      showToast('warning', 'New enrollment request', `${data.studentName} wants to join ${data.className}`);
    };

    socket.on('enrollment-approved', handleEnrollmentApproved);
    socket.on('enrollment-rejected', handleEnrollmentRejected);
    socket.on('student-removed', handleStudentRemoved);
    socket.on('class-created', handleClassCreated);
    socket.on('enrollment-request', handleEnrollmentRequest);

    return () => {
      socket.off('enrollment-approved', handleEnrollmentApproved);
      socket.off('enrollment-rejected', handleEnrollmentRejected);
      socket.off('student-removed', handleStudentRemoved);
      socket.off('class-created', handleClassCreated);
      socket.off('enrollment-request', handleEnrollmentRequest);
    };
  }, [loadClasses, showToast]);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    showToast('success', 'Code copied!', 'Students can use this to join your class');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete ${className}? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(classId);
    try {
      await classService.deleteClass(classId);
      setClasses(classes.filter(c => c.id !== classId));
      showToast('success', 'Class deleted');
    } catch (error: any) {
      console.error('Failed to delete class:', error);
      showToast('error', 'Failed to delete class', error.response?.data?.message);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      showToast('error', 'Class name is required');
      return;
    }

    setIsCreating(true);
    try {
      const newClass = await classService.createClass({
        name: newClassName,
        description: newClassDescription,
        code: newClassCode,
        group: newClassGroup,
        allowedRadius: allowedRadius[0],
      });

      setClasses([newClass, ...classes]);
      setIsModalOpen(false);

      // Reset form
      setNewClassName('');
      setNewClassDescription('');
      setNewClassCode('');
      setNewClassGroup('');
      setAllowedRadius([50]);

      showToast('success', 'Class created!', `${newClass.name} is ready for students`);
    } catch (error: any) {
      console.error('Failed to create class:', error);
      showToast('error', 'Failed to create class', error.response?.data?.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">My Classes</h1>
            <p className="text-muted-foreground mt-1">Manage your classes and view enrolled students</p>
          </div>
          <Button variant="gradient" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Class
          </Button>
        </motion.div>

        {/* Classes Grid */}
        <motion.div variants={item} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading classes...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No classes yet. Create your first class to get started!</p>
            </div>
          ) : (
            <>
              {classes.map((classItem) => (
                <motion.div
                  key={classItem.id}
                  variants={item}
                  className="bg-card rounded-xl border border-border shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <button
                        onClick={() => copyCode(classItem.code, classItem.id)}
                        className="flex items-center gap-1.5 text-sm bg-muted px-3 py-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        {copiedId === classItem.id ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <code className="font-mono font-medium">{classItem.code}</code>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors ml-2"
                        onClick={() => handleDeleteClass(classItem.id, classItem.name)}
                        disabled={isDeleting === classItem.id}
                      >
                        {isDeleting === classItem.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <h3 className="font-display font-semibold text-lg mb-2 line-clamp-1">
                      {classItem.name}
                    </h3>
                    {(classItem as any).group && (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
                        {(classItem as any).group}
                      </span>
                    )}
                    {classItem.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {classItem.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {(classItem as any).enrollmentCounts ? (
                          <>
                            {(classItem as any).enrollmentCounts.approved} enrolled
                            {(classItem as any).enrollmentCounts.pending > 0 && (
                              <span className="text-yellow-600 dark:text-yellow-400">
                                {' '}• {(classItem as any).enrollmentCounts.pending} pending
                              </span>
                            )}
                          </>
                        ) : (
                          `${classItem._count?.enrollments || 0} students`
                        )}
                      </span>
                      {classItem.schedule && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {typeof (classItem.schedule as unknown) === 'string'
                            ? (classItem.schedule as string).split(' - ')[0]
                            : (classItem.schedule as any)?.days?.join(', ') || 'Scheduled'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border p-4 bg-muted/30 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/lecturer/attendance?classId=${classItem.id}`)}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (hasActiveSession) {
                            showToast('warning', 'Session already active', `You have a live attendance session for ${activeSessionClassCode} course. Please end it before starting a new one.`);
                          } else {
                            navigate('/lecturer/session', { state: { classId: classItem.id } });
                          }
                        }}
                        disabled={hasActiveSession}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        {hasActiveSession ? 'Session Active' : 'Start Session'}
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/lecturer/attendance?classId=${classItem.id}&tab=requests`)}
                    >
                      View Enrollment Requests
                    </Button>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </motion.div>

        {/* Create Class Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Create New Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="className">Class Name</Label>
                <Input
                  id="className"
                  placeholder="e.g., Introduction to Physics"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classCode">Course Code (Optional)</Label>
                  <Input
                    id="classCode"
                    placeholder="Auto-generated if empty"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classGroup">Group (Optional)</Label>
                  <Input
                    id="classGroup"
                    placeholder="e.g. Group A"
                    value={newClassGroup}
                    onChange={(e) => setNewClassGroup(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classDescription">Description (optional)</Label>
                <Textarea
                  id="classDescription"
                  placeholder="Brief description of the class..."
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Allowed Radius for Attendance</Label>
                  <span className="text-sm font-medium text-primary">{allowedRadius[0]}m</span>
                </div>
                <Slider
                  value={allowedRadius}
                  onValueChange={setAllowedRadius}
                  min={10}
                  max={200}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Students must be within this distance from you to mark attendance
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={handleCreateClass} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Class'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}

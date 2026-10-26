export const metrics = [
  { label: 'Total Employees', value: '128', change: '+8 this month', icon: 'users' },
  { label: 'Active Tasks', value: '42', change: 'Across all teams', icon: 'clipboard' },
  { label: 'Completed Tasks', value: '316', change: '+12% this month', icon: 'check' },
  { label: 'Attendance Rate', value: '94.6%', change: 'Current month', icon: 'calendar' },
] as const;
export const productivity = [
  { day: 'Mon', completed: 30, assigned: 42 },
  { day: 'Tue', completed: 38, assigned: 46 },
  { day: 'Wed', completed: 35, assigned: 45 },
  { day: 'Thu', completed: 48, assigned: 52 },
  { day: 'Fri', completed: 44, assigned: 51 },
  { day: 'Sat', completed: 26, assigned: 32 },
  { day: 'Sun', completed: 18, assigned: 24 },
];
export const taskStatus = [
  { name: 'Completed', value: 316, color: '#16a34a' },
  { name: 'In progress', value: 42, color: '#6366f1' },
  { name: 'Pending', value: 25, color: '#f59e0b' },
  { name: 'Overdue', value: 9, color: '#ef4444' },
];
export const activities = [
  { name: 'Ananya Rao', action: 'completed the onboarding checklist', time: '10 minutes ago', initials: 'AR' },
  { name: 'Rahul Verma', action: 'submitted a daily work update', time: '35 minutes ago', initials: 'RV' },
  { name: 'Priya Sharma', action: 'created a new sprint task', time: '1 hour ago', initials: 'PS' },
  { name: 'Vikram Reddy', action: 'updated a performance review', time: '2 hours ago', initials: 'VR' },
];

import React, { useState, useEffect, useMemo, useRef } from 'react';

const STORAGE_KEY = 'lifeos_v7_data';
const ANCHOR_TODAY = '2026-11-25';

function parseDateStr(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateStr, delta) {
  const dt = parseDateStr(dateStr);
  dt.setDate(dt.getDate() + delta);
  return formatDateStr(dt);
}

function getWeekDates(anchorDateStr, weekStart = 'Sunday') {
  const dt = parseDateStr(anchorDateStr);
  const dow = dt.getDay(); // 0 = Sun ... 6 = Sat
  const offset = weekStart === 'Monday' ? (dow === 0 ? -6 : 1 - dow) : -dow;
  const start = new Date(dt);
  start.setDate(dt.getDate() + offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return formatDateStr(d);
  });
}

function getOrderedDays(weekStart = 'Sunday') {
  return weekStart === 'Monday'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

function getDayShortName(dateStr) {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return names[parseDateStr(dateStr).getDay()];
}

function formatReadableDate(dateStr) {
  const dt = parseDateStr(dateStr);
  return dt.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function createSeedData() {
  const tasks = [
    {
      id: 't1',
      title: 'Review Q4 product roadmap',
      notes: 'Align milestones for offline sync and mobile release.',
      dueDate: ANCHOR_TODAY,
      time: '09:30',
      priority: 'High',
      category: 'Work',
      completed: true,
      completedDate: ANCHOR_TODAY,
    },
    {
      id: 't2',
      title: 'Deep work: System architecture spec',
      notes: 'Finalize local storage schema and scoring engine.',
      dueDate: ANCHOR_TODAY,
      time: '11:00',
      priority: 'High',
      category: 'Work',
      completed: true,
      completedDate: ANCHOR_TODAY,
    },
    {
      id: 't3',
      title: 'Zone 2 run — 5km',
      notes: 'Keep heart rate steady between 135–145 bpm.',
      dueDate: ANCHOR_TODAY,
      time: '17:30',
      priority: 'Medium',
      category: 'Health',
      completed: true,
      completedDate: ANCHOR_TODAY,
    },
    {
      id: 't4',
      title: 'Prepare design critique deck',
      notes: 'Export key flows for tomorrow morning review.',
      dueDate: ANCHOR_TODAY,
      time: '19:00',
      priority: 'Medium',
      category: 'Personal',
      completed: false,
      completedDate: null,
    },
    {
      id: 't5',
      title: 'Submit quarterly tax estimate',
      notes: 'Verify Q3 deductions before filing.',
      dueDate: addDays(ANCHOR_TODAY, -1),
      time: '16:00',
      priority: 'High',
      category: 'Finance',
      completed: false,
      completedDate: null,
    },
    {
      id: 't6',
      title: 'Book dental checkup',
      notes: 'Morning slot preferred.',
      dueDate: addDays(ANCHOR_TODAY, 1),
      time: '10:00',
      priority: 'Low',
      category: 'Health',
      completed: false,
      completedDate: null,
    },
    {
      id: 't7',
      title: 'Read 2 chapters of Designing Data-Intensive Apps',
      notes: 'Focus on replication and partitioning.',
      dueDate: addDays(ANCHOR_TODAY, 2),
      time: '20:30',
      priority: 'Medium',
      category: 'Learning',
      completed: false,
      completedDate: null,
    },
    {
      id: 't8',
      title: 'Weekly pantry & meal prep reset',
      notes: 'High-protein lunches for next week.',
      dueDate: addDays(ANCHOR_TODAY, 3),
      time: '11:30',
      priority: 'Low',
      category: 'Personal',
      completed: false,
      completedDate: null,
    },
  ];

  // Historical task logs for past 30 days
  const taskHistory = {};
  for (let i = 30; i >= 1; i--) {
    const d = addDays(ANCHOR_TODAY, -i);
    const pattern = [100, 75, 100, 80, 60, 100, 90, 50, 100, 85];
    taskHistory[d] = pattern[i % pattern.length];
  }

  const habits = [
    {
      id: 'h1',
      name: 'Morning Hydration (500ml)',
      category: 'Health',
      time: '07:15',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      bestStreak: 19,
    },
    {
      id: 'h2',
      name: '10-Min Mindfulness',
      category: 'Mindset',
      time: '08:00',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      bestStreak: 14,
    },
    {
      id: 'h3',
      name: 'Language Practice (15m)',
      category: 'Learning',
      time: '13:00',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      bestStreak: 24,
    },
    {
      id: 'h4',
      name: 'Strength & Mobility',
      category: 'Health',
      time: '18:00',
      days: ['Sun', 'Tue', 'Wed', 'Fri'],
      bestStreak: 11,
    },
    {
      id: 'h5',
      name: 'Digital Sunset (No screens 10pm)',
      category: 'Mindset',
      time: '22:00',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      bestStreak: 9,
    },
  ];

  const habitLogs = {};
  for (let i = 30; i >= 1; i--) {
    const d = addDays(ANCHOR_TODAY, -i);
    const dayName = getDayShortName(d);
    const doneIds = [];
    habits.forEach((h, idx) => {
      if (h.days.includes(dayName) && (i + idx) % 4 !== 0) {
        doneIds.push(h.id);
      }
    });
    habitLogs[d] = doneIds;
  }
  habitLogs[ANCHOR_TODAY] = ['h1', 'h2', 'h3', 'h4'];

  const notes = [
    {
      id: 'n1',
      title: 'Daily Reflection — Nov 25',
      content:
        'Completed the architecture spec ahead of schedule and kept afternoon focus clean. Energy stayed steady after morning hydration and mindfulness.',
      tag: 'Daily',
      date: ANCHOR_TODAY,
      pinned: true,
      updatedAt: 'Today, 14:10',
    },
    {
      id: 'n2',
      title: 'Q4 Personal Operating Principles',
      content:
        '1. Protect 90 minutes before noon for deep creative work.\n2. Keep daily task list under 5 essential outcomes.\n3. Never miss two habit days in a row.',
      tag: 'Principles',
      date: addDays(ANCHOR_TODAY, -2),
      pinned: true,
      updatedAt: 'Nov 23',
    },
    {
      id: 'n3',
      title: 'Book Takeaways: Atomic Systems',
      content:
        'Environment design beats willpower. Place water bottle on desk at night and keep phone charging outside the bedroom.',
      tag: 'Learning',
      date: addDays(ANCHOR_TODAY, -5),
      pinned: false,
      updatedAt: 'Nov 20',
    },
  ];

  return {
    tasks,
    taskHistory,
    habits,
    habitLogs,
    notes,
    settings: {
      theme: 'light',
      weekStart: 'Sunday',
      weights: {
        tasks: 45,
        habits: 35,
        consistency: 20,
      },
      notifications: {
        morningBrief: true,
        habitReminders: true,
        eveningReview: false,
      },
    },
  };
}

// Apple iOS 18 SF Symbols-inspired optical icon library
function SFSymbol({ name, size = 18, strokeWidth = 1.9, className = '', filled = false }) {
  const fillOpacity = filled ? '0.2' : '0.12';
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
  };

  switch (name) {
    case 'plus':
      return (
        <svg {...props} strokeWidth={strokeWidth + 0.35}>
          <path d="M12 4.75v14.5M4.75 12h14.5" />
        </svg>
      );
    case 'plus.app':
      return (
        <svg {...props}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="currentColor" fillOpacity={fillOpacity} />
          <path d="M12 8.25v7.5M8.25 12h7.5" />
        </svg>
      );
    case 'square.and.pencil':
      return (
        <svg {...props}>
          <path d="M11 4.5H7.2A3.7 3.7 0 0 0 3.5 8.2v8.6a3.7 3.7 0 0 0 3.7 3.7h8.6a3.7 3.7 0 0 0 3.7-3.7V13" />
          <path
            d="M16.6 3.9a2.1 2.1 0 0 1 3 3L12 14.5l-3.6.9.9-3.6 7.3-7.9Z"
            fill="currentColor"
            fillOpacity={fillOpacity}
          />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...props}>
          <rect x="3.5" y="4.75" width="17" height="15.75" rx="4.2" fill="currentColor" fillOpacity={fillOpacity} />
          <path d="M3.5 9.5h17M8 3.25v3M16 3.25v3" />
          <circle cx="8.5" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="12" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'gearshape':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3.1" fill="currentColor" fillOpacity={fillOpacity} />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.42 1.08H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      );
    case 'flame':
      return (
        <svg {...props}>
          <path
            d="M12.3 3.2c.4 2.7-1.2 4.3-2.5 5.6-1.4 1.4-2.8 2.9-2.8 5.4a5.2 5.2 0 0 0 10.4 0c0-3.2-2.1-5.6-3.7-7.4-.5 1.4-1.4 2.2-2.2 2.4.5-1.9.9-3.9.8-6Z"
            fill="currentColor"
            fillOpacity={fillOpacity}
          />
        </svg>
      );
    case 'pin':
      return (
        <svg {...props}>
          <path
            d="M14.5 4.5 19.5 9.5l-2 2-2.2-.7-3.6 3.6.7 2.6-1.6 1.6-3.2-3.2-3.6 3.6 3.6-3.6-3.2-3.2 1.6-1.6 2.6.7 3.6-3.6-.7-2.2 2-2Z"
            fill="currentColor"
            fillOpacity={fillOpacity}
          />
        </svg>
      );
    case 'magnifyingglass':
      return (
        <svg {...props}>
          <circle cx="10.75" cy="10.75" r="6.25" fill="currentColor" fillOpacity={fillOpacity} />
          <path d="m15.5 15.5 4.5 4.5" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...props}>
          <path d="M4.5 7h15M9.5 7V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3V7" />
          <path
            d="M6.5 7l.8 11.6c.1 1.1 1 1.9 2.1 1.9h5.2c1.1 0 2-.8 2.1-1.9L17.5 7"
            fill="currentColor"
            fillOpacity={fillOpacity}
          />
        </svg>
      );
    case 'pencil':
      return (
        <svg {...props}>
          <path
            d="M15.8 4.2a2.1 2.1 0 0 1 3 3L8.2 17.8l-4 1 1-4L15.8 4.2Z"
            fill="currentColor"
            fillOpacity={fillOpacity}
          />
        </svg>
      );
    case 'chart.bar':
      return (
        <svg {...props}>
          <rect x="4" y="12" width="3.6" height="8" rx="1.2" fill="currentColor" fillOpacity={fillOpacity} />
          <rect x="10.2" y="7.5" width="3.6" height="12.5" rx="1.2" fill="currentColor" fillOpacity={fillOpacity} />
          <rect x="16.4" y="4" width="3.6" height="16" rx="1.2" fill="currentColor" fillOpacity={fillOpacity} />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...props}>
          <path
            d="M12 3.5 13.7 8.3 18.5 10l-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7L12 3.5Z"
            fill="currentColor"
            fillOpacity={fillOpacity}
          />
          <path d="M18.5 15.5v3M17 17h3M5.5 4.5v2.5M4.25 5.75h2.5" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.25" fill="currentColor" fillOpacity={fillOpacity} />
          <path d="M12 7.75V12l2.75 1.75" />
        </svg>
      );
    case 'checkmark':
      return (
        <svg {...props} strokeWidth={strokeWidth + 0.3}>
          <path d="m5.25 12.5 4.25 4.25 9.25-9.5" />
        </svg>
      );
    case 'xmark':
      return (
        <svg {...props} strokeWidth={strokeWidth + 0.2}>
          <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
        </svg>
      );
    case 'chevron.left':
      return (
        <svg {...props}>
          <path d="m14.75 5.75-6.25 6.25 6.25 6.25" />
        </svg>
      );
    case 'chevron.right':
      return (
        <svg {...props}>
          <path d="m9.25 5.75 6.25 6.25-6.25 6.25" />
        </svg>
      );
    case 'chevron.down':
      return (
        <svg {...props}>
          <path d="m5.75 9.25 6.25 6.25 6.25-6.25" />
        </svg>
      );
    case 'square.and.arrow.up':
      return (
        <svg {...props}>
          <path d="M12 3.75v10.5M8.25 7.5 12 3.75l3.75 3.75" />
          <path
            d="M6.5 11.5h-1a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1"
            fill="currentColor"
            fillOpacity={fillOpacity}
          />
        </svg>
      );
    case 'square.and.arrow.down':
      return (
        <svg {...props}>
          <path d="M12 14.25V3.75M8.25 10.5 12 14.25l3.75-3.75" />
          <path
            d="M6.5 11.5h-1a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1"
            fill="currentColor"
            fillOpacity={fillOpacity}
          />
        </svg>
      );
    case 'sun.max':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4.2" fill="currentColor" fillOpacity={fillOpacity} />
          <path d="M12 2.75v2M12 19.25v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2.75 12h2M19.25 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case 'moon.stars':
      return (
        <svg {...props}>
          <path
            d="M19.5 14.6A7.8 7.8 0 0 1 9.4 4.5a7.8 7.8 0 1 0 10.1 10.1Z"
            fill="currentColor"
            fillOpacity={fillOpacity}
          />
          <path d="M17.5 4.5v2.5M16.25 5.75h2.5" />
        </svg>
      );
    case 'circle.lefthalf.filled':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.25" />
          <path d="M12 3.75a8.25 8.25 0 0 0 0 16.5V3.75Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'exclamationmark.circle':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.25" fill="currentColor" fillOpacity={fillOpacity} />
          <path d="M12 8v4.5M12 15.75h.01" />
        </svg>
      );
    default:
      return null;
  }
}

// Bespoke Dual-Layer Duotone Bottom Navigation Icons
function LifeOSNavIcon({ tab, active }) {
  const stroke = active ? '#007AFF' : 'currentColor';
  const fillOpacity = active ? '0.22' : '0.07';

  switch (tab) {
    case 'myday':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="3.5"
            y="4"
            width="17"
            height="16.5"
            rx="5"
            fill={stroke}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth="1.85"
          />
          <circle cx="12" cy="12.2" r="3.1" fill={stroke} fillOpacity={active ? '0.35' : '0.15'} stroke={stroke} strokeWidth="1.75" />
          <path
            d="M12 6.8v1.1M12 16.5v1.1M6.6 12.2h1.1M16.3 12.2h1.1"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'tasks':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="4.8"
            fill={stroke}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth="1.85"
          />
          <path
            d="m8.5 12.2 2.4 2.4 4.8-5"
            stroke={stroke}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'habits':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3.5 18.8 12 12 20.5 5.2 12 12 3.5Z"
            fill={active ? '#10B981' : stroke}
            fillOpacity={active ? '0.22' : '0.08'}
            stroke={active ? '#10B981' : stroke}
            strokeWidth="1.85"
            strokeLinejoin="round"
          />
          <path
            d="M12 8.2 15 12l-3 3.8L9 12l3-3.8Z"
            fill={active ? '#10B981' : stroke}
            fillOpacity={active ? '0.55' : '0.2'}
          />
        </svg>
      );
    case 'progress':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="4.2"
            y="12.5"
            width="3.6"
            height="7.5"
            rx="1.2"
            fill={stroke}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth="1.75"
          />
          <rect
            x="10.2"
            y="8.5"
            width="3.6"
            height="11.5"
            rx="1.2"
            fill={stroke}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth="1.75"
          />
          <rect
            x="16.2"
            y="4.5"
            width="3.6"
            height="15.5"
            rx="1.2"
            fill={stroke}
            fillOpacity={active ? '0.32' : '0.1'}
            stroke={stroke}
            strokeWidth="1.75"
          />
        </svg>
      );
    case 'notes':
    default:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="4.5"
            y="3.5"
            width="15"
            height="17"
            rx="4.2"
            fill={stroke}
            fillOpacity={fillOpacity}
            stroke={stroke}
            strokeWidth="1.85"
          />
          <path
            d="M8.5 8.8h7M8.5 12.3h7M8.5 15.8h4.5"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

// Sculpted iOS Continuous-Squircle Buttons (Zero Capsule Shapes)
function IOSButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  isDark = false,
  type = 'button',
}) {
  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-1.5 text-[12px] rounded-[10px] gap-1.5'
      : size === 'lg'
      ? 'px-4 py-3 text-[14px] rounded-[12px] gap-2'
      : 'px-3.5 py-2 text-[13px] rounded-[11px] gap-1.5';

  const variantClasses = {
    primary:
      'bg-[#007AFF] text-white shadow-[0_3px_10px_rgba(0,122,255,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] hover:bg-[#006EE6]',
    emerald:
      'bg-[#10B981] text-white shadow-[0_3px_10px_rgba(16,185,129,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] hover:bg-[#0EA472]',
    secondary: isDark
      ? 'bg-[#2C2C2E] text-[#F5F5F7] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-[#3A3A3C]'
      : 'bg-white text-[#1D1D1F] border border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-[#F5F5F7]',
    tinted: isDark
      ? 'bg-[#0A84FF]/18 text-[#409CFF] border border-[#0A84FF]/25 hover:bg-[#0A84FF]/25'
      : 'bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20 hover:bg-[#007AFF]/15',
    danger: isDark
      ? 'bg-[#FF453A]/18 text-[#FF6961] border border-[#FF453A]/25 hover:bg-[#FF453A]/25'
      : 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 hover:bg-[#FF3B30]/15',
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-semibold tracking-[-0.01em] transition-all duration-150 active:scale-[0.97] select-none ${sizeClasses} ${variantClasses} ${className}`}
    >
      {icon && <SFSymbol name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

function IOSIconButton({ icon, onClick, isDark, label, active = false, size = 36 }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-[11px] transition-all duration-150 active:scale-[0.94] border ${
        active
          ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-[0_3px_10px_rgba(0,122,255,0.28)]'
          : isDark
          ? 'bg-[#1C1C1E] text-[#E5E5EA] border-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-[#2C2C2E]'
          : 'bg-white text-[#1D1D1F] border-black/[0.07] shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.95)] hover:bg-[#F5F5F7]'
      }`}
    >
      <SFSymbol name={icon} size={17} />
    </button>
  );
}

// 1. Enchanted Liquid-Filled Radial Sunburst Orb (168x168 SVG)
function EnchantedSunburstOrb({
  taskPct,
  habitPct,
  overallPct,
  lifeScore,
  isDark,
  focusMode,
  setFocusMode,
  onOpenProgress,
  tasksDone,
  tasksTotal,
  habitsDone,
  habitsTotal,
}) {
  const modes = ['today', 'tasks', 'habits', 'score'];
  const cycleMode = () => {
    const idx = modes.indexOf(focusMode);
    setFocusMode(modes[(idx + 1) % modes.length]);
  };

  const activeValue =
    focusMode === 'tasks'
      ? taskPct
      : focusMode === 'habits'
      ? habitPct
      : focusMode === 'score'
      ? lifeScore
      : overallPct;

  const activeLabel =
    focusMode === 'tasks'
      ? 'TASKS'
      : focusMode === 'habits'
      ? 'HABITS'
      : focusMode === 'score'
      ? 'SCORE'
      : 'TODAY';

  // Liquid Y position inside r=59.5 chamber (cx=84, cy=84 -> top=24.5, bottom=143.5)
  const clampedPct = Math.max(0, Math.min(100, activeValue));
  const waterY = 143.5 - (clampedPct / 100) * 119;

  // Build 24 radial fan sectors (15 deg each, 2.5 deg gap)
  // Left 12 sectors (indices 12..23 -> 180° to 360° clockwise) = Tasks (Blue)
  // Right 12 sectors (indices 0..11 -> 0° to 180° clockwise) = Habits (Emerald)
  const cx = 84;
  const cy = 84;
  const rInner = 63.5;
  const rOuter = 79.5;
  const filledRightCount = Math.round((habitPct / 100) * 12);
  const filledLeftCount = Math.round((taskPct / 100) * 12);

  const buildSectorPath = (startDeg, endDeg, r1, r2) => {
    const toRad = (deg) => ((deg - 90) * Math.PI) / 180;
    const a1 = toRad(startDeg);
    const a2 = toRad(endDeg);
    const x1 = cx + r1 * Math.cos(a1);
    const y1 = cy + r1 * Math.sin(a1);
    const x2 = cx + r2 * Math.cos(a1);
    const y2 = cy + r2 * Math.sin(a1);
    const x3 = cx + r2 * Math.cos(a2);
    const y3 = cy + r2 * Math.sin(a2);
    const x4 = cx + r1 * Math.cos(a2);
    const y4 = cy + r1 * Math.sin(a2);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} A ${r2} ${r2} 0 0 1 ${x3.toFixed(2)} ${y3.toFixed(2)} L ${x4.toFixed(2)} ${y4.toFixed(2)} A ${r1} ${r1} 0 0 0 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
  };

  const sectors = [];
  for (let i = 0; i < 24; i++) {
    const startDeg = i * 15 + 1.25;
    const endDeg = (i + 1) * 15 - 1.25;
    const isRight = i < 12; // Habits (0..11 clockwise from top)
    let isFilled = false;
    let dimmed = false;
    if (isRight) {
      isFilled = i < filledRightCount;
      dimmed = focusMode === 'tasks';
    } else {
      const leftStep = i - 12; // 0 is bottom-left (180°), 11 is top-left (345°)
      isFilled = leftStep < filledLeftCount;
      dimmed = focusMode === 'habits';
    }
    sectors.push({
      key: i,
      d: buildSectorPath(startDeg, endDeg, rInner, rOuter),
      isRight,
      isFilled,
      dimmed,
    });
  }

  return (
    <div
      className={`p-4 rounded-[18px] border transition-colors ${
        isDark
          ? 'bg-[#1C1C1E] border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
          : 'bg-white border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Left: 168x168 Enchanted Liquid Sunburst Orb */}
        <button
          type="button"
          onClick={cycleMode}
          aria-label="Cycle daily progress focus"
          className="relative shrink-0 w-[168px] h-[168px] flex items-center justify-center active:scale-[0.98] transition-transform focus:outline-none"
        >
          <svg width="168" height="168" viewBox="0 0 168 168" className="overflow-visible">
            <defs>
              <linearGradient id="sunburstBlue" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#007AFF" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
              <linearGradient id="sunburstEmerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
              <linearGradient id="liquidFrontGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.92" />
                <stop offset="55%" stopColor="#007AFF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="liquidHabitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.92" />
                <stop offset="55%" stopColor="#10B981" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#059669" stopOpacity="1" />
              </linearGradient>
              <clipPath id="orbLiquidClip">
                <circle cx="84" cy="84" r="59.5" />
              </clipPath>
            </defs>

            {/* 24 Sculpted Jewel-Cut Radial Fan Sectors */}
            {sectors.map((s) => (
              <path
                key={s.key}
                d={s.d}
                fill={
                  s.isFilled
                    ? s.isRight
                      ? 'url(#sunburstEmerald)'
                      : 'url(#sunburstBlue)'
                    : isDark
                    ? 'rgba(255,255,255,0.07)'
                    : 'rgba(0,0,0,0.055)'
                }
                opacity={s.dimmed ? 0.25 : 1}
                className="transition-all duration-300"
              />
            ))}

            {/* Crystalline Chamber Backdrop */}
            <circle
              cx="84"
              cy="84"
              r="60"
              fill={isDark ? '#121214' : '#F2F5F9'}
              stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)'}
              strokeWidth="1.2"
            />

            {/* Sinusoidal Dual Liquid Waves Inside Clipped Chamber */}
            <g clipPath="url(#orbLiquidClip)">
              {/* Back Emerald Translucent Wave */}
              <path
                d={`M 20 ${waterY - 2} Q 52 ${waterY - 10}, 84 ${waterY - 2} T 148 ${waterY - 2} L 148 150 L 20 150 Z`}
                fill="#10B981"
                fillOpacity={focusMode === 'tasks' ? '0.15' : '0.42'}
              />
              {/* Front Luminous Wave */}
              <path
                d={`M 20 ${waterY + 1} Q 52 ${waterY + 8}, 84 ${waterY + 1} T 148 ${waterY + 1} L 148 150 L 20 150 Z`}
                fill={focusMode === 'habits' ? 'url(#liquidHabitGrad)' : 'url(#liquidFrontGrad)'}
              />
              {/* Crisp 1.5px White Meniscus Crest */}
              <path
                d={`M 20 ${waterY + 1} Q 52 ${waterY + 8}, 84 ${waterY + 1} T 148 ${waterY + 1}`}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeOpacity="0.72"
              />
              {/* Rising Specular Bubbles */}
              {clampedPct > 18 && (
                <>
                  <circle cx="62" cy={Math.min(134, waterY + 22)} r="2.2" fill="#FFFFFF" fillOpacity="0.35" />
                  <circle cx="104" cy={Math.min(136, waterY + 30)} r="1.7" fill="#FFFFFF" fillOpacity="0.3" />
                  <circle cx="74" cy={Math.min(138, waterY + 42)} r="2.6" fill="#FFFFFF" fillOpacity="0.24" />
                  <circle cx="96" cy={Math.min(132, waterY + 14)} r="1.4" fill="#FFFFFF" fillOpacity="0.4" />
                </>
              )}
              {/* Top Glass Crescent Reflection */}
              <path
                d="M 42 52 A 48 48 0 0 1 126 52 A 54 42 0 0 0 42 52 Z"
                fill="#FFFFFF"
                fillOpacity={isDark ? '0.08' : '0.45'}
              />
            </g>

            {/* Interactive Center Medallion */}
            <circle
              cx="84"
              cy="84"
              r="32"
              fill={isDark ? 'rgba(28,28,30,0.92)' : 'rgba(255,255,255,0.94)'}
              stroke={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)'}
              strokeWidth="1.2"
            />
            <text
              x="84"
              y="84"
              textAnchor="middle"
              dominantBaseline="central"
              fill={isDark ? '#FFFFFF' : '#1D1D1F'}
              fontSize="21"
              fontWeight="700"
              letterSpacing="-0.03em"
            >
              {focusMode === 'score' ? activeValue : `${activeValue}%`}
            </text>
            <text
              x="84"
              y="101"
              textAnchor="middle"
              fill={
                focusMode === 'habits'
                  ? '#10B981'
                  : focusMode === 'tasks' || focusMode === 'score'
                  ? '#007AFF'
                  : isDark
                  ? '#8E8E93'
                  : '#6E6E73'
              }
              fontSize="8.5"
              fontWeight="700"
              letterSpacing="0.09em"
            >
              {activeLabel}
            </text>
          </svg>
        </button>

        {/* Right: Precision 10-Tile Rectangular Micro-Block Meters & Life Score Link */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Tasks Meter */}
          <div
            onClick={() => setFocusMode(focusMode === 'tasks' ? 'today' : 'tasks')}
            className={`cursor-pointer p-2 rounded-[11px] transition-colors ${
              focusMode === 'tasks'
                ? isDark
                  ? 'bg-[#007AFF]/15'
                  : 'bg-[#007AFF]/[0.07]'
                : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[2px] bg-[#007AFF]" />
                <span className={`text-[12px] font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#1D1D1F]'}`}>
                  Tasks
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] tabular-nums ${isDark ? 'text-[#8E8E93]' : 'text-[#6E6E73]'}`}>
                  {tasksDone}/{tasksTotal}
                </span>
                <span className="text-[11px] font-bold tabular-nums text-[#007AFF]">{taskPct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, idx) => {
                const active = idx < Math.round(taskPct / 10);
                return (
                  <div
                    key={idx}
                    className={`h-2 rounded-[2px] transition-all ${
                      active ? 'bg-[#007AFF]' : isDark ? 'bg-white/10' : 'bg-black/[0.07]'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Habits Meter */}
          <div
            onClick={() => setFocusMode(focusMode === 'habits' ? 'today' : 'habits')}
            className={`cursor-pointer p-2 rounded-[11px] transition-colors ${
              focusMode === 'habits'
                ? isDark
                  ? 'bg-[#10B981]/15'
                  : 'bg-[#10B981]/[0.08]'
                : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-[2px] bg-[#10B981]" />
                <span className={`text-[12px] font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#1D1D1F]'}`}>
                  Habits
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] tabular-nums ${isDark ? 'text-[#8E8E93]' : 'text-[#6E6E73]'}`}>
                  {habitsDone}/{habitsTotal}
                </span>
                <span className="text-[11px] font-bold tabular-nums text-[#10B981]">{habitPct}%</span>
              </div>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, idx) => {
                const active = idx < Math.round(habitPct / 10);
                return (
                  <div
                    key={idx}
                    className={`h-2 rounded-[2px] transition-all ${
                      active ? 'bg-[#10B981]' : isDark ? 'bg-white/10' : 'bg-black/[0.07]'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Life Score Link */}
          <button
            type="button"
            onClick={onOpenProgress}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[10px] border text-left transition-all active:scale-[0.98] ${
              isDark
                ? 'bg-[#2C2C2E]/70 border-white/[0.07] hover:bg-[#2C2C2E]'
                : 'bg-[#F5F5F7] border-black/[0.05] hover:bg-[#ECECEE]'
            }`}
          >
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#007AFF]">
              <SFSymbol name="sparkles" size={13} />
              Life Score
            </span>
            <span className="inline-flex items-center gap-1 text-[12px] font-bold tabular-nums">
              <span className={isDark ? 'text-white' : 'text-[#1D1D1F]'}>{lifeScore}</span>
              <span className={isDark ? 'text-[#8E8E93]' : 'text-[#8E8E93]'}>/ 100</span>
              <SFSymbol name="chevron.right" size={12} className="text-[#8E8E93]" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. Mini Liquid-Filled Orb (38x38 SVG) for This Week (Sun - Sat)
function MiniLiquidOrb({ pct, score, isFuture, isSelected, isDark, uid }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const y = 34 - (clamped / 100) * 30;

  return (
    <svg width="38" height="38" viewBox="0 0 38 38">
      <defs>
        <linearGradient id={`miniGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#007AFF" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <clipPath id={`miniClip-${uid}`}>
          <circle cx="19" cy="19" r="15" />
        </clipPath>
      </defs>

      <circle
        cx="19"
        cy="19"
        r="16"
        fill={isDark ? '#141416' : '#F3F5F8'}
        stroke={
          isSelected
            ? '#007AFF'
            : isFuture
            ? isDark
              ? 'rgba(255,255,255,0.14)'
              : 'rgba(0,0,0,0.12)'
            : isDark
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.07)'
        }
        strokeWidth={isSelected ? '1.8' : '1.1'}
        strokeDasharray={isFuture ? '2.5 2.5' : undefined}
      />

      {!isFuture ? (
        <g clipPath={`url(#miniClip-${uid})`}>
          <path
            d={`M 2 ${y} Q 10.5 ${y - 3.5}, 19 ${y} T 36 ${y} L 36 36 L 2 36 Z`}
            fill={`url(#miniGrad-${uid})`}
            fillOpacity="0.88"
          />
          <path
            d={`M 2 ${y} Q 10.5 ${y - 3.5}, 19 ${y} T 36 ${y}`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeOpacity="0.65"
          />
        </g>
      ) : (
        <circle cx="19" cy="19" r="2.2" fill={isDark ? '#636366' : '#AEAEB2'} />
      )}

      {!isFuture && (
        <text
          x="19"
          y="19.5"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="9.5"
          fontWeight="700"
          fill={clamped > 48 ? '#FFFFFF' : isDark ? '#F5F5F7' : '#1D1D1F'}
        >
          {score}
        </text>
      )}
    </svg>
  );
}

// 3. 150° Emerald Crystalline Fan Crown & Diamond Facet Matrix (Habits Tab)
function EmeraldCrystallineFanCrown({ habitsToday, completedIds, onToggleHabit, isDark }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const total = Math.max(1, habitsToday.length);
  const doneCount = habitsToday.filter((h) => completedIds.includes(h.id)).length;
  const pct = Math.round((doneCount / total) * 100);

  // Spread petals across 150° (-75° to +75°)
  const angles = habitsToday.map((_, idx) => {
    if (habitsToday.length === 1) return 0;
    return -75 + (idx / (habitsToday.length - 1)) * 150;
  });

  const activeHabit = hoveredIdx !== null ? habitsToday[hoveredIdx] : null;

  return (
    <div
      className={`p-4 rounded-[18px] border ${
        isDark
          ? 'bg-[#1C1C1E] border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
          : 'bg-white border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <h3 className={`text-[15px] font-bold tracking-[-0.01em] ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
            Daily Habit Consistency
          </h3>
          <p className={`text-[11.5px] mt-0.5 ${isDark ? 'text-[#8E8E93]' : 'text-[#6E6E73]'}`}>
            {activeHabit
              ? `${activeHabit.name} · ${completedIds.includes(activeHabit.id) ? 'Completed' : 'Tap to complete'}`
              : 'Tap any crystal facet to log today’s habit'}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-[6px] text-[12px] font-bold tabular-nums bg-[#10B981]/12 text-[#10B981] border border-[#10B981]/25">
          {pct}%
        </span>
      </div>

      {/* 150° Emerald Crystalline Lotus / Fan Crown SVG (136x84) */}
      <div className="flex flex-col items-center my-2">
        <svg width="210" height="114" viewBox="0 0 136 84" className="overflow-visible">
          <defs>
            <linearGradient id="crystalEmeraldGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="55%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
            <filter id="emeraldFacetGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#10B981" floodOpacity="0.38" />
            </filter>
          </defs>

          {/* 150° Architectural Hairline Guide Arc */}
          <path
            d="M 10.5 56.6 A 59.5 59.5 0 0 1 125.5 56.6"
            fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)'}
            strokeWidth="1"
            strokeDasharray="2.5 2.5"
          />

          {/* Sculpted Diamond-Lanceolate Petal Facets */}
          {habitsToday.map((habit, idx) => {
            const angle = angles[idx];
            const isDone = completedIds.includes(habit.id);
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={habit.id}
                transform={`translate(68, 72) rotate(${angle}) scale(${isHovered ? 1.07 : 1})`}
                onClick={() => onToggleHabit(habit.id)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-transform duration-150"
                filter={isDone ? 'url(#emeraldFacetGlow)' : undefined}
              >
                <path
                  d="M 0 -7 L 6.5 -34 L 0 -61 L -6.5 -34 Z"
                  fill={
                    isDone
                      ? 'url(#crystalEmeraldGrad)'
                      : isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.06)'
                  }
                  stroke={isDone ? '#6EE7B7' : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}
                  strokeWidth="0.7"
                />
                {/* Crisp Left-Facet Specular Highlight */}
                {isDone && (
                  <path
                    d="M 0 -7 L 0 -61 L -6.5 -34 Z"
                    fill="#FFFFFF"
                    fillOpacity="0.22"
                  />
                )}
              </g>
            );
          })}

          {/* Emerald & Silver Jewel Anchor Diamond at (68, 72) */}
          <g transform="translate(68, 72) rotate(45)">
            <rect
              x="-5.5"
              y="-5.5"
              width="11"
              height="11"
              rx="2"
              fill={isDark ? '#1C1C1E' : '#FFFFFF'}
              stroke="#10B981"
              strokeWidth="1.6"
            />
            <rect x="-2.4" y="-2.4" width="4.8" height="4.8" rx="1" fill="#10B981" />
          </g>
        </svg>

        {/* Interactive Diamond Facet Matrix */}
        <div className="flex items-center justify-center gap-3 mt-1">
          {habitsToday.map((habit, idx) => {
            const isDone = completedIds.includes(habit.id);
            return (
              <button
                key={habit.id}
                type="button"
                onClick={() => onToggleHabit(habit.id)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                title={habit.name}
                className={`w-[13px] h-[13px] rotate-45 rounded-[2.5px] transition-all duration-150 active:scale-90 ${
                  isDone
                    ? 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.45)] border border-[#6EE7B7]'
                    : isDark
                    ? 'bg-white/10 border border-white/15 hover:bg-white/20'
                    : 'bg-black/[0.06] border border-black/10 hover:bg-black/15'
                }`}
              />
            );
          })}
        </div>
      </div>

      <p className={`text-[11px] text-center mt-2 ${isDark ? 'text-[#8E8E93]' : 'text-[#6E6E73]'}`}>
        Streaks calculate on scheduled days only. Unscheduled rest days never reset streaks.
      </p>
    </div>
  );
}

// 4. Enchanted Liquid Semi-Orb Dome Gauge (228x132 SVG) on Progress Tab
function LiquidSemiOrbDomeGauge({ score, taskScore, habitScore, consistencyScore, weights, isDark }) {
  const clamped = Math.max(0, Math.min(100, score));
  // Dome inner radius r=76 centered at (114, 114): top=38, bottom=114
  const domeWaterY = 114 - (clamped / 100) * 76;
  const cx = 114;
  const cy = 114;
  const r1 = 81;
  const r2 = 97;
  const filledPetals = Math.round((clamped / 100) * 20);

  const buildSector = (startDeg, endDeg) => {
    const toRad = (deg) => ((deg - 180) * Math.PI) / 180;
    const a1 = toRad(startDeg);
    const a2 = toRad(endDeg);
    const x1 = cx + r1 * Math.cos(a1);
    const y1 = cy + r1 * Math.sin(a1);
    const x2 = cx + r2 * Math.cos(a1);
    const y2 = cy + r2 * Math.sin(a1);
    const x3 = cx + r2 * Math.cos(a2);
    const y3 = cy + r2 * Math.sin(a2);
    const x4 = cx + r1 * Math.cos(a2);
    const y4 = cy + r1 * Math.sin(a2);
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} A ${r2} ${r2} 0 0 1 ${x3.toFixed(2)} ${y3.toFixed(2)} L ${x4.toFixed(2)} ${y4.toFixed(2)} A ${r1} ${r1} 0 0 0 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
  };

  const statusLabel = score >= 85 ? 'Peak Momentum' : score >= 65 ? 'Steady Rhythm' : 'Rebuilding';

  return (
    <div
      className={`p-4 rounded-[18px] border ${
        isDark
          ? 'bg-[#1C1C1E] border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
          : 'bg-white border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[11px] font-bold tracking-[0.06em] uppercase ${isDark ? 'text-[#8E8E93]' : 'text-[#6E6E73]'}`}>
          COMPOSITE LIFE SCORE
        </span>
        <span className="px-2.5 py-0.5 rounded-[6px] text-[11px] font-semibold bg-[#007AFF]/12 text-[#007AFF]">
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <svg width="228" height="132" viewBox="0 0 228 132">
          <defs>
            <linearGradient id="domeSectorGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#007AFF" />
              <stop offset="50%" stopColor="#0EA5E9" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="domeLiquidGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#007AFF" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.95" />
            </linearGradient>
            <clipPath id="domeClip">
              <path d="M 38 114 A 76 76 0 0 1 190 114 Z" />
            </clipPath>
          </defs>

          {/* 20 Radial Gradient-Filled Fan Sectors */}
          {Array.from({ length: 20 }, (_, i) => {
            const startDeg = i * 9 + 0.8;
            const endDeg = (i + 1) * 9 - 0.8;
            const isFilled = i < filledPetals;
            return (
              <path
                key={i}
                d={buildSector(startDeg, endDeg)}
                fill={
                  isFilled
                    ? 'url(#domeSectorGrad)'
                    : isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)'
                }
              />
            );
          })}

          {/* Inner Semi-Orb Chamber */}
          <path
            d="M 38 114 A 76 76 0 0 1 190 114 Z"
            fill={isDark ? '#121214' : '#F3F6FA'}
            stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)'}
            strokeWidth="1.2"
          />

          {/* Sinusoidal Liquid Wave Dome Fill */}
          <g clipPath="url(#domeClip)">
            <path
              d={`M 34 ${domeWaterY} Q 74 ${domeWaterY - 6}, 114 ${domeWaterY} T 194 ${domeWaterY} L 194 120 L 34 120 Z`}
              fill="url(#domeLiquidGrad)"
            />
            <path
              d={`M 34 ${domeWaterY} Q 74 ${domeWaterY - 6}, 114 ${domeWaterY} T 194 ${domeWaterY}`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
          </g>

          {/* Center Readout Badge */}
          <rect
            x="78"
            y="72"
            width="72"
            height="38"
            rx="10"
            fill={isDark ? 'rgba(28,28,30,0.92)' : 'rgba(255,255,255,0.94)'}
            stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}
            strokeWidth="1"
          />
          <text
            x="114"
            y="91"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fill={isDark ? '#FFFFFF' : '#1D1D1F'}
          >
            {score}
          </text>
          <text
            x="114"
            y="103"
            textAnchor="middle"
            fontSize="8.5"
            fontWeight="700"
            letterSpacing="0.08em"
            fill="#8E8E93"
          >
            OUT OF 100
          </text>
        </svg>
      </div>

      {/* 3 Weighted Pillar Cards */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        {[
          { label: 'Tasks', val: taskScore, weight: weights.tasks, color: '#007AFF' },
          { label: 'Habits', val: habitScore, weight: weights.habits, color: '#10B981' },
          { label: 'Consistency', val: consistencyScore, weight: weights.consistency, color: '#6366F1' },
        ].map((p) => (
          <div
            key={p.label}
            className={`p-2.5 rounded-[12px] border ${
              isDark ? 'bg-[#2C2C2E]/60 border-white/[0.06]' : 'bg-[#F5F5F7] border-black/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between text-[10.5px] font-semibold">
              <span style={{ color: p.color }}>{p.label}</span>
              <span className="text-[#8E8E93]">{p.weight}%</span>
            </div>
            <div className={`text-[16px] font-bold tabular-nums mt-0.5 ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
              {p.val}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LifeOS() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.tasks && parsed.habits && parsed.settings) {
          return parsed;
        }
      }
    } catch {
      // ignore storage read errors
    }
    return createSeedData();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage write errors
    }
  }, [data]);

  const [systemDark, setSystemDark] = useState(() => {
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => setSystemDark(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      return undefined;
    }
  }, []);

  const isDark =
    data.settings.theme === 'dark' || (data.settings.theme === 'system' && systemDark);

  const [activeTab, setActiveTab] = useState('myday');
  const [focusMode, setFocusMode] = useState('today');
  const [selectedWeekDay, setSelectedWeekDay] = useState(ANCHOR_TODAY);
  const [taskFilter, setTaskFilter] = useState('All');
  const [taskSearch, setTaskSearch] = useState('');
  const [showTaskAnalytics, setShowTaskAnalytics] = useState(false);

  const [progressRange, setProgressRange] = useState('Weekly');
  const [selectedPerfDay, setSelectedPerfDay] = useState(ANCHOR_TODAY);
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState(null);

  const [noteFilter, setNoteFilter] = useState('All');
  const [editingNoteId, setEditingNoteId] = useState(null);

  // Modals & Sheets
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarView, setCalendarView] = useState('Month');
  const [calendarSelectedDate, setCalendarSelectedDate] = useState(ANCHOR_TODAY);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [taskModal, setTaskModal] = useState({ open: false, task: null });
  const [habitModal, setHabitModal] = useState({ open: false, habit: null });
  const [noteModal, setNoteModal] = useState({ open: false, note: null });
  const [toastMsg, setToastMsg] = useState('');

  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2400);
  };

  // Core Metrics Calculation
  const todayDayName = getDayShortName(ANCHOR_TODAY);
  const todayTasks = useMemo(
    () => data.tasks.filter((t) => t.dueDate === ANCHOR_TODAY),
    [data.tasks]
  );
  const overdueTasks = useMemo(
    () => data.tasks.filter((t) => !t.completed && t.dueDate < ANCHOR_TODAY),
    [data.tasks]
  );
  const todayHabits = useMemo(
    () => data.habits.filter((h) => h.days.includes(todayDayName)),
    [data.habits, todayDayName]
  );
  const todayHabitDoneIds = data.habitLogs[ANCHOR_TODAY] || [];

  const tasksDoneCount = todayTasks.filter((t) => t.completed).length;
  const tasksLeftCount = todayTasks.filter((t) => !t.completed).length;
  const taskPct = todayTasks.length ? Math.round((tasksDoneCount / todayTasks.length) * 100) : 100;

  const habitsDoneCount = todayHabits.filter((h) => todayHabitDoneIds.includes(h.id)).length;
  const habitPct = todayHabits.length ? Math.round((habitsDoneCount / todayHabits.length) * 100) : 100;

  const overallPct = Math.round((taskPct + habitPct) / 2);

  // 7-day consistency
  const weekDates = useMemo(
    () => getWeekDates(ANCHOR_TODAY, data.settings.weekStart),
    [data.settings.weekStart]
  );

  const elapsedWeekDates = useMemo(
    () => weekDates.filter((d) => d <= ANCHOR_TODAY),
    [weekDates]
  );

  const getDayMetrics = (dateStr) => {
    if (dateStr > ANCHOR_TODAY) {
      const scheduledTasks = data.tasks.filter((t) => t.dueDate === dateStr).length;
      const dName = getDayShortName(dateStr);
      const scheduledHabits = data.habits.filter((h) => h.days.includes(dName)).length;
      return {
        isFuture: true,
        taskPct: 0,
        habitPct: 0,
        combinedPct: 0,
        score: 0,
        scheduledTasks,
        scheduledHabits,
      };
    }

    let tPct = 0;
    if (dateStr === ANCHOR_TODAY) {
      tPct = taskPct;
    } else {
      const explicitTasks = data.tasks.filter((t) => t.dueDate === dateStr);
      if (explicitTasks.length > 0) {
        tPct = Math.round(
          (explicitTasks.filter((t) => t.completed).length / explicitTasks.length) * 100
        );
      } else {
        tPct = data.taskHistory[dateStr] ?? 80;
      }
    }

    const dName = getDayShortName(dateStr);
    const schedHabits = data.habits.filter((h) => h.days.includes(dName));
    const logged = data.habitLogs[dateStr] || [];
    const hPct =
      schedHabits.length > 0
        ? Math.round((schedHabits.filter((h) => logged.includes(h.id)).length / schedHabits.length) * 100)
        : 100;

    const combinedPct = Math.round((tPct + hPct) / 2);
    const w = data.settings.weights;
    const score = Math.round((tPct * w.tasks + hPct * w.habits + combinedPct * w.consistency) / 100);

    return {
      isFuture: false,
      taskPct: tPct,
      habitPct: hPct,
      combinedPct,
      score,
      scheduledTasks: 0,
      scheduledHabits: schedHabits.length,
    };
  };

  const consistencyScore = useMemo(() => {
    if (!elapsedWeekDates.length) return 100;
    const activeDays = elapsedWeekDates.filter((d) => getDayMetrics(d).combinedPct >= 50).length;
    return Math.round((activeDays / elapsedWeekDates.length) * 100);
  }, [elapsedWeekDates, data]);

  const lifeScore = useMemo(() => {
    const w = data.settings.weights;
    return Math.round((taskPct * w.tasks + habitPct * w.habits + consistencyScore * w.consistency) / 100);
  }, [taskPct, habitPct, consistencyScore, data.settings.weights]);

  // CRUD Handlers
  const toggleTask = (taskId) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: !t.completed,
              completedDate: !t.completed ? ANCHOR_TODAY : null,
            }
          : t
      ),
    }));
  };

  const saveTask = (taskPayload) => {
    setData((prev) => {
      const exists = prev.tasks.some((t) => t.id === taskPayload.id);
      return {
        ...prev,
        tasks: exists
          ? prev.tasks.map((t) => (t.id === taskPayload.id ? taskPayload : t))
          : [taskPayload, ...prev.tasks],
      };
    });
    setTaskModal({ open: false, task: null });
    showToast(taskPayload.id ? 'Task saved' : 'Task created');
  };

  const deleteTask = (taskId) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
    setTaskModal({ open: false, task: null });
    showToast('Task deleted');
  };

  const toggleHabitForDate = (habitId, dateStr = ANCHOR_TODAY) => {
    setData((prev) => {
      const current = prev.habitLogs[dateStr] || [];
      const next = current.includes(habitId)
        ? current.filter((id) => id !== habitId)
        : [...current, habitId];
      return {
        ...prev,
        habitLogs: {
          ...prev.habitLogs,
          [dateStr]: next,
        },
      };
    });
  };

  const saveHabit = (habitPayload) => {
    setData((prev) => {
      const exists = prev.habits.some((h) => h.id === habitPayload.id);
      return {
        ...prev,
        habits: exists
          ? prev.habits.map((h) => (h.id === habitPayload.id ? habitPayload : h))
          : [...prev.habits, habitPayload],
      };
    });
    setHabitModal({ open: false, habit: null });
    showToast('Habit saved');
  };

  const deleteHabit = (habitId) => {
    setData((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== habitId),
    }));
    setHabitModal({ open: false, habit: null });
    showToast('Habit removed');
  };

  const saveNote = (notePayload) => {
    setData((prev) => {
      const exists = prev.notes.some((n) => n.id === notePayload.id);
      return {
        ...prev,
        notes: exists
          ? prev.notes.map((n) => (n.id === notePayload.id ? notePayload : n))
          : [notePayload, ...prev.notes],
      };
    });
    setNoteModal({ open: false, note: null });
    showToast('Note saved');
  };

  const togglePinNote = (noteId) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n)),
    }));
  };

  const deleteNote = (noteId) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== noteId),
    }));
    if (editingNoteId === noteId) setEditingNoteId(null);
    showToast('Note deleted');
  };

  // Habit Streak Calculation (scheduled days only)
  const getHabitStreak = (habit) => {
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = addDays(ANCHOR_TODAY, -i);
      const dName = getDayShortName(d);
      if (!habit.days.includes(dName)) continue;
      const done = (data.habitLogs[d] || []).includes(habit.id);
      if (done) {
        streak++;
      } else if (i === 0) {
        continue; // Today still in progress doesn't break streak
      } else {
        break;
      }
    }
    return streak;
  };

  // Today's Chronological Schedule (Habits + Tasks)
  const todayScheduleItems = useMemo(() => {
    const habitItems = todayHabits.map((h) => ({
      id: `sched-h-${h.id}`,
      rawId: h.id,
      type: 'habit',
      title: h.name,
      time: h.time || '08:00',
      subtitle: `${h.category} · Habit`,
      completed: todayHabitDoneIds.includes(h.id),
      accent: '#10B981',
    }));

    const taskItems = todayTasks.map((t) => ({
      id: `sched-t-${t.id}`,
      rawId: t.id,
      type: 'task',
      title: t.title,
      time: t.time || '12:00',
      subtitle: t.category,
      priority: t.priority,
      completed: t.completed,
      accent: '#007AFF',
      raw: t,
    }));

    return [...habitItems, ...taskItems].sort((a, b) => a.time.localeCompare(b.time));
  }, [todayHabits, todayHabitDoneIds, todayTasks]);

  // 30-day heatmap array (Sun-aligned 30 days)
  const heatmapDays = useMemo(() => {
    return Array.from({ length: 30 }, (_, idx) => {
      const d = addDays(ANCHOR_TODAY, -(29 - idx));
      const m = getDayMetrics(d);
      return { date: d, ...m };
    });
  }, [data]);

  // Export & Import JSON
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-backup-${ANCHOR_TODAY}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exported');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed && parsed.tasks && parsed.habits) {
          setData(parsed);
          showToast('Backup restored');
        } else {
          showToast('Invalid backup file');
        }
      } catch {
        showToast('Could not parse JSON');
      }
    };
    reader.readAsText(file);
  };

  const selectedDayInfo = getDayMetrics(selectedWeekDay);

  return (
    <div className="min-h-[100dvh] w-full bg-[#09090B] flex items-center justify-center p-0 font-sans">
      {/* Mobile Device Frame */}
      <div
        className={`relative w-full max-w-none h-[100dvh] min-h-[100dvh] sm:h-[100dvh] sm:rounded-none overflow-hidden flex flex-col border-0 transition-colors ${
          isDark
            ? 'bg-[#000000] text-[#F5F5F7] border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.85)]'
            : 'bg-[#F5F5F7] text-[#1D1D1F] border-black/15 shadow-[0_24px_80px_rgba(0,0,0,0.45)]'
        }`}
      >
        {/* Toast Feedback */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-[10px] bg-[#1C1C1E] text-white text-[12px] font-semibold shadow-lg border border-white/15">
            {toastMsg}
          </div>
        )}

        {/* Main Scrollable Viewport */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-[calc(112px+env(safe-area-inset-bottom))] px-[clamp(14px,4vw,20px)] pt-[calc(16px+env(safe-area-inset-top))]">
          {/* ==================== TAB 1: MY DAY ==================== */}
          {activeTab === 'myday' && (
            <div className="space-y-4">
              {/* Top Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-[11px] font-bold tracking-[0.07em] uppercase ${isDark ? 'text-[#8E8E93]' : 'text-[#6E6E73]'}`}>
                    WEDNESDAY, NOV 25
                  </p>
                  <h1 className={`text-[26px] font-bold tracking-[-0.025em] leading-tight mt-0.5 ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
                    Good Afternoon
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <IOSIconButton
                    icon="calendar"
                    label="Open Calendar"
                    isDark={isDark}
                    onClick={() => setCalendarOpen(true)}
                  />
                  <IOSIconButton
                    icon="gearshape"
                    label="Open Settings"
                    isDark={isDark}
                    onClick={() => setSettingsOpen(true)}
                  />
                </div>
              </div>

              {/* 4-Tile Bento Summary Strip */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    label: 'Done',
                    value: tasksDoneCount,
                    color: '#007AFF',
                    icon: 'checkmark',
                    onClick: () => {
                      setTaskFilter('Completed');
                      setActiveTab('tasks');
                    },
                  },
                  {
                    label: 'Left',
                    value: tasksLeftCount,
                    color: isDark ? '#F5F5F7' : '#1D1D1F',
                    icon: 'clock',
                    onClick: () => {
                      setTaskFilter('Today');
                      setActiveTab('tasks');
                    },
                  },
                  {
                    label: 'Overdue',
                    value: overdueTasks.length,
                    color: overdueTasks.length > 0 ? '#FF3B30' : '#8E8E93',
                    icon: 'exclamationmark.circle',
                    highlight: overdueTasks.length > 0,
                    onClick: () => {
                      setTaskFilter('Overdue');
                      setActiveTab('tasks');
                    },
                  },
                  {
                    label: 'Habits',
                    value: `${habitsDoneCount}/${todayHabits.length}`,
                    color: '#10B981',
                    icon: 'flame',
                    onClick: () => setActiveTab('habits'),
                  },
                ].map((tile) => (
                  <button
                    key={tile.label}
                    type="button"
                    onClick={tile.onClick}
                    className={`p-2.5 rounded-[14px] border text-left transition-all active:scale-[0.96] ${
                      tile.highlight
                        ? isDark
                          ? 'bg-[#FF453A]/12 border-[#FF453A]/30'
                          : 'bg-[#FF3B30]/[0.06] border-[#FF3B30]/25'
                        : isDark
                        ? 'bg-[#1C1C1E] border-white/[0.08]'
                        : 'bg-white border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[17px] font-bold tabular-nums tracking-[-0.02em]"
                        style={{ color: tile.color }}
                      >
                        {tile.value}
                      </span>
                      <span style={{ color: tile.color }}>
                        <SFSymbol name={tile.icon} size={13} />
                      </span>
                    </div>
                    <div className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-[#8E8E93]' : 'text-[#6E6E73]'}`}>
                      {tile.label}
                    </div>
                  </button>
                ))}
              </div>

              {/* Hero Enchanted Liquid-Filled Radial Sunburst Orb */}
              <EnchantedSunburstOrb
                taskPct={taskPct}
                habitPct={habitPct}
                overallPct={overallPct}
                lifeScore={lifeScore}
                isDark={isDark}
                focusMode={focusMode}
                setFocusMode={setFocusMode}
                onOpenProgress={() => setActiveTab('progress')}
                tasksDone={tasksDoneCount}
                tasksTotal={todayTasks.length}
                habitsDone={habitsDoneCount}
                habitsTotal={todayHabits.length}
              />

              {/* Sunday-First Weekly Momentum Strip */}
              <div
                className={`p-3.5 rounded-[18px] border ${
                  isDark
                    ? 'bg-[#1C1C1E] border-white/[0.08]'
                    : 'bg-white border-black/[0.06] shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-[13.5px] font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
                    This Week ({data.settings.weekStart === 'Sunday' ? 'Sun – Sat' : 'Mon – Sun'})
                  </span>
                  <div className="flex items-center gap-2.5 text-[10.5px] font-semibold">
                    <span className="inline-flex items-center gap-1 text-[#007AFF]">
                      <span className="w-1.5 h-1.5 rounded-[1.5px] bg-[#007AFF]" />
                      Tasks
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#10B981]">
                      <span className="w-1.5 h-1.5 rounded-[1.5px] bg-[#10B981]" />
                      Habits
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {weekDates.map((dStr) => {
                    const m = getDayMetrics(dStr);
                    const isSelected = dStr === selectedWeekDay;
                    const isToday = dStr === ANCHOR_TODAY;
                    const letter = getDayShortName(dStr).charAt(0);
                    return (
                      <button
                        key={dStr}
                        type="button"
                        onClick={() => setSelectedWeekDay(dStr)}
                        className={`flex flex-col items-center py-1.5 rounded-[12px] transition-all ${
                          isSelected
                            ? isDark
                              ? 'bg-[#0A84FF]/18 border border-[#0A84FF]/35'
                              : 'bg-[#007AFF]/[0.08] border border-[#007AFF]/25'
                            : 'border border-transparent'
                        }`}
                      >
                        <span
                          className={`text-[10.5px] font-bold mb-1 ${
                            isToday
                              ? 'text-[#007AFF]'
                              : isDark
                              ? 'text-[#8E8E93]'
                              : 'text-[#6E6E73]'
                          }`}
                        >
                          {letter}
                        </span>
                        <MiniLiquidOrb
                          pct={m.combinedPct}
                          score={m.score}
                          isFuture={m.isFuture}
                          isSelected={isSelected}
                          isDark={isDark}
                          uid={dStr}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Inline Selected Day Footer */}
                <div
                  className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[11.5px] ${
                    isDark ? 'border-white/[0.07]' : 'border-black/[0.05]'
                  }`}
                >
                  <span className={`font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#1D1D1F]'}`}>
                    {selectedWeekDay === ANCHOR_TODAY
                      ? 'Today · Wed, Nov 25'
                      : formatReadableDate(selectedWeekDay)}
                  </span>
                  {selectedDayInfo.isFuture ? (
                    <span className="text-[#8E8E93] font-medium">
                      Scheduled: {selectedDayInfo.scheduledTasks} tasks · {selectedDayInfo.scheduledHabits} habits
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 font-semibold tabular-nums">
                      <span className="text-[#007AFF]">Tasks {selectedDayInfo.taskPct}%</span>
                      <span className="text-[#10B981]">Habits {selectedDayInfo.habitPct}%</span>
                      <span className="px-2 py-0.5 rounded-[6px] bg-[#007AFF]/12 text-[#007AFF]">
                        Score {selectedDayInfo.score}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Today's Chronological Schedule */}
              <div>
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <h2 className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
                    Today&apos;s Schedule
                  </h2>
                  <span className={`text-[11.5px] font-medium ${isDark ? 'text-[#8E8E93]' : 'text-[#6E6E73]'}`}>
                    {todayScheduleItems.length} items
                  </span>
                </div>

                <div
                  className={`rounded-[16px] border divide-y overflow-hidden ${
                    isDark
                      ? 'bg-[#1C1C1E] border-white/[0.08] divide-white/[0.06]'
                      : 'bg-white border-black/[0.06] divide-black/[0.05] shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  {todayScheduleItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          item.type === 'habit'
                            ? toggleHabitForDate(item.rawId, ANCHOR_TODAY)
                            : toggleTask(item.rawId)
                        }
                        aria-label={`Toggle ${item.title}`}
                        style={{
                          backgroundColor: item.completed ? item.accent : 'transparent',
                          borderColor: item.completed
                            ? item.accent
                            : isDark
                            ? 'rgba(255,255,255,0.24)'
                            : 'rgba(0,0,0,0.22)',
                        }}
                        className="w-[22px] h-[22px] rounded-[7px] border-[1.75px] flex items-center justify-center shrink-0 transition-all active:scale-90 text-white"
                      >
                        {item.completed && <SFSymbol name="checkmark" size={13} strokeWidth={2.5} />}
                      </button>

                      <div
                        onClick={() => {
                          if (item.type === 'task') {
                            setTaskModal({ open: true, task: item.raw });
                          } else {
                            setActiveTab('habits');
                          }
                        }}
                        className="flex-1 min-w-0 cursor-pointer"
                      >
                        <p
                          className={`text-[13.5px] font-semibold truncate ${
                            item.completed
                              ? 'line-through text-[#8E8E93]'
                              : isDark
                              ? 'text-[#F5F5F7]'
                              : 'text-[#1D1D1F]'
                          }`}
                        >
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#8E8E93]">
                          <span className="tabular-nums font-medium">{item.time}</span>
                          <span>·</span>
                          <span>{item.subtitle}</span>
                          {item.priority === 'High' && (
                            <span className="w-1.5 h-1.5 rounded-[1.5px] bg-[#FF3B30]" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: TASKS ==================== */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-[26px] font-bold tracking-[-0.025em] ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
                    Tasks
                  </h1>
                  <p className="text-[12px] text-[#8E8E93]">
                    {data.tasks.filter((t) => !t.completed).length} active ·{' '}
                    {data.tasks.filter((t) => t.completed).length} completed
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <IOSIconButton
                    icon="chart.bar"
                    label="Task Analytics"
                    isDark={isDark}
                    active={showTaskAnalytics}
                    onClick={() => setShowTaskAnalytics(!showTaskAnalytics)}
                  />
                  <IOSButton
                    icon="plus"
                    isDark={isDark}
                    onClick={() =>
                      setTaskModal({
                        open: true,
                        task: {
                          id: `t-${Date.now()}`,
                          title: '',
                          notes: '',
                          dueDate: ANCHOR_TODAY,
                          time: '14:00',
                          priority: 'Medium',
                          category: 'Work',
                          completed: false,
                          completedDate: null,
                        },
                      })
                    }
                  >
                    New Task
                  </IOSButton>
                </div>
              </div>

              {/* Collapsible Task Analytics */}
              {showTaskAnalytics && (
                <div
                  className={`p-3.5 rounded-[16px] border ${
                    isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold">Completion by Category</span>
                    <span className="text-[11px] font-semibold text-[#007AFF]">
                      {Math.round(
                        (data.tasks.filter((t) => t.completed).length / Math.max(1, data.tasks.length)) * 100
                      )}
                      % Overall
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Work', 'Health', 'Personal', 'Finance'].map((cat) => {
                      const catTasks = data.tasks.filter((t) => t.category === cat);
                      const catDone = catTasks.filter((t) => t.completed).length;
                      return (
                        <div
                          key={cat}
                          className={`p-2 rounded-[10px] ${
                            isDark ? 'bg-[#2C2C2E]/60' : 'bg-[#F5F5F7]'
                          }`}
                        >
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span>{cat}</span>
                            <span className="tabular-nums text-[#8E8E93]">
                              {catDone}/{catTasks.length}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search Bar */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-[12px] border ${
                  isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
                }`}
              >
                <SFSymbol name="magnifyingglass" size={15} className="text-[#8E8E93]" />
                <input
                  type="text"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#8E8E93]"
                />
              </div>

              {/* Filter Chips (Continuous Squircles — Zero Capsule Pills) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {['All', 'Today', 'Upcoming', 'Overdue', 'Completed'].map((filter) => {
                  const active = taskFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setTaskFilter(filter)}
                      className={`px-3 py-1.5 rounded-[9px] text-[12px] font-semibold shrink-0 transition-all ${
                        active
                          ? isDark
                            ? 'bg-white text-black'
                            : 'bg-[#1D1D1F] text-white'
                          : isDark
                          ? 'bg-[#1C1C1E] text-[#8E8E93] border border-white/[0.07]'
                          : 'bg-white text-[#6E6E73] border border-black/[0.06]'
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>

              {/* Filtered Task List */}
              <div className="space-y-2">
                {data.tasks
                  .filter((t) => {
                    if (taskSearch && !t.title.toLowerCase().includes(taskSearch.toLowerCase())) {
                      return false;
                    }
                    if (taskFilter === 'Today') return t.dueDate === ANCHOR_TODAY;
                    if (taskFilter === 'Upcoming') return !t.completed && t.dueDate > ANCHOR_TODAY;
                    if (taskFilter === 'Overdue') return !t.completed && t.dueDate < ANCHOR_TODAY;
                    if (taskFilter === 'Completed') return t.completed;
                    return true;
                  })
                  .map((task) => {
                    const isOverdue = !task.completed && task.dueDate < ANCHOR_TODAY;
                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-[15px] border flex items-start gap-3 transition-colors ${
                          isDark
                            ? 'bg-[#1C1C1E] border-white/[0.08]'
                            : 'bg-white border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id)}
                          className={`mt-0.5 w-[22px] h-[22px] rounded-[7px] border-[1.75px] flex items-center justify-center shrink-0 transition-all ${
                            task.completed
                              ? 'bg-[#007AFF] border-[#007AFF] text-white'
                              : isDark
                              ? 'border-white/25'
                              : 'border-black/20'
                          }`}
                        >
                          {task.completed && <SFSymbol name="checkmark" size={13} strokeWidth={2.5} />}
                        </button>
                        <div
                          onClick={() => setTaskModal({ open: true, task })}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-[14px] font-semibold truncate ${
                                task.completed ? 'line-through text-[#8E8E93]' : ''
                              }`}
                            >
                              {task.title}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold shrink-0 ${
                                task.priority === 'High'
                                  ? 'bg-[#FF3B30]/12 text-[#FF3B30]'
                                  : task.priority === 'Medium'
                                  ? 'bg-[#007AFF]/12 text-[#007AFF]'
                                  : 'bg-[#8E8E93]/15 text-[#8E8E93]'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          {task.notes && (
                            <p className="text-[12px] text-[#8E8E93] line-clamp-1 mt-0.5">{task.notes}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] font-medium">
                            <span className={isOverdue ? 'text-[#FF3B30] font-semibold' : 'text-[#8E8E93]'}>
                              {task.dueDate === ANCHOR_TODAY ? 'Today' : task.dueDate} · {task.time}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-[5px] bg-black/[0.04] dark:bg-white/[0.07] text-[#8E8E93]">
                              {task.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ==================== TAB 3: HABITS ==================== */}
          {activeTab === 'habits' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-[26px] font-bold tracking-[-0.025em] ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
                    Habits
                  </h1>
                  <p className="text-[12px] text-[#8E8E93]">
                    {habitsDoneCount} of {todayHabits.length} completed today ({habitPct}%)
                  </p>
                </div>
                <IOSButton
                  variant="emerald"
                  icon="plus"
                  isDark={isDark}
                  onClick={() =>
                    setHabitModal({
                      open: true,
                      habit: {
                        id: `h-${Date.now()}`,
                        name: '',
                        category: 'Health',
                        time: '08:00',
                        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                        bestStreak: 0,
                      },
                    })
                  }
                >
                  New Habit
                </IOSButton>
              </div>

              {/* 150° Emerald Crystalline Fan Crown & Diamond Facet Matrix */}
              <EmeraldCrystallineFanCrown
                habitsToday={todayHabits}
                completedIds={todayHabitDoneIds}
                onToggleHabit={(id) => toggleHabitForDate(id, ANCHOR_TODAY)}
                isDark={isDark}
              />

              {/* Sunday-First Weekly Habit Matrix */}
              <div
                className={`p-3.5 rounded-[18px] border ${
                  isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13.5px] font-bold">
                    Weekly Matrix ({data.settings.weekStart === 'Sunday' ? 'Sun – Sat' : 'Mon – Sun'})
                  </span>
                  <span className="text-[11px] text-[#8E8E93]">Tap cell to toggle</span>
                </div>

                <div className="space-y-3">
                  {data.habits.map((habit) => {
                    const streak = getHabitStreak(habit);
                    return (
                      <div
                        key={habit.id}
                        className={`p-3 rounded-[14px] border ${
                          isDark ? 'bg-[#2C2C2E]/45 border-white/[0.06]' : 'bg-[#F9F9FB] border-black/[0.05]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            onClick={() => setHabitModal({ open: true, habit })}
                            className="cursor-pointer min-w-0 pr-2"
                          >
                            <p className="text-[13.5px] font-semibold truncate">{habit.name}</p>
                            <p className="text-[11px] text-[#8E8E93]">
                              {habit.category} · {habit.time}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11px] font-bold bg-[#10B981]/12 text-[#10B981]">
                              <SFSymbol name="flame" size={12} />
                              {streak}d
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1.5">
                          {weekDates.map((dStr) => {
                            const dName = getDayShortName(dStr);
                            const isScheduled = habit.days.includes(dName);
                            const isDone = (data.habitLogs[dStr] || []).includes(habit.id);
                            const isFuture = dStr > ANCHOR_TODAY;
                            return (
                              <button
                                key={dStr}
                                type="button"
                                disabled={!isScheduled || isFuture}
                                onClick={() => toggleHabitForDate(habit.id, dStr)}
                                className={`py-1.5 rounded-[8px] flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
                                  !isScheduled
                                    ? 'opacity-30 cursor-default'
                                    : isFuture
                                    ? 'opacity-45 cursor-default'
                                    : isDone
                                    ? 'bg-[#10B981] text-white shadow-[0_2px_6px_rgba(16,185,129,0.3)]'
                                    : isDark
                                    ? 'bg-[#1C1C1E] text-[#8E8E93] border border-white/10'
                                    : 'bg-white text-[#6E6E73] border border-black/10'
                                }`}
                              >
                                <span>{dName.charAt(0)}</span>
                                <span className="w-3.5 h-3.5 flex items-center justify-center">
                                  {isDone ? (
                                    <SFSymbol name="checkmark" size={11} strokeWidth={2.6} />
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-[1.5px] bg-current opacity-40" />
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 4: PROGRESS ==================== */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className={`text-[26px] font-bold tracking-[-0.025em] ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
                  Progress
                </h1>
                {/* Segmented Range Switcher */}
                <div
                  className={`grid grid-cols-3 p-1 rounded-[11px] border ${
                    isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-[#E5E5EA]/70 border-black/[0.05]'
                  }`}
                >
                  {['Daily', 'Weekly', 'Monthly'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setProgressRange(r)}
                      className={`px-2.5 py-1 rounded-[8px] text-[11.5px] font-semibold transition-all ${
                        progressRange === r
                          ? isDark
                            ? 'bg-[#2C2C2E] text-white shadow-sm'
                            : 'bg-white text-[#1D1D1F] shadow-sm'
                          : 'text-[#8E8E93]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enchanted Liquid Semi-Orb Dome Gauge */}
              <LiquidSemiOrbDomeGauge
                score={lifeScore}
                taskScore={taskPct}
                habitScore={habitPct}
                consistencyScore={consistencyScore}
                weights={data.settings.weights}
                isDark={isDark}
              />

              {/* 7-Day Grouped Flat-Top Rectangular Bar Chart (Sunday-First) */}
              <div
                className={`p-4 rounded-[18px] border ${
                  isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-[14px] font-bold">
                      7-Day Performance ({data.settings.weekStart === 'Sunday' ? 'Sun – Sat' : 'Mon – Sun'})
                    </h3>
                    <p className="text-[11px] text-[#8E8E93]">
                      {selectedPerfDay === ANCHOR_TODAY ? 'Today' : formatReadableDate(selectedPerfDay)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-semibold">
                    <span className="inline-flex items-center gap-1 text-[#007AFF]">
                      <span className="w-2 h-2 rounded-[2px] bg-[#007AFF]" />
                      Tasks
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#10B981]">
                      <span className="w-2 h-2 rounded-[2px] bg-[#10B981]" />
                      Habits
                    </span>
                  </div>
                </div>

                <div className="relative h-32 flex items-end justify-between gap-2 pt-4 pb-1 px-1">
                  {/* 50% and 100% Dashed Reference Lines */}
                  <div
                    className={`absolute left-0 right-0 top-4 border-t border-dashed ${
                      isDark ? 'border-white/10' : 'border-black/10'
                    }`}
                  />
                  <div
                    className={`absolute left-0 right-0 top-1/2 border-t border-dashed ${
                      isDark ? 'border-white/10' : 'border-black/10'
                    }`}
                  />

                  {weekDates.map((dStr) => {
                    const m = getDayMetrics(dStr);
                    const isSelected = dStr === selectedPerfDay;
                    const letter = getDayShortName(dStr).charAt(0);
                    return (
                      <button
                        key={dStr}
                        type="button"
                        onClick={() => setSelectedPerfDay(dStr)}
                        className={`flex-1 h-full flex flex-col items-center justify-end gap-1.5 rounded-[8px] py-1 transition-colors ${
                          isSelected
                            ? isDark
                              ? 'bg-white/[0.05]'
                              : 'bg-black/[0.03]'
                            : ''
                        }`}
                      >
                        <div className="flex items-end gap-1 h-20">
                          {m.isFuture ? (
                            <>
                              <div className="w-2.5 h-8 rounded-[2.5px] border border-dashed border-[#007AFF]/40" />
                              <div className="w-2.5 h-10 rounded-[2.5px] border border-dashed border-[#10B981]/40" />
                            </>
                          ) : (
                            <>
                              <div
                                style={{ height: `${Math.max(10, (m.taskPct / 100) * 80)}px` }}
                                className="w-2.5 rounded-[2.5px] bg-[#007AFF] transition-all"
                              />
                              <div
                                style={{ height: `${Math.max(10, (m.habitPct / 100) * 80)}px` }}
                                className="w-2.5 rounded-[2.5px] bg-[#10B981] transition-all"
                              />
                            </>
                          )}
                        </div>
                        <span
                          className={`text-[10.5px] font-bold ${
                            dStr === ANCHOR_TODAY ? 'text-[#007AFF]' : 'text-[#8E8E93]'
                          }`}
                        >
                          {letter}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 30-Day Consistency Heatmap (10x3 Square Matrix) */}
              <div
                className={`p-4 rounded-[18px] border ${
                  isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-[14px] font-bold">30-Day Consistency</h3>
                  <span className="text-[11px] text-[#8E8E93]">
                    {selectedHeatmapCell
                      ? `${selectedHeatmapCell.date}: ${selectedHeatmapCell.combinedPct}%`
                      : 'Tap tile to inspect'}
                  </span>
                </div>
                <div className="grid grid-cols-10 gap-1.5">
                  {heatmapDays.map((cell) => {
                    const pct = cell.combinedPct;
                    const bg =
                      pct >= 85
                        ? 'bg-[#10B981]'
                        : pct >= 65
                        ? 'bg-[#10B981]/70'
                        : pct >= 40
                        ? 'bg-[#10B981]/40'
                        : isDark
                        ? 'bg-white/10'
                        : 'bg-black/[0.06]';
                    return (
                      <button
                        key={cell.date}
                        type="button"
                        onClick={() => setSelectedHeatmapCell(cell)}
                        className={`aspect-square rounded-[5px] transition-transform active:scale-90 ${bg} ${
                          selectedHeatmapCell?.date === cell.date
                            ? 'ring-2 ring-[#007AFF]'
                            : ''
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Personal Growth Insights */}
              <div
                className={`p-4 rounded-[18px] border ${
                  isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2 text-[#007AFF]">
                  <SFSymbol name="sparkles" size={15} />
                  <h3 className={`text-[14px] font-bold ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
                    Personal Growth Insights
                  </h3>
                </div>
                <ul className="space-y-2 text-[12.5px] leading-relaxed text-[#8E8E93]">
                  <li>
                    • Your strongest active streak is{' '}
                    <span className={isDark ? 'text-white font-semibold' : 'text-[#1D1D1F] font-semibold'}>
                      Language Practice (15m)
                    </span>{' '}
                    at {getHabitStreak(data.habits[2])} scheduled days.
                  </li>
                  <li>
                    • Morning tasks scheduled before 12:00 PM have a{' '}
                    <span className="text-[#007AFF] font-semibold">100% completion rate</span> this week.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ==================== TAB 5: NOTES ==================== */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-[26px] font-bold tracking-[-0.025em] ${isDark ? 'text-white' : 'text-[#1D1D1F]'}`}>
                    Notes
                  </h1>
                  <p className="text-[12px] text-[#8E8E93]">{data.notes.length} entries saved locally</p>
                </div>
                <IOSButton
                  icon="square.and.pencil"
                  isDark={isDark}
                  onClick={() =>
                    setNoteModal({
                      open: true,
                      note: {
                        id: `n-${Date.now()}`,
                        title: '',
                        content: '',
                        tag: 'Daily',
                        date: ANCHOR_TODAY,
                        pinned: false,
                        updatedAt: 'Just now',
                      },
                    })
                  }
                >
                  New Note
                </IOSButton>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {['All', 'Pinned', 'Daily', 'Principles', 'Learning'].map((tag) => {
                  const active = noteFilter === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNoteFilter(tag)}
                      className={`px-3 py-1.5 rounded-[9px] text-[12px] font-semibold shrink-0 ${
                        active
                          ? isDark
                            ? 'bg-white text-black'
                            : 'bg-[#1D1D1F] text-white'
                          : isDark
                          ? 'bg-[#1C1C1E] text-[#8E8E93] border border-white/[0.07]'
                          : 'bg-white text-[#6E6E73] border border-black/[0.06]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Notes List */}
              <div className="space-y-2.5">
                {data.notes
                  .filter((n) => {
                    if (noteFilter === 'Pinned') return n.pinned;
                    if (noteFilter !== 'All') return n.tag === noteFilter;
                    return true;
                  })
                  .sort((a, b) => Number(b.pinned) - Number(a.pinned))
                  .map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-[16px] border ${
                        isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          onClick={() => setNoteModal({ open: true, note })}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            {note.pinned && <SFSymbol name="pin" size={13} className="text-[#007AFF]" filled />}
                            <h3 className="text-[14.5px] font-bold truncate">{note.title || 'Untitled Note'}</h3>
                          </div>
                          <p className="text-[12.5px] text-[#8E8E93] whitespace-pre-line line-clamp-3 mt-1.5 leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => togglePinNote(note.id)}
                            className={`p-1.5 rounded-[8px] ${
                              note.pinned ? 'text-[#007AFF] bg-[#007AFF]/10' : 'text-[#8E8E93]'
                            }`}
                          >
                            <SFSymbol name="pin" size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNote(note.id)}
                            className="p-1.5 rounded-[8px] text-[#8E8E93] hover:text-[#FF3B30]"
                          >
                            <SFSymbol name="trash" size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/[0.05] dark:border-white/[0.06] text-[11px] text-[#8E8E93]">
                        <span className="px-2 py-0.5 rounded-[5px] bg-[#007AFF]/10 text-[#007AFF] font-semibold">
                          {note.tag}
                        </span>
                        <span>{note.updatedAt}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Floating iOS Continuous Squircle Quick-Add Button (54x54) */}
        <button
          type="button"
          aria-label="Quick Add"
          onClick={() => setQuickAddOpen(!quickAddOpen)}
          className="absolute right-[clamp(16px,4vw,22px)] bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 w-[58px] h-[58px] rounded-[20px] bg-gradient-to-br from-[#35A1FF] via-[#007AFF] to-[#0056D6] text-white flex items-center justify-center shadow-[0_10px_28px_rgba(0,122,255,0.34),inset_0_1px_0_rgba(255,255,255,0.45)] transition-all duration-200 active:scale-90 active:shadow-[0_4px_12px_rgba(0,122,255,0.25)]"
        >
          <span className={`transition-transform duration-200 ${quickAddOpen ? 'rotate-45' : ''}`}>
            <SFSymbol name="plus" size={23} strokeWidth={2.4} />
          </span>
        </button>

        {/* Quick-Add Action Sheet */}
        {quickAddOpen && (
          <div
            onClick={() => setQuickAddOpen(false)}
            className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-end justify-end p-4 pb-[142px]"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-56 p-2 rounded-[18px] border space-y-1 shadow-2xl ${
                isDark ? 'bg-[#1C1C1E] border-white/12' : 'bg-white border-black/10'
              }`}
            >
              {[
                {
                  label: 'New Task',
                  icon: 'plus.app',
                  color: '#007AFF',
                  action: () => {
                    setQuickAddOpen(false);
                    setTaskModal({
                      open: true,
                      task: {
                        id: `t-${Date.now()}`,
                        title: '',
                        notes: '',
                        dueDate: ANCHOR_TODAY,
                        time: '15:00',
                        priority: 'Medium',
                        category: 'Work',
                        completed: false,
                        completedDate: null,
                      },
                    });
                  },
                },
                {
                  label: 'New Habit',
                  icon: 'flame',
                  color: '#10B981',
                  action: () => {
                    setQuickAddOpen(false);
                    setHabitModal({
                      open: true,
                      habit: {
                        id: `h-${Date.now()}`,
                        name: '',
                        category: 'Health',
                        time: '08:00',
                        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                        bestStreak: 0,
                      },
                    });
                  },
                },
                {
                  label: 'New Note',
                  icon: 'square.and.pencil',
                  color: '#5856D6',
                  action: () => {
                    setQuickAddOpen(false);
                    setNoteModal({
                      open: true,
                      note: {
                        id: `n-${Date.now()}`,
                        title: '',
                        content: '',
                        tag: 'Daily',
                        date: ANCHOR_TODAY,
                        pinned: false,
                        updatedAt: 'Just now',
                      },
                    });
                  },
                },
                {
                  label: 'Calendar',
                  icon: 'calendar',
                  color: '#FF9500',
                  action: () => {
                    setQuickAddOpen(false);
                    setCalendarOpen(true);
                  },
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[13.5px] font-semibold transition-colors ${
                    isDark ? 'hover:bg-white/[0.07]' : 'hover:bg-black/[0.04]'
                  }`}
                >
                  <span
                    style={{ backgroundColor: `${item.color}18`, color: item.color }}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center"
                  >
                    <SFSymbol name={item.icon} size={17} />
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom 5-Tab Navigation Bar */}
        <nav
          className={`shrink-0 min-h-[68px] h-[calc(68px+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-1.5 border-t grid grid-cols-5 items-center ${
            isDark
              ? 'bg-[#121214]/95 border-white/[0.08] backdrop-blur-md'
              : 'bg-white/95 border-black/[0.07] backdrop-blur-md'
          }`}
        >
          {[
            { id: 'myday', label: 'My Day' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'habits', label: 'Habits' },
            { id: 'progress', label: 'Progress' },
            { id: 'notes', label: 'Notes' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative h-full flex flex-col items-center justify-center gap-1 select-none"
              >
                {/* Top 2.5px Architectural Active Indicator */}
                {active && (
                  <span className="absolute top-0 w-7 h-[2.5px] rounded-b-[2px] bg-[#007AFF]" />
                )}
                <div
                  className={`w-[38px] h-[28px] rounded-[9px] flex items-center justify-center transition-colors ${
                    active
                      ? isDark
                        ? 'bg-[#007AFF]/18 text-[#007AFF]'
                        : 'bg-[#007AFF]/10 text-[#007AFF]'
                      : isDark
                      ? 'text-[#8E8E93]'
                      : 'text-[#6E6E73]'
                  }`}
                >
                  <LifeOSNavIcon tab={tab.id} active={active} />
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-[-0.01em] ${
                    active ? 'text-[#007AFF]' : isDark ? 'text-[#8E8E93]' : 'text-[#6E6E73]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ==================== CALENDAR MODAL ==================== */}
        {calendarOpen && (
          <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center">
            <div
              className={`w-full max-w-[430px] max-h-[88%] overflow-y-auto rounded-t-[26px] sm:rounded-[26px] p-4 border ${
                isDark ? 'bg-[#1C1C1E] border-white/12' : 'bg-[#F5F5F7] border-black/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-[18px] font-bold">November 2026</h2>
                  <p className="text-[11.5px] text-[#8E8E93]">
                    {data.settings.weekStart === 'Sunday' ? 'Sunday-first calendar' : 'Monday-first calendar'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex p-0.5 rounded-[9px] border ${
                      isDark ? 'bg-[#2C2C2E] border-white/10' : 'bg-white border-black/10'
                    }`}
                  >
                    {['Month', 'Week'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setCalendarView(v)}
                        className={`px-2.5 py-1 rounded-[7px] text-[11px] font-semibold ${
                          calendarView === v ? 'bg-[#007AFF] text-white' : 'text-[#8E8E93]'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <IOSIconButton
                    icon="xmark"
                    label="Close Calendar"
                    isDark={isDark}
                    onClick={() => setCalendarOpen(false)}
                  />
                </div>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-bold text-[#8E8E93] mb-1.5">
                {getOrderedDays(data.settings.weekStart).map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Nov 2026 Starts on Sunday Nov 1 */}
              {calendarView === 'Month' ? (
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 30 }, (_, idx) => {
                    const dayNum = idx + 1;
                    const dateStr = `2026-11-${String(dayNum).padStart(2, '0')}`;
                    const hasTask = data.tasks.some((t) => t.dueDate === dateStr);
                    const isSel = calendarSelectedDate === dateStr;
                    const isToday = dateStr === ANCHOR_TODAY;
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setCalendarSelectedDate(dateStr)}
                        className={`h-10 rounded-[10px] flex flex-col items-center justify-center text-[12.5px] font-semibold border transition-all ${
                          isSel
                            ? 'bg-[#007AFF] text-white border-[#007AFF]'
                            : isToday
                            ? 'border-[#007AFF] text-[#007AFF]'
                            : isDark
                            ? 'bg-[#2C2C2E]/60 border-white/[0.05]'
                            : 'bg-white border-black/[0.05]'
                        }`}
                      >
                        <span>{dayNum}</span>
                        {hasTask && (
                          <span
                            className={`w-1 h-1 rounded-[1px] mt-0.5 ${
                              isSel ? 'bg-white' : 'bg-[#007AFF]'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1.5">
                  {weekDates.map((dStr) => {
                    const isSel = calendarSelectedDate === dStr;
                    return (
                      <button
                        key={dStr}
                        type="button"
                        onClick={() => setCalendarSelectedDate(dStr)}
                        className={`py-3 rounded-[11px] flex flex-col items-center gap-1 border ${
                          isSel
                            ? 'bg-[#007AFF] text-white border-[#007AFF]'
                            : isDark
                            ? 'bg-[#2C2C2E]/70 border-white/10'
                            : 'bg-white border-black/10'
                        }`}
                      >
                        <span className="text-[10px] opacity-80">{getDayShortName(dStr)}</span>
                        <span className="text-[14px] font-bold">{dStr.slice(-2)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected Date Agenda */}
              <div
                className={`mt-3 p-3 rounded-[14px] border ${
                  isDark ? 'bg-[#2C2C2E]/50 border-white/[0.07]' : 'bg-white border-black/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12.5px] font-bold">
                    {formatReadableDate(calendarSelectedDate)}
                  </span>
                  <IOSButton
                    size="sm"
                    icon="plus"
                    isDark={isDark}
                    onClick={() => {
                      setCalendarOpen(false);
                      setTaskModal({
                        open: true,
                        task: {
                          id: `t-${Date.now()}`,
                          title: '',
                          notes: '',
                          dueDate: calendarSelectedDate,
                          time: '10:00',
                          priority: 'Medium',
                          category: 'Work',
                          completed: false,
                          completedDate: null,
                        },
                      });
                    }}
                  >
                    Add
                  </IOSButton>
                </div>
                {data.tasks.filter((t) => t.dueDate === calendarSelectedDate).length === 0 ? (
                  <p className="text-[12px] text-[#8E8E93]">No tasks scheduled for this date.</p>
                ) : (
                  <div className="space-y-1.5">
                    {data.tasks
                      .filter((t) => t.dueDate === calendarSelectedDate)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between text-[12.5px] py-1"
                        >
                          <span className={t.completed ? 'line-through text-[#8E8E93]' : 'font-medium'}>
                            {t.title}
                          </span>
                          <span className="text-[11px] text-[#8E8E93] tabular-nums">{t.time}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== SETTINGS MODAL ==================== */}
        {settingsOpen && (
          <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center">
            <div
              className={`w-full max-w-[430px] max-h-[88%] overflow-y-auto rounded-t-[26px] sm:rounded-[26px] p-4 border space-y-4 ${
                isDark ? 'bg-[#1C1C1E] border-white/12' : 'bg-[#F5F5F7] border-black/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[19px] font-bold">Settings</h2>
                <IOSIconButton
                  icon="xmark"
                  label="Close Settings"
                  isDark={isDark}
                  onClick={() => setSettingsOpen(false)}
                />
              </div>

              {/* Appearance */}
              <div
                className={`p-3.5 rounded-[16px] border ${
                  isDark ? 'bg-[#2C2C2E]/60 border-white/[0.08]' : 'bg-white border-black/[0.06]'
                }`}
              >
                <p className="text-[12px] font-bold mb-2">Appearance</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light', label: 'Light', icon: 'sun.max' },
                    { id: 'dark', label: 'Dark', icon: 'moon.stars' },
                    { id: 'system', label: 'System', icon: 'circle.lefthalf.filled' },
                  ].map((opt) => {
                    const active = data.settings.theme === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, theme: opt.id },
                          }))
                        }
                        className={`py-2 px-2.5 rounded-[11px] border flex items-center justify-center gap-1.5 text-[12px] font-semibold transition-all ${
                          active
                            ? 'bg-[#007AFF] text-white border-[#007AFF]'
                            : isDark
                            ? 'bg-[#1C1C1E] border-white/10 text-[#8E8E93]'
                            : 'bg-[#F5F5F7] border-black/10 text-[#6E6E73]'
                        }`}
                      >
                        <SFSymbol name={opt.icon} size={14} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start of Week */}
              <div
                className={`p-3.5 rounded-[16px] border ${
                  isDark ? 'bg-[#2C2C2E]/60 border-white/[0.08]' : 'bg-white border-black/[0.06]'
                }`}
              >
                <p className="text-[12px] font-bold mb-2">Start of Week</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Sunday', 'Monday'].map((day) => {
                    const active = data.settings.weekStart === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, weekStart: day },
                          }))
                        }
                        className={`py-2 rounded-[11px] border text-[12.5px] font-semibold ${
                          active
                            ? 'bg-[#007AFF] text-white border-[#007AFF]'
                            : isDark
                            ? 'bg-[#1C1C1E] border-white/10 text-[#8E8E93]'
                            : 'bg-[#F5F5F7] border-black/10 text-[#6E6E73]'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Life Score Weighting */}
              <div
                className={`p-3.5 rounded-[16px] border space-y-2.5 ${
                  isDark ? 'bg-[#2C2C2E]/60 border-white/[0.08]' : 'bg-white border-black/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold">Life Score Weighting</p>
                  <span className="text-[11px] font-semibold text-[#007AFF]">
                    Total: {data.settings.weights.tasks + data.settings.weights.habits + data.settings.weights.consistency}%
                  </span>
                </div>
                {[
                  { key: 'tasks', label: 'Tasks', color: '#007AFF' },
                  { key: 'habits', label: 'Habits', color: '#10B981' },
                  { key: 'consistency', label: 'Consistency', color: '#6366F1' },
                ].map((item) => (
                  <div key={item.key}>
                    <div className="flex justify-between text-[11.5px] font-medium mb-1">
                      <span>{item.label}</span>
                      <span className="tabular-nums font-bold">{data.settings.weights[item.key]}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="70"
                      step="5"
                      value={data.settings.weights[item.key]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setData((prev) => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            weights: { ...prev.settings.weights, [item.key]: val },
                          },
                        }));
                      }}
                      className="w-full accent-[#007AFF]"
                    />
                  </div>
                ))}
              </div>

              {/* Data Backup & Reset */}
              <div
                className={`p-3.5 rounded-[16px] border space-y-2 ${
                  isDark ? 'bg-[#2C2C2E]/60 border-white/[0.08]' : 'bg-white border-black/[0.06]'
                }`}
              >
                <p className="text-[12px] font-bold mb-1">Offline Data & Backup</p>
                <div className="grid grid-cols-2 gap-2">
                  <IOSButton variant="secondary" icon="square.and.arrow.up" isDark={isDark} onClick={handleExportJSON}>
                    Export JSON
                  </IOSButton>
                  <IOSButton
                    variant="secondary"
                    icon="square.and.arrow.down"
                    isDark={isDark}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Restore JSON
                  </IOSButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </div>
                <IOSButton
                  variant="danger"
                  className="w-full mt-2"
                  isDark={isDark}
                  onClick={() => {
                    const fresh = createSeedData();
                    setData(fresh);
                    showToast('Demo data restored');
                  }}
                >
                  Reset to Default Seed Data
                </IOSButton>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TASK FORM MODAL ==================== */}
        {taskModal.open && taskModal.task && (
          <TaskFormModal
            task={taskModal.task}
            isDark={isDark}
            onClose={() => setTaskModal({ open: false, task: null })}
            onSave={saveTask}
            onDelete={deleteTask}
          />
        )}

        {/* ==================== HABIT FORM MODAL ==================== */}
        {habitModal.open && habitModal.habit && (
          <HabitFormModal
            habit={habitModal.habit}
            weekStart={data.settings.weekStart}
            isDark={isDark}
            onClose={() => setHabitModal({ open: false, habit: null })}
            onSave={saveHabit}
            onDelete={deleteHabit}
          />
        )}

        {/* ==================== NOTE FORM MODAL ==================== */}
        {noteModal.open && noteModal.note && (
          <NoteFormModal
            note={noteModal.note}
            isDark={isDark}
            onClose={() => setNoteModal({ open: false, note: null })}
            onSave={saveNote}
          />
        )}
      </div>
    </div>
  );
}

function TaskFormModal({ task, isDark, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(task);
  const isExisting = Boolean(task.title);

  return (
    <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-[2px] flex items-end justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) return;
          onSave(form);
        }}
        className={`w-full max-w-[430px] rounded-t-[26px] p-4 border space-y-3 ${
          isDark ? 'bg-[#1C1C1E] border-white/12' : 'bg-[#F5F5F7] border-black/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-bold">{isExisting ? 'Edit Task' : 'New Task'}</h3>
          <IOSIconButton icon="xmark" label="Close" isDark={isDark} onClick={onClose} />
        </div>

        <input
          type="text"
          required
          placeholder="Task title..."
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={`w-full px-3.5 py-2.5 rounded-[12px] border text-[14px] font-medium outline-none ${
            isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : 'bg-white border-black/10 text-[#1D1D1F]'
          }`}
        />

        <textarea
          rows={2}
          placeholder="Notes (optional)..."
          value={form.notes || ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className={`w-full px-3.5 py-2 rounded-[12px] border text-[13px] outline-none ${
            isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : 'bg-white border-black/10 text-[#1D1D1F]'
          }`}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] block mb-1">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className={`w-full px-3 py-2 rounded-[10px] border text-[12.5px] ${
                isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : 'bg-white border-black/10'
              }`}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] block mb-1">Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className={`w-full px-3 py-2 rounded-[10px] border text-[12.5px] ${
                isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : 'bg-white border-black/10'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] block mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className={`w-full px-3 py-2 rounded-[10px] border text-[12.5px] ${
                isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : 'bg-white border-black/10'
              }`}
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] block mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={`w-full px-3 py-2 rounded-[10px] border text-[12.5px] ${
                isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : 'bg-white border-black/10'
              }`}
            >
              <option>Work</option>
              <option>Health</option>
              <option>Personal</option>
              <option>Finance</option>
              <option>Learning</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {isExisting && (
            <IOSButton variant="danger" icon="trash" isDark={isDark} onClick={() => onDelete(form.id)}>
              Delete
            </IOSButton>
          )}
          <IOSButton type="submit" className="flex-1" size="lg" isDark={isDark}>
            Save Task
          </IOSButton>
        </div>
      </form>
    </div>
  );
}

function HabitFormModal({ habit, weekStart, isDark, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(habit);
  const orderedDays = getOrderedDays(weekStart);
  const isExisting = Boolean(habit.name);

  const toggleDay = (d) => {
    const exists = form.days.includes(d);
    const next = exists ? form.days.filter((x) => x !== d) : [...form.days, d];
    if (next.length === 0) return;
    setForm({ ...form, days: next });
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-[2px] flex items-end justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name.trim()) return;
          onSave(form);
        }}
        className={`w-full max-w-[430px] rounded-t-[26px] p-4 border space-y-3 ${
          isDark ? 'bg-[#1C1C1E] border-white/12' : 'bg-[#F5F5F7] border-black/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-bold">{isExisting ? 'Edit Habit' : 'New Habit'}</h3>
          <IOSIconButton icon="xmark" label="Close" isDark={isDark} onClick={onClose} />
        </div>

        <input
          type="text"
          required
          placeholder="Habit name (e.g., Read 20 mins)..."
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={`w-full px-3.5 py-2.5 rounded-[12px] border text-[14px] font-medium outline-none ${
            isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : 'bg-white border-black/10 text-[#1D1D1F]'
          }`}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] block mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={`w-full px-3 py-2 rounded-[10px] border text-[12.5px] ${
                isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : 'bg-white border-black/10'
              }`}
            >
              <option>Health</option>
              <option>Mindset</option>
              <option>Learning</option>
              <option>Productivity</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#8E8E93] block mb-1">Reminder Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className={`w-full px-3 py-2 rounded-[10px] border text-[12.5px] ${
                isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : 'bg-white border-black/10'
              }`}
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#8E8E93] block mb-1.5">
            Schedule ({weekStart === 'Sunday' ? 'Sun – Sat' : 'Mon – Sun'})
          </label>
          <div className="grid grid-cols-7 gap-1.5">
            {orderedDays.map((d) => {
              const active = form.days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`py-2 rounded-[9px] text-[11px] font-bold border transition-all ${
                    active
                      ? 'bg-[#10B981] text-white border-[#10B981]'
                      : isDark
                      ? 'bg-[#2C2C2E] border-white/10 text-[#8E8E93]'
                      : 'bg-white border-black/10 text-[#6E6E73]'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {isExisting && (
            <IOSButton variant="danger" icon="trash" isDark={isDark} onClick={() => onDelete(form.id)}>
              Delete
            </IOSButton>
          )}
          <IOSButton type="submit" variant="emerald" className="flex-1" size="lg" isDark={isDark}>
            Save Habit
          </IOSButton>
        </div>
      </form>
    </div>
  );
}

function NoteFormModal({ note, isDark, onClose, onSave }) {
  const [form, setForm] = useState(note);

  return (
    <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-[2px] flex items-end justify-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...form, updatedAt: 'Just now' });
        }}
        className={`w-full max-w-[430px] rounded-t-[26px] p-4 border space-y-3 ${
          isDark ? 'bg-[#1C1C1E] border-white/12' : 'bg-[#F5F5F7] border-black/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-bold">{note.title ? 'Edit Note' : 'New Note'}</h3>
          <IOSIconButton icon="xmark" label="Close" isDark={isDark} onClick={onClose} />
        </div>

        <input
          type="text"
          required
          placeholder="Note title..."
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={`w-full px-3.5 py-2.5 rounded-[12px] border text-[14px] font-semibold outline-none ${
            isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : 'bg-white border-black/10 text-[#1D1D1F]'
          }`}
        />

        <div className="flex items-center gap-2">
          {['Daily', 'Principles', 'Learning'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, tag: t })}
              className={`px-3 py-1 rounded-[8px] text-[11.5px] font-semibold ${
                form.tag === t
                  ? 'bg-[#007AFF] text-white'
                  : isDark
                  ? 'bg-[#2C2C2E] text-[#8E8E93]'
                  : 'bg-white text-[#6E6E73]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          rows={5}
          required
          placeholder="Write your reflection or idea..."
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className={`w-full px-3.5 py-2.5 rounded-[12px] border text-[13px] leading-relaxed outline-none ${
            isDark ? 'bg-[#2C2C2E] border-white/10 text-white' : 'bg-white border-black/10 text-[#1D1D1F]'
          }`}
        />

        <IOSButton type="submit" className="w-full" size="lg" isDark={isDark}>
          Save Note
        </IOSButton>
      </form>
    </div>
  );
}

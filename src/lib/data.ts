
import { User, Subscription, AppNotification, Role, SubRole } from './types';
import { add, formatISO } from 'date-fns';

const today = new Date();

export const mockUsers: User[] = [
  // Employees
  { id: 'user-1', name: 'Alice Smith', email: 'alice@example.com', password: 'password', role: 'employee', subrole: null, department: 'Marketing' },
  { id: 'user-2', name: 'Bob Johnson', email: 'bob@example.com', password: 'password', role: 'employee', subrole: null, department: 'Engineering' },
  
  // HODs
  { id: 'user-3', name: 'Charles Brown (HOD)', email: 'charles@example.com', password: 'password', role: 'hod', subrole: null, department: 'Marketing' },
  { id: 'user-4', name: 'Diana Prince (HOD)', email: 'diana@example.com', password: 'password', role: 'hod', subrole: null, department: 'Engineering' },

  // Finance
  { id: 'user-5', name: 'Ethan Hunt (APA)', email: 'ethan@example.com', password: 'password', role: 'finance', subrole: 'apa', department: 'Finance' },
  { id: 'user-6', name: 'Fiona Glenanne (AM)', email: 'fiona@example.com', password: 'password', role: 'finance', subrole: 'am', department: 'Finance' },

  // Admin
  { id: 'user-7', name: 'Grace O-Malley (Admin)', email: 'grace@example.com', password: 'password', role: 'admin', subrole: null, department: 'IT' },
];

export const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    toolName: 'Figma',
    vendorName: 'Figma',
    duration: 12,
    cost: 1440,
    department: 'Engineering',
    purpose: 'For UI/UX design and collaboration.',
    status: 'Active',
    requestedBy: 'user-2',
    requestDate: formatISO(add(today, { months: -6 })),
    expiryDate: formatISO(add(today, { months: 6 })),
    approvedBy: 'user-4',
    paidBy: 'user-5',
    paymentDate: formatISO(add(today, { months: -6, days: 2 })),
  },
  {
    id: 'sub-2',
    toolName: 'Canva',
    vendorName: 'Canva',
    duration: 12,
    cost: 1200,
    department: 'Marketing',
    purpose: 'Creating marketing materials and social media posts.',
    status: 'Active',
    requestedBy: 'user-1',
    requestDate: formatISO(add(today, { months: -2 })),
    expiryDate: formatISO(add(today, { months: 10 })),
    approvedBy: 'user-3',
    paidBy: 'user-5',
    paymentDate: formatISO(add(today, { months: -2, days: 2 })),
  },
  {
    id: 'sub-3',
    toolName: 'Notion',
    vendorName: 'Notion',
    duration: 6,
    cost: 600,
    department: 'Engineering',
    purpose: 'Project management and documentation.',
    status: 'Expired',
    requestedBy: 'user-2',
    requestDate: formatISO(add(today, { months: -7 })),
    expiryDate: formatISO(add(today, { months: -1 })),
    approvedBy: 'user-4',
    paidBy: 'user-5',
    paymentDate: formatISO(add(today, { months: -7, days: 2 })),
  },
  {
    id: 'sub-4',
    toolName: 'Slack',
    vendorName: 'Slack',
    duration: 12,
    cost: 960,
    department: 'Marketing',
    purpose: 'Team communication and collaboration.',
    status: 'Pending',
    requestedBy: 'user-1',
    requestDate: formatISO(add(today, { days: -3 })),
  },
  {
    id: 'sub-5',
    toolName: 'ChatGPT',
    vendorName: 'OpenAI',
    duration: 1,
    cost: 20,
    department: 'Engineering',
    purpose: 'AI-assisted coding and content generation.',
    status: 'Approved',
    requestedBy: 'user-2',
    requestDate: formatISO(add(today, { days: -2 })),
    approvedBy: 'user-4',
    approvalDate: formatISO(add(today, { days: -1 })),
  },
  {
    id: 'sub-6',
    toolName: 'Zoom',
    vendorName: 'Zoom',
    duration: 12,
    cost: 1500,
    department: 'Marketing',
    purpose: 'For client meetings and webinars.',
    status: 'Active',
    requestedBy: 'user-1',
    requestDate: formatISO(add(today, { months: -1 })),
    expiryDate: formatISO(add(today, { days: 8 })), // Expiring soon
    approvedBy: 'user-3',
    paidBy: 'user-5',
    paymentDate: formatISO(add(today, { months: -1, days: 2 })),
  },
];

export const mockNotifications: AppNotification[] = [
    { 
        id: 'notif-1', 
        userId: 'user-1', 
        message: 'Your request for Slack has been submitted for approval.', 
        isRead: true, 
        createdAt: formatISO(add(today, { days: -3 })),
    },
    { 
        id: 'notif-2', 
        userId: 'user-2', 
        message: 'Your request for ChatGPT has been approved and is pending payment.', 
        isRead: false, 
        createdAt: formatISO(add(today, { days: -1 })),
    },
    { 
        id: 'notif-3', 
        userId: 'user-4', 
        message: 'A new subscription request for ChatGPT is awaiting your approval.', 
        isRead: true, 
        createdAt: formatISO(add(today, { days: -2 })),
    },
    { 
        id: 'notif-4', 
        userId: 'user-3', 
        message: 'Your department’s subscription for Zoom is expiring in 8 days.', 
        isRead: false, 
        createdAt: formatISO(add(today, { days: -2 })),
    },
];

    
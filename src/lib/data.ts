
import { User, Subscription, AppNotification, Role, SubRole } from './types';
import { add, formatISO } from 'date-fns';

const today = new Date();

export const mockUsers: User[] = [
  // Employees
  { id: 'user-1', name: 'Alice Smith', email: 'alice@example.com', password: 'password', role: 'employee', subrole: null, department: 'Marketing' },
  { id: 'user-2', name: 'Bob Johnson', email: 'bob@example.com', password: 'password', role: 'employee', subrole: null, department: 'Engineering' },
  
  // HODs
  { id: 'user-3', name: 'Charles Brown (HOD)', email: 'charles.brown@example.com', password: 'password', role: 'hod', subrole: null, department: 'Marketing' },
  { id: 'user-4', name: 'Diana Prince (HOD)', email: 'diana.prince@example.com', password: 'password', role: 'hod', subrole: null, department: 'Engineering' },

  // Finance
  { id: 'user-5', name: 'Ethan Hunt (APA)', email: 'ethan@example.com', password: 'password', role: 'finance', subrole: 'apa', department: 'Marketing' },
  { id: 'user-8', name: 'Ivy Queen (APA)', email: 'ivy@example.com', password: 'password', role: 'finance', subrole: 'apa', department: 'Engineering' },
  { id: 'user-6', name: 'Fiona Glenanne (AM)', email: 'fiona@example.com', password: 'password', role: 'finance', subrole: 'am', department: 'Finance' },


  // Admin
  { id: 'user-7', name: 'Grace O-Malley (Admin)', email: 'grace@example.com', password: 'password', role: 'admin', subrole: null, department: 'IT' },
];

export const departmentHODs: { [key: string]: { hodName: string; hodEmail: string; } } = {
  'Marketing': { hodName: 'Charles Brown', hodEmail: 'charles.brown@example.com' },
  'Engineering': { hodName: 'Diana Prince', hodEmail: 'diana.prince@example.com' },
  'Finance': { hodName: 'Ethan Hunt', hodEmail: 'ethan.hunt@example.com' },
  'IT': { hodName: 'Grace O-Malley', hodEmail: 'grace.omalley@example.com' },
  'HR': { hodName: 'Charles Brown', hodEmail: 'charles.brown@example.com' },
  'Sales': { hodName: 'Diana Prince', hodEmail: 'diana.prince@example.com' },
  'Operations': { hodName: 'Ethan Hunt', hodEmail: 'ethan.hunt@example.com' },
};


export const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    toolName: 'Figma',
    vendorName: 'Figma',
    duration: 12,
    cost: 1440,
    department: 'Engineering',
    purpose: 'For UI/UX design and collaboration.',
    status: 'Payment Completed',
    requestedBy: 'user-2',
    requestDate: formatISO(add(today, { months: -6 })),
    expiryDate: formatISO(add(today, { months: 6 })),
    approvedBy: 'user-4',
    apaApprovedBy: 'user-8',
    paidBy: 'user-6',
    paymentDate: formatISO(add(today, { months: -6, days: 4 })),
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
    apaApprovedBy: 'user-5',
    paidBy: 'user-6',
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
    apaApprovedBy: 'user-8',
    paidBy: 'user-6',
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
    status: 'Approved by HOD',
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
    apaApprovedBy: 'user-5',
    paidBy: 'user-6',
    paymentDate: formatISO(add(today, { months: -1, days: 2 })),
    alertDays: 10,
  },
   {
    id: 'sub-7',
    toolName: 'Adobe Express',
    vendorName: 'Adobe',
    duration: 12,
    cost: 120,
    department: 'Marketing',
    purpose: 'Quickly create graphics and videos.',
    status: 'Approved by APA',
    requestedBy: 'user-1',
    requestDate: formatISO(add(today, { days: -5 })),
    approvedBy: 'user-3',
    approvalDate: formatISO(add(today, { days: -4 })),
    apaApprovedBy: 'user-5',
    apaApprovalDate: formatISO(add(today, { days: -3 })),
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
        message: 'Your request for ChatGPT has been approved by your HOD and is pending finance approval.', 
        isRead: false, 
        createdAt: formatISO(add(today, { days: -1 })),
    },
    { 
        id: 'notif-3', 
        userId: 'user-4', 
        message: 'You have approved the request for ChatGPT.', 
        isRead: true, 
        createdAt: formatISO(add(today, { days: -1 })),
    },
    { 
        id: 'notif-4', 
        userId: 'user-3', 
        message: 'Your department’s subscription for Zoom is expiring in 8 days.', 
        isRead: false, 
        createdAt: formatISO(add(today, { days: -2 })),
    },
     { 
        id: 'notif-5', 
        userId: 'user-5', 
        message: 'A new request for ChatGPT from Engineering is awaiting your approval.', 
        isRead: false, 
        createdAt: formatISO(add(today, { days: -1 })),
    },
     { 
        id: 'notif-6', 
        userId: 'user-6', 
        message: 'A new request for Adobe Express from Marketing has been approved by APA and is ready for payment.', 
        isRead: false, 
        createdAt: formatISO(add(today, { days: -3 })),
    },
];

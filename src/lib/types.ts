
export type Role = 'employee' | 'hod' | 'finance' | 'admin';
export type SubRole = 'apa' | 'am' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Should be hashed in a real app
  role: Role;
  subrole: SubRole;
  department: string;
  googleUid?: string;
}

export type SubscriptionStatus = 'Pending' | 'Approved by HOD' | 'Declined by HOD' | 'Approved by APA' | 'Declined by APA' | 'Active' | 'Expired' | 'Payment Completed' | 'Payment Declined';

export interface Subscription {
  id: string;
  toolName: string;
  vendorName?: string;
  duration: number; // in months
  cost: number;
  department: string;
  purpose: string;
  status: SubscriptionStatus;
  requestedBy: string; // userId
  requestDate: string; // ISO date string
  expiryDate?: string; // ISO date string
  invoiceUrl?: string;
  remarks?: string;
  approvedBy?: string; // HOD's userId
  approvalDate?: string; // HOD's approval date
  apaApprovedBy?: string; // APA's userId
  apaApprovalDate?: string;
  paidBy?: string; // AM's userId
  paymentDate?: string;
  paymentDetails?: {
    mode: string;
    transactionId?: string;
  };
  alertDays?: number;
}

export interface AppNotification {
  id: string;
  userId: string; // User this notification is for
  message: string;
  isRead: boolean;
  createdAt: string; // ISO date string
  link?: string;
}

export const toolOptions = ['ChatGPT', 'Canva', 'Figma', 'Notion', 'Zoom', 'Adobe Creative Cloud', 'Slack', 'Microsoft 365'];

export const departmentOptions = ['Marketing', 'Engineering', 'Finance', 'IT', 'HR', 'Sales', 'Operations'];

    
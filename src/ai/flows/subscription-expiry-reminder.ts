'use server';

/**
 * @fileOverview This flow checks for expiring subscriptions and creates email log entries.
 * It is designed to be run by a scheduled job.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Initialize Firebase to get Firestore instance
const { firestore } = initializeFirebase();

const SubscriptionSchema = z.object({
  id: z.string(),
  toolName: z.string(),
  vendorName: z.string().optional(),
  endDate: z.string(), // ISO string from Firestore
  userId: z.string(),
  department: z.string(),
});

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  department: z.string(),
  role: z.string(),
});

export const subscriptionExpiryReminderFlow = ai.defineFlow(
  {
    name: 'subscriptionExpiryReminderFlow',
    inputSchema: z.void(),
    outputSchema: z.string(),
  },
  async () => {
    console.log('Starting subscription expiry reminder check...');

    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setDate(today.getDate() + 10);
    
    // Set hours, minutes, seconds, and ms to 0 to compare dates only
    reminderDate.setHours(0, 0, 0, 0);
    const reminderDateEnd = new Date(reminderDate);
    reminderDateEnd.setHours(23, 59, 59, 999);

    const reminderTimestampStart = Timestamp.fromDate(reminderDate);
    const reminderTimestampEnd = Timestamp.fromDate(reminderDateEnd);

    const subscriptionsRef = collection(firestore, 'subscriptions');
    const usersRef = collection(firestore, 'users');
    const emailLogsRef = collection(firestore, 'emailLogs');
    
    const q = query(
      subscriptionsRef,
      where('endDate', '>=', reminderTimestampStart),
      where('endDate', '<=', reminderTimestampEnd)
    );

    let reminderCount = 0;
    try {
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} subscriptions expiring in 10 days.`);

      for (const doc of querySnapshot.docs) {
        const subscription = SubscriptionSchema.parse({ id: doc.id, ...doc.data() });

        // Fetch the user
        const userQuery = query(usersRef, where('id', '==', subscription.userId));
        const userSnapshot = await getDocs(userQuery);
        if (userSnapshot.empty) {
          console.warn(`User not found for ID: ${subscription.userId}`);
          continue;
        }
        const user = UserSchema.parse({ id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() });

        // Fetch the HOD
        const hodQuery = query(
          usersRef,
          where('department', '==', user.department),
          where('role', '==', 'hod')
        );
        const hodSnapshot = await getDocs(hodQuery);
        if (hodSnapshot.empty) {
          console.warn(`HOD not found for department: ${user.department}`);
          continue;
        }
        const hod = UserSchema.parse({ id: hodSnapshot.docs[0].id, ...hodSnapshot.docs[0].data() });

        // Log email to be sent by the "Trigger Email" extension
        const emailLog = {
          to: [user.email, hod.email],
          message: {
            subject: `Subscription Expiry Reminder: ${subscription.toolName} expires in 10 days`,
            html: `
              <p>Hello,</p>
              <p>This is a reminder that the following subscription is expiring in 10 days:</p>
              <ul>
                <li><strong>Employee Name:</strong> ${user.name}</li>
                <li><strong>Software Name:</strong> ${subscription.toolName}</li>
                <li><strong>Vendor Name:</strong> ${subscription.vendorName || 'N/A'}</li>
                <li><strong>Expiry Date:</strong> ${new Date(subscription.endDate).toLocaleDateString()}</li>
                <li><strong>Remaining Days:</strong> 10</li>
              </ul>
              <p>Please take necessary renewal action before expiry.</p>
              <p>Thank you,<br/>AutoTrack Pro</p>
            `,
          },
          subscriptionId: subscription.id,
          userId: user.id,
          hodId: hod.id,
          sentAt: serverTimestamp(),
          status: 'Sent', // This will be the trigger for the email extension
        };
        
        await addDoc(emailLogsRef, emailLog);
        reminderCount++;
        console.log(`Logged email reminder for subscription: ${subscription.toolName}`);
      }
    } catch (error) {
      console.error('Error processing subscription reminders:', error);
      return `Failed to process reminders. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    const result = `Successfully processed ${reminderCount} subscription expiry reminders.`;
    console.log(result);
    return result;
  }
);
    
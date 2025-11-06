'use server';

/**
 * @fileOverview A flow that summarizes notifications, grouping them by subscription or department.
 *
 * - summarizeNotifications - A function that summarizes notifications.
 * - SummarizeNotificationsInput - The input type for the summarizeNotifications function.
 * - SummarizeNotificationsOutput - The return type for the summarizeNotifications function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNotificationsInputSchema = z.object({
  notifications: z.array(
    z.object({
      id: z.string(),
      message: z.string(),
      subscription: z.string().optional(),
      department: z.string().optional(),
      severity: z.enum(['info', 'warning', 'error']).optional(),
      timestamp: z.string().datetime().optional(),
    })
  ).describe('An array of notification objects to summarize.'),
  groupingCriteria: z.enum(['subscription', 'department']).describe('The criteria to group notifications by.'),
});
export type SummarizeNotificationsInput = z.infer<typeof SummarizeNotificationsInputSchema>;

const SummarizeNotificationsOutputSchema = z.object({
  summary: z.string().describe('A summarized version of the notifications, grouped by the specified criteria.'),
});
export type SummarizeNotificationsOutput = z.infer<typeof SummarizeNotificationsOutputSchema>;

export async function summarizeNotifications(input: SummarizeNotificationsInput): Promise<SummarizeNotificationsOutput> {
  return summarizeNotificationsFlow(input);
}

const summarizeNotificationsPrompt = ai.definePrompt({
  name: 'summarizeNotificationsPrompt',
  input: {schema: SummarizeNotificationsInputSchema},
  output: {schema: SummarizeNotificationsOutputSchema},
  prompt: `You are an AI assistant that summarizes notifications for a user.

  The notifications should be grouped by the following criteria: {{{groupingCriteria}}}.

  Here are the notifications:
  {{#each notifications}}
  - ID: {{id}}
    Message: {{message}}
    {{#if subscription}}Subscription: {{subscription}}{{/if}}
    {{#if department}}Department: {{department}}{{/if}}
    {{#if severity}}Severity: {{severity}}{{/if}}
    {{#if timestamp}}Timestamp: {{timestamp}}{{/if}}
  {{/each}}

  Please provide a concise summary of the notifications, grouped by the specified criteria.
  The summary should highlight the key updates and any important actions the user needs to take.
  `,
});

const summarizeNotificationsFlow = ai.defineFlow(
  {
    name: 'summarizeNotificationsFlow',
    inputSchema: SummarizeNotificationsInputSchema,
    outputSchema: SummarizeNotificationsOutputSchema,
  },
  async input => {
    const {output} = await summarizeNotificationsPrompt(input);
    return output!;
  }
);

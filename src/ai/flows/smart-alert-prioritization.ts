'use server';

/**
 * @fileOverview A smart alert prioritization AI agent.
 *
 * - prioritizeAlerts - A function that handles the alert prioritization process.
 * - PrioritizeAlertsInput - The input type for the prioritizeAlerts function.
 * - PrioritizeAlertsOutput - The return type for the prioritizeAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizeAlertsInputSchema = z.object({
  alertContent: z
    .string()
    .describe('The content of the alert message to be analyzed.'),
});
export type PrioritizeAlertsInput = z.infer<typeof PrioritizeAlertsInputSchema>;

const PrioritizeAlertsOutputSchema = z.object({
  priorityScore: z
    .number()
    .describe(
      'A score from 1-10 indicating the priority of the alert, with 10 being the highest priority.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the assigned priority score, explaining the urgency and potential impact of the alert.'
    ),
});
export type PrioritizeAlertsOutput = z.infer<typeof PrioritizeAlertsOutputSchema>;

export async function prioritizeAlerts(input: PrioritizeAlertsInput): Promise<PrioritizeAlertsOutput> {
  return prioritizeAlertsFlow(input);
}

const prioritizeAlertsPrompt = ai.definePrompt({
  name: 'prioritizeAlertsPrompt',
  input: {schema: PrioritizeAlertsInputSchema},
  output: {schema: PrioritizeAlertsOutputSchema},
  prompt: `You are an AI assistant designed to prioritize alerts based on their urgency and impact.

  Analyze the following alert content and assign a priority score from 1 to 10 (10 being highest priority).
  Provide a reasoning for the assigned score, explaining the urgency and potential impact of the alert.

  Alert Content: {{{alertContent}}}
  \n  Output in JSON format:
  `,
});

const prioritizeAlertsFlow = ai.defineFlow(
  {
    name: 'prioritizeAlertsFlow',
    inputSchema: PrioritizeAlertsInputSchema,
    outputSchema: PrioritizeAlertsOutputSchema,
  },
  async input => {
    const {output} = await prioritizeAlertsPrompt(input);
    return output!;
  }
);

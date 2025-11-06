'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting a suitable purpose for a new subscription request based on the tool name and department selected by the employee.
 *
 * @exported
 * - `suggestSubscriptionPurpose`: A function that takes the tool name and department as input and returns a suggested purpose for the subscription.
 * - `SubscriptionSuggestionInput`: The input type for the `suggestSubscriptionPurpose` function.
 * - `SubscriptionSuggestionOutput`: The output type for the `suggestSubscriptionPurpose` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SubscriptionSuggestionInputSchema = z.object({
  toolName: z.string().describe('The name of the tool for which the subscription is being requested.'),
  department: z.string().describe('The department making the subscription request.'),
});
export type SubscriptionSuggestionInput = z.infer<typeof SubscriptionSuggestionInputSchema>;

const SubscriptionSuggestionOutputSchema = z.object({
  suggestedPurpose: z.string().describe('A suggested purpose for the subscription request based on the tool and department.'),
});
export type SubscriptionSuggestionOutput = z.infer<typeof SubscriptionSuggestionOutputSchema>;

export async function suggestSubscriptionPurpose(input: SubscriptionSuggestionInput): Promise<SubscriptionSuggestionOutput> {
  return suggestSubscriptionPurposeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'subscriptionPurposeSuggestionPrompt',
  input: {schema: SubscriptionSuggestionInputSchema},
  output: {schema: SubscriptionSuggestionOutputSchema},
  prompt: `You are an AI assistant that suggests a suitable purpose for a software subscription request.

  Given the tool name and the department requesting the subscription, provide a concise and well-articulated justification for the subscription.

  Tool Name: {{{toolName}}}
  Department: {{{department}}}

  Suggested Purpose:`,
});

const suggestSubscriptionPurposeFlow = ai.defineFlow(
  {
    name: 'suggestSubscriptionPurposeFlow',
    inputSchema: SubscriptionSuggestionInputSchema,
    outputSchema: SubscriptionSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

'use server';
/**
 * @fileOverview AI flow to generate insights for 'Daily Fresh Cars'.
 *
 * - getFreshCarInsight - A function that handles the AI insight generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FreshCarInputSchema = z.object({
  title: z.string(),
  price: z.number(),
  year: z.number(),
  km: z.number(),
  fuelType: z.string(),
  transmission: z.string(),
});

const FreshCarOutputSchema = z.object({
  insight: z.string().describe("A brief, catchy (10-15 words) insight about why this car is a great deal."),
});

const prompt = ai.definePrompt({
  name: 'freshCarPrompt',
  input: { schema: FreshCarInputSchema },
  output: { schema: FreshCarOutputSchema },
  prompt: `You are an expert Indian car market analyst. 
    Based on these details:
    - Car: {{title}}
    - Price: {{price}}
    - Year: {{year}}
    - Kms: {{km}}
    - Fuel: {{fuelType}}
    - Transmission: {{transmission}}

    Generate a 1-sentence 'Fresh Pick' insight for this car listing. 
    Focus on things like 'low running for its age' or 'excellent value'.
    Keep it professional but exciting.`,
});

const freshCarInsightFlow = ai.defineFlow(
  {
    name: 'freshCarInsightFlow',
    inputSchema: FreshCarInputSchema,
    outputSchema: FreshCarOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function getFreshCarInsight(input: z.infer<typeof FreshCarInputSchema>) {
  try {
    const result = await freshCarInsightFlow(input);
    return result.insight || "A well-maintained example of this popular model, ready for its next owner.";
  } catch (error) {
    console.error("AI Insight Flow Error:", error);
    return "A well-maintained example of this popular model, ready for its next owner.";
  }
}

'use server';
/**
 * @fileOverview AI flow to generate insights for 'Daily Fresh Cars'.
 *
 * - getFreshCarInsight - Generates a brief, catchy reason why a car is a 'Fresh Pick'.
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
  insight: z.string().describe("A brief, catchy (10-15 words) insight about why this car is a great deal or a rare find."),
});

const freshCarPrompt = ai.definePrompt({
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
    Focus on things like 'low running for its age', 'hard to find variant', or 'excellent value for money'.
    Keep it professional but exciting.`,
});

export async function getFreshCarInsight(input: z.infer<typeof FreshCarInputSchema>) {
  try {
    const { output } = await freshCarPrompt(input);
    return output?.insight || "A well-maintained example of this popular model, ready for its next owner.";
  } catch (error) {
    console.error("AI Insight Flow Error:", error);
    return "A well-maintained example of this popular model, ready for its next owner.";
  }
}

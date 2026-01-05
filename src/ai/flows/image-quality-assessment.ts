
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ImageQualityInputSchema = z.array(z.string()).describe("An array of Base64 data URIs of the car photos.");

const ImageQualityOutputSchema = z.object({
    overall_score: z.number().min(0).max(100).describe("A score from 0-100 representing the overall quality of the set of images for a car listing."),
    overall_assessment: z.string().describe("A brief, one-sentence summary of the image quality (e.g., 'Excellent photos for a professional listing.')."),
    feedback: z.array(z.string()).describe("A list of specific, actionable tips to improve the photos."),
});

type ImageQualityOutput = z.infer<typeof ImageQualityOutputSchema>;

const imageQualityPrompt = ai.definePrompt({
    name: 'imageQualityPrompt',
    input: { schema: ImageQualityInputSchema },
    output: { schema: ImageQualityOutputSchema },
    prompt: `You are an expert car photographer and online sales analyst.
    You will be given a set of photos for a used car listing. Your task is to assess their quality and provide a score and actionable feedback.

    Analyze the following images:
    {{#each this}}
    - Photo {{inc @index}}: {{media url=this}}
    {{/each}}
    
    Critique the images based on lighting, angle, background, cleanliness of the car, and completeness (showing interior, exterior, engine, etc.).

    Provide your assessment in JSON format with an overall score (0-100), a brief summary, and specific feedback for improvement.`,
});

const checkImageQualityFlow = ai.defineFlow(
  {
    name: 'checkImageQualityFlow',
    inputSchema: ImageQualityInputSchema,
    outputSchema: ImageQualityOutputSchema,
  },
  async (photos) => {
    const { output } = await imageQualityPrompt(photos);
    return output!;
  }
);

export async function checkImageQuality(photos: z.infer<typeof ImageQualityInputSchema>): Promise<ImageQualityOutput> {
    return checkImageQualityFlow(photos);
}

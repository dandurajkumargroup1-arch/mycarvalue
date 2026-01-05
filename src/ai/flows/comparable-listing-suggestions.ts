
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CarValuationDataForAISchema } from '@/lib/schemas';
import type { CarListing } from '@/lib/types';

const ComparableListingsInputSchema = CarValuationDataForAISchema;
type ComparableListingsInput = z.infer<typeof ComparableListingsInputSchema>;

const ComparableListingSchema = z.object({
    title: z.string().describe("e.g., '2018 Maruti Swift VXi'"),
    details: z.string().describe("e.g., '45,000 kms, 1st Owner, Mumbai'"),
    price: z.number().describe("Price in INR, e.g., 550000"),
    link: z.string().url().describe("A placeholder URL to a listing, e.g., https://www.example.com/listing/123"),
});

const ComparableListingsOutputSchema = z.object({
  listings: z.array(ComparableListingSchema).describe("An array of 3 to 5 comparable car listings."),
});

type ComparableListingsOutput = z.infer<typeof ComparableListingsOutputSchema>;

const comparableListingsPrompt = ai.definePrompt({
    name: 'comparableListingsPrompt',
    input: { schema: ComparableListingsInputSchema },
    output: { schema: ComparableListingsOutputSchema },
    prompt: `You are a market research expert for used cars in India.
    Based on the following car, generate a list of 3-5 realistic, comparable listings that are currently on the market.

    Car Details:
    - Make: {{{make}}}
    - Model: {{{model}}}
    - Year of Registration: {{{registrationYear}}}
    - Kilometers Driven: {{{usage.odometer}}}
    - Registration State: {{{registrationState}}}

    For each listing, provide a realistic title, key details (kms, ownership, location), a competitive price, and a placeholder URL. The data should be representative of the current Indian used car market.`,
});


const getComparableListingsFlow = ai.defineFlow(
  {
    name: 'getComparableListingsFlow',
    inputSchema: ComparableListingsInputSchema,
    outputSchema: ComparableListingsOutputSchema,
  },
  async (carData) => {
    const { output } = await comparableListingsPrompt(carData);
    return output!;
  }
);


export async function getComparableListings(carData: ComparableListingsInput): Promise<ComparableListingsOutput> {
  return getComparableListingsFlow(carData);
}

    
import { z } from 'zod';

// The contract every template takes. Editable in Remotion Studio, and the same
// JSON goes to `--props` on the command line.
export const templateSchema = z.object({
  // A video or image, either a file name inside /footage or a full URL.
  // Empty string = no footage: the engine falls back to procedural film frames.
  footageUrl: z.string(),
  headlines: z.tuple([z.string(), z.string(), z.string()]),
  eventDate: z.string(),
  // The "photos of you" counter lands on this number in the MAGIC beat. Odd and specific reads as true.
  photoCount: z.number().int().min(1).optional(),
  // Which opener plays in frames 0–24. See hooks/index.ts.
  hook: z.enum(['ticket-at-lens']).optional(),
});

export type TemplateProps = z.infer<typeof templateSchema>;

export const defaultProps: TemplateProps = {
  footageUrl: '',
  headlines: ['the ticket,', 'the camera,', 'the morning after.'],
  eventDate: 'sat 10.18',
  photoCount: 37,
  hook: 'ticket-at-lens',
};

export const DEFAULT_PHOTO_COUNT = 37;

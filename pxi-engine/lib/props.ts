import { z } from 'zod';

// The contract every template takes. Editable in Remotion Studio, and the same
// JSON goes to `--props` on the command line.
export const templateSchema = z.object({
  // A video or image, either a file name inside /footage or a full URL.
  // Empty string = no footage: the engine falls back to procedural film frames.
  footageUrl: z.string(),
  headlines: z.tuple([z.string(), z.string(), z.string()]),
  eventDate: z.string(),
});

export type TemplateProps = z.infer<typeof templateSchema>;

export const defaultProps: TemplateProps = {
  footageUrl: '',
  headlines: ['the ticket,', 'the camera,', 'the morning after.'],
  eventDate: 'sat 10.18',
};

/**
 * Reusable server component that injects JSON-LD structured data into the page.
 * Accepts a single schema object or an array of schemas.
 */
export function JsonLd({ data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

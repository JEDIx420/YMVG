# Dynamic JSON Blog System Documentation

> **Supplemental feature note:** For authoritative project architecture, security, and deployment context, see [`docs/YMBD_SOURCE_OF_TRUTH.md`](docs/YMBD_SOURCE_OF_TRUTH.md). Verify this feature note against `app/blog/` before changing it.

This project features a file-based dynamic blog system. To publish or update blog posts, you do not need to modify any code or configure database collections. Simply add or update JSON files under the `public/blogs/` directory in the repository and push to GitHub.

---

## 1. How the System Works

The system relies on Next.js server-side file reading and static generation features to create highly optimized, SEO-friendly pages.

```mermaid
graph TD
    A[Push JSON to public/blogs/] --> B[Next.js Build Process]
    B --> C[app/blog/page.tsx: Scans directory, lists posts]
    B --> D[app/blog/[slug]/page.tsx: Runs generateStaticParams]
    D --> E[Generates static HTML for each blog post]
    C --> F[User visits blog catalog]
    E --> G[User reads blog post with fast SSG speed]
```

- **Scanning**: The index page [`app/blog/page.tsx`](app/blog/page.tsx) uses Node.js `fs` to list all JSON files under `public/blogs/`, parses their metadata, and displays cards sorted by date (newest first).
- **Static Generation (SSG)**: The dynamic page [`app/blog/[slug]/page.tsx`](app/blog/[slug]/page.tsx) implements `generateStaticParams()`. During the build phase, it lists the slugs based on JSON filenames, allowing Next.js to pre-render the pages.
- **Dynamic SEO Metadata**: The system exports a `generateMetadata` function that dynamically extracts the meta description and title directly from the JSON files to optimize for search engines.

---

## 2. Expected JSON Schema & Metadata

Each blog post must be a single JSON file saved under `public/blogs/[slug].json`. The filename (excluding `.json`) will become the URL slug (e.g. `/blog/my-first-post` for `my-first-post.json`).

### JSON Fields Table

| Field Name | Type | Description | Required | Example |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `string` | The main H1 title of the article. | Yes | `"Serving Our Communities"` |
| `slug` | `string` | Must match the filename exactly. | Yes | `"ys-men-international-kerala-impact"` |
| `description` | `string` | Brief summary shown on the preview cards. | Yes | `"Discover how we are making a difference..."` |
| `metaDescription`| `string` | The SEO meta description injected in the `<head>`. | No | `"Official history and impact overview..."` |
| `category` | `string` | Label pill shown on the card (e.g. History). | Yes | `"Regional Impact & History"` |
| `image` | `string` | Absolute URL or public path to the cover image. | Yes | `"https://images.unsplash.com/..."` |
| `date` | `string` | Date of publication (formatted as `"Month Day, Year"`). | Yes | `"June 27, 2026"` |
| `readTime` | `string` | Estimated read time. | Yes | `"8 min read"` |
| `authorName` | `string` | The name of the author. | Yes | `"SWIR Communications"` |
| `authorTitle` | `string` | Author's official title. | Yes | `"Official Regional Update"` |
| `content` | `array` | List of content block objects (detailed below). | Yes | `[ ... ]` |
| `cta` | `object` | Footer Call-to-Action block (detailed below). | No | `{ ... }` |

---

## 3. Content Block Types

The `content` array supports dynamic block rendering. You can combine the following blocks in any order:

### A. Paragraph Block
Renders standard text. The first paragraph block in the JSON automatically gets styled with a **Drop Cap** (an elegant, enlarged first letter).
```json
{
  "type": "paragraph",
  "text": "For over a century, the global movement has..."
}
```

### B. Heading Block
Renders headings (`<h2>` or `<h3>` levels).
```json
{
  "type": "heading",
  "level": 2,
  "text": "What Does YMI Stand For in Our Region?"
}
```

### C. Quote Block
Renders a highlighted blockquote with a navy border and italic styling.
```json
{
  "type": "quote",
  "text": "The goal of Y's Men International Kerala is to bridge the gap..."
}
```

### D. List Block
Renders bullet points under a list structure.
```json
{
  "type": "list",
  "items": [
    "1931 – Colombo Charter",
    "1983 – Formation of the India Area"
  ]
}
```

### E. Grid Block
Renders a 2-column key-value grid card layout, useful for highlighting key initiatives, values, or steps.
```json
{
  "type": "grid",
  "items": [
    {
      "title": "1. Housing Projects",
      "text": "We construct free houses for families in need."
    },
    {
      "title": "2. Education Support",
      "text": "We provide digital setups to public schools."
    }
  ]
}
```

---

## 4. Call to Action (CTA) Structure

You can optionally define a high-impact call-to-action block at the bottom of the article:

```json
"cta": {
  "title": "Connect With Y's Men Kerala",
  "description": "Get in touch with us to collaborate on projects or join our growing network.",
  "primaryLink": "/directory",
  "primaryText": "Explore Member Directory",
  "secondaryLink": "/contact",
  "secondaryText": "Visit Headquarters"
}
```

---

## 5. Publishing Checklist

1. Create a file named `your-slug-here.json` inside `/public/blogs/`.
2. Populate the required metadata and content blocks.
3. Commit and push the file to your remote GitHub repository.
4. The deployment pipeline will automatically compile the site, generating the new page statically at `/blog/your-slug-here` and adding it to the `/blog` catalog.

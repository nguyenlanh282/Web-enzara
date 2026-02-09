import { List } from 'lucide-react';

interface TableOfContentsProps {
  content: string;
}

interface Heading {
  level: number;
  text: string;
  slug: string;
}

function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function generateSlug(text: string): string {
  return removeVietnameseDiacritics(text)
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function parseHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const level = parseInt(match[1], 10);
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    const slug = generateSlug(text);

    headings.push({ level, text, slug });
  }

  return headings;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const headings = parseHeadings(content);

  if (headings.length < 2) {
    return null;
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-6 mb-8 bg-neutral-50">
      <div className="flex items-center gap-2 mb-4">
        <List className="w-5 h-5 text-primary-700" />
        <h2 className="text-lg font-heading font-bold text-neutral-900">Mục lục</h2>
      </div>

      <ul className="space-y-2">
        {headings.map((heading, index) => (
          <li
            key={index}
            className={heading.level === 3 ? 'ml-4' : ''}
          >
            <a
              href={`#${heading.slug}`}
              className="text-sm text-neutral-700 hover:text-primary-700 transition-colors block py-1"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

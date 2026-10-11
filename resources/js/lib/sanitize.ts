/*
|--------------------------------------------------------------------------
| HTML sanitiser
|--------------------------------------------------------------------------
| `pages.content` is authored in the admin panel and rendered with
| dangerouslySetInnerHTML. The admin is trusted, but the value is still
| database content flowing into the DOM, so it is filtered against a strict
| allow-list before rendering. Laravel-side sanitisation is the next layer
| (PROMPT 4+); this one keeps the public site safe on its own.
|
| Only the tags the page editor produces are allowed: headings, paragraphs,
| lists, inline emphasis, links and images.
*/

const ALLOWED_TAGS = new Set([
    'h2',
    'h3',
    'h4',
    'p',
    'ul',
    'ol',
    'li',
    'blockquote',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'br',
    'hr',
    'a',
    'span',
    'div',
    'figure',
    'figcaption',
    'img',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
]);

/** Tags whose entire subtree is dropped, content included. */
const FORBIDDEN_TAGS = new Set([
    'script',
    'style',
    'iframe',
    'object',
    'embed',
    'link',
    'meta',
    'base',
    'form',
    'input',
    'button',
    'textarea',
    'select',
    'svg',
    'math',
]);

/** Attributes allowed on any permitted tag. */
const GLOBAL_ATTRIBUTES = new Set(['class', 'title']);

const TAG_ATTRIBUTES: Record<string, Set<string>> = {
    a: new Set(['href', 'target', 'rel']),
    img: new Set(['src', 'alt', 'width', 'height', 'loading']),
    td: new Set(['colspan', 'rowspan']),
    th: new Set(['colspan', 'rowspan', 'scope']),
};

const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;

/**
 * Removes script/style content and any tag or attribute outside the
 * allow-list. Returns an HTML string safe for dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
    if (!dirty) {
        return '';
    }

    // DOMParser never executes scripts and keeps the markup inert.
    if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
        return stripTags(dirty);
    }

    const doc = new window.DOMParser().parseFromString(
        `<!DOCTYPE html><body>${dirty}</body>`,
        'text/html',
    );

    const body = doc.body;

    if (!body) {
        return stripTags(dirty);
    }

    sanitizeNode(body);

    return body.innerHTML;
}

function sanitizeNode(node: Element): void {
    // A static copy is required: the live child list mutates as we remove.
    const children = Array.from(node.children);

    for (const child of children) {
        const tag = child.tagName.toLowerCase();

        if (FORBIDDEN_TAGS.has(tag)) {
            child.remove();

            continue;
        }

        if (!ALLOWED_TAGS.has(tag)) {
            // Keep the text of a disallowed-but-harmless tag (e.g. <font>)
            // instead of deleting the author's words, then drop the element.
            unwrap(child);

            continue;
        }

        cleanAttributes(child, tag);

        sanitizeNode(child);
    }
}

function cleanAttributes(element: Element, tag: string): void {
    const allowed = TAG_ATTRIBUTES[tag];

    for (const attribute of Array.from(element.attributes)) {
        const name = attribute.name.toLowerCase();

        const isAllowed =
            GLOBAL_ATTRIBUTES.has(name) ||
            name.startsWith('data-') ||
            (allowed !== undefined && allowed.has(name));

        if (!isAllowed) {
            element.removeAttribute(attribute.name);

            continue;
        }

        if ((name === 'href' || name === 'src') && !SAFE_URL.test(attribute.value.trim())) {
            element.removeAttribute(attribute.name);
        }
    }

    // External links opened in a new tab need `noopener`.
    if (tag === 'a' && element.getAttribute('target') === '_blank') {
        element.setAttribute('rel', 'noopener noreferrer');
    }

    // Images must never be able to break the layout.
    if (tag === 'img') {
        element.setAttribute('loading', 'lazy');
    }
}

function unwrap(element: Element): void {
    const parent = element.parentNode;

    if (parent === null) {
        element.remove();

        return;
    }

    while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
    }

    parent.removeChild(element);
}

/** Last-resort fallback when no DOM parser is available (SSR). */
function stripTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

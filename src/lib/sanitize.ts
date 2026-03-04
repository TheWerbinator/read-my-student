/**
 * Server-safe sanitization utilities.
 *
 * DOMPurify requires a DOM environment. In Node.js (server actions / RSC)
 * we supply one via jsdom. The window instance is created once per process
 * and reused for performance.
 */

import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

// ─── Shared DOMPurify instance ────────────────────────────────────────────────

const { window: jsdomWindow } = new JSDOM("<!DOCTYPE html>");
const purify = DOMPurify(jsdomWindow);

/** Allow-list: only the tags / attributes produced by Lexical's html serialiser */
const ALLOWED_TAGS = [
  "p",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "span",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "hr",
];

const ALLOWED_ATTR = [
  "style",
  "class", // Lexical inlines class / style for formatting
];

/**
 * Strip any unsafe HTML from the string produced by `$generateHtmlFromNodes`.
 * Returns a sanitized string safe for storage and later rendering.
 */
export function sanitizeLetterHtml(dirty: string): string {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: true,
  });
}

// ─── Lexical JSON validator ───────────────────────────────────────────────────

type LexicalSerializedEditorState = {
  root: {
    type: "root";
    children: unknown[];
    [key: string]: unknown;
  };
};

const KNOWN_NODE_TYPES = new Set([
  "root",
  "paragraph",
  "text",
  "linebreak",
  "list",
  "listitem",
  "heading",
  "quote",
  "decorator",
]);

/**
 * Returns true only when the object looks like a serialised Lexical editor
 * state that our app expects — i.e. it has a root node whose immediate
 * children are all of known types.
 *
 * This is a structural guard, not a full recursive walk, so it stays fast.
 */
export function validateLexicalJson(
  raw: unknown,
): raw is LexicalSerializedEditorState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;

  const obj = raw as Record<string, unknown>;
  if (!obj.root || typeof obj.root !== "object" || Array.isArray(obj.root))
    return false;

  const root = obj.root as Record<string, unknown>;
  if (root.type !== "root") return false;
  if (!Array.isArray(root.children)) return false;

  // Reject any top-level child whose type is not in our known set
  for (const child of root.children as Array<Record<string, unknown>>) {
    if (typeof child.type !== "string" || !KNOWN_NODE_TYPES.has(child.type)) {
      return false;
    }
  }

  return true;
}

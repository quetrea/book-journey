"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

type BookData = { title: string; author?: string; coverUrl?: string };

function extractIsbn(text: string): string | null {
  const m = text.match(/\b(97[89]\d{10}|\d{13})\b/);
  return m?.[1] ?? null;
}

async function safeJson(res: Response): Promise<Record<string, unknown> | null> {
  if (!res.ok) return null;
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fromOpenLibraryWork(olid: string): Promise<BookData | null> {
  const data = await safeJson(
    await fetch(`https://openlibrary.org/works/${olid}.json`)
  );
  if (!data?.title) return null;

  let author: string | undefined;
  const authors = data.authors as Array<{ author: { key: string } }> | undefined;
  const authorKey = authors?.[0]?.author?.key;
  if (authorKey) {
    const ad = await safeJson(
      await fetch(`https://openlibrary.org${authorKey}.json`)
    );
    if (ad?.name) author = ad.name as string;
  }
  const coverUrl = `https://covers.openlibrary.org/b/olid/${olid}-M.jpg`;
  return { title: data.title as string, author, coverUrl };
}

async function fromGoogleBooksId(id: string): Promise<BookData | null> {
  const data = await safeJson(
    await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`)
  );
  const info = data?.volumeInfo as Record<string, unknown> | undefined;
  if (!info?.title) return null;
  const authors = info.authors as string[] | undefined;
  const imageLinks = info.imageLinks as Record<string, string> | undefined;
  const coverUrl = imageLinks?.thumbnail ?? imageLinks?.smallThumbnail;
  return { title: info.title as string, author: authors?.[0], coverUrl };
}

async function fromIsbn(isbn: string): Promise<BookData | null> {
  const data = await safeJson(
    await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    )
  );
  const book = data?.[`ISBN:${isbn}`] as Record<string, unknown> | undefined;
  if (!book?.title) return null;
  const authors = book.authors as Array<{ name: string }> | undefined;
  return { title: book.title as string, author: authors?.[0]?.name };
}

async function fromOgMeta(url: string): Promise<BookData | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BookJourneyBot/1.0; +https://book-journey.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const title = (
      html.match(
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,300})["']/i
      )?.[1] ??
      html.match(
        /<meta[^>]+content=["']([^"']{1,300})["'][^>]+property=["']og:title["']/i
      )?.[1]
    )?.trim();

    if (!title) return null;

    const desc = (
      html.match(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})["']/i
      )?.[1] ??
      html.match(
        /<meta[^>]+content=["']([^"']{1,500})["'][^>]+name=["']description["']/i
      )?.[1]
    )?.trim();

    const author = desc?.match(/\bby\s+([A-Z][^.,\n]{1,60})/)?.[1]?.trim();
    return { title, author };
  } catch {
    return null;
  }
}

export const importBookFromUrl = action({
  args: { url: v.string() },
  handler: async (_ctx, { url }): Promise<BookData | null> => {
    try {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return null;
      }
      const { hostname, pathname } = parsed;

      // OpenLibrary — works page
      const olWork = pathname.match(/\/works\/(OL\w+)/i);
      if (hostname.includes("openlibrary.org") && olWork) {
        return fromOpenLibraryWork(olWork[1]!);
      }

      // OpenLibrary — edition/book page
      const olEdition = pathname.match(/\/books\/(OL\w+)/i);
      if (hostname.includes("openlibrary.org") && olEdition) {
        const data = await safeJson(
          await fetch(`https://openlibrary.org/books/${olEdition[1]!}.json`)
        );
        const worksKey = (
          data?.works as Array<{ key: string }> | undefined
        )?.[0]?.key;
        if (worksKey)
          return fromOpenLibraryWork(worksKey.replace("/works/", ""));
        return null;
      }

      // Google Books
      if (hostname.includes("books.google")) {
        const gid = parsed.searchParams.get("id");
        if (gid) return fromGoogleBooksId(gid);
      }

      // ISBN embedded in URL
      const isbn = extractIsbn(url);
      if (isbn) return fromIsbn(isbn);

      // Goodreads, Amazon, any other site → OG meta scrape
      return fromOgMeta(url);
    } catch {
      return null;
    }
  },
});

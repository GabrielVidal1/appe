export function tokensToRealWorldText(tokenCount: number): string {
  const words = tokenCount * 0.75;

  const wordsPerParagraph = 120;
  const wordsPerPage = 250;
  const wordsPerChapter = 7500;
  const wordsPerBook = 75000;
  const wordsPerSeries = 750000; // ~10 books
  const wordsPerLibrary = 7500000; // ~100 books

  if (words < wordsPerPage) {
    const paragraphs = Math.round(words / wordsPerParagraph);
    return `${paragraphs} paragraph${paragraphs !== 1 ? "s" : ""}`;
  } else if (words < wordsPerChapter) {
    const pages = Math.round(words / wordsPerPage);
    return `${pages} page${pages !== 1 ? "s" : ""}`;
  } else if (words < wordsPerBook) {
    const chapters = Math.round(words / wordsPerChapter);
    return `${chapters} chapter${chapters !== 1 ? "s" : ""}`;
  } else if (words < wordsPerSeries) {
    const books = (words / wordsPerBook).toFixed(0);
    return `~${books} book${books !== "1" ? "s" : ""}`;
  } else if (words < wordsPerLibrary) {
    const series = (words / wordsPerSeries).toFixed(0);
    return `~${series} book series (10 books each)`;
  } else {
    const libraries = (words / wordsPerLibrary).toFixed(0);
    return `~${libraries} personal librar${
      libraries === "1" ? "y" : "ies"
    } (100 books each)`;
  }
}

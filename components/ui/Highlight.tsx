"use client";

import React from 'react';

interface HighlightProps {
  text: string;
  query: string;
}

export const Highlight: React.FC<HighlightProps> = ({ text, query }) => {
  if (!query.trim()) return <>{text}</>;

  // Escape special characters and create a regex for matching keywords
  // We split by non-alphanumeric to get individual search terms for broader highlighting
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  if (terms.length === 0) return <>{text}</>;

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const safeTerms = terms.map(escapeRegExp);

  const regex = new RegExp(`(${safeTerms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => (
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-px px-0.5 font-bold underline decoration-yellow-400">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      ))}
    </>
  );
};

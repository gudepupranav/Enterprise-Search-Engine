import type { DocumentToken } from '../types';

export type ProcessedDocument = {
  id: string;
  name: string;
  originalText: string;
  normalizedText: string;
  searchText: string;
  extension: string;
  measuredCharacters: number;
  fileSizeBytes: number;
  tokenCount: number;
  wordCount: number;
  lineCount: number;
  tokens: DocumentToken[];
  status: 'ready' | 'empty';
};

export function processDocumentFile(name: string, content: string, fileSizeBytes: number): ProcessedDocument {
  const originalText = content ?? '';
  const tokens = tokenizeText(originalText);
  const normalizedText = normalizeText(originalText);

  return {
    id: `${name}-${fileSizeBytes}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    originalText,
    normalizedText,
    searchText: originalText,
    extension: extractExtension(name),
    measuredCharacters: originalText.length,
    fileSizeBytes,
    tokenCount: tokens.length,
    wordCount: tokens.filter(token => /[a-z0-9]/i.test(token.value)).length,
    lineCount: originalText.length === 0 ? 0 : originalText.split(/\r\n|\r|\n/).length,
    tokens,
    status: originalText.trim().length > 0 ? 'ready' : 'empty',
  };
}

export function tokenizeText(text: string): DocumentToken[] {
  const tokens: DocumentToken[] = [];
  const tokenPattern = /[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(text)) !== null) {
    const value = match[0];
    tokens.push({
      value,
      normalized: value.toLocaleLowerCase(),
      start: match.index,
      end: match.index + value.length,
      index: tokens.length,
    });
  }

  return tokens;
}

export function normalizeText(text: string): string {
  return text.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function extractExtension(name: string): string {
  const lastDot = name.lastIndexOf('.');
  return lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase() : 'text';
}

import { RecordItem, MatchScoreDetail, ClassificationType, SystemConfig } from '../types';

/**
 * Normalized hash calculation for deterministic exact matching
 */
export function computeContentHash(record: Partial<RecordItem>): string {
  const normKey = (record.primaryKey || '').trim().toLowerCase();
  const normTitle = (record.title || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normText = (record.secondaryText || '').trim().toLowerCase();
  const normContent = (record.content || '').trim().toLowerCase().replace(/\s+/g, ' ');

  const raw = `${normKey}|${normTitle}|${normText}|${normContent}`;
  
  // Simple fast string hashing (Fowler-Noll-Vo / DJB2 derivative for determinism)
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 33) ^ raw.charCodeAt(i);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `hash_${hex}_${raw.length}`;
}

/**
 * Standard Levenshtein Distance for String Similarity
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();

  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const row: number[] = [];
  for (let i = 0; i <= s2.length; i++) {
    row[i] = i;
  }

  for (let i = 1; i <= s1.length; i++) {
    let prev = i;
    for (let j = 1; j <= s2.length; j++) {
      let val = row[j - 1];
      if (s1[i - 1] === s2[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[s2.length] = prev;
  }
  return row[s2.length];
}

export function levenshteinSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Jaccard Index for Word Token Sets
 */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersection = 0;
  setA.forEach((token) => {
    if (setB.has(token)) intersection++;
  });

  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/**
 * Soundex algorithm for Phonetic name matching
 */
export function soundex(str: string): string {
  const s = str.toUpperCase().replace(/[^A-Z]/g, '');
  if (!s) return '0000';
  
  const firstChar = s[0];
  const mapping: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6'
  };

  let coded = firstChar;
  for (let i = 1; i < s.length; i++) {
    const char = s[i];
    const code = mapping[char] || '0';
    if (code !== '0' && code !== coded[coded.length - 1]) {
      coded += code;
    }
  }

  coded = coded.replace(/0/g, '');
  return (coded + '0000').slice(0, 4);
}

export function soundexMatch(a: string, b: string): boolean {
  return soundex(a) === soundex(b);
}

/**
 * Multi-field Record Matcher
 */
export interface RecordMatchResult {
  overallSimilarity: number; // 0 to 1
  fieldScores: MatchScoreDetail[];
  isExactHashMatch: boolean;
  classification: ClassificationType;
}

export function compareRecords(candidate: RecordItem, existing: RecordItem, config: SystemConfig): RecordMatchResult {
  // Exact Hash check
  const isExactHashMatch = candidate.contentHash === existing.contentHash;
  if (isExactHashMatch) {
    return {
      overallSimilarity: 1.0,
      fieldScores: [
        {
          field: 'ContentHash',
          similarityScore: 1.0,
          matchMethod: 'exact',
          valueA: candidate.contentHash,
          valueB: existing.contentHash,
          isExact: true
        }
      ],
      isExactHashMatch: true,
      classification: 'EXACT_DUPLICATE'
    };
  }

  // Primary Key (e.g. Email / SSN / Unique ID) check
  const keyMatchExact = candidate.primaryKey.trim().toLowerCase() === existing.primaryKey.trim().toLowerCase() && candidate.primaryKey.trim().length > 0;
  const keySimilarity = levenshteinSimilarity(candidate.primaryKey, existing.primaryKey);

  // Title / Name similarity
  const titleLev = levenshteinSimilarity(candidate.title, existing.title);
  const titleJaccard = jaccardSimilarity(candidate.title, existing.title);
  const titleSoundex = config.usePhoneticMatching && soundexMatch(candidate.title, existing.title);
  
  // Blend title score (bonus if phonetic match)
  let titleScore = Math.max(titleLev, titleJaccard);
  if (titleSoundex && titleScore < 0.85) {
    titleScore = Math.min(1.0, titleScore + 0.15);
  }

  // Secondary text / Contact / Category similarity
  const secondaryScore = levenshteinSimilarity(candidate.secondaryText, existing.secondaryText);

  // Content body similarity
  const contentLev = levenshteinSimilarity(candidate.content, existing.content);
  const contentJaccard = jaccardSimilarity(candidate.content, existing.content);
  const contentScore = Math.max(contentLev, contentJaccard);

  const fieldScores: MatchScoreDetail[] = [
    {
      field: 'Primary Identifier',
      similarityScore: keyMatchExact ? 1.0 : keySimilarity,
      matchMethod: keyMatchExact ? 'exact' : 'levenshtein',
      valueA: candidate.primaryKey,
      valueB: existing.primaryKey,
      isExact: keyMatchExact
    },
    {
      field: 'Title / Name',
      similarityScore: titleScore,
      matchMethod: titleSoundex ? 'soundex' : (titleLev > titleJaccard ? 'levenshtein' : 'jaccard'),
      valueA: candidate.title,
      valueB: existing.title,
      isExact: candidate.title.toLowerCase().trim() === existing.title.toLowerCase().trim()
    },
    {
      field: 'Secondary / Contact',
      similarityScore: secondaryScore,
      matchMethod: 'levenshtein',
      valueA: candidate.secondaryText,
      valueB: existing.secondaryText,
      isExact: candidate.secondaryText.toLowerCase().trim() === existing.secondaryText.toLowerCase().trim()
    },
    {
      field: 'Payload Content',
      similarityScore: contentScore,
      matchMethod: contentLev > contentJaccard ? 'levenshtein' : 'jaccard',
      valueA: candidate.content,
      valueB: existing.content,
      isExact: candidate.content.toLowerCase().trim() === existing.content.toLowerCase().trim()
    }
  ];

  // Weighted overall calculation
  // Primary Identifier: 35%, Title/Name: 35%, Secondary: 15%, Content: 15%
  let overall = (keySimilarity * 0.35) + (titleScore * 0.35) + (secondaryScore * 0.15) + (contentScore * 0.15);

  // If Primary key is exact match on non-empty key, heavily boost score
  if (keyMatchExact) {
    overall = Math.max(overall, 0.95);
  }

  // Classification assignment
  let classification: ClassificationType = 'UNIQUE_VERIFIED';
  if (overall >= 0.95) {
    classification = 'EXACT_DUPLICATE';
  } else if (overall >= config.fuzzyThreshold) {
    classification = 'HIGH_CONFIDENCE_DUP';
  } else if (overall >= 0.65) {
    classification = 'NEAR_DUPLICATE_REVIEW';
  } else {
    classification = 'UNIQUE_VERIFIED';
  }

  return {
    overallSimilarity: overall,
    fieldScores,
    isExactHashMatch: false,
    classification
  };
}

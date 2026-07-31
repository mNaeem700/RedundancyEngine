import { GoogleGenAI, Type } from '@google/genai';
import { RecordItem, AIAnalysisResult, MatchScoreDetail } from '../types';

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is missing.');
    return null;
  }
  aiInstance = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return aiInstance;
}

export async function analyzeFalsePositiveWithAI(
  candidate: RecordItem,
  existing: RecordItem,
  similarityScore: number,
  fieldScores: MatchScoreDetail[]
): Promise<AIAnalysisResult> {
  const ai = getGeminiClient();

  if (!ai) {
    // Fallback if no API key is present
    const isNearBoundary = similarityScore >= 0.70 && similarityScore <= 0.88;
    return {
      isFalsePositive: isNearBoundary,
      confidenceScore: 75,
      reasoning: 'Heuristic fallback: Record exhibits subtle differences in key fields. Flagged for review.',
      keyDifferences: fieldScores
        .filter((f) => f.similarityScore < 0.90)
        .map((f) => `${f.field}: Candidate "${f.valueA}" vs Existing "${f.valueB}"`),
      recommendedAction: isNearBoundary ? 'HUMAN_REVIEW' : 'REJECT',
    };
  }

  try {
    const prompt = `
    You are an expert Data Deduplication & Data Quality Auditor.
    Your task is to analyze two database records that have been flagged as potential duplicates by fuzzy string matching algorithms (Similarity Score: ${(similarityScore * 100).toFixed(1)}%).

    DETERMINE IF THIS MATCH IS A "TRUE DUPLICATE" OR A "FALSE POSITIVE" (i.e., looks similar textually, but is actually a distinct entity, distinct person, distinct transaction, or legitimate separate entry).

    RECORD A (NEW CANDIDATE ENTRY):
    - Primary ID: ${candidate.primaryKey}
    - Title/Name: ${candidate.title}
    - Secondary/Contact: ${candidate.secondaryText}
    - Content/Payload: ${candidate.content}
    - Category: ${candidate.category}

    RECORD B (EXISTING DATABASE ENTRY):
    - Primary ID: ${existing.primaryKey}
    - Title/Name: ${existing.title}
    - Secondary/Contact: ${existing.secondaryText}
    - Content/Payload: ${existing.content}
    - Category: ${existing.category}

    Analyze the contextual meanings, business domain, distinct attributes (e.g. different locations, departments, SKU versions, middle initials, transaction timestamps, or clinical dosages).
    Is Record A a False Positive (should be allowed into DB) or a True Duplicate (should be rejected/merged)?
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a high-precision Data Redundancy Auditor. Carefully distinguish false positives from genuine duplicate records.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFalsePositive: {
              type: Type.BOOLEAN,
              description: 'True if records are distinct entities/false positive match; False if true duplicate.',
            },
            confidenceScore: {
              type: Type.INTEGER,
              description: 'Confidence level from 0 to 100.',
            },
            reasoning: {
              type: Type.STRING,
              description: 'Clear, concise rationale explaining why it is or is not a false positive.',
            },
            keyDifferences: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of specific distinct attributes or field variations.',
            },
            recommendedAction: {
              type: Type.STRING,
              enum: ['APPEND', 'REJECT', 'MERGE', 'HUMAN_REVIEW'],
              description: 'Action to take on the incoming candidate record.',
            },
          },
          required: ['isFalsePositive', 'confidenceScore', 'reasoning', 'keyDifferences', 'recommendedAction'],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim()) as AIAnalysisResult;
      return parsed;
    }
  } catch (err) {
    console.error('Gemini false positive analysis error:', err);
  }

  // Graceful fallback
  return {
    isFalsePositive: false,
    confidenceScore: 60,
    reasoning: 'AI analysis encountered a transient error. Relying on fuzzy threshold classification.',
    keyDifferences: fieldScores
      .filter((f) => f.similarityScore < 1.0)
      .map((f) => `${f.field} differs`),
    recommendedAction: similarityScore > 0.88 ? 'REJECT' : 'HUMAN_REVIEW',
  };
}


import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DiscoveryResult, AppLanguage, InterviewFeedback, SearchPreferences } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const discoverJobs = async (cvFile: File, prefs: SearchPreferences, language: AppLanguage): Promise<DiscoveryResult> => {
  const cvPart = await fileToGenerativePart(cvFile);
  
  const languageNames = {
    'en': 'English',
    'fr': 'French',
    'zh': 'Chinese (Simplified)'
  };

  const targetLanguage = languageNames[language];

  // Constructing a detailed prompt based on preferences
  const preferencesString = `
    Location: ${prefs.location || 'Global/Remote'}
    Desired Role: ${prefs.role || 'Based on CV analysis'}
    Keywords: ${prefs.keywords || 'N/A'}
    Industry: ${prefs.industry || 'N/A'}
    Experience Level: ${prefs.experienceLevel || 'Based on CV'}
    Company Size: ${prefs.companySize || 'Any'}
  `;

  const prompt = `
    You are an elite AI Career Coach and Recruitment Specialist. 
    
    PHASE 1: DEEP PROFILE ANALYSIS
    Analyze the attached CV to identify the candidate's core skills, experience level, and unique value proposition.
    
    PHASE 2: STRATEGIC CAREER PATHS
    Based on the analysis, define 4 distinct, viable career paths:
    1. "The Logical Step" (Direct progression)
    2. "The Strategic Pivot" (Transferable skills to a new domain)
    3. "The Ambitious Reach" (High growth potential)
    4. "The Emerging Opportunity" (New market trends, AI, or specific niche)

    PHASE 3: MARKET INTELLIGENCE (SEARCH EXECUTION)
    Use Google Search to find ACTUAL, LIVE job listings that match the user's specific preferences:
    ${preferencesString}
    
    - You MUST perform specific searches. Example search queries to use: 
      "${prefs.role} jobs in ${prefs.location} ${prefs.industry} ${prefs.keywords}"
      "${prefs.role} hiring ${prefs.location} ${prefs.companySize} companies"
      
    - Filter for listings that appear to be currently active (posted recently).
    - Look for credible sources like company career pages, LinkedIn, Indeed, Welcome to the Jungle, or major job boards.
    
    PHASE 4: DATA EXTRACTION & OUTPUT
    Compile the findings into a JSON object. Do not include any conversational text before or after the JSON.
    
    CRITICAL RULES FOR "foundJobs":
    - **VALIDITY**: ONLY include jobs found in the search results. DO NOT fabricate or hallucinate jobs.
    - **SOURCE**: You MUST include the URL found in the search result.
    - **QUANTITY**: Find at least 8-12 relevant, real opportunities. Broaden your search if necessary to meet this quantity.
    
    LANGUAGE RULE:
    - The "marketInsights", "title", "description" and "matchReason" fields MUST be written in ${targetLanguage}.
    
    The JSON structure must be:
    {
      "suggestedPaths": [
        { "title": "string", "description": "string", "matchReason": "string" }
      ],
      "foundJobs": [
        { "title": "string", "company": "string", "location": "string", "snippet": "string", "url": "string" }
      ],
      "marketInsights": "string (A brief 2-3 sentence executive summary of the current job market for this profile in this location, mentioning how well it aligns with their industry/size preferences)"
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        cvPart,
        { text: prompt }
      ]
    },
    config: {
      tools: [{ googleSearch: {} }], // Enable Search
      // responseMimeType and responseSchema are NOT supported when using tools in this context.
    }
  });

  if (!response.text) {
    throw new Error("No response from AI Coach");
  }

  const text = response.text;

  // Helper to validate the parsed object
  const isValidResult = (obj: any): obj is DiscoveryResult => {
    return obj && Array.isArray(obj.suggestedPaths) && Array.isArray(obj.foundJobs);
  };

  // Strategy 1: Attempt to extract JSON from Markdown code blocks.
  // We iterate backwards to find the last valid block, as the model often "corrects" itself or outputs the final answer last.
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  const matches = [...text.matchAll(codeBlockRegex)];

  for (let i = matches.length - 1; i >= 0; i--) {
    try {
      const jsonStr = matches[i][1];
      const parsed = JSON.parse(jsonStr);
      if (isValidResult(parsed)) return parsed;
    } catch (e) {
      // Continue to check other blocks if this one fails
    }
  }

  // Strategy 2: If no code blocks (or all failed), try extracting the outermost JSON object (between first { and last })
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const jsonStr = text.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonStr);
      if (isValidResult(parsed)) return parsed;
    } catch (e) {
      console.warn("Failed to parse JSON via brace extraction", e);
    }
  }

  console.error("Failed to parse discovery JSON. Raw text:", text);
  throw new Error("Failed to parse career discovery results. Please try again.");
};

export const analyzeCV = async (cvFile: File, jdText: string): Promise<AnalysisResult> => {
  const cvPart = await fileToGenerativePart(cvFile);
  
  const prompt = `
    You are an expert Career Coach and HR Specialist with deep knowledge of ATS systems and multi-lingual resume standards. 
    Analyze the attached CV (PDF) against the following Job Description (JD).
    
    JOB DESCRIPTION:
    "${jdText}"

    1. DETECT LANGUAGE: Identify the primary language of the uploaded CV (e.g., English, French, Spanish).
    2. OUTPUT LANGUAGE: All generated text (Analysis, Score Reasons, Suggested Summary, Improvements, Rewritten Versions, Interview Prep) MUST be in the DETECTED LANGUAGE of the CV.
    
    CRITICAL FORMATTING RULES BY LANGUAGE:
    - **IF FRENCH**: 
       - Use the **INFINITIVE** form for verbs at the start of bullet points (e.g., "Gérer", "Développer", "Optimiser", "Créer"). 
       - NEVER use the first person ("Je", "J'ai") or conjugated verbs at the start.
       - Use standard French typographic conventions.
    - **IF ENGLISH**: 
       - Use strong **ACTION VERBS** in the **PAST TENSE** for past roles (e.g., "Managed", "Developed") and Present Tense for current roles.
    
    Provide a structured response with:
    1. "Score": A strict match score (0-100) representing how well the candidate fits the role.
    2. "Score Breakdown": Break down the score into 4 categories. Provide a score (0-100) and a very brief reason (5-6 words) for each.
    3. "Candidate Analysis": A brief, high-level assessment of the candidate's fit (2 sentences max).
    4. "Suggested Profile Summary": A polished, professional summary paragraph (3-4 lines) specifically written to be placed at the very top (Header) of the candidate's CV. It must be impactful and tailored to the JD.
    5. "Improvements": A list of 4 specific, actionable improvements. 
       - Keep the "suggestion" text CONCISE (1-2 sentences max).
       - Focus on high-impact changes.
    6. Two distinct versions of content rewriting (IN THE DETECTED LANGUAGE):
       a) "Beautiful Version": Focus on impactful storytelling, specific language conventions (Infinitive for French), and structure suitable for a human reader. Give design tips.
       b) "ATS Version": Focus on keyword optimization, simple formatting, and clarity for parsing algorithms. List keywords used.
    7. Key points to prepare for an interview.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        cvPart,
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          detectedLanguage: { type: Type.STRING, description: "The detected language of the CV (e.g., 'French', 'English')"},
          score: { type: Type.NUMBER, description: "Overall match score 0-100" },
          scoreBreakdown: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                score: { type: Type.NUMBER },
                reason: { type: Type.STRING }
              }
            }
          },
          candidateAnalysis: { type: Type.STRING },
          suggestedProfileSummary: { type: Type.STRING, description: "Text to copy-paste into the CV header" },
          improvements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                suggestion: { type: Type.STRING }
              }
            }
          },
          beautifulVersion: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING, description: "Full CV content rewriting suggestions in Markdown" },
              designTips: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "content", "designTips"]
          },
          atsVersion: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING, description: "Full CV content rewriting suggestions in Markdown (Plain text focused)" },
              keywordsIncluded: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "content", "keywordsIncluded"]
          },
          interviewPrepPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["detectedLanguage", "score", "scoreBreakdown", "candidateAnalysis", "suggestedProfileSummary", "improvements", "beautifulVersion", "atsVersion", "interviewPrepPoints"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text) as AnalysisResult;
};

export const generateInterviewFeedback = async (transcript: {role: string, text: string}[], language: AppLanguage): Promise<InterviewFeedback> => {
  const languageNames = {
    'en': 'English',
    'fr': 'French',
    'zh': 'Chinese (Simplified)'
  };
  const targetLanguage = languageNames[language] || 'English';

  const prompt = `
    You are an expert Interview Coach. Analyze the following interview transcript between an AI Interviewer and a Candidate.
    
    TARGET LANGUAGE FOR REPORT: ${targetLanguage}.
    
    TRANSCRIPT:
    ${JSON.stringify(transcript)}
    
    Evaluate the candidate's performance based on:
    1. Relevance of answers.
    2. Clarity and Tone.
    3. Content quality (did they provide examples?).
    
    Provide a detailed JSON report containing:
    - overallScore (0-100)
    - toneAnalysis (Adjectives describing the tone, e.g., "Confident", "Hesitant", "Too casual")
    - strengths (List of 3 key strengths)
    - improvements (List of 3 areas to improve)
    - qaFeedback: An array of objects for the most significant 2-3 exchanges. For each, provide:
       - question (Summary of what was asked)
       - userAnswer (Summary of what candidate said)
       - critique (Specific feedback on what was good/bad)
       - improvedVersion (A better way to answer this in the first person)
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { text: prompt },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          toneAnalysis: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          qaFeedback: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                userAnswer: { type: Type.STRING },
                critique: { type: Type.STRING },
                improvedVersion: { type: Type.STRING }
              }
            }
          }
        },
        required: ["overallScore", "toneAnalysis", "strengths", "improvements", "qaFeedback"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini Feedback");
  }

  return JSON.parse(response.text) as InterviewFeedback;
};

import { RoundDefinition, RoundNumber } from '../types';

export const COMPETITION_ROUNDS: Record<RoundNumber, RoundDefinition> = {
  1: {
    round_number: 1,
    title: 'Round 1 — Cyber Styling',
    subtitle: 'All registered teams participate in the theme design challenge',
    max_marks: 25,
    target_qualifiers_per_room: 7,
    tie_breaker_order: ['prompt_quality', 'creativity', 'functionality', 'output', 'timing'],
    description: 'Create an innovative and responsive web interface using refined prompts.',
    criteria: [
      {
        id: 'creativity',
        name: 'Creativity / Originality',
        description: 'Fresh ideas, not just generic designs',
        max: 5,
      },
      {
        id: 'functionality',
        name: 'Functionality',
        description: 'The webpage works correctly, including buttons, links, and scripts',
        max: 5,
      },
      {
        id: 'timing',
        name: 'Timing',
        description: 'Submission was completed within the required time',
        max: 5,
      },
      {
        id: 'output',
        name: 'Output Quality',
        description: 'Final webpage matches the selected theme and has good visual quality',
        max: 5,
      },
      {
        id: 'prompt_quality',
        name: 'Prompt Quality',
        description: 'Prompts are clear, specific, and refined',
        max: 5,
      },
    ],
  },
  2: {
    round_number: 2,
    title: 'Round 2 — BugX Hacker',
    subtitle: 'Top 7 teams per classroom engage in problem-solving and cyber deciphering',
    max_marks: 25,
    target_qualifiers_per_room: 4,
    tie_breaker_order: ['password', 'code_word', 'speed'],
    description: 'Decipher protected strings, locate vulnerabilities, and solve against the clock.',
    criteria: [
      {
        id: 'password',
        name: 'Correct Password',
        description: 'Deciphered the secret key correctly',
        max: 10,
      },
      {
        id: 'code_word',
        name: 'Correct Code Word',
        description: 'Identified the target vulnerability codeword',
        max: 8,
      },
      {
        id: 'speed',
        name: 'Speed Marks (Calculated from Solve Time)',
        description: '<=8m: 7pts | 8-12m: 5pts | 12-16m: 3pts | 16-20m: 1pt | >20m: 0pts',
        max: 7,
      },
    ],
  },
  3: {
    round_number: 3,
    title: 'Round 3 — Prompt Rumble',
    subtitle: 'Top 4 teams per classroom craft storytelling AI advertising concepts',
    max_marks: 25,
    target_qualifiers_per_room: 2,
    tie_breaker_order: ['creativity', 'storytelling', 'ai_usage', 'ad_quality', 'images_and_words'],
    description: 'Generate a cohesive commercial campaign incorporating 3 mandatory images and 3 designated keywords.',
    criteria: [
      {
        id: 'creativity',
        name: 'Creativity',
        description: 'Originality of idea and visual treatment',
        max: 5,
      },
      {
        id: 'images_and_words',
        name: 'Use of 3 Images + 3 Words',
        description: 'All supplied images and words are incorporated appropriately',
        max: 5,
      },
      {
        id: 'storytelling',
        name: 'Storytelling',
        description: 'Clear narrative structure and emotional delivery',
        max: 5,
      },
      {
        id: 'ai_usage',
        name: 'Prompt / AI Usage',
        description: 'Effective and specific application of AI tools',
        max: 5,
      },
      {
        id: 'ad_quality',
        name: 'Final Ad Quality',
        description: 'Overall polish and quality of the advertisement',
        max: 5,
      },
    ],
  },
  4: {
    round_number: 4,
    title: 'Round 4 — Prompt Charades',
    subtitle: 'The 8 Grand Finalists compete across all classrooms for the Championship',
    max_marks: 25,
    target_qualifiers_per_room: 0, // Final round
    tie_breaker_order: ['similarity', 'communication', 'prompt_quality', 'visual_interpretation'],
    description: 'Describers communicate concepts without naming them; guesser generates the closest visual reproduction.',
    criteria: [
      {
        id: 'communication',
        name: 'Communication',
        description: 'Describers communicate effectively without naming the picture',
        max: 5,
      },
      {
        id: 'prompt_quality',
        name: 'Prompt Quality',
        description: 'Guesser creates a clear, structured, and detailed prompt',
        max: 5,
      },
      {
        id: 'visual_interpretation',
        name: 'Visual Interpretation',
        description: 'Key geometric and artistic components of the picture are understood',
        max: 5,
      },
      {
        id: 'similarity',
        name: 'Similarity to Original',
        description: 'Generated output closely matches the original target picture',
        max: 10,
      },
    ],
  },
};

export function calculateRound2SpeedMarks(solveTimeMinutes: number | undefined | null): number {
  if (solveTimeMinutes === undefined || solveTimeMinutes === null || isNaN(solveTimeMinutes)) {
    return 0;
  }
  if (solveTimeMinutes <= 8) return 7;
  if (solveTimeMinutes <= 12) return 5;
  if (solveTimeMinutes <= 16) return 3;
  if (solveTimeMinutes <= 20) return 1;
  return 0;
}

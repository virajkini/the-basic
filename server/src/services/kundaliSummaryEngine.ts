import { DashakootApiResponse, CompatibilityTier, KootaStatus } from '../models/kundaliMatch.js';

type KootaName =
  | 'dina' | 'gana' | 'yoni' | 'rashi' | 'rasyadhipati'
  | 'rajju' | 'vedha' | 'vashya' | 'mahendra' | 'streeDeergha';

const TIER_TEMPLATES: Record<CompatibilityTier, string> = {
  LOW: 'The overall compatibility score falls below the traditionally recommended range. While some favorable factors may be present, several important compatibility indicators show weaker alignment. This match may require considerable understanding, communication, and mutual effort to build long-term harmony.',
  FAIR: 'This match meets the traditional minimum compatibility threshold. The horoscope comparison indicates a balanced mix of strengths and areas requiring attention. With mutual understanding and shared values, the relationship has the potential to develop into a stable partnership.',
  GOOD: 'This match demonstrates good overall compatibility. Several important matching factors show favorable alignment, suggesting a healthy foundation for mutual understanding, companionship, and long-term harmony.',
  VERY_GOOD: 'This is a strong compatibility match with positive indications across most matching parameters. The horoscope comparison suggests a balanced relationship with good emotional, practical, and interpersonal compatibility.',
  EXCELLENT: 'This is an excellent compatibility match with exceptionally favorable results across multiple traditional matching parameters. The horoscope comparison indicates strong potential for harmony, understanding, and long-term partnership.',
};

const STRENGTH_PARAGRAPHS: Record<KootaName, string> = {
  dina: 'Dina compatibility is favorable, indicating good day-to-day understanding, support, and overall harmony between the partners.',
  gana: 'Gana compatibility suggests similar temperaments and a natural ability to understand each other\'s personality traits and emotional tendencies.',
  yoni: 'Yoni compatibility indicates healthy attraction, comfort, and interpersonal chemistry, supporting closeness and mutual affection.',
  rashi: 'Rashi compatibility reflects emotional harmony and a positive flow of understanding between the partners.',
  rasyadhipati: 'Planetary lord compatibility is highly favorable, indicating friendship, cooperation, and mutual support at a deeper level.',
  rajju: 'Rajju compatibility is favorable, which is traditionally considered an important indicator for stability, longevity, and well-being in married life.',
  vedha: 'Vedha compatibility is positive, suggesting fewer obstacles and smoother interactions between the partners.',
  vashya: 'Vashya compatibility indicates a balanced influence and cooperative nature within the relationship.',
  mahendra: 'Mahendra compatibility is favorable and is traditionally associated with prosperity, growth, support, and overall well-being in marriage.',
  streeDeergha: 'Stree Deergha compatibility is favorable and indicates support for long-term marital harmony and mutual care.',
};

const CHALLENGE_PARAGRAPHS: Record<KootaName, string> = {
  rajju: 'Rajju compatibility is traditionally considered one of the most significant matching factors. A mismatch here is often viewed with caution and may warrant additional consultation.',
  rashi: 'Rashi compatibility receives no points, indicating possible differences in emotional outlook, family values, or overall approach to life. Open communication becomes especially important in such cases.',
  gana: 'Gana compatibility is not favorable, suggesting differences in temperament, emotional expression, or behavioral tendencies. Greater understanding and patience may help bridge these differences.',
  mahendra: 'Mahendra compatibility is not favorable, suggesting that traditional indicators related to growth, prosperity, and support are comparatively weaker.',
  streeDeergha: 'Stree Deergha compatibility is not favorable, indicating that some traditional indicators related to long-term marital harmony are less supportive.',
  yoni: 'Yoni compatibility is weak, which may suggest differences in intimacy, comfort, or interpersonal chemistry.',
  dina: 'Dina compatibility is weak, indicating that day-to-day understanding and adjustment may require additional effort.',
  rasyadhipati: 'Planetary lord compatibility is weak, suggesting fewer natural indicators of friendship and mutual support.',
  vedha: 'Vedha compatibility is not favorable, indicating the possibility of additional challenges or misunderstandings.',
  vashya: 'Vashya compatibility is weak, suggesting that balancing influence and expectations within the relationship may require conscious effort.',
};

const STRENGTH_PRIORITY: KootaName[] = [
  'rajju', 'rasyadhipati', 'rashi', 'gana', 'yoni', 'dina', 'mahendra', 'streeDeergha', 'vedha', 'vashya',
];

const CHALLENGE_PRIORITY: KootaName[] = [
  'rajju', 'rashi', 'gana', 'mahendra', 'streeDeergha', 'yoni', 'dina', 'rasyadhipati', 'vedha', 'vashya',
];

const CONCLUSION_TEMPLATES: Array<{ minScore: number; text: string }> = [
  {
    minScore: 31,
    text: 'Overall, this appears to be an exceptional match with strong traditional compatibility indicators. The horoscope comparison suggests excellent potential for harmony, mutual understanding, and long-term happiness.',
  },
  {
    minScore: 26,
    text: 'Overall, this appears to be a very promising match with strong compatibility across several important dimensions. The relationship benefits from multiple favorable indicators supporting stability and mutual growth.',
  },
  {
    minScore: 22,
    text: 'Overall, this match falls within the good compatibility range. The horoscope comparison highlights several strengths while also identifying a few areas where understanding and communication can further strengthen the relationship.',
  },
  {
    minScore: 18,
    text: 'Overall, this match falls within the acceptable compatibility range. While several important indicators are favorable, success in the relationship may depend on communication, understanding, and shared commitment from both partners.',
  },
  {
    minScore: 0,
    text: 'Overall, the horoscope comparison highlights both strengths and challenges. Careful consideration of individual compatibility, values, communication, and family expectations is recommended alongside astrological factors.',
  },
];

export function getTier(receivedPoints: number): CompatibilityTier {
  if (receivedPoints >= 31) return 'EXCELLENT';
  if (receivedPoints >= 26) return 'VERY_GOOD';
  if (receivedPoints >= 22) return 'GOOD';
  if (receivedPoints >= 18) return 'FAIR';
  return 'LOW';
}

function classifyKoota(total: number, received: number): KootaStatus {
  if (received === total) return 'STRONG';
  if (received === 0) return 'WEAK';
  return 'MODERATE';
}

export function generateSummary(result: DashakootApiResponse): string {
  const { total } = result;
  const received = total.received_points;
  const tier = getTier(received);

  const opening = TIER_TEMPLATES[tier];

  // Classify all kootas
  const kootaStatuses = new Map<KootaName, KootaStatus>();
  const kootaNames: KootaName[] = [
    'dina', 'gana', 'yoni', 'rashi', 'rasyadhipati',
    'rajju', 'vedha', 'vashya', 'mahendra', 'streeDeergha',
  ];
  for (const name of kootaNames) {
    const koota = result[name];
    kootaStatuses.set(name, classifyKoota(koota.total_points, koota.received_points));
  }

  // Top 3 strengths (STRONG kootas, in priority order)
  const strengths = STRENGTH_PRIORITY
    .filter((name) => kootaStatuses.get(name) === 'STRONG')
    .slice(0, 3);

  // Top 2 challenges (WEAK kootas, in priority order)
  const challenges = CHALLENGE_PRIORITY
    .filter((name) => kootaStatuses.get(name) === 'WEAK')
    .slice(0, 2);

  // Score context
  const meetsMinimum = received >= total.minimum_required;
  const scoreContext = meetsMinimum
    ? `The couple achieves ${received} out of ${total.total_points} points, which meets the traditionally recommended minimum compatibility threshold of ${total.minimum_required} points.`
    : `The couple achieves ${received} out of ${total.total_points} points, which falls below the traditionally recommended minimum compatibility threshold of ${total.minimum_required} points.`;

  // Conclusion
  const conclusion = CONCLUSION_TEMPLATES.find((t) => received >= t.minScore)!.text;

  const parts: string[] = [opening];
  for (const name of strengths) parts.push(STRENGTH_PARAGRAPHS[name]);
  for (const name of challenges) parts.push(CHALLENGE_PARAGRAPHS[name]);
  parts.push(scoreContext);
  parts.push(conclusion);

  return parts.join('\n\n');
}

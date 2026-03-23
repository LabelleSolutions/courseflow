'use strict';

/**
 * VietnameseESLAnalyzer
 *
 * Detects common mother-tongue interference patterns that Vietnamese speakers
 * exhibit when producing American English. Each pattern is described by a
 * strict regular expression so that the analysis is deterministic and
 * independent of any external AI service.
 *
 * Interference types detected:
 *   - dropped_ending_consonant : final consonants omitted (e.g. "ligh" for "light")
 *   - lr_confusion             : /l/ and /r/ swapped (e.g. "rive" for "live")
 *   - th_substitution          : /ð/ or /θ/ replaced by /d/, /t/, or /z/
 *   - final_consonant_cluster  : consonant clusters at end of syllable reduced
 *   - vowel_shortening         : long vowels shortened or merged with adjacent vowels
 */
class VietnameseESLAnalyzer {
  constructor() {
    // Each entry maps an interference type to its drill metadata.
    this._rules = [
      {
        type: 'dropped_ending_consonant',
        label: 'Dropped ending consonant',
        drillCommand: 'Repeat the word slowly, making sure to touch your teeth or lips for the final sound',
        repetitions: 5,
      },
      {
        type: 'lr_confusion',
        label: 'L / R confusion',
        drillCommand: 'Practice "la-la-la" then "ra-ra-ra", feeling where your tongue touches',
        repetitions: 10,
      },
      {
        type: 'th_substitution',
        label: 'TH sound substitution',
        // /ð/ → /d/ or /z/  ;  /θ/ → /t/ or /s/
        // Matches: "dis/dat/dem/dose/dere/dey/dese/dough" and "tink/tree/trow/trone"
        pattern: /\b(d(?:is|at|em|ose|ere|ey|ese|ough)|t(?:ink|ree|row|rone))\b/gi,
        drillCommand: 'Place your tongue lightly between your teeth and blow air to make the TH sound',
        repetitions: 8,
      },
      {
        type: 'final_consonant_cluster',
        label: 'Final consonant cluster reduction',
        drillCommand: 'Clap once for each consonant at the end of the word',
        repetitions: 6,
      },
      {
        type: 'vowel_shortening',
        label: 'Vowel shortening / monophthongisation',
        drillCommand: 'Open your mouth wider and hold the vowel sound for two full beats',
        repetitions: 5,
      },
    ];
  }

  /**
   * analyzeInterference
   *
   * Compares the student's transcript against the target sentence to detect
   * the most prominent Vietnamese ESL interference pattern.
   *
   * @param {string} transcript     – what the student actually said
   * @param {string} targetSentence – what they were supposed to say
   * @returns {{ type: string, words: string[], label: string } | null}
   */
  analyzeInterference(transcript, targetSentence) {
    if (!transcript || !targetSentence) return null;

    const t = transcript.toLowerCase().trim();
    const target = targetSentence.toLowerCase().trim();

    // --- L/R confusion: compare corresponding words ---
    const tWords = t.split(/\s+/);
    const targetWords = target.split(/\s+/);
    const lrConfused = [];
    for (let i = 0; i < Math.min(tWords.length, targetWords.length); i++) {
      const tw = tWords[i].replace(/[^a-z]/g, '');
      const sv = targetWords[i].replace(/[^a-z]/g, '');
      if (tw.length > 0 && sv.length > 0) {
        if (
          (tw.startsWith('r') && sv.startsWith('l')) ||
          (tw.startsWith('l') && sv.startsWith('r'))
        ) {
          lrConfused.push(tw);
        }
      }
    }
    if (lrConfused.length > 0) {
      return { type: 'lr_confusion', words: lrConfused, label: 'L / R confusion' };
    }

    // --- TH substitution ---
    const thRule = this._rules.find(r => r.type === 'th_substitution');
    const thMatches = [...t.matchAll(thRule.pattern)].map(m => m[0]);
    if (thMatches.length > 0) {
      return { type: 'th_substitution', words: thMatches, label: 'TH sound substitution' };
    }

    // --- Dropped ending consonant: target word ends with consonant, transcript word doesn't ---
    const droppedWords = [];
    for (let i = 0; i < Math.min(tWords.length, targetWords.length); i++) {
      const tw = tWords[i].replace(/[^a-z]/g, '');
      const sv = targetWords[i].replace(/[^a-z]/g, '');
      if (tw.length > 0 && sv.length > 1) {
        const svEndsConsonant = /[bcdfghjklmnpqrstvwxyz]$/.test(sv);
        const twEndsVowel = /[aeiou]$/.test(tw);
        if (svEndsConsonant && twEndsVowel && tw.length < sv.length) {
          droppedWords.push(tw);
        }
      }
    }
    if (droppedWords.length > 0) {
      return {
        type: 'dropped_ending_consonant',
        words: droppedWords,
        label: 'Dropped ending consonant',
      };
    }

    // --- Final consonant cluster reduction ---
    const clusterWords = [];
    for (let i = 0; i < Math.min(tWords.length, targetWords.length); i++) {
      const tw = tWords[i].replace(/[^a-z]/g, '');
      const sv = targetWords[i].replace(/[^a-z]/g, '');
      if (tw.length > 0 && sv.length > 0) {
        const svCluster = /(?:st|nd|ld|nk|sk|ft|pt|kt)$/.test(sv);
        const twNoCluster = tw.length < sv.length && !new RegExp(sv.slice(-2) + '$').test(tw);
        if (svCluster && twNoCluster) {
          clusterWords.push(tw);
        }
      }
    }
    if (clusterWords.length > 0) {
      return {
        type: 'final_consonant_cluster',
        words: clusterWords,
        label: 'Final consonant cluster reduction',
      };
    }

    // --- Vowel shortening: target has a long-vowel pattern that the transcript lacks ---
    // Detects two sub-patterns:
    //  1. CVCe (silent-e): target ends in 'e', transcript does not (e.g. "make" → "mak")
    //  2. Vowel digraphs / diphthongs: target has ai/ay/ee/ea/oa/igh/ou, transcript doesn't
    const digraphPattern = /(?:ai|ay|ee|ea|oa|igh|ou)/;
    const vowelShortenedWords = [];
    for (let i = 0; i < Math.min(tWords.length, targetWords.length); i++) {
      const tw = tWords[i].replace(/[^a-z]/g, '');
      const sv = targetWords[i].replace(/[^a-z]/g, '');
      if (tw.length > 0 && sv.length > 1) {
        const silentEDropped = sv.endsWith('e') && !tw.endsWith('e') && tw.length < sv.length;
        const digraphDropped = digraphPattern.test(sv) && !digraphPattern.test(tw);
        if (silentEDropped || digraphDropped) {
          vowelShortenedWords.push(tw);
        }
      }
    }
    if (vowelShortenedWords.length > 0) {
      return {
        type: 'vowel_shortening',
        words: vowelShortenedWords,
        label: 'Vowel shortening / monophthongisation',
      };
    }

    return null;
  }

  /**
   * generateCorrection
   *
   * Produces structured drill instructions for a given interference type.
   *
   * @param {string}   type  – interference type key
   * @param {string[]} words – words where the issue was found
   * @returns {{ issue: string, command: string, repetitions: number, words: string[] }}
   */
  generateCorrection(type, words) {
    const rule = this._rules.find(r => r.type === type);
    if (!rule) {
      return {
        issue: 'General pronunciation issue',
        command: 'Practice the sentence slowly, word by word',
        repetitions: 5,
        words: words || [],
      };
    }
    return {
      issue: rule.label,
      command: rule.drillCommand,
      repetitions: rule.repetitions,
      words: words || [],
    };
  }

  /**
   * scorePerformance
   *
   * Produces a simple 0–100 score based on whether interference was detected
   * and how many attempts the student has made.
   *
   * @param {{ type: string } | null} detectedIssue
   * @param {number} attemptCount
   * @returns {number}
   */
  scorePerformance(detectedIssue, attemptCount) {
    const attempts = Math.max(1, Number(attemptCount) || 1);

    if (!detectedIssue) {
      // No interference found – high base score, capped at 100
      return Math.min(100, 85 + Math.floor(10 / attempts));
    }

    // Severity penalty by interference type
    const penalties = {
      th_substitution: 25,
      lr_confusion: 20,
      dropped_ending_consonant: 15,
      final_consonant_cluster: 12,
      vowel_shortening: 10,
    };

    const penalty = penalties[detectedIssue.type] || 15;

    // Score improves with successive attempts (learner is practising)
    const attemptBonus = Math.min(15, (attempts - 1) * 5);

    return Math.max(0, Math.min(100, 100 - penalty + attemptBonus));
  }
}

module.exports = VietnameseESLAnalyzer;

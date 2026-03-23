'use strict';

const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const VietnameseESLAnalyzer = require('../analyzer');

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required but not set.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const analyzer = new VietnameseESLAnalyzer();

/**
 * POST /api/ai/analyze-speech
 *
 * Accepts a student's speech transcript, runs the local Vietnamese ESL
 * interference detector, then passes the structured findings to Google
 * Gemini to produce natural, encouraging coaching feedback.
 *
 * Request body:
 *   transcript     {string}  – what the student actually said
 *   targetSentence {string}  – the sentence they were aiming for
 *   attemptCount   {number}  – how many times they have tried (default 1)
 *
 * Response:
 *   success        {boolean}
 *   feedback       {string}  – Gemini's friendly coaching text
 *   technicalData  {object}  – raw output from VietnameseESLAnalyzer
 *   score          {number}  – 0–100 performance score
 */
router.post('/analyze-speech', async (req, res) => {
  try {
    const { transcript, targetSentence, attemptCount = 1 } = req.body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      return res.status(400).json({ success: false, error: 'transcript is required and must be a non-empty string.' });
    }
    if (!targetSentence || typeof targetSentence !== 'string' || targetSentence.trim() === '') {
      return res.status(400).json({ success: false, error: 'targetSentence is required and must be a non-empty string.' });
    }

    // Step 1: Run the custom regex-based interference detector
    const detectedIssue = analyzer.analyzeInterference(transcript, targetSentence);

    let issueContext = 'No major Vietnamese interference detected. Great effort!';
    let recommendedDrill = '';

    if (detectedIssue) {
      const correctionData = analyzer.generateCorrection(detectedIssue.type, detectedIssue.words);
      issueContext = `Detected Issue: ${correctionData.issue}`;
      if (correctionData.words && correctionData.words.length > 0) {
        issueContext += ` (affected words: ${correctionData.words.join(', ')})`;
      }
      recommendedDrill = `Recommended Drill: ${correctionData.command} (${correctionData.repetitions} repetitions).`;
    }

    // Step 2: Build a score from the technical analysis
    const score = analyzer.scorePerformance(detectedIssue, attemptCount);

    // Step 3: Ask Gemini to turn the technical findings into friendly coaching
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction:
        'You are a highly encouraging American English pronunciation coach specialising in helping Vietnamese native speakers. ' +
        'You have been given a technical analysis of the student\'s pronunciation. ' +
        'Use that analysis to write 2–3 sentences of warm, specific, and motivating feedback. ' +
        'Avoid jargon; speak directly to the student in a friendly tone.',
    });

    const prompt = `Target sentence: "${targetSentence}"
Student said: "${transcript}"

Technical analysis:
- ${issueContext}
- ${recommendedDrill}
- Performance score: ${score}/100 (attempt #${attemptCount})

Please turn these findings into a friendly, encouraging coaching message for the student.`;

    const result = await model.generateContent(prompt);
    const feedback = result.response.text();

    res.json({
      success: true,
      feedback,
      technicalData: detectedIssue,
      score,
    });
  } catch (error) {
    console.error('AI Route Error:', error);
    const isAIError = error.message && error.message.toLowerCase().includes('google');
    res.status(500).json({
      success: false,
      error: isAIError ? 'AI service unavailable. Please try again later.' : 'Failed to analyze speech.',
    });
  }
});

module.exports = router;

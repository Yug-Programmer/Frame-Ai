import { TopicAnalysis } from '../types/index.js';

export function buildGenerateScriptPrompt(
  analysis: TopicAnalysis,
  userInstruction?: string,
  factualContext?: string
): string {
  const targetDuration = analysis.duration || 30;
  // Rule of thumb for speech: ~2.5 words per second
  const targetWordCount = Math.round(targetDuration * 2.5);
  const numScenes = Math.max(3, Math.min(8, Math.round(targetDuration / 6)));
  const isActionStory =
    analysis.isExperiential ||
    analysis.contentType === 'action_experience' ||
    analysis.contentType === 'first_person_pov';

  return `You are an award-winning short-form video director and viral scriptwriter for the Qoneqt Global Feed.
Create a complete narrative script based on this analysis:
- Topic: ${analysis.topic}
- Intent: ${analysis.intent}
- Content Type: ${analysis.contentType} (isActionStory: ${isActionStory})
- Audience: ${analysis.audience}
- Tone: ${analysis.tone}
- Target Duration: ${targetDuration} seconds (~${targetWordCount} spoken words total across all scenes)
- Angle: ${analysis.angle}
${factualContext ? `\nVerified Real-World Knowledge / Context:\n${factualContext}\n` : ''}
${userInstruction ? `- Specific User Revision Instruction: "${userInstruction}"` : ''}

CRITICAL STORYTELLING & MOTION RULES:
${
  isActionStory
    ? `1. EXPERIENTIAL ACTION NARRATIVE: The user wants an immersive, first-person action experience (e.g. playing cricket with Virat Kohli, racing, superhero battle, space mission).
   - Write in FIRST PERSON ("I", "we", "my") or thrilling live action commentary.
   - Do NOT write an educational biography or dry facts. Make the viewer FEEL they are right there in the moment!
   - Hook in Scene 1: An intense high-stakes moment (e.g. stepping onto the pitch under stadium lights, final over needed).
   - Climax in middle scenes: Key action moment (e.g. facing the delivery, hitting the shot, high-fiving Virat).
   - Celebration in final scene: The victory roar, crowd explosion, and community CTA.`
    : `1. EDUCATIONAL EXPLAINER: Deliver engaging, concise insights with a hook, key revelations, and community takeaway.`
}
2. Divide the video into approximately ${numScenes} scenes.
3. The sum of scene durations MUST approximately equal ${targetDuration} seconds.
4. Every scene MUST have:
   - "id": incremental integer (1, 2, 3...)
   - "duration": integer seconds (typically 4 to 8 seconds per scene)
   - "narration": punchy, spoken voiceover script (10-20 words per scene)
   - "visualPrompt": detailed, photorealistic prompt for 9:16 vertical cinematic generation. Must describe subject, action, camera angle, and lighting (e.g. "Cinematic 9:16 vertical shot: young cricket batsman in blue Indian kit facing bowler at the crease, Virat Kohli at non-striker end, packed stadium at night under bright floodlights, motion blur, 8k resolution").
   - "searchQuery": 2 to 4 tangible photographic keywords specific to this scene. Must explicitly include main characters (e.g. "cricket match batsman Virat Kohli pitch", "cricket stadium crowd floodlights").
   - "caption": 3 to 6 word lively on-screen caption with an expressive icon/emoji (e.g. "🏏 Walking Out With King Kohli", "⚡ The Final Over", "💥 Six Into The Stands!", "🏆 Victory Roar")
   - "motion": one of "action-shake", "crash-zoom", "whip-pan", "zoom-in", "slow-zoom", "pan-left", "pan-right". Use "action-shake" on shot hits or impacts, and "crash-zoom" on high-intensity moments.
5. Provide a strong closing CTA (Call to action) for the Qoneqt community.

Return a raw JSON object (no markdown, no backticks, only JSON) matching this schema:
{
  "title": "string (catchy, clean 4-8 word title)",
  "hook": "string (Scene 1 opening hook sentence)",
  "introduction": "string (brief intro context)",
  "scenes": [
    {
      "id": 1,
      "duration": 5,
      "narration": "string (what the voice says)",
      "visualPrompt": "string (visual details for 9:16 vertical video)",
      "searchQuery": "string (2-4 concrete photo keywords)",
      "caption": "string (short on-screen text with emoji)",
      "motion": "string (crash-zoom | action-shake | whip-pan | zoom-in | slow-zoom | pan-left | pan-right)"
    }
  ],
  "conclusion": "string (wrap up insight)",
  "cta": "string (e.g. What would you do in the final over with King Kohli? Comment on Qoneqt!)"
}`;
}

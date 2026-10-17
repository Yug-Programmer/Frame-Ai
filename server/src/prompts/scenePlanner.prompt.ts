import { Script } from '../types/index.js';

export function buildScenePlannerPrompt(script: Script): string {
  return `You are a professional video director and editor.
Transform the following video script into an exact, executable scene production plan for vertical 9:16 video:

Title: "${script.title}"
Hook: "${script.hook}"
Scenes raw:
${JSON.stringify(script.scenes, null, 2)}

For each scene, refine and finalize:
- "id": integer
- "duration": integer seconds
- "narration": polished speech line
- "visualPrompt": detailed, photorealistic or clean illustrative prompt formatted for 9:16 vertical image generation
- "searchQuery": 2 to 4 tangible photographic keywords specific to this scene. CRITICAL: Every single scene's searchQuery MUST explicitly include the core topic/character/entity name (e.g. for "Superman": "Superman Krypton destruction", "Superman baby Kal-El ship", "Superman Clark Kent Smallville", "Superman Daily Planet reporter", "Superman iconic flying suit cape"). Never omit the main subject so image search remains 100% on-topic!
- "caption": concise, impactful on-screen text
- "transition": one of "fade", "slide", "cut", "dissolve"
- "motion": one of "crash-zoom", "action-shake", "whip-pan", "slow-zoom", "pan-left", "pan-right", "zoom-in", "zoom-out". Use "action-shake" on impact/hits, "crash-zoom" on high tension, and dynamic pans across other scenes.
- "backgroundType": "generated-image" or "solid-backdrop"

Return a raw JSON array of scenes (no markdown, no backticks):
[
  {
    "id": 1,
    "duration": 6,
    "narration": "...",
    "visualPrompt": "...",
    "searchQuery": "...",
    "caption": "...",
    "transition": "fade",
    "motion": "slow-zoom",
    "backgroundType": "generated-image"
  }
]`;
}

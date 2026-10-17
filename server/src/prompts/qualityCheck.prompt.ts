import { Script, TopicAnalysis } from '../types/index.js';

export function buildQualityCheckPrompt(analysis: TopicAnalysis, script: Script): string {
  return `You are a strict quality control editor for video publishing.
Evaluate whether this generated script meets publishing standards for Qoneqt:

Target Topic: "${analysis.topic}"
Target Angle: "${analysis.angle}"
Target Audience: "${analysis.audience}"

Generated Video Script:
Title: "${script.title}"
Hook: "${script.hook}"
Scenes count: ${script.scenes.length}
Total Planned Duration: ${script.scenes.reduce((acc, s) => acc + s.duration, 0)}s
CTA: "${script.cta}"

Check the following:
1. Topic relevance: Does the script directly explain the topic without straying?
2. Script consistency: Does the narrative arc flow smoothly from hook to conclusion?
3. Scene consistency: Are durations realistic for the narration length?
4. Narration/visual alignment: Do the visuals match what is spoken?

Return a raw JSON object (no markdown):
{
  "passed": boolean,
  "issues": ["string issue description if any"],
  "aiChecks": {
    "topicRelevance": boolean,
    "scriptConsistency": boolean,
    "sceneConsistency": boolean,
    "narrationVisualAlignment": boolean
  }
}`;
}

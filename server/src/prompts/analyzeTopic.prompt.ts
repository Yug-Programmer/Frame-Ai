export function buildAnalyzeTopicPrompt(userInput: string, conversationContext?: string): string {
  return `You are an expert AI content director and video strategist for Qoneqt Global Feed.
Analyze the user's input and extract structured video production parameters.

User Input: "${userInput}"
${conversationContext ? `Conversation History Context:\n${conversationContext}\n` : ''}

CRITICAL CONTENT TYPE DETECTION:
1. If the user request is an ACTION, EXPERIENTIAL, FIRST-PERSON, or SCENARIO simulation (e.g., "Make a video of me playing with Virat Kohli in a cricket match", "POV you are...", "What if I raced...", "A thrilling adventure where...", "Batman fighting in Tokyo"):
   - Set "contentType" to "action_experience" or "first_person_pov"
   - Set "isExperiential" to true
   - Set "intent" to "entertain" or "inspire"
   - Set "tone" to "high-energy", "epic", "thrilling", or "cinematic"
   - Set "angle" to an immersive, cinematic action premise (e.g. "Nail-biting final over chase batting alongside Virat Kohli in a packed stadium")

2. If the user request is an EDUCATIONAL, FACTUAL, or DOCUMENTARY topic (e.g., "How black holes work", "History of Rome", "AI Agents overview"):
   - Set "contentType" to "explainer" or "trend-breakdown"
   - Set "isExperiential" to false
   - Set "intent" to "educate" or "inform"
   - Set "tone" to "professional", "thoughtful", or "analytical"

You must return a raw JSON object with EXACTLY this structure (no markdown fences, no explanatory text):
{
  "topic": "string (the core subject or event, e.g. 'Playing cricket with Virat Kohli')",
  "intent": "string (e.g. entertain, inspire, educate, inform)",
  "audience": "string (target demographic or community on Qoneqt)",
  "tone": "string (e.g. high-energy, epic, cinematic, professional)",
  "duration": number (estimated video length in seconds, default to 30 if unspecified, minimum 15, maximum 90),
  "contentType": "string (e.g. action_experience, first_person_pov, explainer, trend-breakdown)",
  "angle": "string (the distinct perspective or narrative hook)",
  "isExperiential": boolean (true if personal simulation, sports action, or fictional story; false if factual educational topic)
}`;
}

async function getOllamaResponse(message, model = 'deepseek-r1:8b') {
    const fetch = (await import('node-fetch')).default;

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt: message, stream: false }) 
        });

        const rawData = await response.text();

        const data = JSON.parse(rawData);

        if (!data.done || !data.response) {
            throw new Error("Aucune réponse valide d'Ollama.");
        }

        let responseText = data.response
        console.log("Réponse brute d'Ollama:", responseText);
        const thinkingPhaseMatch = responseText.match(/<think>(.*?)<\/think>/s);
        console.log("ThinkingPhaseMatch:", thinkingPhaseMatch);
        const responseMarkdown = responseText.replace(/<think>.*?<\/think>/s, '').trim();
        console.log("Réponse Markdown:", responseMarkdown);

        let thinkingPhase = '*(Phase de réflexion indisponible...)*';

        if (thinkingPhaseMatch[0] == "<think>\n\n</think>") {
            thinkingPhase = '*Pas de phase de réflexion...*';
        } else {   
            if (thinkingPhaseMatch) {
                thinkingPhase = thinkingPhaseMatch[1].trim();
                // thinkingPhase = thinkingPhase.replace(/^(.*)$/gm, '*$1*');
            } else {
                thinkingPhase = '*(Phase de réflexion non trouvée...)*';
            }
        }   

        return `
#### 🧠 Phase de réflexion :
> ${thinkingPhase}\n

---

### 🐒 Réponse :
${responseMarkdown}
        `;

    } catch (err) {
        console.error('Erreur avec Ollama:', err);
        return "Désolé, je ne peux pas répondre pour l'instant.";
    }
}

module.exports = { getOllamaResponse };
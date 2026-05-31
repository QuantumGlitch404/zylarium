async function testLlama8b() {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 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',
        },
        body: JSON.stringify({
            model: 'meta/llama-3.1-8b-instruct',
            messages: [
                { role: 'user', content: 'Translate the following text from English to Hindi. Formality: neutral. Return only the translated text, nothing else.\n\nI am going to the market today to buy some fresh vegetables.' }
            ]
        })
    });
    console.log("Llama 8b Output:", (await res.json()).choices?.[0]?.message?.content);
}
testLlama8b();

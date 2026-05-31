async function testRiva() {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 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',
        },
        body: JSON.stringify({
            model: 'nvidia/riva-translate-4b-instruct-v1.1',
            messages: [
                { role: 'user', content: 'Translate to Hindi: I am going to the market today to buy some fresh vegetables.' }
            ]
        })
    });
    console.log("Riva Output:", (await res.json()).choices?.[0]?.message?.content);
}
testRiva();

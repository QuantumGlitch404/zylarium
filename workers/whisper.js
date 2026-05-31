import { pipeline, env } from '@xenova/transformers';

// Skip local model checks since we're running in browser
env.allowLocalModels = false;
env.useBrowserCache = true;

class Transcriber {
    static instance = null;
    static loadingPromise = null;

    static async getInstance(progress_callback) {
        if (this.instance) return this.instance;

        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = (async () => {
            try {
                const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
                    progress_callback
                });
                this.instance = transcriber;
                return transcriber;
            } catch (error) {
                this.loadingPromise = null; // Reset on error
                throw error;
            }
        })();

        return this.loadingPromise;
    }
}

self.addEventListener('message', async (event) => {
    const message = event.data;

    // Load command (optional now as transcribe will auto-load)
    if (message.type === 'load') {
        try {
            self.postMessage({ status: 'loading', message: 'Initializing Whisper model...' });

            await Transcriber.getInstance((data) => {
                if (data.status === 'progress') {
                    self.postMessage({
                        status: 'model_downloading',
                        progress: data.progress,
                        file: data.file
                    });
                }
            });

            self.postMessage({ status: 'loaded', message: 'Whisper model ready!' });
        } catch (error) {
            self.postMessage({ status: 'error', error: error.message });
        }
        return;
    }

    // Transcribe audio
    if (message.type === 'transcribe') {
        try {
            const { audio } = message;

            // Auto-load if needed
            const transcriber = await Transcriber.getInstance((data) => {
                // Forward loading progress if lazy loading triggers it
                if (data.status === 'progress') {
                    self.postMessage({
                        status: 'model_downloading',
                        progress: data.progress,
                        file: data.file
                    });
                }
            });

            // Convert audio blob/url to float32 array or just pass url? 
            // Pipeline supports URL or float32 array. We'll expect a blob URL or direct processing.
            // Actually, pipeline() can take a URL.

            self.postMessage({ status: 'transcribing', message: 'Starting transcription...' });

            const output = await transcriber(audio, {
                // Return timestamps for professional look
                return_timestamps: true,
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'english', // auto-detection is default but english is safer for tiny model
                callback_function: (item) => {
                    // Partial results if supported
                    // self.postMessage({ status: 'partial', text: item });
                }
            });

            self.postMessage({
                status: 'complete',
                transcript: output.text,
                segments: output.chunks // detailed segments with timestamps
            });

        } catch (error) {
            self.postMessage({ status: 'error', error: error.message });
        }
    }
});

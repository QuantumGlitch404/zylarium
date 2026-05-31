const express = require('express');
const multer = require('multer');
const CloudConvert = require('cloudconvert');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
// Middleware
app.use(cors({
    origin: '*', // Allow all origins (or specify your frontend URL)
    exposedHeaders: ['Content-Length', 'Content-Disposition', 'X-File-Size']
}));
app.use(express.json({ limit: '5000mb' }));
app.use(express.urlencoded({ extended: true, limit: '5000mb' }));

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5000 * 1024 * 1024 } // 5000MB (5GB) limit
});

// CloudConvert API Key
const CLOUDCONVERT_API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiOWE5MTM1YzdjZWI1NWI2NzVmNDg1MDQ4ZDliMjQyMTAzMzMzMTI4NDExMzhiMzYyZjliOTM5Zjg5MDg4NGY4YjhmZDZkMjE2ZmM1NTdjNjMiLCJpYXQiOjE3NjU2NTUxMDIuMjU4Mjc5LCJuYmYiOjE3NjU2NTUxMDIuMjU4MjgsImV4cCI6NDkyMTMyODcwMi4yNDkyNjMsInN1YiI6IjczNzI2NTg5Iiwic2NvcGVzIjpbInRhc2sucmVhZCIsInRhc2sud3JpdGUiLCJ1c2VyLnJlYWQiLCJ1c2VyLndyaXRlIiwid2ViaG9vay5yZWFkIiwid2ViaG9vay53cml0ZSIsInByZXNldC5yZWFkIiwicHJlc2V0LndyaXRlIl19.Se2o6E-5cdNhyfZqwjta1aMvpsLmEhyMSmUDHmstV-DtEFkwsFsi_Z91j70dt1Ni6QrwE-iffV5zD_HWwUoiUzSwGAbxjVTSjEHh5HVfek754v6qId8mfDXjpj_jr-uRNJXwuEEz7m7JE5049Y7j9-S-9dGlfU_m34fvj4Fs09GjWyUZwKM7G-r2HhhDQrorydvZpKuSIbucGFnujNcDXuGMdTtBX2tkA4PSh08crKDVxw6W8I6b_qnbwG8K-fqZxsSixeFEavFGQTriCdbfjYeWDGGGlcZCu1fb1SNKy2BQareLeOkKs2CMZNtX4GC0uzfW9JEsXDApd7JYZlj4EEYNe4O8fCiCjIAqcOZXnQAmNw__x-Z-obGl6W5QBXCo4vU1BYcbv-nTs87tJKegEbTAShVdTEulXGYMx5ucqPX4TZndeIV_7dXJHSZNDHJqUH-PsVq1ijEnmpZAo_fXK6QcqqxLBUbmHJTr2AJDByOu7AjMDcLCrlgzimaWrcQuyLjADKpeSgcKQ4LAl-T8M75dZcny-8q2cqrzk0-IBvOiHtpEwsjyPhWdqUMMfA9fJyCP8YEJwKhy96Y4O-o9UvYCfRjOseUGy5t0vAMmD6FuVuOgS_L1qTkI8rFo_ULDhy0k3_EcNCfYCo9HbXAdfTiUby4b4fG1sZhqOK4r9pg';
const cloudConvert = new CloudConvert(CLOUDCONVERT_API_KEY);

// Main conversion endpoint
app.post('/convert-word-to-pdf', upload.single('file'), async (req, res) => {
    let uploadedFilePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        uploadedFilePath = req.file.path;
        const fileName = req.file.originalname;

        console.log(`🚀 Converting: ${fileName}`);

        // Create CloudConvert job
        let job = await cloudConvert.jobs.create({
            tasks: {
                'import-my-file': {
                    operation: 'import/upload'
                },
                'convert-my-file': {
                    operation: 'convert',
                    input: 'import-my-file',
                    output_format: 'pdf',
                    engine: 'office',
                    filename: fileName.replace(/\.(docx?|odt)$/i, '.pdf'),
                    optimize_print: true,
                    pdf_a: false,
                    zoom: 100
                },
                'export-my-file': {
                    operation: 'export/url',
                    input: 'convert-my-file'
                }
            }
        });

        console.log(`✅ Job created: ${job.id}`);

        // Upload file to CloudConvert
        const uploadTask = job.tasks.filter(task => task.name === 'import-my-file')[0];
        const inputFile = await fs.readFile(uploadedFilePath);
        await cloudConvert.tasks.upload(uploadTask, inputFile, fileName);
        console.log('📤 File uploaded');

        // Wait for conversion
        job = await cloudConvert.jobs.wait(job.id);
        console.log('🔄 Conversion completed');

        // Download converted PDF
        const exportTask = job.tasks.filter(task => task.name === 'export-my-file')[0];
        const file = exportTask.result.files[0];

        const response = await axios({
            method: 'get',
            url: file.url,
            responseType: 'arraybuffer'
        });

        // Send PDF to client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.send(Buffer.from(response.data));

        console.log('✅ PDF sent successfully');

        // Cleanup
        await fs.unlink(uploadedFilePath);

    } catch (error) {
        console.error('❌ Error:', error);

        if (uploadedFilePath) {
            try { await fs.unlink(uploadedFilePath); } catch (e) { }
        }

        if (error.code === 'INVALID_API_KEY') {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        if (error.code === 'INSUFFICIENT_CREDITS') {
            return res.status(402).json({ error: 'Credits exhausted' });
        }

        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
});

// PDF to Word conversion endpoint
app.post('/convert-pdf-to-word', upload.single('file'), async (req, res) => {
    let uploadedFilePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        uploadedFilePath = req.file.path;
        const fileName = req.file.originalname;

        console.log(`🚀 PDF to Word: ${fileName}`);

        // Create CloudConvert job
        // We use 'office' engine (Word) for best results
        let job = await cloudConvert.jobs.create({
            tasks: {
                'import-my-file': {
                    operation: 'import/upload'
                },
                'convert-my-file': {
                    operation: 'convert',
                    input: 'import-my-file',
                    output_format: 'docx',
                    output_format: 'docx',
                    filename: fileName.replace(/\.pdf$/i, '.docx')
                },
                'export-my-file': {
                    operation: 'export/url',
                    input: 'convert-my-file'
                }
            }
        });

        console.log(`✅ Job created: ${job.id}`);

        if (!job.tasks || !Array.isArray(job.tasks)) {
            throw new Error(`Invalid job response: No tasks found. Job: ${JSON.stringify(job)}`);
        }

        // Upload file to CloudConvert
        const uploadTask = job.tasks.find(task => task.name === 'import-my-file');
        if (!uploadTask) {
            throw new Error(`Upload task 'import-my-file' not found in job. Tasks: ${job.tasks.map(t => t.name).join(', ')}`);
        }

        console.log(`Using upload task: ${uploadTask.id}`);
        const inputFile = await fs.readFile(uploadedFilePath);
        await cloudConvert.tasks.upload(uploadTask, inputFile, fileName);
        console.log('📤 File uploaded successfully');

        // Wait for conversion
        job = await cloudConvert.jobs.wait(job.id);
        console.log('🔄 Conversion completed');

        // Download converted DOCX
        const exportTask = job.tasks.filter(task => task.name === 'export-my-file')[0];
        const file = exportTask.result.files[0];

        const response = await axios({
            method: 'get',
            url: file.url,
            responseType: 'arraybuffer'
        });

        // Send DOCX to client
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.send(Buffer.from(response.data));

        console.log('✅ DOCX sent successfully');

        // Cleanup
        await fs.unlink(uploadedFilePath);

    } catch (error) {
        console.error('❌ Error:', error);

        if (uploadedFilePath) {
            try { await fs.unlink(uploadedFilePath); } catch (e) { }
        }

        if (error.code === 'INVALID_API_KEY') {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        if (error.code === 'INSUFFICIENT_CREDITS') {
            return res.status(402).json({ error: 'Credits exhausted' });
        }

        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
});

// ============================================================================
// FAST VIDEO COMPRESSION ENDPOINT (Native FFmpeg)
// ============================================================================
const ffmpeg = require('fluent-ffmpeg');
const { spawn, exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

// Set FFmpeg paths explicitly
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Configure larger file uploads for video
const videoUpload = multer({
    dest: 'uploads/',
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit for video
});

app.post('/compress-video', videoUpload.single('file'), async (req, res) => {
    let uploadedFilePath = null;
    let outputPath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        uploadedFilePath = req.file.path;
        const fileName = req.file.originalname;
        const { preset = 'balanced', codec = 'h264', resolution = 'original', keepAudio = 'true' } = req.body;

        console.log(`🎬 Compressing: ${fileName} (preset: ${preset}, codec: ${codec})`);

        // Generate output path
        const outputFileName = `compressed_${Date.now()}.mp4`;
        outputPath = path.join(__dirname, 'uploads', outputFileName);

        // Build FFmpeg command
        const command = ffmpeg(uploadedFilePath);

        // Video codec
        if (codec === 'h264') {
            command.videoCodec('libx264');
        } else if (codec === 'h265') {
            command.videoCodec('libx265');
        } else if (codec === 'vp9') {
            command.videoCodec('libvpx-vp9');
        }

        // Quality preset
        let crf = 23;
        let ffmpegPreset = 'fast';
        if (preset === 'ultra') {
            crf = 18;
            ffmpegPreset = 'medium';
        } else if (preset === 'balanced') {
            crf = 23;
            ffmpegPreset = 'fast';
        } else if (preset === 'maximum') {
            crf = 28;
            ffmpegPreset = 'veryfast';
        }

        command.addOption('-crf', crf.toString());
        command.addOption('-preset', ffmpegPreset);

        // Resolution scaling
        if (resolution !== 'original') {
            const scales = {
                '720p': 'scale=-2:720',
                '480p': 'scale=-2:480',
                '360p': 'scale=-2:360'
            };
            if (scales[resolution]) {
                command.videoFilter(scales[resolution]);
            }
        }

        // Audio
        if (keepAudio === 'true') {
            command.audioCodec('aac').audioBitrate('128k');
        } else {
            command.noAudio();
        }

        // Fast start for web
        command.addOption('-movflags', '+faststart');

        // Output
        command.output(outputPath);

        // Process with progress
        await new Promise((resolve, reject) => {
            command
                .on('start', (cmd) => console.log('FFmpeg started:', cmd))
                .on('progress', (progress) => {
                    console.log(`Progress: ${progress.percent?.toFixed(1)}%`);
                })
                .on('end', () => {
                    console.log('✅ Compression complete');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ FFmpeg error:', err);
                    reject(err);
                })
                .run();
        });

        // Send the compressed file
        const compressedData = await fs.readFile(outputPath);
        const originalSize = req.file.size;
        const compressedSize = compressedData.length;
        const savedPercent = Math.round((1 - compressedSize / originalSize) * 100);

        console.log(`📊 Saved ${savedPercent}% (${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB)`);

        res.set({
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="${fileName.replace(/\.[^.]+$/, '_compressed.mp4')}"`,
            'X-Original-Size': originalSize.toString(),
            'X-Compressed-Size': compressedSize.toString(),
            'X-Saved-Percent': savedPercent.toString()
        });

        res.send(compressedData);

        // Cleanup
        await fs.unlink(uploadedFilePath).catch(() => { });
        await fs.unlink(outputPath).catch(() => { });

    } catch (error) {
        console.error('Compression error:', error);

        // Cleanup on error
        if (uploadedFilePath) await fs.unlink(uploadedFilePath).catch(() => { });
        if (outputPath) await fs.unlink(outputPath).catch(() => { });

        res.status(500).json({ error: 'Compression failed', details: error.message });
    }
});

// ============================================================================
// FAST VIDEO TO GIF ENDPOINT (Native FFmpeg)
// ============================================================================
app.post('/video-to-gif', videoUpload.single('file'), async (req, res) => {
    let uploadedFilePath = null;
    let palettePath = null;
    let outputPath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        uploadedFilePath = req.file.path;
        const fileName = req.file.originalname;
        const { startTime = '0', endTime = '5', fps = '15', width = '480' } = req.body;

        console.log(`🎞️ Converting to GIF: ${fileName} (${startTime}s - ${endTime}s, ${fps}fps, ${width}px)`);

        const duration = parseFloat(endTime) - parseFloat(startTime);
        palettePath = path.join(__dirname, 'uploads', `palette_${Date.now()}.png`);
        outputPath = path.join(__dirname, 'uploads', `gif_${Date.now()}.gif`);

        // Step 1: Generate palette for better quality
        await new Promise((resolve, reject) => {
            ffmpeg(uploadedFilePath)
                .setStartTime(parseFloat(startTime))
                .setDuration(duration)
                .videoFilter(`fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`)
                .output(palettePath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // Step 2: Create GIF with palette
        await new Promise((resolve, reject) => {
            ffmpeg(uploadedFilePath)
                .setStartTime(parseFloat(startTime))
                .setDuration(duration)
                .input(palettePath)
                .complexFilter(`fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`)
                .output(outputPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        console.log('✅ GIF conversion complete');

        const gifData = await fs.readFile(outputPath);

        res.set({
            'Content-Type': 'image/gif',
            'Content-Disposition': `attachment; filename="${fileName.replace(/\.[^.]+$/, '.gif')}"`,
            'X-GIF-Size': gifData.length.toString()
        });

        res.send(gifData);

        // Cleanup
        await fs.unlink(uploadedFilePath).catch(() => { });
        await fs.unlink(palettePath).catch(() => { });
        await fs.unlink(outputPath).catch(() => { });

    } catch (error) {
        console.error('GIF conversion error:', error);

        if (uploadedFilePath) await fs.unlink(uploadedFilePath).catch(() => { });
        if (palettePath) await fs.unlink(palettePath).catch(() => { });
        if (outputPath) await fs.unlink(outputPath).catch(() => { });

        res.status(500).json({ error: 'GIF conversion failed', details: error.message });
    }
});

// ============================================================================
// VIDEO RESOLUTION CHANGER (Native FFmpeg)
// ============================================================================
app.post('/change-resolution', videoUpload.single('file'), async (req, res) => {
    let uploadedFilePath = null;
    let outputPath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        uploadedFilePath = req.file.path;
        const fileName = req.file.originalname;
        const { targetResolution, customWidth, customHeight, scaleMethod = 'lanczos' } = req.body;

        console.log(`📏 Changing resolution: ${fileName} -> ${targetResolution || 'Custom'} (${scaleMethod})`);

        // Generate output path
        const outputFileName = `resized_${Date.now()}.mp4`;
        outputPath = path.join(__dirname, 'uploads', outputFileName);

        // Build FFmpeg command
        const command = ffmpeg(uploadedFilePath);

        // Determine scale filter
        let scaleFilter = '';
        if (targetResolution === 'custom') {
            const w = parseInt(customWidth) || -2;
            const h = parseInt(customHeight) || -2;
            scaleFilter = `scale=${w}:${h}:flags=${scaleMethod}`;
        } else {
            const resolutions = {
                '480p': 'scale=-2:480',
                '720p': 'scale=-2:720',
                '1080p': 'scale=-2:1080',
                '1440p': 'scale=-2:1440',
                '4k': 'scale=-2:2160'
            };
            scaleFilter = resolutions[targetResolution];
            if (scaleFilter) {
                scaleFilter += `:flags=${scaleMethod}`;
            }
        }

        if (scaleFilter) {
            command.videoFilter(scaleFilter);
        }

        // Maintain quality but prioritize speed as requested
        command.videoCodec('libx264')
            .addOption('-crf', '28') // Slightly higher CRF for faster encoding (good balance)
            .addOption('-preset', 'ultrafast') // Max speed
            .addOption('-threads', '0') // Use all available CPU threads
            .audioCodec('aac')
            .audioBitrate('128k')
            .addOption('-movflags', '+faststart');

        command.output(outputPath);

        // Run FFmpeg
        await new Promise((resolve, reject) => {
            command
                .on('start', (cmd) => console.log('FFmpeg started:', cmd))
                .on('end', () => {
                    console.log('✅ Resize complete');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ FFmpeg error:', err);
                    reject(err);
                })
                .run();
        });

        // Send file
        // Send file via stream (prevent OOM on large files)
        const outputFilename = fileName.replace(/\.[^.]+$/, `_${targetResolution || 'resized'}.mp4`);

        res.download(outputPath, outputFilename, (err) => {
            if (err) {
                console.error('Download error:', err);
                // If headers haven't been sent, we can still send an error response
                if (!res.headersSent) {
                    res.status(500).send('File download failed');
                }
            }
            // Cleanup after stream finishes or errors
            fs.unlink(uploadedFilePath).catch(() => { });
            fs.unlink(outputPath).catch(() => { });
        });

    } catch (error) {
        console.error('Resolution change error:', error);
        if (uploadedFilePath) await fs.unlink(uploadedFilePath).catch(() => { });
        if (outputPath) await fs.unlink(outputPath).catch(() => { });
        res.status(500).json({ error: 'Resizing failed', details: error.message });
    }
});

// ============================================================================
// VIDEO FORMAT CONVERTER (Native FFmpeg)
// ============================================================================
app.post('/convert-video', videoUpload.single('file'), async (req, res) => {
    let uploadedFilePath = null;
    let outputPath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        uploadedFilePath = req.file.path;
        const fileName = req.file.originalname;
        const { outputFormat, profile = 'web' } = req.body;

        console.log(`🎬 Converting Format: ${fileName} -> .${outputFormat} (profile: ${profile})`);

        // Generate output path
        const outputFilename = fileName.replace(/\.[^.]+$/, `.${outputFormat}`);
        const tempOutputName = `converted_${Date.now()}.${outputFormat}`;
        outputPath = path.join(__dirname, 'uploads', tempOutputName);

        // Build FFmpeg command
        const command = ffmpeg(uploadedFilePath);

        // Speed optimization: threads=0 (auto), faststart (web ready)
        command.addOption('-threads', '0').addOption('-movflags', '+faststart');

        // Logic to determine best codec and settings for "VERY FAST" speed
        if (outputFormat === 'webm') {
            // WebM: Use VP8 (faster than VP9) with realtime settings for max speed
            command.videoCodec('libvpx')
                .audioCodec('libvorbis') // Standard for WebM
                .addOption('-quality', 'realtime')
                .addOption('-cpu-used', '5') // 0-5 for VP8, 5 is fastest
                .addOption('-b:v', '1M') // Target bitrate to prevent potato quality
                .addOption('-crf', '30'); // Reasonable quality/speed balance
        } else {
            // MP4, MOV, MKV, AVI: Use x264 with ultrafast preset
            // Use 'libx264' for all these containers for max compatibility and speed
            command.videoCodec('libx264')
                .audioCodec('aac')
                .audioBitrate('128k')
                .addOption('-preset', 'ultrafast') // MAXIMUM SPEED
                .addOption('-crf', '28'); // Speed/Quality balance

            // Container specific adjustments
            if (outputFormat === 'mkv') command.format('matroska');
            if (outputFormat === 'mov') command.format('mov');
            if (outputFormat === 'avi') command.format('avi'); // x264 in AVI is generally fine
        }

        // Remove profile logic for now - User priority is SPEED above all else.
        // We can re-introduce profiles later if needed, but currently "stuck" complaints take priority.

        command.output(outputPath);

        // Run FFmpeg
        await new Promise((resolve, reject) => {
            command
                .on('start', (cmd) => console.log('FFmpeg started:', cmd))
                .on('end', () => {
                    console.log('✅ Conversion complete');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ FFmpeg error:', err);
                    reject(err);
                })
                .run();
        });

        // Send file via stream
        res.download(outputPath, outputFilename, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) res.status(500).send('File download failed');
            }
            // Cleanup
            fs.unlink(uploadedFilePath).catch(() => { });
            fs.unlink(outputPath).catch(() => { });
        });

    } catch (error) {
        console.error('Format conversion error:', error);
        if (uploadedFilePath) await fs.unlink(uploadedFilePath).catch(() => { });
        if (outputPath) await fs.unlink(outputPath).catch(() => { });
        res.status(500).json({ error: 'Conversion failed', details: error.message });
    }
});

// ============================================================================
// VIDEO ROTATION ENDPOINT (Native FFmpeg - SUPER FAST with metadata)
// ============================================================================
app.post('/rotate-video', videoUpload.single('file'), async (req, res) => {
    let uploadedFilePath = null;
    let outputPath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        uploadedFilePath = req.file.path;
        const fileName = req.file.originalname;
        const { rotation = '90', flip = 'none' } = req.body;

        console.log(`🔄 Rotating video: ${fileName} (${rotation}°, flip: ${flip})`);

        // Generate output path
        const outputFileName = `rotated_${Date.now()}.mp4`;
        outputPath = path.join(__dirname, 'uploads', outputFileName);

        // Build FFmpeg command - FASTEST POSSIBLE METHOD
        const command = ffmpeg(uploadedFilePath);

        // Build transpose filter for rotation
        let transposeFilter = '';
        if (rotation === '90') {
            transposeFilter = 'transpose=1'; // 90° clockwise
        } else if (rotation === '180') {
            transposeFilter = 'transpose=1,transpose=1'; // 180°
        } else if (rotation === '270') {
            transposeFilter = 'transpose=2'; // 90° counter-clockwise
        }

        // Add flip filters if needed
        if (flip === 'horizontal') {
            transposeFilter += transposeFilter ? ',hflip' : 'hflip';
        } else if (flip === 'vertical') {
            transposeFilter += transposeFilter ? ',vflip' : 'vflip';
        }

        // Apply filter
        if (transposeFilter) {
            command.videoFilter(transposeFilter);
        }

        // MAXIMUM SPEED SETTINGS
        command
            .videoCodec('libx264')
            .addOption('-preset', 'ultrafast')
            .addOption('-crf', '28') // Lower quality for speed
            .addOption('-threads', '0')
            .audioCodec('aac')
            .audioBitrate('96k') // Low bitrate for speed
            .addOption('-movflags', '+faststart')
            .output(outputPath);

        // Run FFmpeg with progress
        await new Promise((resolve, reject) => {
            command
                .on('start', (cmd) => {
                    console.log('FFmpeg started');
                })
                .on('progress', (progress) => {
                    const percent = progress.percent || 0;
                    if (percent > 0) {
                        console.log(`Progress: ${percent.toFixed(1)}%`);
                    }
                })
                .on('end', () => {
                    console.log('✅ Rotation complete');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ FFmpeg error:', err);
                    reject(err);
                })
                .run();
        });

        // Send file
        console.log('📤 Sending rotated video...');
        res.download(outputPath, fileName.replace(/\.[^.]+$/, '_rotated.mp4'), (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).send('File download failed');
                }
            } else {
                console.log('✅ File sent successfully');
            }
            // Cleanup
            fs.unlink(uploadedFilePath).catch(() => { });
            fs.unlink(outputPath).catch(() => { });
        });

    } catch (error) {
        console.error('Rotation error:', error);
        if (uploadedFilePath) await fs.unlink(uploadedFilePath).catch(() => { });
        if (outputPath) await fs.unlink(outputPath).catch(() => { });
        res.status(500).json({ error: 'Rotation failed', details: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', cloudconvert: 'enabled', ffmpeg: 'enabled', gemini: 'enabled' });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 CloudConvert: Configured ✅`);
});

// Increase timeout to 10 minutes for large file processing
server.setTimeout(600000);

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

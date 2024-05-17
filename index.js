const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const { SpeechClient } = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });
const speechClient = new SpeechClient();

app.use(cors());

app.post('/upload', upload.single('audio'), async (req, res) => {
    const filePath = path.join(__dirname, req.file.path);
    const outputFilePath = filePath + '.wav';

    ffmpeg(filePath)
        .toFormat('wav')
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('end', async () => {
            try {
                const audioBytes = fs.readFileSync(outputFilePath).toString('base64');
                const audio = { content: audioBytes };
                const config = {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 16000,
                    languageCode: 'en-US',
                };
                const request = { audio, config };

                const [response] = await speechClient.recognize(request);
                const transcription = response.results
                    .map(result => result.alternatives[0].transcript)
                    .join('\n');

                res.json({ transcription });
                fs.unlinkSync(filePath);
                fs.unlinkSync(outputFilePath);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: error.message });
            }
        })
        .on('error', (error) => {
            console.error('FFmpeg error:', error);
            res.status(500).json({ error: error.message });
        })
        .save(outputFilePath);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

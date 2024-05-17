const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const speechClient = new SpeechClient();

// Middleware to parse JSON bodies and enable CORS
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Adjust the limit as needed

app.post('/upload', async (req, res) => {
    console.log("File upload request received.");
    try {
        const base64Audio = req.body.audio;
        if (!base64Audio) {
            return res.status(400).json({ error: 'No audio data provided' });
        }

        const buffer = Buffer.from(base64Audio, 'base64');
        const filePath = path.join(__dirname, 'uploads', `audio-${Date.now()}.wav`);
        fs.writeFileSync(filePath, buffer);

        // Read the audio file and convert to base64
        const audioBytes = fs.readFileSync(filePath).toString('base64');
        const audio = {
            content: audioBytes,
        };

        const config = {
            encoding: 'LINEAR16',
            // sampleRateHertz: 16000,
            languageCode: 'en-US',
        };

        const request = {
            audio: audio,
            config: config,
        };

        try {
            const [response] = await speechClient.recognize(request);
            const transcription = response.results
                .map((result) => result.alternatives[0].transcript)
                .join('\n');

            res.json(response);
            // res.json({ transcription });

            // Clean up the uploaded file
            fs.unlinkSync(filePath);
        } catch (error) {
            console.log(error.message);
            res.status(500).json({ error: error.message });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

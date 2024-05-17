const express = require('express');
const multer = require('multer');
const { SpeechClient } = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });
const speechClient = new SpeechClient();

// Enable CORS
app.use(cors());

// Endpoint to handle file uploads
app.post('/upload', upload.single('audio'), async (req, res) => {
    console.log("File upload request received.");

    const filePath = path.join(__dirname, req.file.path);
    try {
        const audioBytes = fs.readFileSync(filePath).toString('base64');
        const audio = {
            content: audioBytes,
        };

        const config = {
            encoding: 'LINEAR16',
            //   sampleRateHertz: 16000,
            languageCode: 'en-US',
        };

        const request = {
            audio: audio,
            config: config,
        };

        try {
            const [response] = await speechClient.recognize(request);
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');

            res.json({ transcription });

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

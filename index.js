const express = require('express');
const multer = require('multer');
const { SpeechClient } = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });
const speechClient = new SpeechClient();



// Use the cors middleware
app.use(cors());

app.post('/upload', upload.single('audio'), async (req, res) => {
    console.log("file upload request .. ");
    try {

        const filePath = path.join(__dirname, req.file.path );

        const audioBytes = fs.readFileSync(filePath).toString('base64');
        const audio = {
            content: audioBytes
        };

        const config = {
            encoding: 'LINEAR16',
            // sampleRateHertz: 16000,
            languageCode: 'en-US'
        };

        const request = {
            audio: audio,
            config: config
        };

        try {
            console.log("try to end file");
            const [response] = await speechClient.recognize(request);
            res.json({ response });
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');

            // res.json({ transcription });

            // Clean up the uploaded file
            fs.unlinkSync(filePath);
        } catch (error) {
            console.log(error.message);
            res.status(500).json({ error: error.message });
        }

    } catch (error) {
        console.log(error);

    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

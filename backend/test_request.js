const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const run = async () => {
    try {
        const file = fs.createReadStream('test.pdf');
        const form = new FormData();
        form.append('file', file);

        console.log('Sending request...');
        const response = await axios.post('http://localhost:3001/convert-pdf-to-word', form, {
            headers: ...form.getHeaders(),
            responseType: 'arraybuffer'
        });

        console.log('Response status:', response.status);
        if (response.status === 200) {
            console.log('Success! Received DOCX bytes:', response.data.length);
        }
    } catch (err) {
        console.error('Test failed:', err.message);
        if (err.response) {
            console.error('Server response:', err.response.status, err.response.data.toString());
        }
    }
};

run();

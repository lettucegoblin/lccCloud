const express = require('express');
const { spawn } = require('child_process');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/lcc', (req, res) => {
    //const { arguments, data } = req.body;

    const lccProcess = spawn('./lcc.exe', ['a1test.a']); //arguments);

    //lccProcess.stdin.write(data);
    lccProcess.stdin.end();

    lccProcess.stdout.on('data', (output) => {
        // Handle the output from the lcc program
        res.send(output.toString());
    });

    lccProcess.stderr.on('data', (error) => {
        // Handle any errors from the lcc program
        res.status(500).send(error.toString());
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
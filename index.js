const express = require('express');
const { spawn, exec } = require('child_process');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;

// Function to change permissions
function changePermissions(filePath, mode) {
    exec(`chmod ${mode} ${filePath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Stdout: ${stdout}`);
    });
}

let lccCommand;
if (os.platform() === 'win32') {
    lccCommand = './lcc.exe';
} else {
    lccCommand = './lcc';
    changePermissions(lccCommand, '755'); // Changing permissions to 'rwxr-xr-x'
}

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/lcc', (req, res) => {
    //const { arguments, data } = req.body;
    

    //const { arguments, data } = req.body;
    //const lccProcess = spawn(lccCommand, arguments);
    const lccProcess = spawn(lccCommand, ['helloworld.a']);

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
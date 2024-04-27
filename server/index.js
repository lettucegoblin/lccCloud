const express = require('express');
const { spawn, exec } = require('child_process');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;
app.use(cors({
    origin: '*'  // This allows only requests from this origin
    // or use '*' to allow all origins
}));
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
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/test', (req, res) => {
    res.send('Hello World!');
});

/*
requestType: 'execute',
data: {
  fileName: 'helloworld.a',
  aCode: textAreaContent
}
*/
function executeLCC(fileName, callback){
    //const lccProcess = spawn(lccCommand, arguments);
    const lccProcess = spawn(lccCommand, [fileName]);

    //lccProcess.stdin.write(data);
    lccProcess.stdin.end();

    lccProcess.stdout.on('data', (output) => {
        // Handle the output from the lcc program
        callback(output.toString());
        
    });

    lccProcess.stderr.on('data', (error) => {
        // Handle any errors from the lcc program
        res.status(500).send(error.toString());
    });
}

function writeAssemblyCodeToFile(fileName, aCode, callback) {
    const fs = require('fs');
    fs.writeFile(fileName, aCode, (error) => {
        if (error) {
            console.error(error);
            return;
        }
        console.log('File written successfully');
        callback();
    });
}


app.post('/lcc', (req, res) => {
    const { requestType, data } = req.body;
    if (requestType == 'execute') {
        const { fileName, aCode } = data;
        writeAssemblyCodeToFile(fileName, aCode, () => {
            executeLCC(fileName, (output) => {
                const jsonData = { output: output };
                res.json(jsonData);
            });
        });
    }
    
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
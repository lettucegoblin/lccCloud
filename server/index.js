const express = require('express');
const { spawn, exec } = require('child_process');
const cors = require('cors');
const path = require('path');
const os = require('os');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new socketIo.Server(server, {
    cors: {
        origin: "*",
    }
});

const port = process.env.PORT || 3000;

app.use(cors({origin: '*'}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

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

let lccCommand = './lcc';
if (os.platform() === 'win32') {
    lccCommand = './lcc.exe';
} else {
    changePermissions(lccCommand, '755');
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

function executeLCC(socket, fileName) {
    const lccProcess = spawn(lccCommand, [fileName]);
    
    lccProcess.stdout.on('data', (data) => {
        socket.emit('output', { data: data.toString() });
    });

    lccProcess.stderr.on('data', (data) => {
        socket.emit('error', { data: data.toString() });
    });

    lccProcess.on('close', (code) => {
        socket.emit('completed', { code });
    });

    // Handling input from the client
    socket.on('input', (input) => {
        lccProcess.stdin.write(input);
        lccProcess.stdin.end();
    });
}

io.on('connection', (socket) => {
    console.log('a user connected');
    
    socket.on('execute', (data) => {
        const { fileName, aCode } = data;
        writeAssemblyCodeToFile(fileName, aCode, () => {
            executeLCC(socket, fileName);
        });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

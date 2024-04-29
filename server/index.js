const express = require('express');
const { spawn, exec } = require('child_process');
const cors = require('cors');
const path = require('path');
const os = require('os');
const http = require('http');
const socketIo = require('socket.io');
const pty = require('node-pty');

const app = express();
const server = http.createServer(app);
const io = new socketIo.Server(server, {
    cors: {
        origin: "*",
    }
});

const port = process.env.PORT || 3000;
const IS_WIN = os.platform() === 'win32';
const SHELL = IS_WIN ? 'powershell.exe' : 'bash';
const CMD_START_MARKER = "CMD_START_MARKER";
const CMD_DONE_MARKER = "CMD_DONE_MARKER";

app.use(cors({ origin: '*' }))
    .use(express.json())
    .use(express.static(path.join(__dirname, 'dist')));

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
if (IS_WIN) {
    lccCommand = './lcc.exe';
} else {
    changePermissions(lccCommand, '755');
}

function writeCodeToFile(fileName, codeString, callback) {
    const fs = require('fs');
    fs.writeFile(fileName, codeString, (error) => {
        if (error) {
            console.error(error);
            return;
        }
        console.log('File written successfully');
        callback();
    });
}

function executeLCC(socket, fileName) {
    // Execute your command within the terminal
    console.log('Executing command', socket.ptyTerminal.lccRunning, socket.ptyTerminal.killed);
    if (!socket.ptyTerminal.lccRunning) {
        socket.ptyTerminal.lccRunning = true;
        socket.ptyTerminal.write(`echo ${CMD_START_MARKER}${IS_WIN ? ';' : '&&'}${lccCommand} ${fileName} ${IS_WIN ? ';' : '&&'} echo ${CMD_DONE_MARKER}\r`);

    }
}

function sendPayload(socket, endpoint, type, data) {
    if (endpoint === 'terminal-output') {
        console.log('Sending terminal output', type, JSON.stringify(data));
        // check if 'echo CMD_DONE_MARKER' is present in the output
        if (data.includes(CMD_START_MARKER)) {
            console.log('Contains unique marker');
            
            return;
        }
        let escapeSequences = ["[1C", "[?25h", "[93me"];
        data = data.replace(CMD_DONE_MARKER, ''); // Remove the marker from the output
        data = data.replace(escapeSequences[0], " ");
        data = data.replace(escapeSequences[1], " ");
        data = data.replace(escapeSequences[2], " ");
    }
    socket.emit(endpoint, { 
        type,
        data,
        lccRunning: socket.ptyTerminal.lccRunning
    });
}

function bindPtyTerminalWithSocket(socket) {
    socket.ptyTerminal = pty.spawn(SHELL, [], {
        name: 'dumb',
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: process.env
    });
    socket.ptyTerminal.lccRunning = false;
    socket.ptyTerminal.cleanup = function cleanup() {
        console.log('Cleaning up');
        if (socket.ptyTerminal.lccRunning) {
            socket.ptyTerminal.lccRunning = false;
            // send ctrl+c to kill the process
            socket.ptyTerminal.write('\x03');
            socket.ptyTerminal.write('\x03');
            socket.uniqueMarkerCount = 0
            socket.lineCount = 0;
            socket.processingData = false;
        }
    }
    socket.ptyTerminal.on('error', function (error) {
        console.error(`Error: ${error}`);
    });
    socket.uniqueMarkerCount = 0;
    socket.lineCount = 0;
    socket.processingData = false;

    /* lccProcess bindings */
    socket.ptyTerminal.on('data', function (data) {
        if (socket.processingData)
            return; // Skip the data processing if the previous data is still being processed

        socket.processingData = true;

        if (!socket.ptyTerminal.lccRunning || socket.ptyTerminal.killed) {
            socket.processingData = false;
            return;
        }
        socket.lineCount++;
        //console.log('Line count:', socket.lineCount, socket.uniqueMarkerCount, data);

        //console.log('\x1b[36m%s\x1b[0m', data); // Print the output in cyan color
        if (data.includes(CMD_DONE_MARKER)) { // Check if the marker is present in the output
            let markerIndex = data.indexOf(CMD_DONE_MARKER);

            if (socket.uniqueMarkerCount > 0) { // If the marker is present more than once, it means the output is complete
                // When you detect the marker, emit a 'finished' event
                console.log('Contains unique marker');
                socket.ptyTerminal.cleanup();
                sendPayload(socket, 'terminal-output', 'finished', data.slice(0, markerIndex));
                return;
            }
            socket.uniqueMarkerCount++;
        }

        sendPayload(socket, 'terminal-output', 'running', data);
        socket.processingData = false;
    });

    socket.ptyTerminal.on('exit', function (code, signal) {
        console.log(`lccProcess exited with code ${code} and signal ${signal}`);
    });
    /* socket bindings */
    socket.on('input', (input) => {
        console.log(`Received input: ${input}`)
        if (!socket.ptyTerminal.lccRunning || socket.ptyTerminal.killed)
            return;
        socket.ptyTerminal.write(input + '\r'); // '\r' simulates the enter key in a terminal
    });

    socket.on('terminate-lcc', () => {
        socket.ptyTerminal.cleanup(); // sends ctrl-c to kill the process. keeps the terminal clean
        sendPayload(socket, 'terminate-lcc', 'terminated', null);
        // socket.emit('terminate-lcc', { lccRunning: socket.ptyTerminal.lccRunning });
    });

    socket.on('execute', (data) => {
        const { fileName, codeString } = data;
        writeCodeToFile(fileName, codeString, () => {
            executeLCC(socket, fileName);
        });
    });
}


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.uniqueId = Math.random().toString(36).substring(7); // TODO: replace with words/githubid
    bindPtyTerminalWithSocket(socket);
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

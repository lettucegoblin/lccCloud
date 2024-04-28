import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const defaultCodeString = `    mov r0, 5
    dout r0
    nl
    halt`;

const demoBprogram = `    lea r0, hello
    sout r0
    nl
    halt

hello:  .string "Hello World!"`;

function App() {
    const outputRef = useRef(null);
    const socketRef = useRef(null);
    const [ideContent, setIdeContent] = useState(localStorage.getItem('ideContent') || defaultCodeString);
    const [terminalOutput, setTerminalOutput] = useState(localStorage.getItem('terminalOutput') || '');
    const [fileNameContent, setFileNameContent] = useState(localStorage.getItem('fileNameContent') || 'demoA.a');
    const [errorMessage, setErrorMessage] = useState("");
    const [userInput, setUserInput] = useState("");
    const [runningProgram, setRunningProgram] = useState(false);

    useEffect(() => {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }, [terminalOutput]);

    useEffect(() => {
        localStorage.setItem('fileNameContent', fileNameContent);
        localStorage.setItem('ideContent', ideContent);
        localStorage.setItem('terminalOutput', terminalOutput);
    }, [fileNameContent, ideContent, terminalOutput]);

    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_LCC_API);

        socketRef.current.on('terminal-output', data => {
            console.log(`LCC Running: ${data.lccRunning}`);
            setRunningProgram(data.lccRunning);
            setTerminalOutput(output => `${output}${data.tokenResponse}`);
        });

        socketRef.current.on('terminate-lcc', data => {
            console.log(`LCC Running: ${data.lccRunning}`);
            setRunningProgram(false);
        });

        socketRef.current.on('error', data => {
            setErrorMessage(`Error: ${data.data}`);
            setRunningProgram(false);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const handleDemoABtnClick = () => {
        setIdeContent(defaultCodeString);
        setFileNameContent("demoA.a");
        setErrorMessage('');
    }

    const handleDemoBBtnClick = () => {
        setIdeContent(demoBprogram);
        setFileNameContent("demoB.a");
        setErrorMessage('');
    }

    const handleClearBtnClick = () => {
        setTerminalOutput('');
        setErrorMessage('');
    }

    const handleRunStopButtonClick = () => {
        if (!runningProgram) {
            if (socketRef.current) {
                socketRef.current.emit('execute', {
                    fileName: fileNameContent,
                    codeString: ideContent
                });
            }
        } else {
            if (socketRef.current) {
                socketRef.current.emit('terminate-lcc');
            }
        }

    };

    const handleUserInput = (e) => {
        if (e.key === 'Enter') {
            socketRef.current.emit('input', userInput);
            setUserInput(''); // Clear input field after sending
        }
    };

    return (
        <section className="tc mr-auto ml-auto helvetica">
            <h1 className="f2 fw9 ma0 pt3 pb2">LCC Cloud</h1>
            <section>
                <button className="link pointer dim br-pill bn ph3 pv2 dib mr1" onClick={handleDemoABtnClick}>Load Demo A</button>
                <button className="link pointer dim br-pill bn ph3 pv2 dib ml1" onClick={handleDemoBBtnClick}>Load Demo B</button>
            </section>
            <div className="pt2 measure-narrow flex mr-auto ml-auto">
                <label className="w4">File Name:</label>
                <input
                    type="text"
                    placeholder="test.a"
                    className="code w-100"
                    onChange={e => setFileNameContent(e.target.value)}
                    value={fileNameContent} />
            </div>
            <section className="measure-narrow mr-auto ml-auto">
                <p className="ma0 pt2 pb1 o-50">Enter your text program below:</p>
                <textarea
                    rows="10"
                    className="w-100 code v-align-top"
                    onChange={e => setIdeContent(e.target.value)}
                    spellCheck="false"
                    value={ideContent}
                ></textarea>
                <section className="pt2">
                    <button
                        className="link pointer dim br-pill bn ph3 pv2 dib mr1"
                        onClick={handleRunStopButtonClick}>
                        {runningProgram ? "Stop" : "Run"}
                    </button>
                    <button className="link pointer dim br-pill bn ph3 pv2 dib ml1" onClick={handleClearBtnClick}>Clear</button>
                </section>
                <section className="measure-narrow mr-auto ml-auto pt2">
                    <textarea
                        id="lcc-cloud-output"
                        rows="10"
                        className="w-100 code v-align-top"
                        readOnly
                        value={terminalOutput}
                        ref={outputRef}
                    ></textarea>
                    <input
                        type="text"
                        placeholder="Enter input..."
                        className="w-100 mt3"
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        onKeyPress={handleUserInput}
                    />
                    <p className="ma0 pt2">{errorMessage}</p>
                </section>
            </section>
        </section>
    );
}

export default App;

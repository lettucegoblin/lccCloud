import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const defaultCodeString = `    mov r0, 5
    dout r0
    nl
    halt`;

const demoBprogram = `    lea r0, ask
    sout r0
    sin r0
    lea r1, hi
    sout r1
    sout r0
    lea r0, period
    sout r0
    nl
    halt

ask:  .string "What's your name? "
hi:   .string "Hi, "
period: .string "."`;

function App() {
    const outputRef = useRef(null);
    const inputRef = useRef(null);
    const socketRef = useRef(null);
    const lastTokenTimeStamp = useRef(0);
    const tokenTimeout = useRef(null);
    const [ideContent, setIdeContent] = useState(localStorage.getItem('ideContent') || defaultCodeString);
    const [terminalOutput, setTerminalOutput] = useState(localStorage.getItem('terminalOutput') || '');
    const [fileNameContent, setFileNameContent] = useState(localStorage.getItem('fileNameContent') || 'demoA.a');
    const [errorMessage, setErrorMessage] = useState("");
    const [userInput, setUserInput] = useState("");
    const runningProgramRef = useRef(false);

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

        socketRef.current.on('terminal-output', payload => {
            runningProgramRef.current = payload.lccRunning;
            setTerminalOutput(output => `${output}${payload.data}`);

            clearTimeout(tokenTimeout.current);
            
            tokenTimeout.current = setTimeout(() => {
                
                if (runningProgramRef.current == true){
                    toast.success("Terminal waiting for input...");
                    inputRef.current.focus();
                }
            }, 500);
            
        });

        socketRef.current.on('terminate-lcc', payload => {
            console.log(`LCC Running: ${payload.lccRunning}`);
            runningProgramRef.current = payload.lccRunning;
            toast.success("Program stopped");
        });

        socketRef.current.on('error', payload => { 
            // TODO: Handle error
            setErrorMessage(`Error: ${payload.data}`);
            runningProgramRef.current = false;
            toast.error(`Error: ${payload.data}`);
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
        if (!runningProgramRef.current) {
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
            <ToastContainer />
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
                        {runningProgramRef.current ? "Stop" : "Run"}
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
                        ref={inputRef}
                    />
                    <p className="ma0 pt2">{errorMessage}</p>
                </section>
            </section>
        </section>
    );
}

export default App;

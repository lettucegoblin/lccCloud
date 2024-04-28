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

  const [textAreaContent, setTextAreaContent] = useState(localStorage.getItem('textAreaContent') || defaultCodeString);
  const [output, setOutput] = useState(localStorage.getItem('output') || '');
  const [fileNameContent, setFileNameContent] = useState(localStorage.getItem('fileNameContent') || 'demoA.a');
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  useEffect(() => {
    localStorage.setItem('fileNameContent', fileNameContent);
    localStorage.setItem('textAreaContent', textAreaContent);
    localStorage.setItem('output', output);
  }, [fileNameContent, textAreaContent, output]);

  useEffect(() => {
    // Connect to the server on component mount and clean up on unmount
    socketRef.current = io(import.meta.env.VITE_LCC_API);

    socketRef.current.on('output', data => {
      setOutput(output => `${output}\n${data.data}`);
    });

    socketRef.current.on('error', data => {
      setErrorMessage(`Error: ${data.data}`);
    });

    socketRef.current.on('completed', () => {
      console.log('Execution completed.');
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const handleDemoABtnClick = () => {
    setTextAreaContent(defaultCodeString);
    setFileNameContent("demoA.a");
    setErrorMessage('');
  }

  const handleDemoBBtnClick = () => {
    setTextAreaContent(demoBprogram);
    setFileNameContent("demoB.a");
    setErrorMessage('');
  }

  const handleClearBtnClick = () => {
    setOutput('');
    setErrorMessage('');
  }

  const handleButtonClick = () => {
    if (socketRef.current) {
      socketRef.current.emit('execute', {
        fileName: fileNameContent,
        aCode: textAreaContent
      });
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
          onChange={e => setTextAreaContent(e.target.value)}
          spellCheck="false"
          value={textAreaContent}
        ></textarea>
      </section>
      <section className="pt2">
        <button className="link pointer dim br-pill bn ph3 pv2 dib mr1" onClick={handleButtonClick}>Run</button>
        <button className="link pointer dim br-pill bn ph3 pv2 dib ml1" onClick={handleClearBtnClick}>Clear</button>
      </section>
      <section className="measure-narrow mr-auto ml-auto pt2">
        <textarea
          rows="10"
          className="w-100 code v-align-top"
          readOnly
          value={output}
          ref={outputRef}
        ></textarea>
        <p className="ma0 pt2">{errorMessage}</p>
      </section>
    </section>
  );
}

export default App;

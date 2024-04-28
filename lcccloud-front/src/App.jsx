import { useState, useRef, useEffect } from 'react'
import './App.css'

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

  const [textAreaContent, setTextAreaContent] = useState(localStorage.getItem('textAreaContent') || defaultCodeString);
  const [output, setOutput] = useState(localStorage.getItem('output') || '');
  const [fileNameContent, setFileNameContent] = useState(localStorage.getItem('fileNameContent') || 'demoA.a');
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Scroll to the bottom of the textarea whenever the output state changes
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]); // Add output as a dependency

  useEffect(() => {
    // Save the new values to localStorage whenever they change
    localStorage.setItem('fileNameContent', fileNameContent);
    localStorage.setItem('textAreaContent', textAreaContent);
    localStorage.setItem('output', output);
  }, [fileNameContent, textAreaContent, output]); // Add fileNameContent, textAreaContent, and output as dependencies

  // Load Demo A
  const handleDemoABtnClick = () => {
    setTextAreaContent(defaultCodeString);
    setFileNameContent("demoA.a");
    setErrorMessage('');
  }

  // Load Demo B
  const handleDemoBBtnClick = () => {
    setTextAreaContent(demoBprogram);
    setFileNameContent("demoB.a");
    setErrorMessage('');
  }

  const handleClearBtnClick = () => {
    setOutput('');
    setErrorMessage('');
  }
  
  /* Goal: Post to http://127.0.0.1:3000/lcc */
  const handleButtonClick = async () => {
    const unsupportedYet = ['din', 'sin', 'hin', 'ain'];

    // TODO: remove this first check when the API is updated to support these instructions
    if (unsupportedYet.some(word => textAreaContent.includes(word))) {
      setErrorMessage('Error: LCC Cloud does not support the following instructions yet: ' + unsupportedYet.join(', '));
      return;
    }

    if (fileNameContent.trim() === "") {
      setErrorMessage('Error: File name cannot be empty.');
      return;
    }

    if (fileNameContent.lastIndexOf(".a") === -1 && fileNameContent.lastIndexOf(".bin") === -1) {
      setErrorMessage('Error: File name must end with .a or .bin.');
      return;
    }

    if((fileNameContent.lastIndexOf(".a" !== -1) && fileNameContent.length < 3) ||
      (fileNameContent.lastIndexOf(".bin" !== -1) && fileNameContent.length < 5)) {
      setErrorMessage('Error: File name is too short, please make it longer.');
      return;
    }

    setErrorMessage('');

    const response = await fetch(`${import.meta.env.VITE_LCC_API}/lcc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestType: 'execute',
        data: {
          fileName: fileNameContent,
          aCode: textAreaContent,
          stdin: ""
        }
      })
    });

    const data = await response.json();
    // console.log(data);
    if (output.trim() !== "") {
      setOutput(output => output + '\n' + data.output);
    } else {
      setOutput(data.output);
    }

  };


  return (
    <section className="tc mr-auto ml-auto helvetica">
      <h1 className="f2 fw9 ma0 pt3 pb2">LCC Cloud</h1>
      <section>
        <button className="link pointer dim br-pill bn ph3 pv2 dib mr1" id="demo-a-btn" onClick={handleDemoABtnClick}>Load Demo A</button>
        <button className="link pointer dim br-pill bn ph3 pv2 dib ml1" id="demo-b-btn" onClick={handleDemoBBtnClick}>Load Demo B</button>
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
          id="lcc-cloud-ide"
          rows="10"
          className="w-100 code v-align-top"
          onChange={e => setTextAreaContent(e.target.value)}
          spellCheck="false"
          value={textAreaContent}
        ></textarea>
      </section>
      <section className="pt2">
        <button className="link pointer dim br-pill bn ph3 pv2 dib mr1" id="run-btn" onClick={handleButtonClick}>Run</button>
        <button className="link pointer dim br-pill bn ph3 pv2 dib ml1" id="clear-btn" onClick={handleClearBtnClick}>Clear</button>
      </section>
      <section className="measure-narrow mr-auto ml-auto pt2">
        <textarea
          id="lcc-cloud-output"
          rows="10"
          className="w-100 code v-align-top"
          readOnly
          value={output}
          ref={outputRef}
        ></textarea>
        <p className="ma0 pt2">{errorMessage}</p>
      </section>
      {/*
      <label>Standard Input:</label>
      <input type="text" placeholder=""></input>
      <input type="button" value="Enter"></input>
      */}
    </section>
  )
}

export default App

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

  const [textAreaContent, setTextAreaContent] = useState(defaultCodeString);
  const [output, setOutput] = useState('');
  const [fileNameContent, setFileNameContent] = useState('demoA.a');

  useEffect(() => {
    // Scroll to the bottom of the textarea whenever the output state changes
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]); // Add output as a dependency

  // Load Demo A
  const handleDemoABtnClick = () => {
    setTextAreaContent(defaultCodeString);
    setFileNameContent("demoA.a");
  }

  // Load Demo B
  const handleDemoBBtnClick = () => {
    setTextAreaContent(demoBprogram);
    setFileNameContent("demoB.a");
  }
  
  /* Goal: Post to http://127.0.0.1:3000/lcc */
  const handleButtonClick = async () => {
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
    <>
      <h1>LCC Cloud</h1>
      <section>
        <button id="demo-a-btn" onClick={() => handleDemoABtnClick()}>Load Demo A</button>
        <button id="demo-b-btn" onClick={() => handleDemoBBtnClick()}>Load Demo B</button>
      </section>

      <div>
        <label>File Name:</label>
        <input
          type="text"
          placeholder="test.a"
          onChange={e => setFileNameContent(e.target.value)}
          value={fileNameContent} />
      </div>
      <section>
        <p>Enter your text program below:</p>
        <textarea
          id="lcc-cloud-ide"
          rows="10"
          style={{ width: "24em" }}
          onChange={e => setTextAreaContent(e.target.value)}
          value={textAreaContent}
        ></textarea>
      </section>
      <section>
        <button id="run-btn" onClick={handleButtonClick}>Run</button>
        <button id="clear-btn">Clear</button>
      </section>
      <textarea
        id="lcc-cloud-output"
        rows="10"
        style={{ width: "24em" }}
        readOnly
        value={output}
        ref={outputRef}
      ></textarea>

      {/*
      <label>Standard Input:</label>
      <input type="text" placeholder=""></input>
      <input type="button" value="Enter"></input>
      */}
    </>
  )
}

export default App

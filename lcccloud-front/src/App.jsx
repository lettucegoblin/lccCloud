import { useState } from 'react'
import './App.css'

function App() {

  const [textAreaContent, setTextAreaContent] = useState('');
  const [output, setOutput] = useState('');
  const [fileNameContent, setFileNameContent] = useState('test.a');

  /* Goal: Post to http://127.0.0.1:3000/lcc */
  const handleButtonClick = async () => {
    const response = await fetch('http://localhost:3000/lcc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestType: 'execute',
        data: {
          fileName: fileNameContent,
          aCode: textAreaContent
        }
      })
    });

    const data = await response.json();
    console.log(data);
    setOutput(data.output); // Set output state to response data
  };


  return (
    <>
      <h1>LCC Cloud</h1>
      <p>Enter your text program below:</p>

      <div>
      <label>File Name:</label>
      <input
        type="text"
        placeholder="test.a"
        onChange={e => setFileNameContent(e.target.value)} />
      </div>
      <textarea
        id="lcc-cloud-ide"
        rows="10"
        style={{width: "24em"}}
        onChange={e => setTextAreaContent(e.target.value)}
        defaultValue={`    mov r0, 5
    dout r0
    nl
    halt`}
      ></textarea>
      <section>
        <button id="run-btn" onClick={handleButtonClick}>Run</button>
      </section>
      <textarea
        id="lcc-cloud-output"
        rows="10"
        style={{width: "24em"}}
        readOnly
        value={output}
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

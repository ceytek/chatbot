import React, { useState, useRef, useEffect } from 'react';
import socketIOClient from "socket.io-client";
const ENDPOINT = "/";
var socket = false;
function App() {

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState([]);
  const messageInput = useRef();
  const chat = useRef();
  const [chatState, setChatState] = useState(true);

  function sendMessage(message){
    messageInput.current.value = ""
    setCurrentMessage("")
    socket.emit("message", message)
  }

  useEffect(() => {
    socket = socketIOClient(ENDPOINT)
    socket.on("message", data => {
      setMessages(messages => [...messages,{from: 'server', message: data}])
      chat.current.scrollTop = chat.current.scrollHeight
    })
    socket.on("done", (data) => {
      setChatState(false)
    })
  }, [])

  return (
    <div className="bg-gray-100 w-full h-full flex">
      <div className="w-full md:w-2/3 lg:w-1/2 xl:w-1/3 h-full bg-gray-200 m-auto md:h-5/6 rounded-xl flex flex-col">
        <div className="h-full w-full pt-10 px-10 pb-20 flex flex-col overflow-y-auto" ref={chat}>
          {
            messages.map(function(message, index){
              return <div key={index} className={`${message.from === "self" ? "bg-gray-50 text-gray-800 rounded-bl-3xl ml-auto" : "mr-auto bg-blue-600 text-gray-50 rounded-br-3xl"} rounded-t-3xl py-1 px-4 text-lg m-4`}>
              {message.message}
              </div>
            })
          }
        </div>
        { chatState ? <div className="h-14 w-full flex flex-row">
          <input type="text" ref={messageInput} onKeyUp={(e) => {setCurrentMessage(e.target.value)}} className="rounded-xl border-2 focus:border-blue-500 focus:outline-none border-gray-400 px-4 ml-4 mb-4 w-full" />
          <button className="bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-xl px-3 mx-4 mb-4" onClick={() => {if(currentMessage === ""){ return } setMessages(messages => [...messages,{from: 'self', message: currentMessage}]); sendMessage(currentMessage)}}>Send</button>
        </div> :
          <p className="text-center mb-5 mx-auto mt-5">Chat bitti, teşekkürler.</p>
        }
      </div>
    </div>
  );
}

export default App;

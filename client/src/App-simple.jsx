import { useState, useEffect } from 'react'
import io from 'socket.io-client'

function App() {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [username, setUsername] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')

  // Initialize socket connection
  useEffect(() => {
    console.log('🔄 Connecting to Socket.io server...')
    
    const newSocket = io('http://localhost:5000', {
      transports: ['polling']
    })
    
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('✅ Connected! Socket ID:', newSocket.id)
      setIsConnected(true)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason)
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('🚨 Connection error:', error)
      setIsConnected(false)
    })

    // Listen for messages
    newSocket.on('message', (messageData) => {
      setMessages(prev => [...prev, messageData])
    })

    return () => newSocket.close()
  }, [])

  const joinChat = (e) => {
    e.preventDefault()
    if (username.trim().length >= 2 && socket && isConnected) {
      socket.emit('joinChat', { username: username.trim() })
      setHasJoined(true)
    }
  }

  const sendMessage = (e) => {
    e.preventDefault()
    if (inputMessage.trim() && socket && isConnected) {
      const messageData = {
        sender: username,
        message: inputMessage.trim(),
        timestamp: new Date().toLocaleTimeString()
      }
      socket.emit('sendMessage', messageData)
      setInputMessage('')
    }
  }

  if (!hasJoined) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
        <h1>💬 JBest Chat</h1>
        <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
        <p>Debug: Socket={socket ? 'Yes' : 'No'} | Connected={isConnected ? 'Yes' : 'No'} | Username Length={username.length}</p>
        
        <form onSubmit={joinChat} style={{ marginTop: '1rem' }}>
          <input
            type="text"
            placeholder="Enter your name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '0.5rem', marginRight: '0.5rem', width: '200px' }}
          />
          <button
            type="submit"
            disabled={!username.trim() || username.trim().length < 2 || !isConnected}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: (username.trim().length >= 2 && isConnected) ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              cursor: (username.trim().length >= 2 && isConnected) ? 'pointer' : 'not-allowed'
            }}
          >
            Join Chat
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>💬 JBest Chat - Welcome {username}!</h1>
      <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      
      <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'auto', padding: '1rem', marginBottom: '1rem' }}>
        {messages.length === 0 ? (
          <p>No messages yet. Start chatting!</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '0.5rem' }}>
              <strong>{msg.sender}:</strong> {msg.message} <small>({msg.timestamp})</small>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          style={{ padding: '0.5rem', marginRight: '0.5rem', width: '300px' }}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || !isConnected}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: (inputMessage.trim() && isConnected) ? '#28a745' : '#ccc',
            color: 'white',
            border: 'none',
            cursor: (inputMessage.trim() && isConnected) ? 'pointer' : 'not-allowed'
          }}
        >
          Send
        </button>
      </form>
      
      <button
        onClick={() => setHasJoined(false)}
        style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#dc3545', color: 'white', border: 'none' }}
      >
        Leave Chat
      </button>
    </div>
  )
}

export default App
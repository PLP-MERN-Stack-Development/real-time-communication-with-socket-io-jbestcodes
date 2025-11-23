import { useState, useEffect } from 'react'
import io from 'socket.io-client'

function App() {
  const [socket, setSocket] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [username, setUsername] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [hasJoined, setHasJoined] = useState(false)

  // Initialize socket connection
  useEffect(() => {
    console.log('🔄 Starting Socket.io connection test...')
    
    // Test basic connection first
    const testSocket = io('http://localhost:5000', {
      transports: ['polling'], // Use only polling for simplicity
      timeout: 3000,
      autoConnect: true,
      forceNew: true
    })
    
    setSocket(testSocket)

    // Simple connection test
    testSocket.on('connect', () => {
      console.log('🎉 SUCCESS! Socket.io connected:', testSocket.id)
      setIsConnected(true)
    })

    testSocket.on('connect_error', (error) => {
      console.error('❌ Connection failed:', error.type, error.description)
      setIsConnected(false)
      
      // Try to reconnect manually
      setTimeout(() => {
        console.log('🔄 Attempting manual reconnect...')
        testSocket.connect()
      }, 2000)
    })

    testSocket.on('disconnect', (reason) => {
      console.log('📤 Disconnected:', reason)
      setIsConnected(false)
    })

    // Server connection confirmation
    testSocket.on('connect_confirmed', (data) => {
      console.log('🎉 Server connection confirmed:', data)
    })

    // Chat events
    testSocket.on('message', (messageData) => {
      setMessages(prev => [...prev, messageData])
    })

    testSocket.on('userJoined', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'System',
        message: `${data.username} joined the chat`,
        timestamp: new Date().toLocaleTimeString(),
        isSystem: true
      }])
      setOnlineUsers(data.users)
    })

    testSocket.on('userLeft', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'System', 
        message: `${data.username} left the chat`,
        timestamp: new Date().toLocaleTimeString(),
        isSystem: true
      }])
      setOnlineUsers(data.users)
    })

    testSocket.on('updateUsers', (users) => {
      setOnlineUsers(users)
    })

    return () => testSocket.close()
  }, [])

  const joinChat = (e) => {
    if (e) e.preventDefault()
    if (username.trim().length >= 2 && socket && isConnected) {
      socket.emit('joinChat', { username: username.trim() })
      setHasJoined(true)
    }
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (inputMessage.trim() && socket && username) {
      const messageData = {
        sender: username,
        message: inputMessage.trim(),
        timestamp: new Date().toLocaleTimeString()
      }
      socket.emit('sendMessage', messageData)
      setInputMessage('')
    }
  }

  // If not joined yet, show join form
  if (!hasJoined) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          textAlign: 'center',
          minWidth: '300px'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#2d3748' }}>💬 Join JBest Chat</h2>
          <p style={{ margin: '0 0 1.5rem 0', color: '#718096' }}>
            Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </p>
          <div style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#4a5568' }}>
            Debug: Socket={socket ? 'Yes' : 'No'} | Connected={isConnected ? 'Yes' : 'No'} | Username Length={username.length}
          </div>
          <form onSubmit={joinChat}>
            <input
              type="text"
              placeholder="Enter your name (min 2 characters)..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="submit"
              disabled={!username.trim() || username.trim().length < 2 || !isConnected}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: (username.trim().length >= 2 && isConnected) ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e2e8f0',
                color: (username.trim().length >= 2 && isConnected) ? 'white' : '#a0aec0',
                border: 'none',
                borderRadius: '8px',
                cursor: (username.trim().length >= 2 && isConnected) ? 'pointer' : 'not-allowed',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Join Chat Room
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '10px 10px 0 0',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#2d3748' }}>💬 JBest Chat</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#718096', fontSize: '0.9rem' }}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'} • {onlineUsers.length} online
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#4a5568', fontWeight: '500' }}>Welcome, {username}!</p>
          <button
            onClick={() => {
              setHasJoined(false)
              setUsername('')
              setMessages([])
              setOnlineUsers([])
            }}
            style={{
              background: '#f56565',
              color: 'white',
              border: 'none',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              marginTop: '0.25rem'
            }}
          >
            Leave
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{
        background: 'white',
        height: '400px',
        overflowY: 'auto',
        padding: '1rem',
        border: '1px solid #e2e8f0'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#718096', marginTop: '2rem' }}>
            <p>💬 Welcome to the chat! Start typing to send messages.</p>
            <p>👥 Online users: {onlineUsers.join(', ')}</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id || Date.now() + Math.random()} style={{
              background: msg.isSystem ? '#f0f8ff' : '#f7fafc',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              borderRadius: '8px',
              border: `1px solid ${msg.isSystem ? '#bee3f8' : '#e2e8f0'}`
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '0.25rem',
                fontSize: '0.8rem',
                color: msg.isSystem ? '#2b6cb0' : '#4a5568'
              }}>
                <strong>{msg.sender}</strong>
                <span>{msg.timestamp}</span>
              </div>
              <div style={{ 
                color: msg.isSystem ? '#2b6cb0' : '#2d3748',
                fontStyle: msg.isSystem ? 'italic' : 'normal'
              }}>
                {msg.message}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} style={{
        background: 'white',
        borderRadius: '0 0 10px 10px',
        padding: '1rem',
        display: 'flex',
        gap: '0.5rem',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
      }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={!isConnected}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '2px solid #e2e8f0',
            borderRadius: '25px',
            outline: 'none',
            fontSize: '1rem',
            opacity: isConnected ? 1 : 0.5
          }}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || !isConnected}
          style={{
            padding: '0.75rem 1.5rem',
            background: (inputMessage.trim() && isConnected) ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e2e8f0',
            color: (inputMessage.trim() && isConnected) ? 'white' : '#a0aec0',
            border: 'none',
            borderRadius: '25px',
            cursor: (inputMessage.trim() && isConnected) ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Send 📤
        </button>
      </form>
    </div>
  )
}

export default App
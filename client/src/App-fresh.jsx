import { useState, useEffect } from 'react'
import io from 'socket.io-client'
import './App.css'

function App() {
  // State management
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [username, setUsername] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState([])

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['polling', 'websocket']
    })

    setSocket(newSocket)

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server')
      setIsConnected(false)
    })

    // Chat events
    newSocket.on('messageHistory', (messageHistory) => {
      setMessages(messageHistory)
    })

    newSocket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message])
    })

    newSocket.on('userJoined', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        username: 'System',
        message: data.message,
        timestamp: data.timestamp,
        isSystem: true
      }])
    })

    newSocket.on('userLeft', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        username: 'System',
        message: data.message,
        timestamp: data.timestamp,
        isSystem: true
      }])
    })

    newSocket.on('usersList', (users) => {
      setOnlineUsers(users)
    })

    newSocket.on('userTyping', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...prev.filter(u => u !== data.username), data.username])
      } else {
        setTypingUsers(prev => prev.filter(u => u !== data.username))
      }
    })

    return () => newSocket.close()
  }, [])

  // Join chat function
  const joinChat = (e) => {
    e.preventDefault()
    if (username.trim().length >= 2 && socket && isConnected) {
      socket.emit('join', { username: username.trim() })
      setHasJoined(true)
    }
  }

  // Send message function
  const sendMessage = (e) => {
    e.preventDefault()
    if (currentMessage.trim() && socket && isConnected) {
      socket.emit('sendMessage', { message: currentMessage.trim() })
      setCurrentMessage('')
      
      // Stop typing indicator
      socket.emit('typing', false)
    }
  }

  // Handle typing
  const handleTyping = (value) => {
    setCurrentMessage(value)
    
    if (socket && hasJoined) {
      socket.emit('typing', value.length > 0)
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Login screen
  if (!hasJoined) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>💬 JBest Chat</h1>
          <p className="status">
            Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </p>
          
          <form onSubmit={joinChat}>
            <input
              type="text"
              placeholder="Enter your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="username-input"
              minLength={2}
              required
            />
            <button 
              type="submit" 
              disabled={!isConnected || username.trim().length < 2}
              className="join-button"
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Main chat interface
  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <h1>💬 JBest Chat</h1>
        <div className="header-info">
          <span className="status">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span className="username">Welcome, {username}!</span>
          <button 
            onClick={() => setHasJoined(false)}
            className="leave-button"
          >
            Leave
          </button>
        </div>
      </div>

      <div className="chat-main">
        {/* Sidebar with online users */}
        <div className="sidebar">
          <h3>Online Users ({onlineUsers.length})</h3>
          <div className="users-list">
            {onlineUsers.map(user => (
              <div key={user.id} className="user-item">
                🟢 {user.username}
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="chat-area">
          {/* Messages */}
          <div className="messages-container">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.isSystem ? 'system-message' : ''}`}
              >
                <div className="message-header">
                  <span className="sender">{message.username}</span>
                  <span className="timestamp">{formatTime(message.timestamp)}</span>
                </div>
                <div className="message-content">{message.message}</div>
              </div>
            ))}
            
            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
          </div>

          {/* Message input */}
          <form onSubmit={sendMessage} className="message-form">
            <input
              type="text"
              placeholder="Type your message..."
              value={currentMessage}
              onChange={(e) => handleTyping(e.target.value)}
              className="message-input"
              disabled={!isConnected}
            />
            <button 
              type="submit" 
              disabled={!currentMessage.trim() || !isConnected}
              className="send-button"
            >
              Send 📤
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
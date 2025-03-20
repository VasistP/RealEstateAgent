import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';

function ChatWindow({ onResponse, setLoading }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    // Check if this is a property search query
    const isPropertyQuery = /property|apartment|house|rent|sale|lease|buy|real estate/i.test(input);

    try {
      // Use the chat API for general queries
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      console.log("Response data:", data);
      
      // Add property-specific response for property queries
      if (isPropertyQuery) {
        data.message = "I'm searching for properties in this area. Would you like to see apartments for rent, sale, or lease?";
      }
      
      const botMessage = {
        text: data.reply || data.message,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
      onResponse({...data, isPropertyQuery});
      
      // If it's a property query, also fetch properties
      if (isPropertyQuery) {
        // Extract location from the input or use the one from the response
        const location = data.address || extractLocationFromInput(input);
        if (location) {
          onResponse({
            message: `Looking for properties in ${location}`,
            location: location
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        text: "Sorry, I couldn't process your request. Please try again.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const extractLocationFromInput = (input) => {
    // Simple regex to extract location - can be improved
    const locationMatch = input.match(/in\s+([^,]+(?:,\s*[A-Z]{2})?)/i);
    return locationMatch ? locationMatch[1] : '';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Real Estate Assistant</h2>
      </div>
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <p>Welcome to RealEstateAI! Ask me about any location to find homes and nearby amenities.</p>
            <p>For example: "Show me information about San Francisco 94105" or "What's around Austin, TX 78704?"</p>
            <p>You can also ask about properties: "Find apartments for rent in Dubai" or "Show me houses for sale in New York"</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.sender === 'bot' 
                  ? msg.text.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))
                  : msg.text
                }
              </div>
              <div className="message-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a location or ask about properties..."
          className="chat-input"
        />
        <button className="send-button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
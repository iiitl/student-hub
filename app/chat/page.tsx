'use client'
import Message from '@/components/message'
import Sidebar from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import sample_message from '@/data/sample_message'
import React, { useState } from 'react'

interface Participant {
  name: string
  avatar: string
}

interface MessageType {
  text: string
  sender: string
  senderAvatar: string
  timestamp: string
}
export default function Page() {
  const [message, setMessage] = useState<string>('')
  const [messages, setMessages] = useState<MessageType[]>(
    sample_message.user_message
  )
  const [participants] = useState<Participant[]>(sample_message.participants)

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: MessageType = {
        text: message,
        sender: 'User1',
        senderAvatar:
          'https://th.bing.com/th/id/OIP.7SSen49kIgXR90Ii5VLYUAHaJQ?w=136&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7',
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages([...messages, newMessage])
      setMessage('')
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1">
        <Sidebar participants={participants} />
        <div className="flex-1 flex flex-col p-6">
          <div className="flex-1 overflow-y-auto">
            {messages.map((msg, index) => (
              <Message key={index} message={msg} user="User1" />
            ))}
          </div>
          <div className="flex mt-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-3 border border-muted-foreground rounded-lg mr-3"
            />
            <Button
              onClick={handleSendMessage}
              variant={'secondary'}
              className="border border-gray-300 hover:bg-blue-600 hover:text-white"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

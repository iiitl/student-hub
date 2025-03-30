import Image from 'next/image'

interface MessageProps {
  message: {
    text: string
    sender: string
    senderAvatar: string
    timestamp: string
  }
  user: string
}

export default function Message({ message, user }: MessageProps) {
  return (
    <div
      className={`flex ${message.sender === user ? 'flex-row-reverse' : ''} mb-4`}
    >
      <Image
        src={message.senderAvatar}
        alt={message.sender}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full mr-3"
      />
      <div className="max-w-[60%] bg-muted-200 p-3 rounded-xl shadow-md dark:shadow-lg dark:shadow-white/50">
        <p>{message.sender}</p>
        <p className="text-muted-foreground">{message.text}</p>
        <span className="text-sm text-muted-foreground">
          {message.timestamp}
        </span>
      </div>
    </div>
  )
}

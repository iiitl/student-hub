import Image from 'next/image'
import React from 'react'
import { GiHamburgerMenu } from 'react-icons/gi'
import { RxCross1 } from 'react-icons/rx'

interface Participant {
  avatar?: string
  name: string
}

interface SidebarProps {
  participants: Participant[]
}

const Sidebar: React.FC<SidebarProps> = ({ participants }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }
  return (
    <div
      className={`bg-muted p-4 ${isOpen ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out border-r border-gray-300`}
    >
      <button onClick={toggleSidebar} className="text-xl">
        {isOpen ? <GiHamburgerMenu /> : <RxCross1 />}
      </button>
      <br />
      {!isOpen && <h3 className="text-lg font-semibold">Participants</h3>}
      {!isOpen && (
        <ul>
          {participants.map((participant, index) => (
            <li key={index} className="flex items-center mb-4">
              <Image
                src={
                  participant.avatar ||
                  'https://www.svgrepo.com/show/213788/avatar-user.svg'
                }
                width={40}
                height={40}
                alt={participant.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <span className="text-muted-foreground">{participant.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Sidebar

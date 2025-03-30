
interface Participant {
  avatar?: string;
  name: string;
}

interface SidebarProps {
  participants: Participant[];
}

const Sidebar:React.FC<SidebarProps> = ({ participants }) => {
    return (
      <div className="bg-muted p-4 w-64 border-r border-gray-300">
        <h3 className="text-lg font-semibold mb-4">Participants</h3>
        <ul>
          {participants.map((participant, index) => (
            <li key={index} className="flex items-center mb-4">
              <img
                src={participant.avatar}
                alt={participant.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <span className="text-muted-foreground">{participant.name}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  export default Sidebar;
  
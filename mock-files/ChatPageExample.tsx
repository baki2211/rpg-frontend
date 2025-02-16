
const ChatPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const locationId = params?.locationId as string; 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<{ username: string; createdAt: string; message: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { connectionStatus, sendMessage, errorMessage } = useWebSocket({
    locationId,
    onMessage: (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Trying to reconnect...');
    },
    onClose: (event) => {
      console.warn('WebSocket connection closed:', event);
      setError('Connection lost. Attempting to reconnect...');
    },
  });

  useEffect(() => {
    if (!locationId) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/chat/${locationId}`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
        scrollToBottom();
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setError('Failed to load messages. Please try again later.');
      }
    };

    fetchMessages();
  }, [locationId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error('You must be logged in to send messages.');
      return;
      }
    if (!newMessage.trim()) return;

    const message = {
      locationId,
      userId: user.id, 
      username: user.username,
      message: newMessage,
      createdAt: new Date().toISOString(),
    };

    sendMessage(message);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        
        {connectionStatus === 'connecting' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
            Connecting to chat...
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-gray-800">{msg.username}</span>
              <span className="text-xs text-gray-500">
                {new Date(msg.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-700">{msg.message}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="border-t border-gray-200 bg-white p-4 shadow-lg"
      >
        <div className="flex gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={connectionStatus !== 'open'}
          />
          <button
            type="submit"
            disabled={connectionStatus !== 'open'}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        {connectionStatus === 'error' && (
          <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
        )}
      </form>
    </div>
    
  );
};

export default ChatPage;


// dashboard bit 

{activeCharacter ? (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>    
      <div key={activeCharacter.id} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', maxWidth: '200px' }}>
        <img 
          src={activeCharacter.imageUrl || '/placeholder.jpg'} 
          alt={activeCharacter.imageUrl || 'activeCharacter Image'} 
          style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
        />
        <h3>{activeCharacter.name}</h3>
        <p><strong>Race:</strong> {activeCharacter.race.name}</p>
        <p><strong>Gender:</strong> {activeCharacter.gender}</p>
        <p><strong>Active:</strong> {activeCharacter.isActive ? 'Yes' : 'No'}</p>
      </div>
  </div>
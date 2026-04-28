import { useSocket } from "./hooks/useSocket";
import { useRoomStore } from "./store/roomStore";
import { joinRoom, sendVote } from "./lib/actions";

function App() {
  useSocket();

  const room = useRoomStore((s) => s.room);

  if (!room) {
    return (
      <div>
        <button onClick={() => joinRoom("abc", "Leo")}>
          Join Room
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>Room: {room.id}</h1>

      <h2>Players</h2>
      {room.players.map((p) => (
        <div key={p.connectionId}>
          {p.name} — {room.isRevealed ? p.vote : p.vote ? "Voted" : "Waiting"}
        </div>
      ))}

      <button onClick={() => sendVote(room.id, "5")}>
        Vote 5
      </button>
    </div>
  );
}

export default App;
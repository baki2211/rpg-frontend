import { useEffect, useState } from 'react';
import axios from 'axios';

interface Player {
    id: number;
    name: string;
    race: string;
    stats: {
        STR: number;
        DEX: number;
        RES: number;
        MN: number;
        CHA: number;
        MGK: number;
    };
}

const Players: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);

    useEffect(() => {
        axios
            .get('http://localhost:5001/api/players')
            .then((response) => setPlayers(response.data))
            .catch((error) => console.error(error));
    }, []);

    return (
        <div>
            <h1>Players</h1>
            <ul>
                {players.map((player) => (
                    <li key={player.id}>
                        {player.name} ({player.race})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Players;

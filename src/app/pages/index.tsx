import Link from 'next/link';

const Home: React.FC = () => {
    return (
        <div>
            <h1>Welcome to the RPG Game</h1>
            <nav>
                <Link href="/players">View Players</Link>
            </nav>
        </div>
    );
};

export default Home;

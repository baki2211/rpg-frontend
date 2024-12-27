export default function HomePage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to the Authentication App</h1>
      <p>
        Use the navigation links to <a href="/register">Register</a>,{' '}
        <a href="/login">Login</a>, or visit the <a href="/protected">Protected Page</a>.
      </p>
    </div>
  );
}

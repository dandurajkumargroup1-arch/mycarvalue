import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link href="/" style={{ color: '#2A9D8F', textDecoration: 'underline' }}>
        Go back to Home
      </Link>
    </div>
  );
}

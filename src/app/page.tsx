'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './utils/AuthContext';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/pages/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null; // Prevent rendering while redirecting
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome to Arcane Realms</h1>
        <p>
          Embark on an epic adventure in a mystical world filled with magic, mystery, and endless possibilities.
        </p>
      </div>
      
      <div className="card home-journey-card">
        <h3 className="home-journey-title">Begin Your Journey</h3>
        <p className="home-journey-text">
          Join thousands of adventurers in exploring enchanted realms, mastering powerful skills,
          and forging your legend in this immersive RPG experience.
        </p>
        <div className="home-journey-buttons">
          <a href="/pages/register" className="btn btn-primary">
            Create Account
          </a>
          <a href="/pages/login" className="btn btn-secondary">
            Login
          </a>
        </div>
      </div>
    </div>
  );
}

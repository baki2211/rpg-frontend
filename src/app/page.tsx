'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import HeaderSection from '@/app/components/common/HeaderSection';
import { ROUTES } from '@/config/routes';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push(ROUTES.dashboard);
    }
  }, [isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return null; // Prevent rendering while checking auth or redirecting
  }

  return (
    <div className="page-container">
      <HeaderSection
        title="Welcome to Arcane Realms"
        subtitle="Embark on an epic adventure in a mystical world filled with magic, mystery, and endless possibilities."
      />
      
      <div className="card home-journey-card">
        <h3 className="home-journey-title">Begin Your Journey</h3>
        <p className="home-journey-text">
          Join thousands of adventurers in exploring enchanted realms, mastering powerful skills,
          and forging your legend in this immersive RPG experience.
        </p>
        <div className="home-journey-buttons">
          <a href={ROUTES.register} className="btn btn-primary">
            Create Account
          </a>
          <a href={ROUTES.login} className="btn btn-secondary">
            Login
          </a>
        </div>
      </div>
    </div>
  );
}

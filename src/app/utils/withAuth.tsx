import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { api } from "../../services/apiClient";

const withAuth = (WrappedComponent: React.ComponentType) => {
  const AuthComponent = (props: Record<string, unknown>) => {
    const router = useRouter();

    useEffect(() => {
      const verifyToken = async () => {
        try {
          await api.get('/protected');
        } catch {
          router.push('/login');
        }
      };

      verifyToken();
    }, [router]);

    return <WrappedComponent {...props} />;
  };
  
  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  return AuthComponent;
};

export default withAuth;

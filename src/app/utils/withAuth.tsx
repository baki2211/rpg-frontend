import React, { useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const withAuth = (WrappedComponent: React.ComponentType) => {
  const AuthComponent = (props: Record<string, unknown>) => {
    const router = useRouter();

    useEffect(() => {
      const verifyToken = async () => {
        try {
          await axios.get('http://localhost:5001/api/protected', { withCredentials: true });
        } catch {
          router.push('/login');
        }
      };

      verifyToken();
    }, []);

    return <WrappedComponent {...props} />;
  };
  
  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  return AuthComponent;
};

export default withAuth;

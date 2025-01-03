import React, { useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const withAuth = (WrappedComponent: React.ComponentType) => {
  return (props: any) => {
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
};

export default withAuth;

import { createContext, useState, useEffect } from 'react';
import { checkLogin } from '../services/authService'; // TODO: Import once implemented

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // TODO: Check login status on app load
  // useEffect(() => {
  //   checkLogin().then(setUser).catch(() => setUser(null));
  // }, []);

  // TODO: Add login/logout functions that update state and call services

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

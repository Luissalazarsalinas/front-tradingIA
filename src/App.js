import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import TopNav from './components/TopNav';
import {AppRouter} from './router/AppRouter';

function App() {
  return (
    <AuthProvider>
      <Router>
        <TopNav />
        <AppRouter />
      </Router>
    </AuthProvider>
  );
}

export default App;

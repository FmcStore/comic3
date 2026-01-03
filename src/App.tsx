import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AnimatePresence } from 'framer-motion';

// Components
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Pages
import Home from './pages/Home';
import Detail from './pages/Detail';
import Chapter from './pages/Chapter';
import Bookmarks from './pages/Bookmarks';
import History from './pages/History';

// Styles
import './styles/globals.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-white">
          <Header />
          
          <AnimatePresence mode="wait">
            <main className="pt-20 pb-24 md:pb-20">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/series/:slug" element={<Detail />} />
                <Route path="/chapter/:slug" element={<Chapter />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/history" element={<History />} />
                <Route path="/ongoing" element={<Home filter="ongoing" />} />
                <Route path="/completed" element={<Home filter="completed" />} />
              </Routes>
            </main>
          </AnimatePresence>

          <BottomNav />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

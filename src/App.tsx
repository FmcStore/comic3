import React, { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load pages
const Home = lazy(() => import('./pages/Home'))
const Detail = lazy(() => import('./pages/Detail'))
const Chapter = lazy(() => import('./pages/Chapter'))
const Bookmarks = lazy(() => import('./pages/Bookmarks'))
const History = lazy(() => import('./pages/History'))
const Search = lazy(() => import('./pages/Search'))
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Show loading when route changes
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [location.pathname])

  // PWA Install Prompt
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered:', registration)
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error)
        })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      <Header />
      
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #f59e0b',
          },
        }}
      />

      <main className="pt-16 pb-20 md:pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<LoadingSpinner />}>
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <Routes location={location}>
                  <Route path="/" element={<Home />} />
                  <Route path="/series/:uuid" element={<Detail />} />
                  <Route path="/chapter/:uuid" element={<Chapter />} />
                  <Route path="/bookmarks" element={<Bookmarks />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/ongoing" element={<Home filter="ongoing" />} />
                  <Route path="/completed" element={<Home filter="completed" />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  )
}

export default App

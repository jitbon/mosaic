import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import EventDetails from './pages/EventDetails';
import Perspectives from './pages/Perspectives';
import Impacts from './pages/Impacts';
import About from './pages/About';
import NotFound from './pages/NotFound';
import { UserProvider } from './contexts/UserContext';
import { SearchProvider } from './contexts/SearchContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <SearchProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/event/:eventId" element={<EventDetails />} />
              <Route path="/event/:eventId/perspectives" element={<Perspectives />} />
              <Route path="/event/:eventId/impacts" element={<Impacts />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </SearchProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
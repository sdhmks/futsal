import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import Sidebar from './components/Sidebar';
import AddTeam from './pages/AddTeam';
import AddPlayer from './pages/AddPlayer';
import Teams from './pages/Teams';
import Players from './pages/Players';
import GameRegistration from './pages/GameRegistration';
import GameRecords from './pages/GameRecords';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './AuthContext';
import './index.css';

function App() {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const { session } = useAuth();

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  return (
    <Router>
      <Container fluid className="p-0">
        <Row>
          <Col>
            {session && <Sidebar isVisible={isSidebarVisible} />}
            <div 
              className={`sidebar-overlay ${isSidebarVisible ? 'visible' : ''}`} 
              onClick={toggleSidebar}
            ></div>
            <div className="main-content">
              {session && (
                <Button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                  ☰
                </Button>
              )}
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Teams />} />
                  <Route path="/add-team" element={<AddTeam />} />
                  <Route path="/add-player" element={<AddPlayer />} />
                  <Route path="/players" element={<Players />} />
                  <Route path="/game-registration" element={<GameRegistration />} />
                  <Route path="/game-records" element={<GameRecords />} />
                </Route>
              </Routes>
            </div>
          </Col>
        </Row>
      </Container>
    </Router>
  );
}

export default App;

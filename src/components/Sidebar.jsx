import React from 'react';
import { Nav, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

function Sidebar({ isVisible }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    window.location.reload(); // Force a reload to clear state
  };

  return (
    <div className={`sidebar ${isVisible ? '' : 'hidden'}`}>
      <h2>Futsal App</h2>
      <Nav className="flex-column">
       
        <LinkContainer to="/add-team">
          <Nav.Link>Add Team</Nav.Link>
        </LinkContainer>
        <LinkContainer to="/add-player">
          <Nav.Link>Add Player</Nav.Link>
        </LinkContainer>
	 <LinkContainer to="/">
          <Nav.Link>Teams</Nav.Link>
        </LinkContainer>
        <LinkContainer to="/players">
          <Nav.Link>Players</Nav.Link>
        </LinkContainer>
        <LinkContainer to="/game-registration">
          <Nav.Link>Game Regist</Nav.Link>
        </LinkContainer>
        <LinkContainer to="/game-records">
          <Nav.Link>Game Record</Nav.Link>
        </LinkContainer>
        <hr />
        <LinkContainer to="/login">
          <Nav.Link>Login</Nav.Link>
        </LinkContainer>
        <LinkContainer to="/signup">
          <Nav.Link>Sign Up</Nav.Link>
        </LinkContainer>
        <Button variant="link" onClick={handleLogout} className="mt-2 text-danger">Logout</Button>
      </Nav>
    </div>
  );
}

export default Sidebar;

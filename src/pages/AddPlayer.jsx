
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

function AddPlayer() {
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchTeams();
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('teams').select('category')
							.order('category',{ascending:true});
    if (error) console.error('Error fetching categories:', error);
    else {
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      setCategories(uniqueCategories);
    }
  };

  const fetchTeams = async () => {
    let query = supabase.from('teams').select('id, school_name').order('school_name', {ascending:true});
    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching teams:', error);
    } else {
      setTeams(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('teams_members')
      .insert([{ team_id: selectedTeam, player_name: playerName, number: playerNumber }]);
    if (error) {
      console.error('Error adding player:', error);
    } else {
      console.log('Player added:', data);
      // Clear form
      setSelectedTeam('');
      setPlayerName('');
      setPlayerNumber('');
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2>Add Player</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formCategory">
              <Form.Label>Category</Form.Label>
              <Form.Select value={selectedCategory} onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedTeam(''); // Reset selected team when category changes
              }}>
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formTeam">
              <Form.Label>Team</Form.Label>
              <Form.Select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} disabled={!selectedCategory}>
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.school_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPlayerName">
              <Form.Label>Player Name</Form.Label>
              <Form.Control type="text" placeholder="Enter player name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPlayerNumber">
              <Form.Label>Player Number</Form.Label>
              <Form.Control type="text" placeholder="Enter player number" value={playerNumber} onChange={(e) => setPlayerNumber(e.target.value)} />
            </Form.Group>

            <Button variant="primary" type="submit">
              Add Player
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default AddPlayer;

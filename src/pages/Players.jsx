import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Table, Button, Modal, Form, FormControl } from 'react-bootstrap';

function Players() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState([]);

  useEffect(() => {
    fetchPlayers();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchTeams();
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPlayers(players);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = players.filter(player =>
        (player.player_name?.toLowerCase().includes(lowercasedQuery)) ||
        (player.teams?.school_name?.toLowerCase().includes(lowercasedQuery))
      );
      setFilteredPlayers(filtered);
    }
  }, [searchQuery, players]);

  const fetchPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('teams_members').select('id, number,player_name, team_id, teams(school_name,headcoach)')
	.order('teams(school_name)', {ascending:true})
	.order('player_name', {ascending:true})
	;
    if (error) {
      console.error('Error fetching players:', error);
      setError(error.message);
    } else {
      setPlayers(data);
      setFilteredPlayers(data);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('teams').select('category');
    if (error) console.error('Error fetching categories:', error);
    else {
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      setCategories(uniqueCategories);
    }
  };

  const fetchTeams = async () => {
    let query = supabase.from('teams').select('id, school_name, category');
    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }
    const { data, error } = await query;
    if (error) console.error('Error fetching teams:', error);
    else setTeams(data);
  };

  const handleEdit = (player) => {
    setCurrentPlayer(player);
    if (player.teams?.category) {
      setSelectedCategory(player.teams.category);
    } else {
      setSelectedCategory('');
    }
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('teams_members').delete().eq('id', id);
    if (error) console.error('Error deleting player:', error);
    else fetchPlayers(); // Refresh list
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { id, player_name, team_id,number } = currentPlayer;
    const { error } = await supabase.from('teams_members').update({ player_name, team_id,number }).eq('id', id);
    if (error) console.error('Error updating player:', error);
    else {
      setEditModalOpen(false);
      fetchPlayers(); // Refresh list
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentPlayer({ ...currentPlayer, [name]: value });
  };

  if (loading) return <div>Loading players...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Players</h2>
      <Form className="mb-3">
        <FormControl
          type="text"
          placeholder="Search by player name or school"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Form>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Team/School</th>
	    <th>Player Name</th>
            <th>HeadCoach</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPlayers.map((player) => (
            <tr key={player.id}>
                <td>{player.teams?.school_name || 'N/A'}</td>
		<td>{player.player_name} ({player.number})</td>
               <td>{player.teams?.headcoach}</td>
              <td>
                <Button variant="warning" onClick={() => handleEdit(player)}>Edit</Button>
                <Button variant="danger" onClick={() => handleDelete(player.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={isEditModalOpen} onHide={() => setEditModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Player</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentPlayer && (
            <Form onSubmit={handleUpdate}>
              <Form.Group className="mb-3">
                <Form.Label>Player Name</Form.Label>
                <Form.Control type="text" name="player_name" value={currentPlayer.player_name} onChange={handleFormChange} />
              </Form.Group>
	    <Form.Group className="mb-3">
                <Form.Label>Number</Form.Label>
                <Form.Control type="text" name="number" value={currentPlayer.number} onChange={handleFormChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Team</Form.Label>
                <Form.Select name="team_id" value={currentPlayer.team_id} onChange={handleFormChange} disabled={!selectedCategory}>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.school_name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Button variant="primary" type="submit">
                Update Player
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Players;

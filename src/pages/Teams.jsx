import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Table, Button, Modal, Form, FormControl } from 'react-bootstrap';

function Teams() {
  const [teams, setTeams] = useState([]);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTeams, setFilteredTeams] = useState([]);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTeams(teams);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = teams.filter(team =>
        (team.category?.toLowerCase().includes(lowercasedQuery)) ||
        (team.group?.toLowerCase().includes(lowercasedQuery)) ||
        (team.school_name?.toLowerCase().includes(lowercasedQuery))
      );
      setFilteredTeams(filtered);
    }
  }, [searchQuery, teams]);

  const fetchTeams = async () => {
    const { data, error } = await supabase.from('teams').select('*')
	.order('category', {ascending:true})
	.order('group',{ascending:true})
	.order('school_name', {ascending:true})
	;
    if (error) console.error('Error fetching teams:', error);
    else {
      setTeams(data);
      setFilteredTeams(data);
    }
  };

  const handleEdit = (team) => {
    setCurrentTeam(team);
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) console.error('Error deleting team:', error);
    else fetchTeams(); // Refresh list
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const { id, ...updatedFields } = currentTeam;
    const { error } = await supabase.from('teams').update(updatedFields).eq('id', id);
    if (error) console.error('Error updating team:', error);
    else {
      setEditModalOpen(false);
      fetchTeams(); // Refresh list
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentTeam({ ...currentTeam, [name]: value });
  };

  return (
    <div>
      <h2>Teams</h2>
      <Form className="mb-3">
        <FormControl
          type="text"
          placeholder="Search by category, group, or school name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Form>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
	    <th>Category</th>
	    <th>Group</th>
            <th>School Name</th>
            <th>Head Coach</th>
	    <th>Status</th>
	    <th>Details</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTeams.map((team) => (
            <tr key={team.id}>
	      <td>{team.category}</td>
	      <td>{team.group}</td>
              <td>{team.school_name}</td>
              <td>{team.headcoach}</td>
	     <td>{team.status}</td>
	     <td>{team.details}</td>
              <td>
                <Button variant="warning" onClick={() => handleEdit(team)}>Edit</Button>
                <Button variant="danger" onClick={() => handleDelete(team.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={isEditModalOpen} onHide={() => setEditModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Team</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentTeam && (
            <Form onSubmit={handleUpdate}>
              <Form.Group className="mb-3">
                <Form.Label>School Name</Form.Label>
                <Form.Control type="text" name="school_name" value={currentTeam.school_name} onChange={handleFormChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Head Coach</Form.Label>
                <Form.Control type="text" name="headcoach" value={currentTeam.headcoach} onChange={handleFormChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Control type="text" name="category" value={currentTeam.category} onChange={handleFormChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Group</Form.Label>
                <Form.Control type="text" name="group" value={currentTeam.group} onChange={handleFormChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Control type="text" name="status" value={currentTeam.status} onChange={handleFormChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Details</Form.Label>
                <Form.Control type="text" name="details" value={currentTeam.details} onChange={handleFormChange} />
              </Form.Group>
              <Button variant="primary" type="submit">
                Update Team
              </Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Teams;


import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

function AddTeam() {
  const [category, setCategory] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [headcoach, setHeadcoach] = useState('');
  const [group, setGroup] = useState('');
  const [status, setStatus] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('teams')
      .insert([{ category, school_name: schoolName, headcoach, group, status, details }]);
    if (error) {
      console.error('Error adding team:', error);
    } else {
      console.log('Team added:', data);
      // Clear form
      setCategory('');
      setSchoolName('');
      setHeadcoach('');
      setGroup('');
      setStatus('');
      setDetails('');
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2>Add Team</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formCategory">
              <Form.Label>Category</Form.Label>
              <Form.Control type="text" placeholder="Enter category" value={category} onChange={(e) => setCategory(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formSchoolName">
              <Form.Label>School Name</Form.Label>
              <Form.Control type="text" placeholder="Enter school name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formHeadCoach">
              <Form.Label>Head Coach</Form.Label>
              <Form.Control type="text" placeholder="Enter head coach" value={headcoach} onChange={(e) => setHeadcoach(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formGroup">
              <Form.Label>Group</Form.Label>
              <Form.Control type="text" placeholder="Enter group" value={group} onChange={(e) => setGroup(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formStatus">
              <Form.Label>Status</Form.Label>
              <Form.Control type="text" placeholder="Enter status" value={status} onChange={(e) => setStatus(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formDetails">
              <Form.Label>Details</Form.Label>
              <Form.Control type="text" placeholder="Enter details" value={details} onChange={(e) => setDetails(e.target.value)} />
            </Form.Group>

            <Button variant="primary" type="submit">
              Add Team
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default AddTeam;

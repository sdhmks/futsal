
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { Form, Button, Container, Row, Col, ListGroup, Alert } from 'react-bootstrap';

function GameRegistration() {
  // General state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(''); // Single category for both teams
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [gametime, setGametime] = useState('');
  const [gameTitles, setGameTitles] = useState([]);
  const [selectedGameTitle, setSelectedGameTitle] = useState('');
  const [newGameTitle, setNewGameTitle] = useState('');
  const [side, setSide] = useState('home');

  // Team State
  const [schools, setSchools] = useState([]);
  const [players, setPlayers] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [headcoach, setHeadcoach] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [details, setDetails] = useState('');

  // Fetch unique categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('teams').select('category');
      if (error) console.error('Error fetching categories:', error);
      else {
        const uniqueCategories = [...new Set(data.map(item => item.category))];
        setCategories(uniqueCategories);
      }
    };
    fetchCategories();

    const fetchGameTitles = async () => {
      const { data, error } = await supabase.from('game_regist').select('game_title');
      if (error) {
        console.error('Error fetching game titles:', error);
      } else {
        const uniqueTitles = [...new Set(data.map(item => item.game_title).filter(Boolean))];
        const formattedTitles = uniqueTitles.map(title => ({ title: title }));
        setGameTitles(formattedTitles);
      }
    };
    fetchGameTitles();
  }, []);

  // Generic function to fetch schools based on category
  const fetchSchools = async (category, setSchoolsCallback) => {
    let query = supabase.from('teams').select('id, school_name');
    if (category && category !== 'Not Pool') {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) console.error('Error fetching schools:', error);
    else setSchoolsCallback(data || []);
  };

  // Effect to fetch schools when category changes
  useEffect(() => {
    fetchSchools(selectedCategory, setSchools);
    setSelectedSchoolId('');
    setHeadcoach('');
    setPlayers([]);
  }, [selectedCategory]);

  // Effect to fetch team details when a school is selected
  useEffect(() => {
    if (selectedSchoolId) {
      const fetchTeamDetails = async () => {
        const { data: teamData, error: teamError } = await supabase.from('teams').select('headcoach').eq('id', selectedSchoolId).single();
        if (teamError) console.error('Error fetching team data:', teamError);
        else setHeadcoach(teamData.headcoach);

        const { data: playersData, error: playersError } = await supabase.from('teams_members').select('player_name,number').eq('team_id', selectedSchoolId);
        if (playersError) console.error('Error fetching players:', playersError);
        else setPlayers(playersData);
      };
      fetchTeamDetails();
    } else {
      setHeadcoach('');
      setPlayers([]);
    }
  }, [selectedSchoolId]);

  const uploadPhoto = async (photoFile, recordId) => {
    if (!photoFile) return '';
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${recordId}_${Date.now()}.${fileExt}`;
    const filePath = `game_photos/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, photoFile, {
      upsert: false, 
    });

    if (uploadError) {
      throw new Error(`Error uploading photo: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from('photos').getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchoolId) {
      setMessage('Please select a team.');
      return;
    }
    setUploading(true);
    setMessage('');

    try {
      let gameTitleToUse = selectedGameTitle;
      if (selectedGameTitle === 'New Title') {
        gameTitleToUse = newGameTitle;
      }

      const photoUrl = await uploadPhoto(photoFile);

      const { error } = await supabase.from('game_regist').insert([{
        // A game_id is needed to group home and away teams.
        // For simplicity, we'll use the game title and time to group them.
        // A more robust solution might involve selecting an existing game.
        game_id: uuidv4(), // Or a shared ID based on game title/time
        side: side,
        team_id: selectedSchoolId,
        photo: photoUrl,
        details: details,
        gametime: gametime,
        game_title: gameTitleToUse,
      }]);

      if (error) {
        throw error;
      }

      setMessage('Game registration successful!');
      // Reset form can be added here
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const renderTeamColumn = (title, schools, selectedSchoolId, setSelectedSchoolId, headcoach, setPhotoFile, setDetails, players, bgColorClass) => (
    <Col md={6} className={`p-3 rounded ${bgColorClass}`}>
      <h3>{title}</h3>

      <Form.Group className="mb-3">
        <Form.Select value={selectedSchoolId} onChange={(e) => setSelectedSchoolId(e.target.value)} required disabled={!selectedCategory}>
          <option value="">Select School</option>
          {schools.map(sch => <option key={sch.id} value={sch.id}>{sch.school_name}</option>)}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Control type="text" placeholder="Head Coach" value={headcoach} readOnly />
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Control type="file" name="photo" accept="image/*" capture="environment" onChange={(e) => setPhotoFile(e.target.files[0])} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Control as="textarea" rows={3} name="details" placeholder="Details" onChange={(e) => setDetails(e.target.value)} />
      </Form.Group>

      {players.length > 0 && (
        <>
          <h5>Player List</h5>
          <ListGroup>
            {players.map((player, index) => <ListGroup.Item key={index}>{player.player_name} ({player.number})</ListGroup.Item>)}
          </ListGroup>
        </>
      )}
    </Col>
  );

  return (
    <Container className="game-registration-container">
      <Row className="justify-content-md-center">
        <Col md={10} lg={8} xl={7}>
          <h2>Game Registration</h2>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} required>
                    <option value="">Select Category</option>
                    <option value="Not Pool">Not Pool</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col>
                <Form.Group>
                  <Form.Label>Game Title</Form.Label>
                  <Form.Select value={selectedGameTitle} onChange={(e) => setSelectedGameTitle(e.target.value)} required>
                    <option value="">Select Game Title</option>
                    <option value="New Title">New Title</option>
                    {gameTitles.map(title => <option key={title.title} value={title.title}>{title.title}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            {selectedGameTitle === 'New Title' && (
              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label>New Game Title</Form.Label>
                    <Form.Control type="text" placeholder="Enter new game title" value={newGameTitle} onChange={(e) => setNewGameTitle(e.target.value)} required />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Side</Form.Label>
              <Form.Select value={side} onChange={(e) => setSide(e.target.value)}>
                <option value="home">Home</option>
                <option value="away">Away</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>School</Form.Label>
              <Form.Select value={selectedSchoolId} onChange={(e) => setSelectedSchoolId(e.target.value)} required disabled={!selectedCategory}>
                <option value="">Select School</option>
                {schools.map(sch => <option key={sch.id} value={sch.id}>{sch.school_name}</option>)}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Head Coach</Form.Label>
              <Form.Control type="text" placeholder="Head Coach" value={headcoach} readOnly />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Photo</Form.Label>
              <Form.Control type="file" name="photo" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Details</Form.Label>
              <Form.Control as="textarea" rows={3} name="details" placeholder="Details" onChange={(e) => setDetails(e.target.value)} />
            </Form.Group>

            {players.length > 0 && (
              <>
                <h5>Player List</h5>
                <ListGroup className="mb-3">
                  {players.map((player, index) => <ListGroup.Item key={index}>{player.player_name} ({player.number})</ListGroup.Item>)}
                </ListGroup>
              </>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Game Time</Form.Label>
              <Form.Control type="datetime-local" name="gametime" value={gametime} onChange={(e) => setGametime(e.target.value)} required />
            </Form.Group>
            <Button type="submit" disabled={uploading} className="w-100">{uploading ? 'Uploading...' : 'Register Game'}</Button>
          </Form>
          {message && <Alert variant="info" className="mt-3">{message}</Alert>}
        </Col>
      </Row>
    </Container>
  );
}

export default GameRegistration;

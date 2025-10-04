import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Table, Modal, Image, Button, Form, FormControl } from 'react-bootstrap';

function GameRecords() {
  const [gameRecords, setGameRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [selectedRecordForModal, setSelectedRecordForModal] = useState(null);
  const [editingCell, setEditingCell] = useState(null); // { rowId, column, value }
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGameRecords, setFilteredGameRecords] = useState([]);

  const handleDelete = async (recordId, photoUrl) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        // Step 1: Delete the photo from storage if it exists
        if (photoUrl) {
          const urlParts = photoUrl.split('/');
          const filePath = `game_photos/${urlParts[urlParts.length - 1]}`;
          const { error: storageError } = await supabase.storage.from('photos').remove([filePath]);
          if (storageError) {
            console.error('Error deleting photo:', storageError);
            // Decide if you want to stop the process if photo deletion fails
          }
        }

        // Step 2: Delete the record from the database
        const { error: dbError } = await supabase.from('game_regist').delete().eq('id', recordId);
        if (dbError) {
          throw dbError;
        }

        // Refresh the records list
        fetchGameRecords();
      } catch (error) {
        console.error('Error deleting record:', error);
        setError('Failed to delete record. ' + error.message);
      }
    }
  };

  useEffect(() => {
    fetchGameRecords();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGameRecords(gameRecords);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = gameRecords.filter(record =>
        (record.game_title?.toLowerCase().includes(lowercasedQuery)) ||
        (record.teams?.school_name?.toLowerCase().includes(lowercasedQuery)) ||
        (record.teams?.category?.toLowerCase().includes(lowercasedQuery))
      );
      setFilteredGameRecords(filtered);
    }
  }, [searchQuery, gameRecords]);

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

  const handlePhotoUpload = async (e, record) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      // Step 1: Delete the old photo if it exists, to prevent orphaned files
      if (record.photo) {
        const oldUrlParts = record.photo.split('/');
        const oldFilePath = `game_photos/${oldUrlParts[oldUrlParts.length - 1]}`;
        // We can ignore a potential error if the file doesn't exist
        await supabase.storage.from('photos').remove([oldFilePath]);
      }

      // Step 2: Upload the new photo
      const photoUrl = await uploadPhoto(file, record.id);
      
      // Step 3: Update the database record with the new photo URL
      const { error } = await supabase
        .from('game_regist')
        .update({ photo: photoUrl })
        .eq('id', record.id);

      if (error) throw error;

      handleCloseImageModal();
      fetchGameRecords();
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo. ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const fetchGameRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('game_regist')
      .select('id, game_id, game_title, side, details, gametime, photo, team_id, teams(category, school_name, headcoach, group)')
      .order('gametime', { ascending: false });
    if (error) {
      console.error('Error fetching game records:', error);
      setError(error.message);
    } else {
      setGameRecords(data);
      setFilteredGameRecords(data);
    }
    setLoading(false);
  };

  const handleImageClick = (record) => {
    setSelectedRecordForModal(record);
    setImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
    setSelectedRecordForModal(null);
  };

  const handleCellClick = (record, column, table, initialValue) => {
    setEditingCell({
      rowId: record.id,
      teamId: record.team_id,
      column,
      value: initialValue,
      table,
    });
  };

  const handleCancel = () => {
    setEditingCell(null);
  };

  const handleInputChange = (e) => {
    setEditingCell(prev => ({ ...prev, value: e.target.value }));
  };

  const handleSave = async () => {
    if (!editingCell) return;

    const { rowId, teamId, column, value, table } = editingCell;
    
    let query;
    if (table === 'teams') {
      query = supabase.from('teams').update({ [column]: value }).eq('id', teamId);
    } else {
      query = supabase.from('game_regist').update({ [column]: value }).eq('id', rowId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error updating record:', error);
      setError('Failed to update record. ' + error.message);
    } else {
      setEditingCell(null);
      fetchGameRecords(); // Refresh data
    }
  };

  if (loading) return <div>Loading game records...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Game Records</h2>
      <Form className="mb-3">
        <FormControl
          type="text"
          placeholder="Search by game title, school, or category"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Form>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
	    <th>GameTitle</th>
            <th>GameTime</th>
            <th>Category</th>
            <th>School Name</th>
            <th>Head Coach</th>
            <th>Group</th>
            <th>Details</th>
            <th>Photo</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredGameRecords.map((record) => (
            <tr key={record.id}>
              <td>{record.id}</td>
              <td onClick={() => !editingCell && handleCellClick(record, 'game_title', 'game_regist', record.game_title)}>
                {editingCell && editingCell.rowId === record.id && editingCell.column === 'game_title' ? (
                  <div>
                    <input type="text" value={editingCell.value} onChange={handleInputChange} autoFocus />
                    <Button onClick={handleSave} size="sm">Save</Button>
                    <Button onClick={handleCancel} size="sm" variant="secondary">X</Button>
                  </div>
                ) : ( record.game_title )}
              </td>
              <td onClick={() => !editingCell && handleCellClick(record, 'gametime', 'game_regist', record.gametime)}>
                {editingCell && editingCell.rowId === record.id && editingCell.column === 'gametime' ? (
                  <div>
                    <input type="datetime-local" value={editingCell.value} onChange={handleInputChange} autoFocus />
                    <Button onClick={handleSave} size="sm">Save</Button>
                    <Button onClick={handleCancel} size="sm" variant="secondary">X</Button>
                  </div>
                ) : ( record.gametime )}
                <br />{record.game_id}
              </td>
              <td onClick={() => !editingCell && handleCellClick(record, 'category', 'teams', record.teams?.category)}>
                {editingCell && editingCell.rowId === record.id && editingCell.column === 'category' ? (
                  <div>
                    <input type="text" value={editingCell.value} onChange={handleInputChange} autoFocus />
                    <Button onClick={handleSave} size="sm">Save</Button>
                    <Button onClick={handleCancel} size="sm" variant="secondary">X</Button>
                  </div>
                ) : ( record.teams?.category || 'N/A' )}
              </td>
              <td onClick={() => !editingCell && handleCellClick(record, 'school_name', 'teams', record.teams?.school_name)}>
                {editingCell && editingCell.rowId === record.id && editingCell.column === 'school_name' ? (
                  <div>
                    <input type="text" value={editingCell.value} onChange={handleInputChange} autoFocus />
                    <Button onClick={handleSave} size="sm">Save</Button>
                    <Button onClick={handleCancel} size="sm" variant="secondary">X</Button>
                  </div>
                ) : ( record.teams?.school_name || 'N/A' )}
                <br />{record.side}
              </td>
              <td onClick={() => !editingCell && handleCellClick(record, 'headcoach', 'teams', record.teams?.headcoach)}>
                {editingCell && editingCell.rowId === record.id && editingCell.column === 'headcoach' ? (
                  <div>
                    <input type="text" value={editingCell.value} onChange={handleInputChange} autoFocus />
                    <Button onClick={handleSave} size="sm">Save</Button>
                    <Button onClick={handleCancel} size="sm" variant="secondary">X</Button>
                  </div>
                ) : ( record.teams?.headcoach || 'N/A' )}
              </td>
              <td onClick={() => !editingCell && handleCellClick(record, 'group', 'teams', record.teams?.group)}>
                {editingCell && editingCell.rowId === record.id && editingCell.column === 'group' ? (
                  <div>
                    <input type="text" value={editingCell.value} onChange={handleInputChange} autoFocus />
                    <Button onClick={handleSave} size="sm">Save</Button>
                    <Button onClick={handleCancel} size="sm" variant="secondary">X</Button>
                  </div>
                ) : ( record.teams?.group || 'N/A' )}
              </td>
              <td onClick={() => !editingCell && handleCellClick(record, 'details', 'game_regist', record.details)}>
                {editingCell && editingCell.rowId === record.id && editingCell.column === 'details' ? (
                  <div>
                    <input type="text" value={editingCell.value} onChange={handleInputChange} autoFocus />
                    <Button onClick={handleSave} size="sm">Save</Button>
                    <Button onClick={handleCancel} size="sm" variant="secondary">X</Button>
                  </div>
                ) : ( record.details )}
              </td>
              <td>
                {record.photo ? (
                  <Image
                    src={record.photo}
                    alt="Game"
                    style={{ width: '100px', height: 'auto', cursor: 'pointer' }}
                    onClick={() => handleImageClick(record)}
                    thumbnail
                  />
                ) : (
                  <Button variant="link" size="sm" onClick={() => handleImageClick(record)}>
                    Add Photo
                  </Button>
                )}
              </td>
              <td>
                <Button variant="danger" size="sm" onClick={() => handleDelete(record.id, record.photo)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {selectedRecordForModal && (
        <>
          <input
            type="file"
            accept="image/*"
            
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={(e) => handlePhotoUpload(e, selectedRecordForModal)}
            disabled={uploadingPhoto}
          />
	
          <Modal show={isImageModalOpen} onHide={handleCloseImageModal} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Game Photo</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
              {selectedRecordForModal.photo ? (
                <Image src={selectedRecordForModal.photo} alt="Zoomed Game" fluid />
              ) : (
                <p>No photo to display. Click the button below to upload one.</p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={() => fileInputRef.current.click()} disabled={uploadingPhoto}>
                {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </Button>
              <Button variant="secondary" onClick={handleCloseImageModal}>Close</Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
}

export default GameRecords;

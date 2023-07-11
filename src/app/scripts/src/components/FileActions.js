import React from 'react';
import { Button, Box } from '@mui/material';

import { ref, getDownloadURL } from 'firebase/storage';

import { fbStorage } from '../utils/firebase';

const FileActions = ({ fileData, fileId, onDeleteFile, onEditFile }) => {
    const handleDownload = () => {
        const storageRef = ref(fbStorage, fileData.path);
        getDownloadURL(storageRef)
            .then((url) => {
                window.open(url, '_blank');
            })
            .catch((error) => console.log(error));
    };

    return (
        <Box sx={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="contained" onClick={handleDownload}>
                View
            </Button>
            <Button variant="contained" onClick={() => onEditFile({ id: fileId, ...fileData })}>
                Edit
            </Button>
            <Button
                variant="contained"
                color="error"
                onClick={() => onDeleteFile(fileData, fileId)}
            >
                Delete
            </Button>
        </Box>
    );
};

export default FileActions;

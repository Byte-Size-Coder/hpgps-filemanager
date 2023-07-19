import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';

import { ref, getDownloadURL } from 'firebase/storage';

import { fbStorage } from '../utils/firebase';

import FileOpenIcon from '@mui/icons-material/FileOpen';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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
		<Box sx={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
			<Tooltip title="Open File">
				<IconButton variant="contained" onClick={handleDownload}>
					<FileOpenIcon color="primary" />
				</IconButton>
			</Tooltip>
			<Tooltip title="Edit File">
				<IconButton
					variant="contained"
					onClick={() => onEditFile({ id: fileId, ...fileData })}
				>
					<EditIcon color="primary" />
				</IconButton>
			</Tooltip>

			<Tooltip title="Delete File">
				<IconButton
					variant="contained"
					color="error"
					onClick={() => onDeleteFile(fileData, fileId)}
				>
					<DeleteIcon color="error" />
				</IconButton>
			</Tooltip>
		</Box>
	);
};

export default FileActions;

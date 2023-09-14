import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';

import { ref, getBlob } from 'firebase/storage';

import { fbStorage } from '../utils/firebase';

import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const FileActions = ({ fileData, fileId, onDeleteFile, onEditFile }) => {
	const handleDownload = () => {
		const storageRef = ref(fbStorage, fileData.path);
		getBlob(storageRef)
			.then((blob) => {
				let link = document.createElement('a');
				link.href = window.URL.createObjectURL(blob);
				link.download = fileData.fileName;
				link.click();
			})
			.catch((error) => console.log(error));
	};

	return (
		<Box sx={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
			<Tooltip title="Download File">
				<IconButton variant="contained" onClick={handleDownload}>
					<OpenInNewRoundedIcon color="primary" />
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

import React from 'react';

import { ref, getDownloadURL } from 'firebase/storage';

import { fbStorage } from '../utils/firebase';

const FileActions = ({ fileData, fileId, onDeleteFile }) => {
	const handleDownload = () => {
		const storageRef = ref(fbStorage, fileData.path);
		getDownloadURL(storageRef)
			.then((url) => {
				window.open(url, '_blank');
			})
			.catch((error) => console.log(error));
	};

	return (
		<div style={{ display: 'flex', gap: '0.5rem' }}>
			<button className="geotabButton" onClick={handleDownload}>
				View
			</button>
			<button className="geotabButton" onClick={() => onDeleteFile(fileData, fileId)}>
				Delete
			</button>
		</div>
	);
};

export default FileActions;

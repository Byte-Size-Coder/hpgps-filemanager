import React from 'react';

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
        <div className="gapper">
            <button className="geo-button" onClick={handleDownload}>
                View
            </button>
            <button className="geo-button" onClick={() => onEditFile({ id: fileId, ...fileData })}>
                Edit
            </button>
            <button className="geo-button" onClick={() => onDeleteFile(fileData, fileId)}>
                Delete
            </button>
        </div>
    );
};

export default FileActions;

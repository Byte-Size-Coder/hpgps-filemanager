import React, { useEffect, useState } from 'react';

import Uploader from './components/Uploader';
import DocumentTable from './components/DocumentTabel';
import FileActions from './components/FileActions';

import 'filepond/dist/filepond.min.css';
import '../../styles/app.css';

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { fbStorage, fbFirestore } from './utils/firebase';
import Popup from './components/Popup';

const App = ({ api, database }) => {
    const [files, setFiles] = useState([]);
    const [tableFiles, setTableFiles] = useState([]);
    const [editFile, setEditFile] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteLoad, setDeleteLoad] = useState(false);

    const handleDeleteFile = (file, id) => {
        setDeleteConfirm({
            id,
            ...file,
        });
    };

    const handeEditFile = (fileData) => {
        setEditFile({ ...fileData });
    };

    const handleFileEditComplete = (id, updateDoc) => {
        setEditFile(null);

        const newFiles = [...files];

        const foundFileIndex = newFiles.findIndex((f) => f.id === id);

        if (foundFileIndex !== -1) {
            newFiles[foundFileIndex] = {
                ...newFiles[foundFileIndex],
                ...updateDoc,
            };

            setFiles([...newFiles]);
        }
    };

    const onDeleteConfirmed = () => {
        const storageRef = ref(fbStorage, deleteConfirm.path);
        setDeleteLoad(true);
        deleteObject(storageRef).then(() => {
            deleteDoc(doc(fbFirestore, database, deleteConfirm.id)).then(() => {
                onFileDeleted(deleteConfirm.id);
            });
        });
    };

    const onFileDeleted = (id) => {
        setDeleteLoad(false);
        const newFiles = files.filter((file) => file.id !== id);
        setFiles(newFiles);
        setDeleteConfirm(null);
    };

    const handleFilesUploaded = (docs) => {
        const newFiles = [...files, ...docs];
        setFiles(newFiles);
    };

    useEffect(() => {
        getDocs(collection(fbFirestore, database)).then((snapshot) => {
            const fetchedFiles = [];
            snapshot.forEach((doc) => {
                fetchedFiles.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });
            setFiles([...fetchedFiles]);
        });
    }, []);

    useEffect(() => {
        const filesWithActions = files.map((file) => {
            file.action = (
                <FileActions
                    fileData={file}
                    fileId={file.id}
                    onDeleteFile={handleDeleteFile}
                    onEditFile={handeEditFile}
                    api={api}
                />
            );
            return file;
        });

        setTableFiles([...filesWithActions]);
    }, [files]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                marginLeft: '0.75rem',
                marginRight: '0.75rem',
            }}
            id="HPGPS"
        >
            <Uploader
                storage={fbStorage}
                firestore={fbFirestore}
                database={database}
                api={api}
                onFileUploaded={handleFilesUploaded}
                editFile={editFile}
                onEditComplete={handleFileEditComplete}
            />
            <DocumentTable files={tableFiles} />
            <Popup open={deleteConfirm !== null}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <h2>Are you sure you want to delete the following file?</h2>
                    <h3> {deleteConfirm ? deleteConfirm.fileName : ''}</h3>
                </div>
                <div className="hpgps-popup-actions">
                    {deleteLoad ? (
                        <div className="spinner-container">
                            <div className="HPGPS_loading-spinner"></div>
                        </div>
                    ) : (
                        <>
                            <button className="geo-button" onClick={onDeleteConfirmed}>
                                Yes
                            </button>
                            <button className="geo-button" onClick={() => setDeleteConfirm(null)}>
                                No
                            </button>
                        </>
                    )}
                </div>
            </Popup>
        </div>
    );
};

export default App;

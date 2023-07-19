import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';

import Uploader from './components/Uploader';
import DocumentTable from './components/DocumentTabel';
import FileActions from './components/FileActions';

import 'filepond/dist/filepond.min.css';
import '../../styles/app.css';

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { getAuth, signInAnonymously } from 'firebase/auth';

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
		console.log(docs);
		const newFiles = [...files, ...docs];
		setFiles(newFiles);
	};

	useEffect(() => {
		const auth = getAuth();
		signInAnonymously(auth)
			.then(() => {
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
			})
			.catch((error) => {
				console.error(error);
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
		<Box
			sx={{
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
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'center',
						width: '100%',
					}}
				>
					<Typography variant="h6">
						Are you sure you want to delete the following file?
					</Typography>
					<Typography sx={{ width: '100%', overflow: 'clip' }}>
						{deleteConfirm ? deleteConfirm.fileName : ''}
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
					{deleteLoad ? (
						<CircularProgress />
					) : (
						<>
							<Button variant="contained" onClick={onDeleteConfirmed}>
								Yes
							</Button>
							<Button variant="contained" onClick={() => setDeleteConfirm(null)}>
								No
							</Button>
						</>
					)}
				</Box>
			</Popup>
		</Box>
	);
};

export default App;

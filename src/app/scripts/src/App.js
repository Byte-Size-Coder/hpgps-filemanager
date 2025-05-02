import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';

import Uploader from './components/Uploader';
import DocumentTable from './components/DocumentTabel';
import FileActions from './components/FileActions';

import '../../styles/app.css';

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { fbStorage, fbFirestore } from './utils/firebase';
import Popup from './components/Popup';
import DocumentMobile from './components/DocumentMobile';
import { verifyDatabaseCode } from './utils/verifyDatabaseCode';

const App = ({ api, database }) => {
	const [files, setFiles] = useState([]);
	const [tableFiles, setTableFiles] = useState([]);
	const [editFile, setEditFile] = useState(null);
	const [deleteConfirm, setDeleteConfirm] = useState(null);
	const [deleteLoad, setDeleteLoad] = useState(false);
	const [mobile, setMobile] = useState(false);
	const [code, setCode] = useState('');
	const [codeValid, setCodeValid] = useState(null);

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
		const hash = window.location.hash;
		const [path, queryString] = hash.split('?');
	
		let codeValue = '';
	
		if (queryString) {
			const params = new URLSearchParams(queryString);
			codeValue = params.get('code');
			console.log('code from URL:', codeValue);
		}

		setCode(codeValue);
	
		if (!codeValue) {
			setCodeValid(false);
			return;
		}
	
		verifyDatabaseCode(codeValue, database, fbFirestore).then((isValid) => {
			if (!isValid) {
				console.warn('Invalid or missing code');
				setCodeValid(false);
				return;
			}

			setCodeValid(true);
	
			// Code valid — load documents
			getDocs(collection(fbFirestore, database)).then((snapshot) => {
				const fetchedFiles = [];
				snapshot.forEach((doc) => {
					if(doc.data().fileName) {
						fetchedFiles.push({
							id: doc.id,
							...doc.data(),
						});
					}
				});
	
				fetchedFiles.sort((a, b) => a.fileName.localeCompare(b.fileName));
				setFiles(fetchedFiles);
			});
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

	useEffect(() => {
		function updateSize() {
			setMobile(window.innerWidth < 1200);
		}
		window.addEventListener('resize', updateSize);
		updateSize();
		return () => window.removeEventListener('resize', updateSize);
	}, []);

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
			{codeValid === null ? (
				<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100vh',
			}}
		>
			<CircularProgress />
		</Box>
			) :
			<>
				{codeValid === true ? (
					<>
	<Uploader
				storage={fbStorage}
				firestore={fbFirestore}
				database={database}
				code={code}
				api={api}
				onFileUploaded={handleFilesUploaded}
				editFile={editFile}
				onEditComplete={handleFileEditComplete}
			/>
			{mobile ? <DocumentMobile files={tableFiles} /> : <DocumentTable files={tableFiles} />}

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
					</>
				):(
					<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'center',
						height: '100vh',
					}}
				>
					<Typography variant="h2" color="error">
						Invalid Access Code
					</Typography>
					<Typography variant="h4" color="error">
						You cannot access this database's geodoc files.
					</Typography>
				</Box>
				)}
			</>
			}
		
		</Box>
	);
};

export default App;

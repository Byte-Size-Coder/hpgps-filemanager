import React, { useEffect, useState, useCallback } from 'react';

import Uploader from './components/Uploader';
import DocumentTable from './components/DocumentTabel';
import FileActions from './components/FileActions';

import 'filepond/dist/filepond.min.css';
import '../../styles/app.css';

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { fbStorage, fbFirestore } from './utils/firebase';

const App = ({ api, database }) => {
	const [files, setFiles] = useState([]);

	const handleDeleteFile = useCallback(
		(file, id, database) => {
			const storageRef = ref(fbStorage, file.path);

			deleteObject(storageRef).then(() => {
				deleteDoc(doc(fbFirestore, database, id)).then(() => {
					onFileDeleted(id);
				});
			});
		},
		[database]
	);

	const onFileDeleted = (id) => {
		const newFiles = files.filter((file) => file !== id);
		setFiles(newFiles);
	};

	const handleFilesUploaded = (docs) => {
		docs.forEach((doc) => {
			doc.action = (
				<FileActions
					fileData={doc}
					fileId={doc.id}
					onDeleteFile={(file, id) => handleDeleteFile(file, id, database)}
					api={api}
				/>
			);
		});
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
					action: (
						<FileActions
							fileData={doc.data()}
							fileId={doc.id}
							onDeleteFile={(file, id) => handleDeleteFile(file, id, database)}
						/>
					),
				});
			});
			setFiles(fetchedFiles);
		});
	}, []);

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
			/>
			<DocumentTable files={files} />
		</div>
	);
};

export default App;

import React, { useEffect, useState, useCallback } from 'react';

import Uploader from './components/Uploader';
import DocumentTable from './components/DocumentTabel';
import FileActions from './components/FileActions';

import 'filepond/dist/filepond.min.css';
import '../../styles/App.css';

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { fbStorage, fbFirestore } from './utils/firebase';

const App = () => {
	const [database, setDatabase] = useState('');
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
				/>
			);
		});
		const newFiles = [...files, ...docs];
		setFiles(newFiles);
	};

	useEffect(() => {
		if (global.api) {
			api.getSession(
				function (result) {
					getDocs(collection(fbFirestore, result.database)).then((snapshot) => {
						const fetchedFiles = [];
						snapshot.forEach((doc) => {
							fetchedFiles.push({
								id: doc.id,
								...doc.data(),
								action: (
									<FileActions
										fileData={doc.data()}
										fileId={doc.id}
										onDeleteFile={(file, id) =>
											handleDeleteFile(file, id, result.database)
										}
									/>
								),
							});
						});
						setFiles(fetchedFiles);
						setDatabase(result.database);
					});
				},
				function (e) {
					console.error('Failed:', e);
				}
			);
		}
	}, []);

	return (
		<div style={{ display: 'flex', flexDirection: 'column' }}>
			<Uploader
				storage={fbStorage}
				firestore={fbFirestore}
				database={database}
				onFileUploaded={handleFilesUploaded}
			/>
			<DocumentTable files={files} />
		</div>
	);
};

export default App;

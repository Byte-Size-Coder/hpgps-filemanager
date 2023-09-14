import React, { useEffect, useState } from 'react';
import {
	Box,
	Typography,
	CircularProgress,
	FormControlLabel,
	RadioGroup,
	Radio,
} from '@mui/material';
import { formatGeotabData, formatOptions } from '../utils/formatter';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBlob, deleteObject } from 'firebase/storage';

import { Button } from '@mui/material';

import { FilePond } from 'react-filepond';

import { fbStorage, fbFirestore } from '../utils/firebase';

import '../../../styles/app.css';
import AssociateSelect from './AssociateSelect';
import GroupSelect from './GroupSelect';

const Uploader = ({ database, onFileUploaded, api, editFile, onEditComplete }) => {
	const [uploadFiles, setUploadFiles] = useState([]);
	const [geotabData, setGeotabData] = useState({
		vehicles: [],
		drivers: [],
		trailers: [],
		groups: [],
	});
	const [uploadData, setUploadData] = useState({
		vehicles: [],
		drivers: [],
		trailers: [],
		groups: [],
	});

	const [selections, setSelections] = useState({
		vehicles: [],
		drivers: [],
		trailers: [],
		groups: [],
	});

	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [oldEditFile, setOldEditfile] = useState(null);
	const [uploadType, setUploadType] = useState('uploadGroup');
	const [clearGroup, setClearGroup] = useState(false);

	const handleUpdateUploadType = (e) => {
		setUploadType(e.target.value);
		setSelections({
			vehicles: [],
			drivers: [],
			trailers: [],
			groups: [],
		});
	};

	const handleUpdateUploadData = (type, data) => {
		setUploadData({ ...uploadData, [`${type}`]: [...data] });
	};

	const handleUpdateCurrentSelections = (selected, key) => {
		const newSelections = { ...selections, [`${key}`]: [...selected] };
		setSelections(newSelections);
	};

	function test1(entities) {
		entities.checked = false;
		if (entities.childrenList === undefined) {
			return;
		}
		for (const ele of entities.childrenList) {
			test1(ele);
		}
		return;
	}

	const handleUpdateGroup = (newGroupData) => {
		setUploadData({ ...uploadData, groups: [...newGroupData] });
		if (clearGroup) {
			setClearGroup(false);
		}
	};

	function test(entities, result = []) {
		if (entities.childrenList === undefined) {
			return result;
		}
		result = [...result, ...entities.childrenList.map((c) => c.label)];
		for (const ele of entities.childrenList) {
			result = test(ele, result);
		}
		return result;
	}

	const organizeOwnersAndTags = () => {
		const owners = {
			vehicles: [],
			drivers: [],
			trailers: [],
			groups: [],
		};

		const tags = [];

		uploadData.vehicles.forEach((vehicle) => {
			owners.vehicles.push(vehicle.value);
			tags.push(vehicle.value);
		});

		uploadData.drivers.forEach((driver) => {
			owners.drivers.push(driver.value);
			tags.push(driver.value);
		});

		uploadData.trailers.forEach((trailer) => {
			owners.trailers.push(trailer.value);
			tags.push(trailer.value);
		});

		uploadData.groups.forEach((group) => {
			const grouptags = test(group);
			owners.groups.push(group.label, ...grouptags);
			tags.push(group.label, ...grouptags);
		});

		return { owners, tags };
	};

	function setCheckedFalse(group) {
		group.checked = false;
		if (group.childrenList === undefined) {
			return;
		}
		for (const child of group.childrenList) {
			setCheckedFalse(child);
		}
		return;
	}

	function setCheckedTrue(group, checkedOnes) {
		if (checkedOnes.findIndex((g) => g.label === group.label) !== -1) {
			group.checked = true;
		}
		if (group.childrenList === undefined) {
			return;
		}
		for (const child of group.childrenList) {
			setCheckedTrue(child, checkedOnes);
		}
		return;
	}

	const clearGroups = () => {
		const newGroupData = [...geotabData.groups];
		newGroupData.forEach((g) => {
			setCheckedFalse(g);
		});
		//setClearGroup(true);
		setGeotabData({ ...geotabData, groups: [...newGroupData] });
	};

	const clearUploadForm = () => {
		setUploadFiles([]);
		const emptyData = {
			vehicles: [],
			drivers: [],
			trailers: [],
			groups: [],
		};

		setUploadData({ ...emptyData });
		setSelections({ ...emptyData });
		clearGroups();
	};

	const handleCancelEdit = () => {
		clearUploadForm();
		setEditMode(false);
	};

	const handeEditFile = async () => {
		setError('');
		if (uploadFiles.length <= 0) {
			setError(
				'Must have a file selected for upload. Please drop a file or select one above.'
			);
			return;
		}

		if (!isThereUploadData() === '') {
			setError(
				'Must select either a Vehicle, Driver, Trailer, or a Group to associate file to.'
			);
			return;
		}

		setLoading(true);

		try {
			let editedDoc = {};

			// skip any file edit logic as it has not changed
			if (uploadFiles.length === 1 && uploadFiles[0] === oldEditFile) {
				editedDoc = organizeOwnersAndTags();
			} else {
				const storageRef = ref(fbStorage, editFile.path);

				await deleteObject(storageRef);
				const newStorageRef = ref(
					fbStorage,
					`${database}/${editFile.id}/${uploadFiles[0].filename}`
				);
				await uploadBytes(newStorageRef, uploadFiles[0].file);
				editedDoc = {
					fileName: uploadFiles[0].filename,
					path: `${database}/${editFile.id}/${uploadFiles[0].filename}`,
					...organizeOwnersAndTags(),
				};
			}

			await updateDoc(doc(fbFirestore, `${database}/${editFile.id}`), editedDoc);

			clearUploadForm();
			onEditComplete(editFile.id, editedDoc);
			setLoading(false);
			setEditMode(false);

			setSuccess('File successfully updated!');

			setTimeout(() => {
				setSuccess('');
			}, 3000);
		} catch (error) {
			console.error(error);
			setLoading(false);
		}
	};

	const isThereUploadData = () => {
		return (
			uploadData.vehicles.length > 0 ||
			uploadData.drivers.length > 0 ||
			uploadData.trailers.length > 0 ||
			uploadData.groups.length > 0
		);
	};

	const handleUpload = async () => {
		setError('');

		if (uploadFiles.length <= 0) {
			setError(
				'Must have a file selected for upload. Please drop a file or select one above.'
			);
			return;
		}

		if (!isThereUploadData()) {
			setError(
				'Must select either a Vehicle, Driver, Trailer, or a Group to associate file to.'
			);
			return;
		}

		setLoading(true);

		Promise.all(uploadFiles.map((file) => uploadFile(file.filename, file.file)))
			.then((docs) => {
				setSuccess('All Files Successfully uploaded');
				clearUploadForm();

				onFileUploaded(docs);

				setTimeout(() => {
					setSuccess('');
				}, 3000);
			})
			.catch((error) => {
				console.log('Some failed: ', error);
			})
			.finally(() => {
				setLoading(false);
			});
	};

	const uploadFile = async (filename, file) => {
		const docRef = doc(collection(fbFirestore, database));
		const storageRef = ref(fbStorage, `${database}/${docRef.id}/${filename}`);

		return uploadBytes(storageRef, file).then(async () => {
			const editDoc = {
				fileName: filename,
				path: `${database}/${docRef.id}/${filename}`,
				...organizeOwnersAndTags(),
			};

			await setDoc(docRef, editDoc);

			return { id: docRef.id, ...editDoc };
		});
	};

	useEffect(() => {
		if (api) {
			api.multiCall(
				[
					['Get', { typeName: 'Device' }],
					['Get', { typeName: 'User', search: { isDriver: true } }],
					['Get', { typeName: 'Trailer' }],
					['Get', { typeName: 'Group' }],
				],
				function (results) {
					const formatedData = formatGeotabData(
						results[0],
						results[1],
						results[2],
						results[3]
					);
					setGeotabData(formatedData);
				},
				function (error) {
					console.log(error);
				}
			);
		}
	}, [api]);

	useEffect(() => {
		if (editFile !== null) {
			const storageRef = ref(fbStorage, editFile.path);
			getBlob(storageRef).then((blob) => {
				const fileToEdit = new File([blob], editFile.fileName);

				const dataVehicles = editFile.owners.vehicles.map((veh) => `${veh}`);
				const dataDrivers = editFile.owners.drivers.map((dri) => `${dri}`);
				const dataTrailers = editFile.owners.trailers.map((tra) => `${tra}`);
				const dataGroups = editFile.owners.groups.map((gro) => `${gro}`);

				if (dataGroups.length === 0) {
					setUploadType('uploadSelection');
					setSelections({
						vehicles: [...formatOptions(dataVehicles)],
						drivers: [...formatOptions(dataDrivers)],
						trailers: [...formatOptions(dataTrailers)],
						groups: [...formatOptions(dataGroups)],
					});
				} else {
					setUploadType('uploadGroup');
					const newGroupData = [...geotabData.groups];
					newGroupData.forEach((g) => {
						setCheckedTrue(g, [...formatOptions(dataGroups)]);
					});
					//setClearGroup(true);
					setGeotabData({ ...geotabData, groups: [...newGroupData] });
				}

				setUploadFiles([fileToEdit]);

				setEditMode(true);
				setOldEditfile(fileToEdit);
				const uploadEl = document.getElementById('upload-area');

				if (uploadEl) {
					uploadEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			});
		}
	}, [editFile]);

	return (
		<Box className="geotabToolbar" id="upload-area">
			<FilePond
				files={uploadFiles}
				onupdatefiles={setUploadFiles}
				allowMultiple={editMode ? false : true}
				maxFiles={3}
				name="files" /* sets the file input name, it's filepond by default */
				labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					gap: '1rem',
				}}
			>
				<Box
					sx={{
						width: { xs: '100%', sm: '100%', md: '75%' },
						display: 'flex',
						flexDirection: { xs: 'column', sm: 'column', md: 'row' },
						justifyContent: 'center',
						alignItems: 'center',
						gap: { xs: '1rem', sm: '1rem', md: '2rem' },
					}}
				>
					<RadioGroup
						name="row-radio-buttons-group"
						onChange={handleUpdateUploadType}
						defaultValue={'uploadGroup'}
						value={uploadType}
					>
						<Box sx={{ display: 'flex', gap: '2.5rem' }}>
							<FormControlLabel
								value="uploadGroup"
								control={<Radio />}
								label="Upload By Group"
							/>
						</Box>
						<Box>
							<FormControlLabel
								value="uploadSelection"
								control={<Radio />}
								label="Upload By Selection"
							/>
						</Box>
					</RadioGroup>
					<GroupSelect
						groupData={geotabData.groups}
						uploadType={uploadType}
						onUpdateData={handleUpdateGroup}
						forceClear={clearGroup}
					/>
				</Box>

				<Box
					sx={{
						paddingLeft: '1.5rem',
						paddingRight: '1.5rem',
						width: '100%',
						display: 'flex',
						flexDirection: { xs: 'column', sm: 'column', md: 'row' },
						justifyContent: 'center',
						gap: '2rem',
					}}
				>
					<AssociateSelect
						options={geotabData.vehicles}
						label="Vehicle"
						currentSelections={selections.vehicles}
						onUpdateCurrentSelections={(selections) => {
							handleUpdateCurrentSelections(selections, 'vehicles');
						}}
						onUpdateUploadSelections={(data) =>
							handleUpdateUploadData('vehicles', data)
						}
						isDisabled={uploadType !== 'uploadSelection'}
					/>
					<AssociateSelect
						options={geotabData.drivers}
						label="Driver"
						currentSelections={selections.drivers}
						onUpdateCurrentSelections={(selections) => {
							handleUpdateCurrentSelections(selections, 'drivers');
						}}
						onUpdateUploadSelections={(data) => handleUpdateUploadData('drivers', data)}
						isDisabled={uploadType !== 'uploadSelection'}
					/>
					<AssociateSelect
						options={geotabData.trailers}
						label="Trailer"
						currentSelections={selections.trailers}
						onUpdateCurrentSelections={(selections) => {
							handleUpdateCurrentSelections(selections, 'trailers');
						}}
						onUpdateUploadSelections={(data) =>
							handleUpdateUploadData('trailers', data)
						}
						isDisabled={uploadType !== 'uploadSelection'}
					/>
				</Box>
				<Box>
					{loading ? (
						<CircularProgress />
					) : (
						<>
							{editMode ? (
								<Box
									sx={{
										display: 'flex',
										flexDirection: { xs: 'column', sm: 'row' },
										gap: { xs: '1rem', sm: '0.5rem' },
									}}
								>
									<Button variant="contained" onClick={handeEditFile}>
										Save
									</Button>
									<Button
										variant="contained"
										color="error"
										onClick={handleCancelEdit}
									>
										Cancel
									</Button>
								</Box>
							) : (
								<Button
									variant="contained"
									onClick={handleUpload}
									sx={{ fontWeight: 'bold', fontSize: '18px' }}
								>
									Upload
								</Button>
							)}
						</>
					)}
				</Box>

				<Box>
					{error !== '' && <Typography className="errorText">{error}</Typography>}
					{success !== '' && <Typography className="successText">{success}</Typography>}
				</Box>
			</Box>
		</Box>
	);
};

export default Uploader;

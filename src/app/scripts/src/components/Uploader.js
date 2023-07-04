import React, { useEffect, useState } from 'react';
import { formatGeotabData, formatOptions } from '../utils/formatter';
import Select from 'react-select';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

import { FilePond } from 'react-filepond';

import { fbStorage, fbFirestore } from '../utils/firebase';

import '../../../styles/app.css';

const Uploader = ({ database, onFileUploaded, api }) => {
	const [files, setFiles] = useState([]);
	const [geotabData, setGeotabData] = useState({
		vehicles: [],
		drivers: [],
		trailers: [],
	});
	const [currentOptions, setCurrentOpetions] = useState([]);
	const [currentSelection, setCurrentSelection] = useState([]);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);

	const updateSelect = (e) => {
		let newOptions = [];
		switch (e.target.id) {
			case 'uploadVehicle':
				newOptions = [...geotabData.vehicles];
				break;
			case 'uploadDriver':
				newOptions = [...geotabData.drivers];
				break;
			case 'uploadTrailer':
				newOptions = [...geotabData.trailers];
				break;
			case 'uploadAll':
				newOptions = [
					...geotabData.vehicles,
					...geotabData.drivers,
					...geotabData.trailers,
				];
				break;
		}

		setCurrentOpetions(formatOptions(newOptions));
	};

	const updateSelection = (selections) => {
		setCurrentSelection(selections);
	};

	const handleUpload = async () => {
		setError('');

		if (files.length <= 0) {
			setError(
				'Must have a file selected for upload. Please drop a file or select one above.'
			);
			return;
		}

		if (currentSelection === '') {
			setError('Must select either a Vehicle, Driver, or Trailer to associate file to.');
			return;
		}

		setLoading(true);

		Promise.all(files.map((file) => uploadFile(file.filename, file.file)))
			.then((docs) => {
				setSuccess('All Files Successfully uploaded to ' + currentSelection);
				setFiles([]);
				setCurrentSelection([]);

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
			const owners = {
				vehicles: [],
				drivers: [],
				traielrs: [],
			};

			const tags = [];

			for (let i = 0; i < currentSelection.length; ++i) {
				const selection = currentSelection[i].value;
				const selectionBreak = selection.split('|');

				switch (selectionBreak[0].trim()) {
					case 'Vehicle':
						owners.vehicles.push(selectionBreak[1].trim());
						break;
					case 'Driver':
						owners.drivers.push(selectionBreak[1].trim());
						break;
					case 'Trailer':
						owners.traielrs.push(selectionBreak[1].trim());
						break;
				}

				tags.push(selectionBreak[1].trim());
			}

			const doc = {
				fileName: filename,
				path: `${database}/${docRef.id}/${filename}`,
				owners,
				tags,
			};

			await setDoc(docRef, doc);

			return { id: docRef.id, ...doc };
		});
	};

	useEffect(() => {
		console.log(api);
		if (api) {
			console.log('API TIME!');
			api.multiCall(
				[
					['Get', { typeName: 'Device' }],
					['Get', { typeName: 'User' }],
					['Get', { typeName: 'Trailer' }],
				],
				function (results) {
					console.log(results);
					const formatedData = formatGeotabData(results[0], results[1], results[2]);
					setGeotabData(formatedData);
					setCurrentOpetions(formatOptions(formatedData.vehicles));
				},
				function (error) {
					console.log(error);
				}
			);
		}
	}, [api]);

	return (
		<div className="geotabToolbar">
			<FilePond
				files={files}
				onupdatefiles={setFiles}
				allowMultiple={true}
				maxFiles={3}
				name="files" /* sets the file input name, it's filepond by default */
				labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
			/>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					gap: '1rem',
				}}
				className="upload-input"
			>
				<div className="horizontalButtonSet upload-type">
					<input
						type="radio"
						name="uploadType"
						id="uploadVehicle"
						className="geo-button"
						defaultChecked
						onChange={updateSelect}
					/>
					<label className="radioButton" htmlFor="uploadVehicle">
						Vehicle
					</label>
					<input
						type="radio"
						name="uploadType"
						id="uploadDriver"
						className="geo-button"
						onChange={updateSelect}
					/>
					<label className="radioButton" htmlFor="uploadDriver">
						Driver
					</label>
					<input
						type="radio"
						name="uploadType"
						id="uploadTrailer"
						className="geo-button radioButton"
						onChange={updateSelect}
					/>
					<label className="radioButton" htmlFor="uploadTrailer">
						Trailer
					</label>
					<input
						type="radio"
						name="uploadType"
						id="uploadAll"
						className="geo-button radioButton"
						onChange={updateSelect}
					/>
					<label className="radioButton" htmlFor="uploadAll">
						All
					</label>
				</div>
				<div style={{ width: '500px' }}>
					<Select
						className="basic-single"
						classNamePrefix="select"
						defaultValue={currentOptions[0] ? currentOptions[0] : ''}
						isClearable
						isSearchable
						name="Owner"
						options={currentOptions}
						isMulti
						onChange={updateSelection}
						value={currentSelection}
					/>
				</div>
				<div>
					{loading ? (
						<div className="spinner-container">
							<div className="HPGPS_loading-spinner"></div>
						</div>
					) : (
						<button className="geo-button geo-button--action" onClick={handleUpload}>
							Upload
						</button>
					)}
				</div>

				<div>
					{error !== '' && <p className="errorText">{error}</p>}
					{success !== '' && <p className="successText">{success}</p>}
				</div>
			</div>
		</div>
	);
};

export default Uploader;

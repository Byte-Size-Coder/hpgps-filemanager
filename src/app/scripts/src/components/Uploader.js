import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { formatGeotabData, formatOptions } from '../utils/formatter';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBlob, deleteObject } from 'firebase/storage';

import {
    Radio,
    RadioGroup,
    FormControl,
    FormControlLabel,
    FormLabel,
    Button,
    Autocomplete,
    TextField,
} from '@mui/material';

import { FilePond } from 'react-filepond';

import { fbStorage, fbFirestore } from '../utils/firebase';

import '../../../styles/app.css';

const containsAll = (value) => {
    value === 'All Vehicles' || value === 'All Drivers' || value === 'All Trailers';
};

const filterAll = (value) => {
    value !== 'All Vehicles' && value !== 'All Drivers' && value !== 'All Trailers';
};

const Uploader = ({ database, onFileUploaded, api, editFile, onEditComplete }) => {
    const [uploadFiles, setUploadFiles] = useState([]);
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
    const [editMode, setEditMode] = useState(false);
    const [oldEditFile, setOldEditfile] = useState(null);
    const [allOptionsSaved, setAllOptionsSaved] = useState([]);
    const [selectionsToUpload, setSelectionsToUpload] = useState([]);
    const [uploadTypeSelected, setUploadTypeSelected] = useState('uploadVehicle');

    const handleUploadTypeChange = (e) => {
        const uploadType = e.target.value;
        updateSelect(uploadType);

        setUploadTypeSelected(uploadType);
    };

    const updateSelect = (uploadType, reset = false) => {
        let newOptions = [];

        let allVehicles = false;
        let allDrivers = false;
        let allTrailers = false;

        if (!reset) {
            currentSelection.forEach((selection) => {
                switch (selection.value) {
                    case 'All Vehicles':
                        allVehicles = true;
                        break;
                    case 'All Drivers':
                        allDrivers = true;
                        break;
                    case 'All Trailers':
                        allTrailers = true;
                        break;
                }
            });
        }

        switch (uploadType) {
            case 'uploadVehicle':
                newOptions = allVehicles ? [] : ['All Vehicles', ...geotabData.vehicles];
                break;
            case 'uploadDriver':
                newOptions = allDrivers ? [] : ['All Drivers', ...geotabData.drivers];
                break;
            case 'uploadTrailer':
                newOptions = allTrailers ? [] : ['All Trailers', ...geotabData.trailers];
                break;
        }

        setCurrentOpetions(formatOptions(newOptions));
    };

    const filterSelections = (allFilter, item, term) => {
        const type = item.split('|')[0].trim();

        return !(allFilter && type === term);
    };

    const updateSelection = (selections) => {
        console.log(selections);
        if (selections.length > 0) {
            let newSelectionsToUpload = [];
            let allVehicles = false;
            let allDrivers = false;
            let allTrailers = false;
            selections.forEach((selection) => {
                switch (selection.value) {
                    case 'All Vehicles':
                        allVehicles = true;
                        newSelectionsToUpload.push(...formatOptions([...geotabData.vehicles]));
                        break;
                    case 'All Drivers':
                        allDrivers = true;
                        newSelectionsToUpload.push(...formatOptions([...geotabData.drivers]));
                        break;
                    case 'All Trailers':
                        allTrailers = true;
                        newSelectionsToUpload.push(...formatOptions([...geotabData.trailer]));
                        break;
                    default:
                        newSelectionsToUpload.push(selection);
                        break;
                }
            });
            setSelectionsToUpload(newSelectionsToUpload);

            const filteredSelections = selections.filter((select) => {
                return (
                    filterSelections(allVehicles, select.value, 'Vehicle') &&
                    filterSelections(allDrivers, select.value, 'Driver') &&
                    filterSelections(allTrailers, select.value, 'Trailer')
                );
            });

            setCurrentSelection(filteredSelections);

            if (
                (allVehicles && uploadTypeSelected === 'uploadVehicle') ||
                (allDrivers && uploadTypeSelected === 'uploadDriver') ||
                (allTrailers && uploadTypeSelected === 'uploadTrailer')
            ) {
                setCurrentOpetions([]);
            }
        } else {
            setSelectionsToUpload([]);
            setCurrentSelection([]);
            updateSelect(uploadTypeSelected, true);
        }
    };

    const organizeOwnersAndTags = () => {
        const owners = {
            vehicles: [],
            drivers: [],
            trailers: [],
        };

        const tags = [];

        for (let i = 0; i < selectionsToUpload.length; ++i) {
            const selection = selectionsToUpload[i].value;
            const selectionBreak = selection.split('|');

            switch (selectionBreak[0].trim()) {
                case 'Vehicle':
                    owners.vehicles.push(selectionBreak[1].trim());
                    break;
                case 'Driver':
                    owners.drivers.push(selectionBreak[1].trim());
                    break;
                case 'Trailer':
                    owners.trailers.push(selectionBreak[1].trim());
                    break;
            }

            tags.push(selectionBreak[1].trim());
        }

        return { owners, tags };
    };

    const clearUploadForm = () => {
        setUploadFiles([]);
        updateSelection([]);
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

        if (currentSelection === '') {
            setError('Must select either a Vehicle, Driver, or Trailer to associate file to.');
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

    const handleUpload = async () => {
        setError('');

        if (uploadFiles.length <= 0) {
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
                    ['Get', { typeName: 'User' }],
                    ['Get', { typeName: 'Trailer' }],
                ],
                function (results) {
                    const formatedData = formatGeotabData(results[0], results[1], results[2]);
                    setGeotabData(formatedData);
                    setCurrentOpetions(formatOptions(['All Vehicles', ...formatedData.vehicles]));
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

                const dataVehicles = editFile.owners.vehicles.map((veh) => `Vehicle | ${veh}`);
                const dataDrivers = editFile.owners.drivers.map((dri) => `Driver | ${dri}`);
                const dataTrailers = editFile.owners.trailers.map((tra) => `Trailer | ${tra}`);

                setUploadFiles([fileToEdit]);

                setCurrentSelection(
                    formatOptions([...dataVehicles, ...dataDrivers, ...dataTrailers])
                );
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
                <FormControl>
                    <FormLabel id="demo-row-radio-buttons-group-label">Type</FormLabel>
                    <RadioGroup
                        row
                        aria-labelledby="demo-row-radio-buttons-group-label"
                        name="row-radio-buttons-group"
                        onChange={handleUploadTypeChange}
                        defaultValue={'uploadVehicle'}
                    >
                        <FormControlLabel
                            value="uploadVehicle"
                            control={<Radio />}
                            label="Vehicle"
                        />
                        <FormControlLabel value="uploadDriver" control={<Radio />} label="Driver" />
                        <FormControlLabel
                            value="uploadTrailer"
                            control={<Radio />}
                            label="Trailer"
                        />
                    </RadioGroup>
                </FormControl>
                <Box sx={{ width: { xs: '90%', sm: '80%', md: '500px' } }}>
                    <Autocomplete
                        multiple
                        id="type-select"
                        options={currentOptions}
                        value={currentSelection}
                        getOptionLabel={(option) => option.label}
                        filterSelectedOptions
                        renderInput={(params) => <TextField {...params} label="Associate With" />}
                        onChange={(event, newValue) => {
                            updateSelection(newValue);
                        }}
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
                                        Edit
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
                                <Button variant="contained" onClick={handleUpload}>
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

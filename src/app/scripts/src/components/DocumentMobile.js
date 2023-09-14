import React, { useState, useEffect } from 'react';
import {
	Box,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	AccordionActions,
	Typography,
} from '@mui/material';
import DebouncedInput from './DebouncedInput';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const DocumentMobile = ({ files }) => {
	const [globalFilter, setGlobalFilter] = useState('');
	const [expandedId, setExpandedId] = useState(null);
	const [filterFiles, setFilterFiles] = useState([]);

	console.log(files);

	useEffect(() => {
		if (globalFilter === '') {
			setFilterFiles([...files]);
		} else {
			console.log('IN HERE?');
			const newFilterFiles = files.filter((file) =>
				file.fileName.toLowerCase().includes(globalFilter.toLowerCase())
			);
			setFilterFiles(newFilterFiles);
		}
	}, [globalFilter, files]);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				gap: '1rem',
				width: '100%',
				marginTop: '2rem',
			}}
		>
			<Box>
				<DebouncedInput
					value={globalFilter ?? ''}
					onChange={(value) => setGlobalFilter(String(value))}
					placeholder="Search..."
				/>
			</Box>
			<Box sx={{ width: '100%' }}>
				{filterFiles.map((file) => {
					console.log(file);
					return (
						<Accordion
							key={file.id}
							expanded={file.id === expandedId}
							onChange={() => {
								expandedId === file.id
									? setExpandedId(null)
									: setExpandedId(file.id);
							}}
						>
							<AccordionSummary expandIcon={<ExpandMoreIcon />}>
								<Typography variant="h5">{file.fileName}</Typography>
							</AccordionSummary>
							<AccordionDetails
								sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
							>
								{file.owners.groups.length > 0 && (
									<Box>
										<Typography variant="h6">Groups</Typography>
										<Typography variant="body1">
											{file.owners.groups.join(', ')}
										</Typography>
									</Box>
								)}
								{file.owners.drivers.length > 0 && (
									<Box>
										<Typography variant="h6">Drivers</Typography>
										<Typography variant="body1">
											{file.owners.drivers.join(', ')}
										</Typography>
									</Box>
								)}
								{file.owners.vehicles.length > 0 && (
									<Box>
										<Typography variant="h6">Vehicles</Typography>
										<Typography variant="body1">
											{file.owners.vehicles.join(', ')}
										</Typography>
									</Box>
								)}
								{file.owners.trailers.length > 0 && (
									<Box>
										<Typography variant="h6">Trailers</Typography>
										<Typography variant="body1">
											{file.owners.trailers.join(', ')}
										</Typography>
									</Box>
								)}
							</AccordionDetails>
							<AccordionActions>{file.action}</AccordionActions>
						</Accordion>
					);
				})}
			</Box>
		</Box>
	);
};

export default DocumentMobile;

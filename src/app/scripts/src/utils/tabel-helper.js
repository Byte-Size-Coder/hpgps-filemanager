import React from 'react';
import { createColumnHelper, sortingFns } from '@tanstack/react-table';

import { rankItem, compareItems } from '@tanstack/match-sorter-utils';
import { Typography, Tooltip } from '@mui/material';

const columnHelper = createColumnHelper();

const displayCell = (value) => {
	const content = `${value.slice(0, 5).join(', ')}${value.length > 5 ? '...' : ''}`;
	return (
		<>
			{value.length > 5 ? (
				<Tooltip title={`${value.join(', ')}`}>
					<Typography>{content}</Typography>
				</Tooltip>
			) : (
				<Typography>{content}</Typography>
			)}
		</>
	);
};

const displayGroupCell = (value) => {
	const content = `${value.slice(0, 5).join(', ')}${value.length > 5 ? '...' : ''}`;
	return (
		<>
			{value.length > 5 ? (
				<Tooltip title={`${value.join(', ')}`}>
					<Typography>{content}</Typography>
				</Tooltip>
			) : (
				<Typography>{content}</Typography>
			)}
		</>
	);
};

const fuzzySort = (rowA, rowB, columnId) => {
	let dir = 0;

	// Only sort by rank if the column has ranking information
	if (rowA.columnFiltersMeta[columnId]) {
		dir = compareItems(
			rowA.columnFiltersMeta[columnId].itemRank,
			rowB.columnFiltersMeta[columnId].itemRank
		);
	}

	// Provide an alphanumeric fallback for when the item ranks are equal
	return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

export const columns = [
	columnHelper.accessor('fileName', {
		header: () => 'File',
		cell: (info) => <Typography>{info.renderValue()}</Typography>,
		filterFn: 'fuzzy',
		sortingFn: fuzzySort,
		className: 'sticky',
		headerClassName: 'sticky',
	}),
	columnHelper.accessor('owners.groups', {
		header: () => 'Groups',
		cell: (info) => {
			const value = info.renderValue();
			if (value === null || value.length < 0) {
				return;
			}

			return displayCell(value);
		},
		filterFn: 'fuzzy',
		sortingFn: fuzzySort,
	}),
	columnHelper.accessor('owners.vehicles', {
		header: () => 'Vehicles',
		cell: (info) => {
			const value = info.renderValue();
			if (value === null || value.length < 0) {
				return;
			}

			return displayCell(value);
		},
		filterFn: 'fuzzy',
		sortingFn: fuzzySort,
		width: 400,
	}),
	columnHelper.accessor('owners.drivers', {
		header: () => 'Drivers',
		cell: (info) => {
			const value = info.renderValue();
			if (value === null || value.length < 0) {
				return;
			}

			return displayCell(value);
		},
		filterFn: 'fuzzy',
		sortingFn: fuzzySort,
	}),
	columnHelper.accessor('owners.trailers', {
		header: () => 'Trailers',
		cell: (info) => {
			const value = info.renderValue();
			if (value === null || value.length < 0) {
				return;
			}

			return displayCell(value);
		},
		filterFn: 'fuzzy',
		sortingFn: fuzzySort,
	}),
	columnHelper.accessor('action', {
		header: () => 'Action',
		cell: (info) => info.renderValue(),
	}),
];

export const fuzzyFilter = (row, columnId, value, addMeta) => {
	// Rank the item
	const itemRank = rankItem(row.getValue(columnId), value);

	// Store the itemRank info
	addMeta({
		itemRank,
	});

	// Return if the item should be filtered in/out
	return itemRank.passed;
};

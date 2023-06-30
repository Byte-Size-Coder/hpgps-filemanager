import React, { useState } from 'react';

import DebouncedInput from './DebouncedInput';
import Filter from './Filter';

import {
	createColumnHelper,
	useReactTable,
	getCoreRowModel,
	getFilteredRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFacetedMinMaxValues,
	getPaginationRowModel,
	sortingFns,
	getSortedRowModel,
	flexRender,
} from '@tanstack/react-table';

import { rankItem, compareItems } from '@tanstack/match-sorter-utils';

import '../../../styles/App.css';
import 'react-tooltip/dist/react-tooltip.css';

import { Tooltip } from 'react-tooltip';

import { makeid } from '../utils/formatter';

const columnHelper = createColumnHelper();

const displayCell = (value) => {
	const content = `${value.slice(0, 5).join(', ')}${value.length > 5 ? '...' : ''}`;

	const tooltipId = `content-tooltip-${makeid(20)}`;
	return (
		<>
			{value.length > 5 ? (
				<div
					data-tooltip-id={tooltipId}
					data-tooltip-content={`${value.join(', ')}`}
					data-tooltip-place="top"
					style={{ cursor: 'help' }}
				>
					{content}
					<Tooltip id={tooltipId} />
				</div>
			) : (
				<div>{content}</div>
			)}
		</>
	);
};

const columns = [
	columnHelper.accessor('fileName', {
		header: () => 'File',
		cell: (info) => info.renderValue(),
		filterFn: 'fuzzy',
		sortingFn: fuzzySort,
	}),
	columnHelper.accessor('owners.vehicles', {
		header: () => 'Vehicles',
		cell: (info) => {
			const value = info.renderValue();
			console.log(value);
			console.log('INFO: ' + info);
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
			console.log(value);
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
			console.log(value);
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

const fuzzyFilter = (row, columnId, value, addMeta) => {
	// Rank the item
	const itemRank = rankItem(row.getValue(columnId), value);

	// Store the itemRank info
	addMeta({
		itemRank,
	});

	// Return if the item should be filtered in/out
	return itemRank.passed;
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

const DocumentTable = ({ files }) => {
	const [columnFilters, setColumnFilters] = useState([]);
	const [globalFilter, setGlobalFilter] = useState('');

	const table = useReactTable({
		data: files,
		columns,
		filterFns: {
			fuzzy: fuzzyFilter,
		},
		state: {
			columnFilters,
			globalFilter,
		},
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: fuzzyFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFacetedMinMaxValues: getFacetedMinMaxValues(),
		debugTable: true,
		debugHeaders: true,
		debugColumns: false,
	});

	return (
		<div
			style={{
				marginTop: '2rem',
				display: 'flex',
				flexDirection: 'column',
				gap: '1rem',
				width: '100%',
			}}
		>
			<div>
				<DebouncedInput
					value={globalFilter ?? ''}
					onChange={(value) => setGlobalFilter(String(value))}
					className="geotabFormEditField"
					placeholder="Search all columns..."
				/>
			</div>
			<div style={{ width: '100%' }}>
				<table style={{ width: '100%' }}>
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									console.log(header);
									return (
										<th key={header.id} colSpan={header.colSpan}>
											{header.isPlaceholder ? null : (
												<>
													<div
														{...{
															className: header.column.getCanSort()
																? 'cursor-pointer select-none'
																: '',
															onClick:
																header.column.getToggleSortingHandler(),
														}}
													>
														{flexRender(
															header.column.columnDef.header,
															header.getContext()
														)}
														{{
															asc: ' 🔼',
															desc: ' 🔽',
														}[header.column.getIsSorted()] ?? null}
													</div>
													{header.id !== 'action' ? (
														<div>
															<Filter
																column={header.column}
																table={table}
															/>
														</div>
													) : null}
												</>
											)}
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row, index) => {
							return (
								<tr
									key={row.id}
									className={
										index % 2 === 0
											? 'geotabPrimaryFill cell-overflow'
											: 'geotabSecondaryFill cell-overflow'
									}
								>
									{row.getVisibleCells().map((cell) => {
										return (
											<td key={cell.id} className="geotabPrimaryText">
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</td>
										);
									})}
								</tr>
							);
						})}
					</tbody>
				</table>
				{files.length > 0 && (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							marginTop: '0.25rem',
						}}
						className="geotabSecondaryText"
					>
						<button
							className="geotabButton"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							{'<<'}
						</button>
						<button
							className="geotabButton"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							{'<'}
						</button>
						<button
							className="geotabButton"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							{'>'}
						</button>
						<button
							className="geotabButton"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
						>
							{'>>'}
						</button>
						<span className="pagenation-foot">
							<div>Page</div>
							<strong>
								{table.getState().pagination.pageIndex + 1} of{' '}
								{table.getPageCount()}
							</strong>
						</span>
						<span className="pagenation-foot">
							| Go to page:
							<input
								type="number"
								defaultValue={table.getState().pagination.pageIndex + 1}
								onChange={(e) => {
									const page = e.target.value ? Number(e.target.value) - 1 : 0;
									table.setPageIndex(page);
								}}
								className="geotabFormEditField"
							/>
						</span>
						<select
							value={table.getState().pagination.pageSize}
							onChange={(e) => {
								table.setPageSize(Number(e.target.value));
							}}
							className="geotabFormEditField"
						>
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<option key={pageSize} value={pageSize}>
									Show {pageSize}
								</option>
							))}
						</select>
						<div>{table.getPrePaginationRowModel().rows.length} Rows</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default DocumentTable;

import React, { useMemo } from 'react';
import DebouncedInput from './DebouncedInput';

import { makeid } from '../utils/formatter';

function Filter({ column, table }) {
	const firstValue = table.getPreFilteredRowModel().flatRows[0]?.getValue(column.id);

	const columnFilterValue = column.getFilterValue();

	const sortedUniqueValues = useMemo(
		() =>
			typeof firstValue === 'number'
				? []
				: Array.from(column.getFacetedUniqueValues().keys()).sort(),
		[column.getFacetedUniqueValues()]
	);

	return (
		<>
			<datalist id={column.id + 'list'}>
				{sortedUniqueValues.slice(0, 5000).map((value) => (
					<option value={value} key={makeid(20)} />
				))}
			</datalist>
			<DebouncedInput
				type="text"
				value={columnFilterValue ?? ''}
				onChange={(value) => column.setFilterValue(value)}
				placeholder={`Search... (${column.getFacetedUniqueValues().size})`}
				className="geotabFormEditField"
				list={column.id + 'list'}
			/>
		</>
	);
}

export default Filter;

export const formatOptions = (data) => {
	return data.map((d) => {
		return {
			label: d,
			value: d,
		};
	});
};

export const formatGeotabData = (fetchedVehicles, fetchedDrivers, fetchedTrailers) => {
	const newVehicles = fetchedVehicles.map((v) => `Vehicle | ${v.name} (${v.serialNumber})`);
	const newDrives = fetchedDrivers.map((d) => `Driver | ${d.firstName} ${d.lastName}`);
	const newTrailers = fetchedTrailers.map((t) => `Trailer | ${t.name}`);

	console.log(fetchedDrivers);

	return {
		vehicles: [...newVehicles],
		drivers: [...newDrives],
		trailers: [...newTrailers],
	};
};

export const makeid = (length) => {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
};

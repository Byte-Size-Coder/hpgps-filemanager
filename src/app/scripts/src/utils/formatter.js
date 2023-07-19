export const formatOptions = (data) => {
	return data.map((d) => {
		return {
			label: d,
			value: d,
		};
	});
};

const formatGroups = (groups) => {
	groups.forEach((group) => {
		if (group.children.length > 0) {
			group.children = group.children.map((child) => {
				const childGroup = groups.find((g) => g.value === child.id);
				console.log('CHILD GROUP');
				console.logChildGroup;
				return {
					...childGroup,
				};
			});
		}
	});

	return groups;
};

export const formatGeotabData = (
	fetchedVehicles,
	fetchedDrivers,
	fetchedTrailers,
	fetchedGroups
) => {
	const newVehicles = fetchedVehicles.map((v) => `${v.name} (${v.serialNumber})`);
	const newDrives = fetchedDrivers.map((d) => `${d.firstName} ${d.lastName}`);
	const newTrailers = fetchedTrailers.map((t) => `${t.name}`);
	const newGroups = fetchedGroups.map((g) => {
		return {
			value: g.id,
			label: g.name,
			children: g.children,
		};
	});

	return {
		vehicles: [...formatOptions(newVehicles)],
		drivers: [...formatOptions(newDrives)],
		trailers: [...formatOptions(newTrailers)],
		groups: [...formatGroups(newGroups)],
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

// export const structureGroup = (groups) => {
// 	console.log(groups);
// 	let addedGroups = [];
// 	groups.forEach((group) => {
// 		let found = false;
// 		groups.forEach((group2) => {
// 			if (group2.children.length > 0) {
// 				if (group2.children.findIndex((child) => child.id === group.value) !== -1) {
// 					if (group.parent) {
// 						addedGroups.push({ ...group, parent: group2.label });
// 					} else {
// 						group.parent = group2.label;
// 					}

// 					found = true;
// 				}
// 			}
// 		});
// 		if (!found) {
// 			group.parent = group.label;
// 			group.name = 'All Children in ' + group.name;
// 		}
// 	});

// 	console.log(groups);

// 	return [...groups, ...addedGroups];
// };

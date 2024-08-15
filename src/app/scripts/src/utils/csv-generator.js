export function generateCSV(fileTable) {
    let csvData = [['File', 'Groups', 'Vehicles', 'Drivers', 'Trailers']];

    fileTable.forEach((fileData) => {
        csvData.push([
            fileData.fileName,
            combineData(fileData.owners.groups),
            combineData(fileData.owners.vehicles),
            combineData(fileData.owners.drivers),
            combineData(fileData.owners.trailers),
        ]);
    });

    return csvData;
}

function combineData(arrayData) {
    return arrayData.join(', ');
}

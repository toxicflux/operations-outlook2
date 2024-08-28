export default {
	convertToCSV(objArray) {
		var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
		var str = '';

		for (var i = 0; i < array.length; i++) {
			var line = '';
			for (var index in array[i]) {
				if (line != '') line += ';'

				line += array[i][index];
			}

			str += line + '\r\n';
		}

		return str;
	},
	exportCSVFile(headers, items) {
		if (headers) {
			items.unshift(headers);
		}

		var jsonObject = JSON.stringify(items);
		var csv = this.convertToCSV(jsonObject);
		return csv;
	},
	async downloadAsXLS(){	
		try{
			const table = await download_csv_query.run();
			console.log(table)
			const headers = {}
			Object.keys(table[0]).forEach(key => {
				headers[key]=key
			});
			const items = table.map(t => {
				return {
					...t,
					com: t.com ? t.com.replaceAll('\n', '').replaceAll('\r', '').replaceAll('\t', '').replaceAll(';', '.'): ''				
				}
			});
			
			console.log(headers)
			const res = this.exportCSVFile(headers, items)
			download(res, "Exported NPT data", "application/vnd.ms-excel");
			// closeModal('downloadExcelModal')
			showAlert("Success! Data exported to Excel file.", "success")
		}catch(err){
			showAlert("Data set is more than 5 MB! You can try to limit the number of wellbores or select a shorter date range.", "warning")
		}
	},
}
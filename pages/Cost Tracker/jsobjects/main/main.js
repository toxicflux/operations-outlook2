export default {
	initialize(){
		if(typeof appsmith.store.frontend_components_url === "undefined" || typeof appsmith.store.frontend_components_timestamp === 'undefined' || appsmith.store.frontend_components_timestamp - (new Date().getTime()/1000) < 3600 ){
			InfraConfig.run().then((config) => {
				storeValue('frontend_components_url', 'https://' + config.frontend_components_url);
				storeValue('frontend_components_timestamp', new Date().getTime() / 1000)
			});		
		}
	},
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
	async downloadAsCSV(){
		const table = await calc.mapToComparativeAnalysis();
		const items = table.tableData.rowData;
		const headers = table.tableData.columnDefs.reduce((agg, item)=> {
			agg[item.field]=item.headerName === ""? "Name" : item.headerName; 
			return agg;
		}, {})
		const res = this.exportCSVFile(headers, items.slice(0, items.length -1))
		download(res, "Exported Cost Tracker for wellbore " +wellbore.data?.[0].wellbore, "text/csv");
	},
	async run(npd_wellbore = wellbore_select.selectedOptionValue){
		await storeValue('selectedWellbore', npd_wellbore);
		comparativeCostAnalysis.run({npd_wellbore}).then((c) => {
			return calc.mapToComparativeAnalysis(c.data);
		});

		cumCostAnalysis.run({npd_wellbore})
		wellbore.run({npd_wellbore});
	},
	formatCurrency (value, symbol = true) {
		if(!symbol){
			return new Intl.NumberFormat('nb-NO').format(value)
		}
		const currency = new Intl.NumberFormat('nb-NO', {
			style: 'currency',
			currency: 'NOK',
		});

		return currency.format(value);
	},
	getRlsSensitivity(){
		if(appsmith.user.idToken.roles.includes('admin')){
			return 4;
		}
		if(appsmith.user.idToken.roles.includes('extended')){
			return 3;
		}
		if(appsmith.user.idToken.roles.includes('basic')){
			return 2;
		}
		return 0;
	}
}
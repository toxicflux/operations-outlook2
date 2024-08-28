export default {
	plannedColumns: ['name', 'planned_depth', 'start', 'summed_duration'],
	actualColumns: ['activityend', 'activitystart', 'classification', 'com', 'depthend', 'depthstart', 'duration', 'npt_contractor', 'npt_service', 'remarks', 'runningmaxdepthend', 'totalduration'], 
	plannedColumnMap: {
		"afe_hours": "AFE Hours",
		"behind_hours": "Behind Hours",
		"dsv_hours": "DSV Hours",
		"ilt_hours": "ILT Hours",
		"name": "Task name",
		"npt_hours": "NPT Hours",
		"planned_depth": "Planned Depth",
		"start": "Start (iQx)",
		"summed_duration": "Summed Duration",
		"target_hours": "Target Hours",
		"tft_hours": "TFT Hours",
		"wow_hours": "WOW Hours"
	},
	actualColumnMap: {
		"activityend": "Activity End",
		"activitystart": "Activity Start",
		"classification": "NPT Classification",
		"com": "Com", 
    "depthend": "Depth end",
    "depthstart": "Depth start",
    "duration": "Duration",
    "npt_contractor": "NPT Contractor",
    "npt_service": "NPT Service",
    "remarks": "Remarks",
    "runningmaxdepthend": "Actual Depth",
    "totalduration": "Total Duration"		
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
	async download_csv(){
		const headers = data_columns.selectedOptionValues;	
		let items = [];
		if(mode.selectedOptionValue === "actual_depth"){
			items = await time_depth_export.run();		
		}else{
			items = await planned_time_depth_export.run()
		}
		
		if(headers.includes("com")){
			items = items.map((d) => {
				return {
					...d,
					com: d.com? d.com.replaceAll("\n", " ").replaceAll("\r", ""): d.com
				}
			})
		}
		
		if(headers.includes("remarks")){
			items = items.map((d) => {
				return {
					...d,
					remarks: d.remarks ? d.remarks.replaceAll("\n", " ").replaceAll("\r", ""): d.remarks
				}
			})
		}
		
		if(headers.includes("name")){
			items = items.map((d) => {
				return {
					...d,
					name: d.name ? d.name.replaceAll("\n", " ").replaceAll("\r", ""): d.name
				}
			})
		}
		
		const res = this.exportCSVFile(headers, items)
		download(res, mode.selectedOptionValue +"_data", "text/csv")
		closeModal(export_csv_modal.name)
	}
}
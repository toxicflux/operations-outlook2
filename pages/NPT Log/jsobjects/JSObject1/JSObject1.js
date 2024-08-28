export default {
	async cleanupFilter(){
		if(!s_nptCopy.selectedOptionValue){
			removeValue(appsmith.store.ws_npt_filter)
			filter.saveFilters("ws_npt_filter", null)
		}
	},
	async initialize (user_config_data= UserConfig.data, wellbores = wellbores_active_last_14_days.data) {
		console.log("initialize")
		if(typeof appsmith.store.frontend_components_url === "undefined" || typeof appsmith.store.frontend_components_timestamp === 'undefined' || appsmith.store.frontend_components_timestamp - (new Date().getTime()/1000) < 3600 ){
			InfraConfig.run().then((config) => {
				storeValue('frontend_components_url', 'https://' + config.frontend_components_url);
				storeValue('frontend_components_timestamp', new Date().getTime() / 1000)
			});		
		}
		const filters = ['ws_npt_filter', 'intervalDays'];

		let hasChanges = false;
		for(let i = 0; i < filters.length; i++){
			const filterValue = filter.getFilters(user_config_data, filters[i]);
			if(appsmith.store[filters[i]] !== filterValue){
				await storeValue(filters[i], filterValue)		
				hasChanges = true;
			}
		}
		if(typeof appsmith.store.selectedWellbore === 'undefined' && typeof wellbores !== 'undefined' &&  wellbores.length > 0){
			await factWvActivity_pagination.run({npd_wellbore: wellbores[0].npd_wellbore})
		}else{
			await factWvActivity_pagination.run({npd_wellbore: appsmith.store.selectedWellbore})
		}
	},
	async changeDateInterval(value){
		if(value === "custom"){
			showModal("selectCustomDateModal")
		}else{
			await storeValue("intervalDays", value);
			await factWvActivity_pagination.run()	
		}
	},
	selectedInterval(){
		if([1, 7, 14, 30, 365].includes(parseInt(appsmith.store.intervalDays))){
			return appsmith.store.intervalDays || "7"			
		}
		return "custom";
	},
	async selectCustomDateInterval(){
		const interval = Math.round((new Date().getTime() - new Date(from_date.selectedDate).getTime())/(24*1000*60*60));
		await storeValue("intervalDays", interval);
		await factWvActivity_pagination.run();
		closeModal("selectCustomDateModal");
	},
	convertToCSV(objArray) {
		var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
		var str = '';

		for (var i = 0; i < array.length; i++) {
			var line = '';
			for (var index in array[i]) {
				if (line != '') line += ','

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
	uppercaseFirst(a){
		if(typeof a === 'undefined' || a === null)
			return a;

		const splitStr = a.split(' ');
		const contentArr = [];
		splitStr.forEach((c) => {
			contentArr.push( c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()); 
		});
		return contentArr.join(' ')
	},
	async downloadAsCSV(){	
		try{
			const wellbores = this.getFilteredData().map(d => d.npd_wellbore);
			const table = await factWvActivity.run({wellbores});
			const items = table.map(t => {
				return {
					...t,
					com: t.com ? t.com.replaceAll('\n', '').replaceAll('\r'): '',
					remarks: t.remarks ? t.remarks.replaceAll('\n', '').replaceAll('\r'): ''
				}
			});
			const headers = {}
			Object.keys(table[0]).forEach(key => {
				headers[key]=key
			});
			const res = this.exportCSVFile(headers, items)
			download(res, "Exported Wellview Search data", "application/vnd.ms-excel");
			showAlert()
			closeModal('downloadExcelModal')
			showAlert("Success! Data exported to Excel file.", "success")
		}catch(err){
			showAlert("Data set is more than 5 MB! You can try to limit the number of wellbores or select a shorter date range.", "warning")
		}
	},
	filter (data = NPT_monthly.data)  {

		const filter = [
			{
				label: "Area",
				value: "wlbmainarea",
				children: [],
			},
			{
				label: "Operator",
				value: "operator",
				children: [],
			},
			{
				label: "Field",
				value: "field_name",
				children: [],
			},
			{
				label: "Rig",
				value: "rig_name",
				children: [],
			},
			{
				label: "Wellbore",
				value: "wellbore",
				children: [],
			}
		];

		// extract unique areas from data and add them as children to the "Area" filter
		const areas = [...new Set(data.filter((a) => !!a).map((d) => d.wlbmainarea))];
		const areaFilter = filter.find((f) => f.value === "wlbmainarea");
		areaFilter.children = areas.filter((a) => !!a).map((a) => ({ label: this.uppercaseFirst(a), value: "wlbmainarea:"+a}) ).sort((a, b) => a.label.localeCompare(b.label) );
		const operators = [...new Set(data.filter((a) => !!a).map((d) => d.operator))];
		const operatorFilter = filter.find((f) => f.value === "operator");
		operatorFilter.children = operators.filter((a) => !!a).map((a) => ({ label: a, value: "operator:"+a}) ).sort((a, b) => a.label.localeCompare(b.label) );

		const fields = [...new Set(data.filter((a) => !!a).map((d) => d.field_name))];
		const fieldFilter = filter.find((f) => f.value === "field_name");
		const unamedFields = fields.filter((a) => !!a).filter((f) => f.startsWith('#')).map((a) => ({ label: a, value: "field_name:"+a}) ).sort((a, b) => a.label.localeCompare(b.label) );
		const namedFields = fields.filter((a) => !!a).filter((f) => !f.startsWith('#')).map((a) => ({ label: this.uppercaseFirst(a), value: "field_name:"+a}) ).sort((a, b) => a.label.localeCompare(b.label) );
		fieldFilter.children = namedFields.concat(unamedFields);

		const rigs = [...new Set(data.filter((a) => !!a).map((d) => d.rig_name))];
		const rigFilter = filter.find((f) => f.value === "rig_name");
		rigFilter.children = rigs.filter((a) => !!a).map((a) => ({ label: this.uppercaseFirst(a), value: "rig_name:"+a}) ).sort((a, b) => a.label.localeCompare(b.label) );


		const wellbores = [...new Set(data.filter((a) => !!a).map((d) => d.wellbore))];
		const wellboreFilter = filter.find((f) => f.value === "wellbore");
		wellboreFilter.children = wellbores.filter((a) => !!a).map((a) => ({ label: a, value: "wellbore:"+a}) );

		return filter;
	},
	getFilteredData(data = NPT_monthly.data){
		const filters = appsmith.store && appsmith.store.ws_filters? appsmith.store.ws_filters: [];
		const filterObj = {};

		for (let i = 0; i < filters.length; i++) {
			const [key, value] = filters[i].split(':');
			filterObj[key] = filterObj[key] || [];
			filterObj[key].push(value);
		}

		return data? data.filter((item) => {
			let include = true;
			for (const [key, values] of Object.entries(filterObj)) {
				if (!values.includes(item[key])) {
					include = false;
					break;
				}
			}
			return include;
		}): [];	
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
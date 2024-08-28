export default {
	async initialize(user_config_data = UserConfig.data, data = NPT_monthly_cutoff.data){
		console.log("initialize")
		if(typeof appsmith.store.frontend_components_url === "undefined" || typeof appsmith.store.frontend_components_timestamp === 'undefined' || appsmith.store.frontend_components_timestamp - (new Date().getTime()/1000) < 3600 ){
			InfraConfig.run().then((config) => {
				storeValue('frontend_components_url', 'https://' + config.frontend_components_url);
				storeValue('frontend_components_timestamp', new Date().getTime() / 1000)
			});		
		}
		const filters = ['mrp_start', 'mrp_end', 'mrp_filters', 'mrp_days_percentage'];

		let hasChanges = false;
		for(let i = 0; i < filters.length; i++){
			const filterValue = filter.getFilters(user_config_data, filters[i]);
			if(appsmith.store[filters[i]] !== filterValue){
				await storeValue(filters[i], filterValue)		
				hasChanges = true;
			}
		}

		if(typeof data === 'undefined'){
			await NPT_monthly_cutoff.run();
		}

		await NPT_monthly.run();
		await this.getData();
		await this.getNptMonthlyRigPerformance();

	},
	getData(data = NPT_monthly_cutoff.data){

		const categories = typeof data === 'undefined'? []: data.map((d) => {
			return moment(d.cutoffmonth).format(data.length > 6 ? 'MMM YY\'': 'MMMM');
		});

		const result =  {
			title: this.getCaption(),
			categories: categories,
			series: [
				{
					name: "Productive",
					type: "bar",
					data: typeof data === 'undefined'? [] : data.map(d => d.productive_days ?? 0)
				},
				{
					name: "Waiting on Weather",
					type: "bar",
					data: typeof data === 'undefined'? [] : data.map(d => d.wow_days ?? 0)
				},
				{
					name: "Productive WOW corrected",
					type: "line",
					data: typeof data === 'undefined'? [] : data.map((d) => {
						const daysInMonth = Math.max(...Array.from(Array(moment(d.cutoffmonth).daysInMonth()), (_, i) => i + 1));
						const wowDays = d.wow_days === null? 0: d.wow_days /d.number_of_rigs;
						const nptDays = d.npt_days === null ? 0: d.npt_days /d.number_of_rigs;
						const wowPerformanceCorrected = ((daysInMonth - nptDays - wowDays) / (daysInMonth-wowDays) / daysInMonth) * 100;
						return ((wowPerformanceCorrected*daysInMonth/100))*d.total_days;
					})
				},
				{
					name: "Non-Productive Time",
					type: "bar",
					data: typeof data === 'undefined'? [] : data.map(d => d.npt_days ?? 0)
				}
			]
		};
		return result;
	},
	async runFilters(){
		const filterData = this.getFilteredData();
		const npdWellbores = [...new Set(filterData.map((d) => d.npd_wellbore))];
		console.log(npdWellbores)
		if(appsmith.store && appsmith.store.mrp_filters){
			await storeValue('wellbores', appsmith.store.mrp_filters.length > 0? npdWellbores: undefined);		
		}else{
			await storeValue('wellbores', undefined);		
		}		

		await NPT_monthly_cutoff.run();
		await this.getData();
		await this.getNptMonthlyRigPerformance();
		if(contractor_breakdown.isSwitchedOn){
			await nptContractorBreakdown.run()	
		}
	},
	async getNptMonthlyRigPerformance(data = NPT_monthly_cutoff.data){
		const groupedByMonth = data;
		const totalNpt = groupedByMonth.filter(g => g.total_days > 0).reduce((arr, item) => {
			arr["nptDays"] += parseFloat(item.npt_days ?? 0);
			arr["productiveDays"] += parseFloat(item.productive_days ?? 0);
			arr["wowDays"] += parseFloat(item.wow_days ?? 0);
			arr["totalDays"] += parseFloat(item.total_days);
			return arr;
		}, {
			"nptDays": 0,
			"productiveDays": 0,
			"wowDays": 0,
			"totalDays": 0
		});
		return [
			{
				value: totalNpt["nptDays"],
				color: "#005D92",
				name: "NPT"
			},
			{
				value: totalNpt["productiveDays"],
				color: "#00A686",
				name: "Productive"
			},
			{
				value: totalNpt["wowDays"],
				color: "#559CB5",
				name: "WoW"
			}
		];
	},
	getCaption(){
		const baseCaption =  "Monthly rig performance "
		const start = moment(datetime.getStartDate());
		const end = moment(datetime.getEndDate());

		if(end.isSame(start, 'year')){
			return baseCaption
		}else{
			return baseCaption + start.format('YYYY') + ' - ' + end.format('YYYY');
		}
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
		const filters = appsmith.store && appsmith.store.mrp_filters? appsmith.store.mrp_filters: [];
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
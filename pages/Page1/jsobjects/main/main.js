export default {
	async initialize (user_config_data= UserConfig.data, wellbores = wellbores_active_last_14_days.data) {
		console.log("initialize")
		if(typeof appsmith.store.frontend_components_url === "undefined" || typeof appsmith.store.frontend_components_timestamp === 'undefined' || appsmith.store.frontend_components_timestamp - (new Date().getTime()/1000) < 3600 ){
			InfraConfig.run().then((config) => {
				storeValue('frontend_components_url', 'https://' + config.frontend_components_url);
				storeValue('frontend_components_timestamp', new Date().getTime() / 1000)
			});		
		}
		const filters = ['date_interval'];

		let hasChanges = false;
		for(let i = 0; i < filters.length; i++){
			const filterValue = filter.getFilters(user_config_data, filters[i]);
			if(appsmith.store[filters[i]] !== filterValue){
				await storeValue(filters[i], filterValue)		
				hasChanges = true;
			}
		}

		await this.changeDateInterval(appsmith.store.date_interval);		
		if(typeof appsmith.store.selectedWellbore === 'undefined' && typeof wellbores !== 'undefined' &&  wellbores.length > 0){
			await factWvActivity.run({npd_wellbore: wellbores[0].npd_wellbore})
		}else{
			await factWvActivity.run({npd_wellbore: appsmith.store.selectedWellbore})
		}
	},
	async open_DDRModal(cutoffdate){
		await storeValue("cutoffdate", cutoffdate)
		await Promise.all([timelogs.run({cutoffdate}), headers.run({cutoffdate})])
		showModal(DDR_modal.name)
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
	},
	async selectCustomDateInterval(){
		await storeValue('fromDate', moment(new Date(from_date.selectedDate)).format())
		await storeValue('date_interval', 'custom')
		await factWvActivity.run();
		closeModal(selectCustomDateModal.name);
	},
	selectedInterval(){
		if(!appsmith.store.date_interval){
			return "last_3_days"
		}

		return appsmith.store.date_interval;
	},
	async changeDateInterval(value = s_timePeriod.selectedOptionValue){
		if(value === "custom"){
			showModal(selectCustomDateModal.name)
		}else{
			let cutoffDate;
			switch(value){
				case "last_24_hours": 
					cutoffDate = moment().subtract(24, 'hours').format();
					break;
				case "last_3_days":
					cutoffDate = moment().subtract(2, 'days').startOf("day").format();
					break;
				case "last_7_days":
					cutoffDate = moment().subtract(6, 'days').startOf("day").format();
					break;
				case "last_month":
					cutoffDate = moment().subtract(1, 'month').startOf("day").format();
					break;
				case "last_3_months":
					cutoffDate = moment().subtract(3, 'month').startOf("day").format();
					break;
			}
			await storeValue('date_interval', value);
			await storeValue("fromDate", cutoffDate);
			await factWvActivity.run()	
		}
	},
}
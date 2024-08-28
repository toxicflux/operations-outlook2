export default {
	async initialize(user_config_data = UserConfig.data){
		this.redirectBasedOnRole();
		const filters = ['h_start', 'h_end'];

		let hasChanges = false;
		for(let i = 0; i < filters.length; i++){
			const filterValue = filter.getFilters(user_config_data, filters[i]);
			if(appsmith.store[filters[i]] !== filterValue){
				await storeValue(filters[i], filterValue)		
				hasChanges = true;
			}
		}

		InfraConfig.run().then((config) => {
			storeValue('frontend_components_url', 'https://' + config.frontend_components_url);
			storeValue('frontend_components_timestamp', new Date().getTime() / 1000)
		});		

		this.process()
	},
	handleClick(data){
		console.log("Clicked active well");			
		storeValue('selectedWellbore', data.data.wellbore.npd_wellbore)
		navigateTo("Wellbore", {npd_wellbore: data.data.wellbore.npd_wellbore}, "SAME_WINDOW")
	},

	async process(drilling_data = dwh_factWvDrillingTimeline.data){
		if(typeof drilling_data === 'undefined'){
			drilling_data = await dwh_factWvDrillingTimeline.run();
		}
		return new Promise((resolve, reject) => {
			const rigs = drilling_data.map((d) => {
				return !d.rig_name ? 'other': d.rig_name			
			});
			const groups = [...new Set(rigs)].map((d, index) => {
				return {
					id: index,
					content: utils.uppercaseFirst(d),
				}
			});

			const items = drilling_data.map((d, index) => {
				const searchGroup = !d.rig_name? 'other':  d.rig_name;
				const groupIndex = groups.findIndex((g) => g.content ===   utils.uppercaseFirst(searchGroup));

				return {
					id: index,
					content: 	d.wellbore,
					npd_wellbore: d.npd_wellbore,
					groupName: d.rig_name,
					start: new Date(moment(d.startdate)),
					start_raw: new Date(moment(d.startdate)),
					end: new Date(moment(d.enddate)),
					end_raw: new Date(moment(d.enddate)),
					group: groups[groupIndex].id
				}
			}).filter((d) => !!d.content)



			resolve({
				dimension: dimensionSelect.selectedOptionValue,
				start: appsmith.store.h_start,
				end: appsmith.store.h_end,				
				groups: groups,
				items: items});
		});
	},
	isInSync() {	
		const dataDefined = typeof data.process.data !== 'undefined';			
		if(!dataDefined){
			return false;
		}
		const startCheck = appsmith.store?.h_start ? data.process.data.start === appsmith.store.h_start : true;
		const endCheck = appsmith.store?.h_end ? data.process.data.end === appsmith.store.h_end : true;

		return startCheck && endCheck;
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
	redirectBasedOnRole(){
		const rls_sensitivity = this.getRlsSensitivity();
		if(rls_sensitivity < 3){
			let stage = ""
			if(appsmith.URL.hostname === "tds-dev.varenergi.no"){
				stage = "-dev"
			}else if(appsmith.URL.hostname === "tds-test.varenergi.no"){
				stage = "-test"
			}else{
				stage = ""
			}
			navigateTo(`https://dw${stage}.varenergi.no/`)
		}
	}
}
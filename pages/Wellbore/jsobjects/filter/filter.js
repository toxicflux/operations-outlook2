export default {
	async run (npd_wellbore = wellbore_select.selectedOptionValue, navigate=true) {

		if(typeof appsmith.store.frontend_components_url === "undefined"){
			InfraConfig.run().then((config) => {
				storeValue('frontend_components_url', 'https://' + config.frontend_components_url);
			});		
		}

		OperationSummaries.run({'npd_wellbore': npd_wellbore}).then((d) => {
			return summary.getSummary()
		})
		activities_next_10_days.run().then((d) => {
			return activities.getActivitiesLast10Days();
		})

		Promise.all([ 
			time_depth.run({'npd_wellbore': npd_wellbore}), 
			planned_time_depth.run({'npd_wellbore': npd_wellbore}), 		
		]);

		hse.run();

		const wellbore = await get_dimWellbore.run({'npd_wellbore': npd_wellbore});
		factCostAnalysisComparative.run({'npd_wellbore': npd_wellbore});
		Promise.all([activities_planned.run({'npd_wellbore': npd_wellbore}), activities_completed.run({'npd_wellbore': npd_wellbore})])
			.then((res => {
			return tasks.getCurrentTask(res[1], res[0], wellbore);					
		}));


		if(navigate){
			navigateTo('Wellbore', {npd_wellbore: npd_wellbore}, "SAME_WINDOW");
		}
	},
	async initialize(data = wellbores_active_last_14_days.data){
		if(typeof appsmith.store.frontend_components_url === "undefined" || typeof appsmith.store.frontend_components_timestamp === 'undefined' || appsmith.store.frontend_components_timestamp - (new Date().getTime()/1000) < 3600 ){
			InfraConfig.run().then((config) => {
				storeValue('frontend_components_url', 'https://' + config.frontend_components_url);
				storeValue('frontend_components_timestamp', new Date().getTime() / 1000)
			});		
		}
		if(!appsmith.URL.queryParams.npd_wellbore){
			if(typeof data === 'undefined'){
				data  = await wellbores_active_last_14_days.run();
			}
			if(!data || data.length === 0){
				showModal('noActiveWellboresModal')
			}else{
				if(typeof appsmith.store.selectedWellbore === 'undefined'){
					await storeValue('selectedWellbore', data[0].npd_wellbore)
					await this.run(data[0].npd_wellbore, false)			
				}else{
					await this.run(appsmith.store.selectedWellbore, false)			
				}

			}
		}else{
			await this.run(appsmith.URL.queryParams.npd_wellbore, false)			
		}
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

}
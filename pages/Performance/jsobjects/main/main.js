export default {
	run(npd_wellbore = wellbore_select.selectedOptionValue){
		dimWellbore.run({npd_wellbore});
		discriminateNptWvData.run({npd_wellbore}).then((d) => {
			const categories = this.getDiscriminateNptData(d).categories;
			if(categories.length === 0){
				showModal('noDataModal');
			}
		});
		nptContractorBreakdown.run({npd_wellbore})
		wvActivityData.run({npd_wellbore});
	},
	initialize(){
		if(typeof appsmith.store.frontend_components_url === "undefined" || typeof appsmith.store.frontend_components_timestamp === 'undefined' || appsmith.store.frontend_components_timestamp - (new Date().getTime()/1000) < 3600 ){
			InfraConfig.run().then((config) => {
				storeValue('frontend_components_url', 'https://' + config.frontend_components_url);
				storeValue('frontend_components_timestamp', new Date().getTime() / 1000)
			});		
		}
		const categories = this.getDiscriminateNptData().categories;
		if(categories.length === 0){
			showModal('noDataModal');
		}
	},
	mapNptOverviewData(data = wvActivityData.data){
		const totalHours = data.reduce((a, b) => a + b.duration_days, 0)		
		return data.map((d) => {
			return {
				...d,
				totalHours: totalHours,
				percentage: totalHours > 0 ? (d.duration_days / totalHours) * 100 : 0
			}
		})
	},
	mapDiscriminateNptData(data = discriminateNptWvData.data){		
		return data.map((d) => {			
			const totalHours = d.npt_data.reduce((a, b) => a + Object.keys(b).map(k=> b[k]).reduce((c,d) => c+d, 0), 0);
			const nptObj = d.npt_data.reduce((agg, item) => {	
				['P', 'NPT', 'WOW', 'npt_service_text', 'npt_contractor_text'].forEach(((x) => {
					if(['npt_service_text', 'npt_contractor_text'].includes(x)){
						if(x in agg){
							if(item[x] !== null && agg[x] !== item[x]){
								agg[x] = agg[x] + item[x]
							}
						}else{
							if(item[x] !== null){
								agg[x] = item[x]	
							}else{
								agg[x] = "";
							}

						}
					}else{
						if(x in item){
							if(	x in agg){
								agg[x] = agg[x] + item[x];
							}else {
								agg[x] = item[x];
							}
						}		
					}

				}));				
				return agg;
			}, {})


			const isNptService = nptObj["npt_service_text"] !== ''
			const isNptContractor = nptObj["npt_contractor_text"] !== '' && nptObj["npt_service_text"] === '';

			if(isNptService){
				nptObj["NPT_SERVICE"] = nptObj["NPT"];		
				delete nptObj.NPT;
			}else if(isNptContractor){
				nptObj["NPT_CONTRACTOR"] = nptObj["NPT"];				
				delete nptObj.NPT;
			}else {
				if("NPT" in nptObj){
					nptObj["NPT_OPERATOR"] = nptObj["NPT"];
				}
				delete nptObj.NPT;
				delete nptObj.npt_service_text;
				delete nptObj.npt_contractor_text;
			}

			return {
				name: d.name,
				afe_hours: d.afe_hours,
				...nptObj,
				totalHours				
			}
		})
	},
	getDiscriminateNptData(data = discriminateNptWvData.data){
		if(typeof data === 'undefined' || data.length === 0){
			return {
				categories: [],
				series: []
			};
		}

		const filteredNptData = this.mapDiscriminateNptData(data).filter(x => x.name !== null)
		return  {
			categories: filteredNptData.map(item => item.name.replaceAll('\"', '\'\'').replaceAll('\n', '')),
			series: [
				{
					name: "AFE hours",
					color: "#FAA41A",
					stack: "x",
					data: filteredNptData.map(item => item.afe_hours? {value: Math.round(item.afe_hours/0.01)*0.01, groupId: null, childGroupId: null}: {value:  null, groupId: null, childGroupId: null})
				},
				{
					name: "Productive Time",
					color: "#00A686",
					data: filteredNptData.map(item => item.P ? {value: Math.round(item.P/0.01)*0.01, groupId: item.npt_contractor_text, childGroupId: item.npt_service_text}: {value:  undefined, groupId: undefined, childGroupId: undefined}),
					stack: "y"
				},
				{
					name: "Waiting on Weather",
					color: "#559CB5",
					data: filteredNptData.map(item => item.WOW? {value: Math.round(item.WOW/0.01)*0.01, groupId: item.npt_contractor_text, childGroupId: item.npt_service_text}: {value:  undefined, groupId: undefined, childGroupId: undefined}),
					stack: "y"
				},
				{
					name: "NPT due to operator",
					color: "#005D92",
					data: filteredNptData.map(item => item.NPT_OPERATOR? {value: Math.round(item.NPT_OPERATOR/0.01)*0.01, groupId: item.npt_contractor_text, childGroupId: item.npt_service_text}: {value:  undefined, groupId: undefined, childGroupId: undefined}),
					stack: "y"
				},
				{
					name: "NPT due to contractor",
					color: "#f75f43",
					data: filteredNptData.map(item => item.NPT_CONTRACTOR? {value: Math.round(item.NPT_CONTRACTOR/0.01)*0.01, groupId: item.npt_contractor_text, childGroupId: item.npt_service_text}: {value:  undefined, groupId: undefined, childGroupId: undefined}),
					stack: "y"
				},
				{
					name: "NPT due to service",
					color: "#ffdc5d",
					data: filteredNptData.map(item => item.NPT_SERVICE? {value: Math.round(item.NPT_SERVICE/0.01)*0.01, groupId: item.npt_contractor_text, childGroupId: item.npt_service_text}: {value:  undefined, groupId: undefined, childGroupId: undefined}),
					stack: "y"
				}
			]
		}
	},
	getTotalNptSeriesData(data = wvActivityData.data){
		if(typeof data === 'undefined'){
			return [];
		}

		const configs = {
			"P": {
				name: "Productive",
				color:"#00A686"
			},
			"NPT": {
				name: "NPT",
				color:"#005D92"
			},
			"WOW": {
				name: "WoW",
				color:"#559CB5"
			}
		}
		return this.mapNptOverviewData(data).map((d) => {
			const config = configs[d.classification]
			return {
				...config,
				value: d.duration_days
			}
		});
	},
	mapDiscriminateNptDataUnfiltered(data = discriminateNptWvData.data){		
		return data.map((d) => {			
			const totalHours = d.npt_data.reduce((a, b) => a + Object.keys(b).map(k=> b[k]).reduce((c,d) => c+d, 0), 0);
			const nptObj = d.npt_data.reduce((agg, item) => {	
				['P', 'NPT', 'WOW'].forEach(((x) => {
					if(x in item){
						if(	x in agg){
							agg[x] = agg[x] + item[x];
						}else {
							agg[x] = item[x];
						}
					}	
				}));				
				return agg;
			}, {})
			return {
				name: d.name,
				afe_hours: d.afe_hours,
				...nptObj,
				totalHours				
			}
		})
	},
	getDiscriminateNptDataUnfiltered(data = discriminateNptWvData.data){
		if(typeof data === 'undefined' || data.length === 0){
			return {
				categories: [],
				series: []
			};
		}

		const filteredNptData = this.mapDiscriminateNptDataUnfiltered(data).filter(x => x.name !== null)
		console.log(filteredNptData)
		return  {
			categories: filteredNptData.map(item => item.name.replaceAll('\"', '\'\'').replaceAll('\n', '')),
			series: [
				{
					name: "AFE hours",
					color: "#FAA41A",
					stack: "x",
					data: filteredNptData.map(item => item.afe_hours? {value: Math.round(item.afe_hours/0.01)*0.01, groupId: null, childGroupId: null}: {value:  null, groupId: null, childGroupId: null})
				},
				{
					name: "Productive Time",
					color: "#00A686",
					data: filteredNptData.map(item => item.P ? {value: Math.round(item.P/0.01)*0.01, groupId: item.npt_contractor_text, childGroupId: item.npt_service_text}: {value:  undefined, groupId: undefined, childGroupId: undefined}),
					stack: "y"
				},
				{
					name: "Waiting on Weather",
					color: "#559CB5",
					data: filteredNptData.map(item => item.WOW? {value: Math.round(item.WOW/0.01)*0.01, groupId: undefined, childGroupId: undefined}: {value:  undefined, groupId: undefined, childGroupId: undefined}),
					stack: "y"
				},
				{
					name: "Non Productive Time",
					color: "#005D92",
					data: filteredNptData.map(item => item.NPT? {value: Math.round(item.NPT/0.01)*0.01, groupId: undefined, childGroupId: undefined}: {value:  undefined, groupId: undefined, childGroupId: undefined}),
					stack: "y"
				},

			]
		}
	},
	async selectWellbore(npd_wellbore = wellbore_select.selectedOptionValue){
		await storeValue('selectedWellbore', npd_wellbore);
		await Promise.all([dimWellbore.run({npd_wellbore}, wvActivityData.run({npd_wellbore})), discriminateNptWvData.run({npd_wellbore})])
		closeModal('changeWellboreModal')
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
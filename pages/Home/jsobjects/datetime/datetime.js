export default {
	async selectCustomDate(){
		closeModal('selectDateModal');
		return Promise.all([storeValue("h_start", dp_start.selectedDate), storeValue("h_end", dp_end.selectedDate)])
			.then(()=> {
			filter.saveDateRange(dp_start.selectedDate, dp_end.selectedDate);
			s_dateRange.setSelectedOption('custom');			
			return dwh_factWvDrillingTimeline.run();			
		}).then((response)=> {
			return data.process(response);			
		});
	},
	async setDateFilter(value){
		let start;
		switch(value){
			case 'last_month':
				start = moment().subtract(1, 'month').format();				
				break;
			case 'last_3_months':
				start =  moment().subtract(3, 'month').format();				
				break;
			case '1_year':
				start = moment().subtract(1, 'year').format();				
				break;
			case 'year_to_date':
				start=moment().startOf('year').format()				
				break;	
			case 'custom':
				showModal('selectDateModal');
				break;
		}

		const  end = moment().format();
		if(value !== 'custom' && (moment(appsmith.store.h_start).format('l') !== moment(start).format('l') || moment(appsmith.store.h_end).format('l') !== moment(end).format('l'))){
			storeValue('h_start', start);
			storeValue('h_end', end);
			filter.saveDateRange(start, end);
			const response = await dwh_factWvDrillingTimeline.run();
			data.process(response);
		}


	},
	resetDateRange(){
		const defaultDateFilter = this.getDefaultDateFilter();
		s_dateRange.setSelectedOption(defaultDateFilter);
	},
	getDefaultDateFilter(){
		if(appsmith.store && (appsmith.store.h_start && appsmith.store.h_end)){

			const endDate = moment(appsmith.store.h_end).format('l');			
			const actualEndDate = moment().format('l');

			if(endDate !== actualEndDate){
				return 'custom';
			}

			const startDate = moment(appsmith.store.h_start).format('l');

			if(startDate === moment().subtract(1, 'month').format('l')){
				return 'last_month';
			}else if(startDate === moment().subtract(3, 'month').format('l')){
				return 'last_3_months';
			}else if(startDate === moment().subtract(1, 'year').format('l')){
				return '1_year';
			}else if(startDate === moment().startOf('year').format('l')){
				return 'year_to_date';
			}else{
				return 'custom';				
			}			
		}

		return 'last_3_months';
	},
	getStartDate(){
		return appsmith.store && appsmith.store.h_start?  moment(appsmith.store.h_start).format('YYYY-MM-DD') : moment().subtract(3, 'month').format('YYYY-MM-DD')
	},
	getEndDate(){
		return appsmith.store && appsmith.store.h_end? moment(appsmith.store.h_end).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
	}
}
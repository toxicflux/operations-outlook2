export default {
	async selectCustomDate(){
		const start = moment(dp_start.selectedDate).startOf('month')
		const end = moment(dp_end.selectedDate).endOf('month')
		return Promise.all([storeValue("mrp_start", start.format()), storeValue("mrp_end", end.format())])
			.then(()=> {
			filter.saveDateRange(start.format(), end.format());
			s_dateRange.setSelectedOption('custom');				
			return NPT_monthly.run();
		})
			.then(() => {
			return main.runFilters();
		})
			.then(()=> {
			closeModal('selectDateModal');
		})
	},
	async setDateFilter(value){
		let start;
		switch(value){
			case 'last_3_months':
				start = moment().subtract(3, 'month').startOf('month').format();				
				break;
			case 'last_6_months':
				start =  moment().subtract(6, 'month').startOf('month').format();				
				break;
			case '1_year':
				start = moment().subtract(1, 'year').startOf('month').format();				
				break;
			case 'year_to_date':
				start=moment().startOf('year').format()				
				break;	
			case 'custom':
				showModal('selectDateModal');
				break;
		}

		const  end = moment().endOf('month').subtract(1, 'month');
		if(value !== 'custom' && (moment(appsmith.store.mrp_start).format('l') !== moment(start).format('l') || moment(appsmith.store.mrp_end).format('l') !== moment(end).format('l'))){
			await storeValue('mrp_start', start);
			await storeValue('mrp_end', end.format());
			await filter.saveDateRange(start, end.format());
			await NPT_monthly.run();
			main.runFilters();
		}


	},
	resetDateRange(){
		const defaultDateFilter = this.getDefaultDateFilter();
		s_dateRange.setSelectedOption(defaultDateFilter);
	},
	getDefaultDateFilter(){
		if(appsmith.store && (appsmith.store.mrp_start && appsmith.store.mrp_end)){
			const startDate = moment(appsmith.store.mrp_start).format('l');

			if(startDate === moment().subtract(3, 'month').startOf('month').format('l')){
				return 'last_3_months';
			}else if(startDate === moment().subtract(6, 'month').startOf('month').format('l')){
				return 'last_6_months';
			}else if(startDate === moment().subtract(1, 'year').startOf('month').format('l')){
				return '1_year';
			}else if(startDate === moment().startOf('year').format('l')){
				return 'year_to_date';
			}else{
				return 'custom';				
			}			
		}

		return 'last_6_months';
	},
	getStartDate(){
		return appsmith.store && appsmith.store.mrp_start?  moment(appsmith.store.mrp_start).format('YYYY-MM-DD') : moment().startOf('month').subtract(6, 'month').format('YYYY-MM-DD')
	},
	getEndDate(){
		return appsmith.store && appsmith.store.mrp_end? moment(appsmith.store.mrp_end).format('YYYY-MM-DD') : moment().endOf('month').subtract(1, 'month').format('YYYY-MM-DD')
	}
}
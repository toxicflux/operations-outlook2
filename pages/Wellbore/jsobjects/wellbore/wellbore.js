export default {

	wellbores () {
		return wellbores_active_last_14_days.data.map(p => ({"label": p["wellbore"], "value": p["npd_wellbore"]}));
	},
	getWellboreName(){
		if(wellbore.wellbores().length === 0){
			return 'No active wellbore!';
		}
		if(typeof appsmith.store === 'undefined' || typeof appsmith.store.selectedWellbore === 'undefined' || appsmith.store.selectedWellbore === null){
			return 'No wellbore selected!';
		}

		if(typeof get_dimWellbore.data === 'undefined' || get_dimWellbore.data.length === 0){
			return '';
		}

		return get_dimWellbore.data[0].wellbore;
	},
	getWellboreMetadata(data = get_dimWellbore.data){
		if(!data || data.length === 0){
			return '';
		}

		const rig =  typeof tasks.getCurrentTask.data !== 'undefined'? tasks.getCurrentTask.data.rig: '';
		if(rig === undefined){
			return ''
		}
		return utils.uppercaseFirst(data[0].drillingoperator) + ', ' + rig
	}

}
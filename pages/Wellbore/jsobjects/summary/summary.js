export default {
	async getSummary () {		
		return (OperationSummaries.data && OperationSummaries.data.length > 0 ? OperationSummaries.data.map((row, index)=> {
					return {
						id: index,
						date: row.date,
						summary: row.summary.replace(/\"/g,'\'\'').replace(/\n/g,''),
						npd_wellbore: appsmith.store.selectedWellbore
					}
				}): []).filter((x) => x.summary !== '.');
	}
}
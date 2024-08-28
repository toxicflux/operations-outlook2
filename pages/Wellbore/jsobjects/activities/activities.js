export default {
	async run(){
		return Promise.all([activities_planned.run(), activities_completed.run()])
			.then(() => {
			return Promise.all([this.calcTree(), this.getActivitiesLast10Days()])
		})
			.then(()=> {
			showModal('showAllTasksModal')
		})
	},
	async getActivitiesLast10Days () {		
		return activities_next_10_days.data && activities_next_10_days.data.length > 0 ? activities_next_10_days.data.map((row, index)=> {
			return {
				...row,
				task_name: row.task_name? row.task_name.replace(/\"/g,'\'\'').replace(/\n/g,''): ''
			}
		}): [];
	},
	async calcTree (activities_planned_data = activities_planned.data, activities_completed_data = activities_completed.data) {

		return new Promise((resolve, reject) => {		
			const columnDefs = [
				{ field: 'portplantaskid', hide: true },		
				{ field: 'parentplantaskid', hide: true },		
				{ field: 'task_name', colId: 'task_name', headerName: 'Name'},		
				{ field: 'start_date', colId: 'start_date', headerName: 'Critical Path Start Date' },
				{ field: 'operation_status', colId: 'operation_status', headerName: 'Operation Status' },
			];
			
			const activities = (activities_planned_data ?? []).concat(activities_completed_data ?? []);
			const filteredActivities = activities.filter((a) => (a.parentplantaskid === null || (tasks.getCurrentTask.data.portplantaskid.includes(a.portplantaskid)) || new Date(a.start_date) >= new Date()))
			const uniqueArr = [...new Set(filteredActivities.map((a) => a.portplantaskid))];
			const uniqueActivities = [];
			uniqueArr.forEach((unique) => {
				const activity = filteredActivities.find((a) => a.portplantaskid === unique);
				uniqueActivities.push(activity)
			})			

			resolve({
				tableData: {
					columnDefs: columnDefs,
					rowData: uniqueActivities.map((d) => {					
						let taskName =  d.task_name?  d.task_name.replace(/\"/g,'\'\'').replace(/\n/g,''): "";

						return {
							...d,
							"task_name": taskName,							
							"start_date": moment(d.start_date).tz('Europe/Oslo').format('DD/MM/YYYY HH:mm'),
							"operation_status": d.operation_status
						}
					}).sort((a, b) => {
						return new Date(a.start_date) - new Date(b.start_date)
					})
				},
			});
		});
	}
}
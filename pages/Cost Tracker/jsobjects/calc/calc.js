export default {
	async mapToComparativeAnalysis (comparative_analysis_data = comparativeCostAnalysis.data) {	
		return new Promise((resolve, reject) => {
			const columnDefs = [{
				field: "name",
				headerName: "",
				tooltipField: "",
				flex: 3,
				minWidth: 250,
				suppressSizeToFit: true
			},
													{
														field: "start",  tooltipField: "Start", headerName: "Start", flex: 1, minWidth: 150
													},
													{
														field: "end",  tooltipField: "End", headerName: "End", flex: 1, minWidth: 150
													},	
													{
														field: "dsv_time",  tooltipField: "DSV Time", headerName: "DSV Time", flex: 1, minWidth: 120
													},
													{
														field: "planned_time",  tooltipField: "Planned Time", headerName: "Planned Time", flex: 1, minWidth: 120
													},
													{
														field: "actual_time",  tooltipField: "Actual Time", headerName: "Actual Time", flex: 1, minWidth: 120
													},
													{
														field: "delta_days",  tooltipField: "Δ Days", headerName: "Δ Days", flex: 1, minWidth: 100
													},
													{
														field: "planned",  tooltipField: "Planned AFE", headerName: "Planned AFE", flex: 1, minWidth: 150
													},
													{
														field: "est_VoWD",  tooltipField: "Est. VoWD", headerName: "Est. VoWD", flex: 1, minWidth: 150
													},
													{
														field: "delta_cost",  tooltipField: "Δ Cost", headerName: "Δ Cost", flex: 1, minWidth: 200
													},
													{
														field: "predictive_cost",  tooltipField: "Baseline Cost Prediction", headerName: "Baseline Cost Prediction", flex: 1, minWidth: 200
													},
													{
														field: "dsv_cost",  tooltipField: "DSV Cost Prediction", headerName: "DSV Cost Prediction", flex: 1, minWidth: 200
													}
												 ];


			const rowData = comparative_analysis_data.reduce((arr, item) => {
				arr.push({
					"name" : item.taskname ? item.taskname.replace(/\"/g,'\'\'').replace(/\n/g,'').replace(/\r/g,'') :  "Other",					
					"start": item.kabal_start ? moment(item.kabal_start).format('DD.MM.YYYY HH:mm'): '-',
					"end": item.kabal_end ? moment(item.kabal_end).format('DD.MM.YYYY HH:mm') : '-',
					"dsv_time": item.dsv_time,
					"planned_time": item.planned_time,
					"actual_time": item.actual_time,
					"delta_days": item.delta_days,
					"planned": item.total_cost,
					"est_VoWD": item.total_vowd,
					"delta_cost":item.delta_cost,
					"predictive_cost": item.predictive_cost,
					"dsv_cost": item.dsv_cost
				});
				return arr;
			}, []);

			const totalPlannedCost = comparative_analysis_data.reduce((sum, item) => sum + item.total_cost, 0);
			const totalEstVOWD = comparative_analysis_data.reduce((sum, item) => sum + item.total_vowd, 0);
			const totalDaysAheadBehind = comparative_analysis_data.reduce((sum, item) => sum + item.delta_days, 0); 
			const predictiveCost = comparative_analysis_data.reduce((sum, item) => sum + item.predictive_cost, 0); 
			const dsvCost = comparative_analysis_data.reduce((sum, item) => sum + item.dsv_cost, 0);
			const dsvTime = comparative_analysis_data.filter(x => x.actual_time !== null).reduce((sum, item) => sum + item.dsv_time, 0);
			const plannedTime = comparative_analysis_data.filter(x => x.actual_time !== null).reduce((sum, item) => sum + item.planned_time, 0);
			const actualTime = comparative_analysis_data.reduce((sum, item) => sum + item.actual_time, 0);
			const index = rowData.findIndex((x) =>  x.name !== "" && x.actual_time === null)
			if(index >= 0){
				rowData.splice(index, 0, {
					"name": "",
					"actual_time": actualTime,
					"dsv_time": dsvTime,
					"planned_time": plannedTime,
					"delta_days": totalDaysAheadBehind,
				});
			}

			rowData.push({
				"name": "",
				"actual_time": index < 0? actualTime: undefined,
				"dsv_time": index < 0? dsvTime: undefined,
				"planned_time": index < 0? plannedTime: undefined,
				"delta_days": index < 0? totalDaysAheadBehind: undefined,
				"planned": totalPlannedCost, 
				"est_VoWD": totalEstVOWD,
				"delta_cost": totalEstVOWD - totalPlannedCost,
				"predictive_cost": predictiveCost,
				"dsv_cost": dsvCost
			})

			if(rowData.filter((row) => !!row.name).length === 0){
				showModal('noDataModal');
			}

			resolve({
				tableData: {
					columnDefs: columnDefs,
					rowData: rowData
				}
			});

		})
	},
}
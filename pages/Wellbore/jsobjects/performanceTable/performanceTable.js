export default {
	getMax(data, column) {
		let arr = data.map(p => (p[column]));
		return Math.max.apply(Math, arr).toFixed(2);
	},
	data (actual_data = time_depth.data, planned_data = planned_time_depth.data) {
		if(!actual_data || !planned_data){
			return [];
		}
		let maxDuration  = this.getMax(actual_data, "summed_duration");
		let lastDepth = actual_data.filter(p => (p.summed_duration.toFixed(2) == maxDuration)).map(p => (p.depthend))[0];
		let entry = this.sameDataForPlanned(lastDepth, planned_data);

		return [
			{
				"Rows": "Planned",
				"Total Days":  typeof entry.summed_duration === 'number' ? entry.summed_duration.toFixed(2): entry.summed_duration,
				"Total Depth": entry.depthend
			},
			{
				"Rows": "Actual",
				"Total Days": this.getMax(actual_data, "summed_duration"),
				"Total Depth": lastDepth
			},
			// {
			// "Rows": "Trouble Free Time",
			// "Total Days": "",
			// "Total Depth": ""
			// },
			{
				"Rows": "Ahead / Behind",
				"Total Days": (this.getMax(actual_data, "summed_duration") - entry.summed_duration).toFixed(2),
				"Total Depth": ""
			}
		];
	},

	sameDataForPlanned (lastDepth, planned_data = planned_time_depth.data) {
		let lowest = 0;
		let highest;
		for (let i = 0; i < planned_data.length; i++) {
			if (planned_data[i].depthend <= lastDepth) {
				lowest = i;
			} else if (planned_data[i].depthend >= lastDepth && ! !!highest) {
				highest = i;
			} else {
				break;
			}
		}
		let entry;
		if (! !!highest) {
			entry = planned_data[lowest];
		} else {
			let m = (planned_data[lowest].depthend - planned_data[highest].depthend)/(planned_data[lowest].summed_duration - planned_data[highest].summed_duration);
			let b = planned_data[lowest].depthend - m * planned_data[lowest].summed_duration;
			entry = {
				"depthend": lastDepth,
				"summed_duration": ((lastDepth-b)/m).toFixed(2)
			};
		}
		return entry;
	}
}
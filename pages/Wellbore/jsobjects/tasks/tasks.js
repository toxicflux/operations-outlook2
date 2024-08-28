export default {	
	async getCurrentTask (completed_activities =  activities_completed.data, planned_activities =  activities_planned.data, wellbore_data = get_dimWellbore.data) {
		const data = (completed_activities ?? []).concat(planned_activities ?? []);
		const sorted = data.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
		const wellbore = typeof wellbore_data === 'undefined' ? undefined: wellbore_data[0];
		const rig = typeof wellbore === 'undefined' || typeof wellbore.rig_latest === 'undefined' ||  wellbore.rig_latest === null ? '': utils.uppercaseFirst(wellbore.rig_latest);

		let phase;
		const sortedPhases = sorted.filter(s => s.parentplantaskid === null)
		const indexPhase = sortedPhases.findIndex((t) => new Date(t.start_date) > new Date());
		if(sortedPhases.length === 0){
			phase = null;
		}else{
			if(indexPhase === -1){
				phase = sortedPhases[sortedPhases.length - 1];
			}else{
				if(sortedPhases.length > 1 && indexPhase > 1 && moment(sortedPhases[indexPhase].start_date).isAfter(moment())){
					phase = sortedPhases[indexPhase - 1];	
				}else{
					phase = sortedPhases[indexPhase];	
				}	
			}
		}

		let task;
		const sortedTasks = !phase? sorted.filter(s => s.parentplantaskid !== null): sorted.filter(s => s.parentplantaskid === phase.portplantaskid)
		const indexTask = sortedTasks.findIndex((t) => new Date(t.start_date) > new Date());

		if(sortedTasks.length === 0){
			task = null;
		}else{
			if(indexTask === -1){
				task = sortedTasks[sortedTasks.length - 1];
			}else{
				if(sortedTasks.length > 1 && indexTask > 1 && moment(sortedTasks[indexTask].start_date).isAfter(moment())){
					task = sortedTasks[indexTask - 1];	
				}else{
					task = sortedTasks[indexTask];	
				}	
			}
		}

		let start_date = null;
		if(!phase){			
			start_date = !task? null: task.start_date;
		}else{
			start_date = phase.start_date;
		}

		const portplantaskids = []
		if(phase){
			portplantaskids.push(phase.portplantaskid);
		}
		if(task){
			portplantaskids.push(task.portplantaskid);
		}

		return {
			"portplantaskid": portplantaskids,
			"activity_name": !phase? '-': phase.task_name.replace(/\"/g,'\'\'').replace(/\n/g,''),
			"start_date":  !start_date? '-': moment(start_date).format('DD/MM/YYYY'),
			"task_name": !task? '-' : task.task_name.replace(/\"/g,'\'\'').replace(/\n/g,''),
			"rig": rig
		}
	}
}
export default {
	dataseries (data) {
		let datestamps = data? data.map(p => ([p.summed_duration, p.depthend])): [];
		return datestamps;
	},
	getTask(com){
		const index = com.search('\r\n\r\n');
		let description = index < 0 ? com: com.substring(0, index);
		description =  description.replaceAll('"', '\'\'');	
		description =  description.replaceAll('.-', '-');
		description =  description.replaceAll('&quote;', '\'\'');	
		description = description.replaceAll('½', '1/2');
		description = description.replace(/[&#,+$~%:*<>{}]/g, '');
		description =  description.replaceAll('\r\n', '');
		description =  description.replaceAll('\t', '   ');
		description =  description.replaceAll(/[^a-zA-Z0-9\'.\-\R ]/g, "");

		return description.trim();
	},
	timedepthTasks(data = time_depth.data){
		return data.map((d) => {
			return this.getTask(d.com)
		})
	}
}
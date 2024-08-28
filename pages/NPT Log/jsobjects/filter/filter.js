export default {
	page: "OO_ws",
	async saveDateRange(start, end){
		const page = this.page;
		let config;
		if(typeof UserConfig.data === 'undefined' || UserConfig.data.length === 0){
			config = {
				[page]: {
					'ws_start': start,
					'ws_end': end
				}			
			};	
		}else{
			const persistedConfig = UserConfig.data.length > 0 ? UserConfig.data[0].config: {};
			config = persistedConfig;
			config[page]={
				...config[page],
				'ws_start': start,
				'ws_end': end
			}
		}

		await UpsertUserConfig.run({
			config,
			user: appsmith.user.username
		});
		await UserConfig.run();
	},
	getFilters(user_config_data = UserConfig.data, path = 'h_start', general = false){
		const returnArray = [];
		const page = general? 'general': this.page;
		const emptyReturnValue = returnArray.includes(path) ? []: null;
		if(typeof user_config_data === 'undefined' || user_config_data.length === 0){
			return emptyReturnValue;
		}

		const config = user_config_data[0].config;
		if(!config || !config[page] || !(path in config[page])){
			return emptyReturnValue;
		}

		return config[page][path];
	},
	async saveFilters(path, filters, general = false){
		const page = general ? 'general': this.page;
		let config;
		if(typeof UserConfig.data === 'undefined' || UserConfig.data.length === 0){
			config = {
				[page]: {
					[path]: filters	
				}			
			};	
		}else{
			const persistedConfig = UserConfig.data.length > 0 ? UserConfig.data[0].config: {};
			config = persistedConfig;
			config[page]={
				...config[page],
				[path]: filters
			}
		}

		await UpsertUserConfig.run({
			config,
			user: appsmith.user.username
		});
		await UserConfig.run();
	},	

}
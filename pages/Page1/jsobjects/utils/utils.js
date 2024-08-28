export default {
	uppercaseFirst(a){
		if(typeof a === 'undefined' || a === null)
			return a;
		if(a.startsWith('#'))
			return a;
		const splitStr = a.split(' ');
		const contentArr = [];
		splitStr.forEach((c) => {
			contentArr.push( c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()); 
		});
		return contentArr.join(' ')
	},
	filteredWellbores: [9632, 9798, 9224], // [9632, 9798, 9224],
	filtersEmptyOrNotSet(){
		if(!appsmith.store || typeof appsmith.store.h_filters === 'undefined' || typeof appsmith.store.wellbores === 'undefined'){
			return true;
		}
		
		return appsmith.store.h_filters.length === 0 || appsmith.store.wellbores.length === 0;
	}
}
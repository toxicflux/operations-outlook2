export default {
	uppercaseFirst(a){
		if(typeof a === 'undefined' || a === null)
			return "";
		if(a.startsWith('#'))
			return a;

		const splitStr =a.split(' ');
		const contentArr = [];
		splitStr.forEach((c) => {
			if(!(c === 'AS' || c === 'ASA')){
				contentArr.push( c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()); 		
			}			
		});
		return contentArr.join(' ');
	}
}
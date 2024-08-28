export default {
	progress: 0,
	async exportToPDF () {
		this.progress = 0;
		const summarySrcDoc = await this.formatSummaryTable();
		const wellInfoSrcDoc = this.formatWellInfo();

		const encodedPdfs = await Promise.all([UrlToPdf.run({
			external_url: w_timedepth.source,
			delay: 2000
		}),  HtmlToPdf.run( {html: summarySrcDoc,  delay: 200}), HtmlToPdf.run( {html: wellInfoSrcDoc,  delay: 200})])	
		this.progress = 50;
		const base64strings = encodedPdfs.map((res)=> {
			return res.encoded_pdf.split(',')[1];
		});
		const result = await MergeToPdf.run( {encoded_pdfs: base64strings});
		this.progress = 100;
		closeModal('exportPdfModal');

		download(result.encoded_pdf, "Operations Outlook - Summary.pdf");
	},	
	formatTimeDepthGraph(){
		let timedepthSrcDoc = w_timedepth.srcDoc;		
		timedepthSrcDoc = timedepthSrcDoc.replace(/width: 100%/g, 'width: 1000px')
		timedepthSrcDoc = timedepthSrcDoc.replace(/var enableTooltip = true;/g, 'var enableTooltip = false;')
		const element = "<body>";
		const indexToInsertTitle = timedepthSrcDoc.indexOf(element)
		timedepthSrcDoc = timedepthSrcDoc.substring(0, indexToInsertTitle + element.length) + "\n<h2>Time Depth</h2>\n" + timedepthSrcDoc.substring(indexToInsertTitle + element.length);
		return timedepthSrcDoc;
	},
	async formatSummaryTable(){
		const res = await summary.getSummary();
		const [data] = res;
		if(!data){
			return "";
		}
		let summarySrcDoc ="\n<h2>Last 7 Days Summary</h2>\n"
		const date =  new Date(data.date);
		date.setDate(date.getDate() + 1);
		const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
		const month = months[date.getMonth()];
		const formattedDate = month + " " + date.getDate() + ", " + date.getFullYear();
		summarySrcDoc += "\n<em>Created - " + formattedDate + "</em>\n"
		summarySrcDoc += "\n<p>" + data.summary + "</p>"
		return summarySrcDoc;
	},
	formatWellInfo(){
		let wellInfoSrcDoc = well_infoCopy.srcDoc;		
		const indexToInsertTitle = wellInfoSrcDoc.indexOf('<div class="container">');
		wellInfoSrcDoc = wellInfoSrcDoc.substring(0, indexToInsertTitle) + "\n<h2>Activities</h2>\n" + wellInfoSrcDoc.substring(indexToInsertTitle);
		return wellInfoSrcDoc;
	}
}
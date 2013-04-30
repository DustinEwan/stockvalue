function fn_CurrencyToNum(num){
//To Unformat Currency to Number. 
//numSign: will multiply the final value to determine if it is Positive (numSign=1) or negative (numSign=-1)
    var noJunk = "", withDollar = "", foundDecimal = 0, foundAlphaChar = 0, numSign=1, i;
    num += "";
	//Check to see if the first character in the string is a "negative" sign
	if (num.slice(0,1)=="-"){numSign=-1;}
	//Check to see if the first character in the string is a "(" bracket: ie, (45,000)
	if (num.slice(0,1)=="("){
		numSign=-1;
		num = num.substring(1,num.length-1);	//If first character is a "(" bracket, remove the first and last elements "(" and ")"
		}	//End if num.slice(0,1) =="(" ie, if the number is enclosed in ()
	
    if (num == "" || num=="-") { return(0); }
    for (i=0; i <= num.length; i++){
		var thisChar = num.substring(i, i+1);
		if (thisChar == ".")  {
			foundDecimal = 1;
			noJunk = noJunk + thisChar;
        }	//End if (thisChar == ".")
        if ((thisChar < "0") || (thisChar > "9"))    {
			if ((thisChar != "$") && (thisChar !=".") && (thisChar != ",") && (thisChar != " ") && (thisChar !="")) {foundAlphaChar = 1;}
        }	//End if ((thisChar < "0") || (thisChar > "9"))
        else {
			withDollar = withDollar + thisChar;
			noJunk = noJunk + thisChar;
		}	//End else

		if ((thisChar == "$") || (thisChar == ".") || (thisChar == ",")){
			withDollar = withDollar + thisChar;
		}	//End if ((thisChar == "$") || (thisChar == ".") || (thisChar == ","))
	}	//End for (i=0; i <= num.length; i++)

	if (foundDecimal) { return parseFloat(numSign*noJunk); }
    else if (noJunk.length > 0) { return parseFloat(numSign*noJunk); }
    else return 0;
}	//End function fn_CurrencyToNum

function fn_GetRate(n_Numerator, n_Denominator){
//Given two values, find the rate. If the denominator is zero, return a rate of zero	
	if(parseFloat(n_Denominator)!=0){return (parseFloat(n_Numerator)/parseFloat(n_Denominator));}
	else {return 0;}
}	//End function fn_GetRate

function fn_MakePct(s_num,i_places){
//Given a numeric string 's_num', convert it to a percent with 'i_places' decimal places
	s_num=s_num*100;
	return s_num.toFixed(i_places) + "%";
}	//End function fn_MakePct

function fn_StrToNumFormat(s_string){
//Given a string with a number, convert the number to an integer, and then add ',' every 3 characters
	var n_array = new Array();
	n_array = s_string.toString().split("").reverse();
	var n_array_item;
	var s_newString= '';
	for (n_array_item in n_array){

		if (n_array_item%3 == 0 && n_array_item!=0) { //If number divisible by 3
			s_newString = s_newString + ",";
		}	//End if element divisible by 3

		s_newString = s_newString + n_array[n_array_item];
	}	//End loop over elements
	return s_newString.split("").reverse().join("");
}

function fn_GetWACC(){
//Pull Relevant Values from the Ajax-imported tables, and calculate WACC.
	var tbl_BS = document.getElementById("tbl_BalanceSheet");
		var tbl_BS_len = tbl_BS.rows[1].cells.length;
	var tbl_IS = document.getElementById("tbl_IncomeStatement");
		var tbl_IS_len = tbl_IS.rows[1].cells.length;
	var tbl_KS = document.getElementById("tbl_KeyStats");
		
//	BALANCE SHEET ASSIGNMENT
	var STDebt_0 = fn_CurrencyToNum(fn_TrimNBSP(tbl_BS.rows[2].cells[1].innerHTML))*thousand;	//Short Term Debt, period T0
	var LTDebt_0 = fn_CurrencyToNum(fn_TrimNBSP(tbl_BS.rows[3].cells[1].innerHTML))*thousand;	//Long Term Debt, period T0
	if (tbl_BS_len > 2) {	//If there are at least 3 entries (1 = name, 2 = Yr0, 3 = Yr-1) in the BS, use AVERGAGE DEBT Y0+Y-1 
		var STDebt_1 = fn_CurrencyToNum(fn_TrimNBSP(tbl_BS.rows[2].cells[2].innerHTML)) * thousand; //Short Term Debt, period T-1
		var LTDebt_1 = fn_CurrencyToNum(fn_TrimNBSP(tbl_BS.rows[3].cells[2].innerHTML)) * thousand; //Long Term Debt, period T-1
		var AvgTotDebt = (STDebt_0 + STDebt_1 + LTDebt_0 + LTDebt_1) / 2; //Average Debt (ST and LT) for the last 2 years
	}
	else {	//If there is only 1 year of data, just use Total Debt 
		var AvgTotDebt = parseFloat(STDebt_0 + LTDebt_0);
	}
	
	//INCOME STATEMENT ASSIGNMENTS
	var IntExp = fn_CurrencyToNum(fn_TrimNBSP(tbl_IS.rows[2].cells[1].innerHTML))*thousand;	//Interest Expense
	var Income_0 = fn_CurrencyToNum(fn_TrimNBSP(tbl_IS.rows[3].cells[1].innerHTML))*thousand;	//Income (Before Tax), period T0
	var IncTax_0 = fn_CurrencyToNum(fn_TrimNBSP(tbl_IS.rows[4].cells[1].innerHTML))*thousand;	//Income Tax Expense, period T0
		var Income_3_yrs = Income_0;
		var Tax_3_yrs = IncTax_0;
		
	if (tbl_IS_len > 2) {//If 2 years of data in Income Statement, Assign values
		var Income_1 = fn_CurrencyToNum(fn_TrimNBSP(tbl_IS.rows[3].cells[2].innerHTML)) * thousand; //Income (Before Tax), period T-1
		var IncTax_1 = fn_CurrencyToNum(fn_TrimNBSP(tbl_IS.rows[4].cells[2].innerHTML))*thousand;	//Income Tax Expense, period T-1
			Income_3_yrs = Income_3_yrs + Income_1;
			Tax_3_yrs = parseFloat(Tax_3_yrs + IncTax_1);
	}
	if (tbl_IS_len >3) {	//If 3 years of data...
		var Income_2 = fn_CurrencyToNum(fn_TrimNBSP(tbl_IS.rows[3].cells[3].innerHTML)) * thousand; //Income (Before Tax), period T-2
		var IncTax_2 = fn_CurrencyToNum(fn_TrimNBSP(tbl_IS.rows[4].cells[3].innerHTML))*thousand;	//Income Tax Expense, period T-2	
			Income_3_yrs = Income_3_yrs + Income_2;
			Tax_3_yrs = Tax_3_yrs + IncTax_2;
	}
	
	var MktCap = fn_TrimNBSP(tbl_KS.rows[1].cells[1].innerHTML);	//Market Cap (Intraday)
	//The Market Cap is a number in either millions (**.**M) or billions (**.**B). Find last character, and multiply accordingly
		switch(MktCap.slice(MktCap.length-1,MktCap.length)){
			case "M":	//The market Cap is listed in MILLIONS (1,000,000)
				MktCap=parseInt(parseFloat(MktCap.slice(0,MktCap.length-1))*million); break;
			case "B":	//The market cap is listed in BILLIONS (1,000,000,000)	
				MktCap=parseInt(parseFloat(MktCap.slice(0,MktCap.length-1))*billion); break;
			default: MktCap=0;	//Indicates an Error (no indicator on value of market cap)
		}
		
	var StockName = tbl_KS.rows[0].cells[1].innerHTML;

	var Beta = parseFloat(fn_TrimNBSP(tbl_KS.rows[2].cells[1].innerHTML));	//Beta
	var MktRiskPremium = fn_CurrencyToNum(fn_TrimNBSP(tbl_KS.rows[3].cells[1].innerHTML))/100;	//Market Risk Premium
	var RiskFreeRate = fn_CurrencyToNum(fn_TrimNBSP(tbl_KS.rows[4].cells[1].innerHTML))/100;	//RiskFreeRate (ie, 10yr treasury)

	var TaxRate = fn_GetRate(Tax_3_yrs,Income_3_yrs);
	var DebtRate = fn_GetRate(IntExp,AvgTotDebt);
	
	var FirmValue = parseFloat(parseFloat(MktCap) + parseFloat(AvgTotDebt));
	var EquityRate = RiskFreeRate + (Beta*(MktRiskPremium - RiskFreeRate));
	
	var WACC = (DebtRate*(1-TaxRate))*(AvgTotDebt/FirmValue) + EquityRate*(MktCap/FirmValue);
//	alert("The firm's WACC is: " + WACC + "Where Rd " + DebtRate + "Tc is" + TaxRate + "D,E and V are " + AvgTotDebt + ", " + MktCap + ", " +  FirmValue + ", " +  "Re is: " + EquityRate);

	var replaceString = 
		'<div id="tw_wacc_results_div">'
			+ '<div id="tw_wacc_results">'
				+ '<div class="ui-widget-header ui-corner-all"><h3>Here is the WACC and supporting information for <span class="stockname">' + StockName + '</span>.</h3></div>'
				+ '<div class="ui-widget-content ui-corner-all"><br><p>You can change values in the "Your Input" sections of the tables below.</p><br>'
					+ '<table id="mitchtest"><tr><th style="border:solid #0000FF">Element</th><th style="border:solid #0000FF">From Financial Statements</th><th style="border:solid #0000FF">Your Input</th></tr>'
						+ '<tr><td>WACC:</td><td>' + fn_MakePct(WACC,2) + '</td><td id="Usr_WACC">' + fn_MakePct(WACC,2) + '</td></tr>'
						+ "<tr><td>" + "Cost of Debt r<sub>D</sub>:</td><td>"  + fn_MakePct(DebtRate,2) + "</td><td><input type='text' id='Usr_rD' value='" + fn_MakePct(DebtRate,2) + "'/></td></tr>"
						+ "<tr><td>" + "Corporate Tax Rate T<sub>C</sub>:</td><td>"  + fn_MakePct(TaxRate,2) + "</td><td><input type='text' id='Usr_Tc' value='" + fn_MakePct(TaxRate,2) + "'/></td></tr>"
						+ "<tr><td>" + "Total Debt D:</td><td>"  + fn_StrToNumFormat(AvgTotDebt) + "</td><td><input type='text' id='Usr_D' value='" + fn_StrToNumFormat(AvgTotDebt) + "'/></td></tr>"
						+ "<tr><td>" + "Total Equity E:</td><td>"  + fn_StrToNumFormat(MktCap) + "</td><td><input type='text' id='Usr_MktCap' value='" + fn_StrToNumFormat(MktCap) + "'/></td></tr>"
						+ "<tr><td>" + "Total Firm Value V:</td><td>"  + fn_StrToNumFormat(FirmValue) + "</td><td id='Usr_V'>" + fn_StrToNumFormat(FirmValue) + "</td></tr>"
						+ "<tr><td>" + "Cost of Equity r<sub>E</sub>:</td><td>"  + fn_MakePct(EquityRate,2) + "</td><td id='Usr_rE'>" + fn_MakePct(EquityRate,2) + "</td></tr>"
					+ "</table>"
					+ "<br><p> The Cost of Equity (r<sub>E</sub>) listed above is calculated using the Capital Asset Pricing Model (CAPM) "
					+ "based on the values below. You can also change the assumptions in the CAPM model. </p>"
					+ "<p> Recall that the CAPM model defines the rate of equity return as r<sub>E</sub> = r<sub>f</sub> + &#946(r<sub>M</sub> - r<sub>f</sub>).</p>"
					+ "<br>"
					+ "<table id='table_CAPM'><tr><th style='border:solid #0000FF'>CAPM Component</th><th style='border:solid #0000FF'>Calculated Value:</th><th style='border:solid #0000FF'>Your Input</th></tr>"
						+ "<tr><td>" + "Beta:</td><td>" + Beta + "</td><td><input type='text' id='Usr_Beta' value='" + Beta + "'/></td></tr>"
						+ "<tr><td>" + "Historical Market Return r<sub>m</sub>:</td><td>" + fn_MakePct(MktRiskPremium,2) + "</td><td><input type='text' id='Usr_Rm' value='" + fn_MakePct(MktRiskPremium,2) + "'/></td></tr>"
						+ "<tr><td>" + "Risk Free rate r<sub>f</sub>:</td><td>" + fn_MakePct(RiskFreeRate,2) + "</td><td><input type='text' id='Usr_Beta' value='" + fn_MakePct(RiskFreeRate,2) + "'/></td></tr>"
					+ "</table>"
				+ "</div>"
			+"</div>"
		+ "</div>";
		
		//alert(replaceString);

	$("#tw_wacc_results_div").replaceWith(replaceString
 /*		'<div id="tw_wacc_results_div">'
			+ '<div id="tw_wacc_results">'
				+ '<h3>Here is the WACC and supporting information for '
				+ '<span class="stockname">' + StockName + '</span>.</h3>'
				+ '<br><p>You can change values in the "Your Input" sections of the tables below.</p><br>'
				+ '<table id="mitchtest"><tr><th style="border:solid #0000FF">Element</th><th style="border:solid #0000FF">From Financial Statements</th><th style="border:solid #0000FF">Your Input</th></tr>'
					+ '<tr><td>WACC:</td><td>' + fn_MakePct(WACC,2) + '</td><td id="Usr_WACC">' + fn_MakePct(WACC,2) + '</td></tr>'
					+ "<tr><td>" + "Cost of Debt r<sub>D</sub>:</td><td>"  + fn_MakePct(DebtRate,2) + "</td><td><input type='text' id='Usr_rD' value='" + fn_MakePct(DebtRate,2) + "'/></td></tr>"
					+ "<tr><td>" + "Corporate Tax Rate T<sub>C</sub>:</td><td>"  + fn_MakePct(TaxRate,2) + "</td><td><input type='text' id='Usr_Tc' value='" + fn_MakePct(TaxRate,2) + "'/></td></tr>"
					+ "<tr><td>" + "Total Debt D:</td><td>"  + fn_StrToNumFormat(AvgTotDebt) + "</td><td><input type='text' id='Usr_D' value='" + fn_StrToNumFormat(AvgTotDebt) + "'/></td></tr>"
					+ "<tr><td>" + "Total Equity E:</td><td>"  + fn_StrToNumFormat(MktCap) + "</td><td><input type='text' id='Usr_MktCap' value='" + fn_StrToNumFormat(MktCap) + "'/></td></tr>"
					+ "<tr><td>" + "Total Firm Value V:</td><td>"  + fn_StrToNumFormat(FirmValue) + "</td><td id='Usr_V'>" + fn_StrToNumFormat(FirmValue) + "</td></tr>"
					+ "<tr><td>" + "Cost of Equity r<sub>E</sub>:</td><td>"  + fn_MakePct(EquityRate,2) + "</td><td id='Usr_rE'>" + fn_MakePct(EquityRate,2) + "</td></tr>"
				+ "</table>"
			+ "</div>"
			+ "<br>"
			+ "<p> The Cost of Equity (r<sub>E</sub>) listed above is calculated using the Capital Asset Pricing Model (CAPM)"
			+ "based on the values below. You can also change the assumptions in the CAPM model. </p>"
			+ "<p> Recall that the CAPM model defines the rate of equity return as r<sub>E</sub> = r<sub>f</sub> + &#946(r<sub>M</sub> - r<sub>f</sub>).</p>"
			+ "<br>"
//			+ "<div id='tw_wacc_CAPM'>"
				+ "<table id='table_CAPM'><tr><th style='border:solid #0000FF'>CAPM Component</th><th style='border:solid #0000FF'>Calculated Value:</th><th style='border:solid #0000FF'>Your Input</th></tr>"
					+ "<tr><td>" + "Beta:</td><td>" + Beta + "</td><td><input type='text' id='Usr_Beta' value='" + Beta + "'/></td></tr>"
					+ "<tr><td>" + "Historical Market Returns r<sub>m</sub>:</td><td>" + fn_MakePct(MktRiskPremium,2) + "</td><td><input type='text' id='Usr_Rm' value='" + fn_MakePct(MktRiskPremium,2) + "'/></td></tr>"
					+ "<tr><td>" + "Risk Free rate r<sub>f</sub>:</td><td>" + fn_MakePct(RiskFreeRate,2) + "</td><td><input type='text' id='Usr_Beta' value='" + fn_MakePct(RiskFreeRate,2) + "'/></td></tr>"
				+ "</table>"
//			+ "</div>"
		+ "</div>"	*/
	);
		
}	//End fn_GetWACC



function fn_GetCAPM(){
	//Solve for Re using the CAPM formula; rE = rf + β(rM - rf)
//	var EquityRate = RiskFreeRate + (Beta*(MktRiskPremium - RiskFreeRate));
	var Tbl_CAPM = $("#table_CAPM > tbody > tr > td > input");
	var NewBeta = parseFloat(document.getElementById("Usr_Beta").value);	//Use core JS to get ie to work
	var NewRm = parseFloat(Tbl_CAPM[1].value)/100;
	var NewRf = parseFloat(Tbl_CAPM[2].value)/100;
//	alert("Beta is: " + NewBeta + " Rm is: " + NewRm + " Rf is: " + NewRf);
	//return NewRf + NewBeta*(NewRm-NewRf);
	$("#Usr_rE").html(fn_MakePct(NewRf + NewBeta*(NewRm-NewRf),2));
//	alert(NewRf + NewBeta*(NewRm-NewRf));
	fn_GetUsrWACC();	//Having updated Re, recalculate the full WACC
}

function fn_GetUsrWACC(){
	//When the user changes input values, recalculate the TOTAL VALUE (D+E) and the WACC
	//in the string $("#mitchtest > tbody > tr > td > input"), [0]=rD, [1]=Tc, [2]=D, [3]=E,[4]=rE
	var Tbl_ref = $("#mitchtest > tbody > tr > td > input");
	var New_E = fn_CurrencyToNum(Tbl_ref[2].value) + fn_CurrencyToNum(Tbl_ref[3].value);
	$("#Usr_V").text(fn_StrToNumFormat(New_E));
	var RdNew = fn_CurrencyToNum(Tbl_ref[0].value)/100;
	var TcNew = fn_CurrencyToNum(Tbl_ref[1].value)/100;
	var DNew = fn_CurrencyToNum(Tbl_ref[2].value);
	var ENew = fn_CurrencyToNum(Tbl_ref[3].value);
	var ReNew = parseFloat(($("#Usr_rE").html()))/100;
	
	var VNew = DNew + ENew;
	$("#Usr_V").text(fn_StrToNumFormat(VNew));
//	Recall that WACC = rD(1-Tc)*(D/V)+rE*(E/V)
	var WACCNew = RdNew*(1-TcNew)*(DNew/VNew) + ReNew*(ENew/VNew);
	$("#Usr_WACC").text(fn_MakePct(WACCNew,2));
}	//End fn_GetUsrWACC

function fn_UserWACC() {
	//Define Action when user changes a value in the "user input" values for WACC
		$("#table_CAPM > tbody > tr > td > input").blur(function(){fn_GetCAPM();});
		$("#mitchtest > tbody > tr > td > input").blur(function(){fn_GetUsrWACC();});
		$("table tr").mouseover(function() {$(this).addClass("over");}).mouseout(function() {$(this).removeClass("over");});
		$("table tr:even").addClass("alt");
}	//End fn_UserWACC

function fn_TrimNBSP(s_String){
//Remove all &NBSP (nonbreaking spacing) from a string
//REQUIRES:*** jQuery ///***
	var newString;
	newString = $.trim(s_String.replace(/(&nbsp;)*/g,""));	//Remove &NBSP
	return newString;
}	//End fn_TrimNBSP

 function fn_ToggleClick(v_Object){
	//Function that receives an object and 'toggles' it's visibility
	if ($(v_Object).is(":hidden")) {
		$(v_Object).slideDown("fast");}
	else {
		$(v_Object).slideUp();}
} //End fn_ToggleClick

function fn_AjaxTicker(t_url,t_data){
//Given a URL and data, perform an AJAX request. Currently hard coded to return results to the #go_here id	
	$.ajax({
		type: "GET",
		url: t_url,
		data: t_data,
		success: function(html){
 //		$("#results").append(html);
			$("#go_here").replaceWith(html);},
		complete: function(){fn_GetWACC();fn_UserWACC();}
	})
}	//End fn_AjaxTicker	
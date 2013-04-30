var express = require('express');
var YQL = require('yql');
var request = require('request');

var app = express();

app.use(express.static(__dirname+"/public"));
app.use(express.bodyParser());
app.use(express.logger());

var port = 8080;

app.listen(port, function() {
	console.log("Listening on " + port);
});

app.get('/', function(req, res) {

	var symbol = req.param('symbol');
	var wacc = req.param('wacc');

	if (!req.param('symbol') || !req.param('wacc')) {
		res.render("incomplete.ejs", {symbol: symbol, wacc: wacc});
		return;
	}

	wacc = toDec(wacc);

	if (wacc > 1) wacc /= 100;

	var url = 'url="www.google.com/finance?q=' + symbol + '&fstype=ii&ei=Q1t1UYC7FoielwPCcw"';
	var options = '(css="#incannualdiv table" or css="#balannualdiv table" or css="#casannualdiv table")'; // The three annual tables for income, balance, and cash
	var query = 'select * from data.html.cssselect where ' + url + ' and ' + options;

	new YQL.exec(query, function(data) {
		if (!data || !data.query || !data.query.results || !data.query.results.results) {
			res.redirect('/?symbol=' + symbol + "&wacc=" + wacc);
			return;
		}

		var results = data.query.results.results;

		var output = [];
		for (var i in results) {
			if (!results[i]) {
				res.redirect('/?symbol=' + symbol + "&wacc=" + wacc);
				return
			}

			var curr = {};
			// This is the actual data, each td is formatted such that:
			// 0 => Label
			// 1 => Current Year
			// 2 => Current Year - 1
			// 3 => Current Year - 2
			// 4 => Current Year - 3
			var tdata = results[i].table.tbody.tr;
			if (!tdata)
				continue;

			for (var j in tdata) {
				var td = tdata[j].td;
				var temp = [];
				for (var k = 1; k < 5; k++) {
					var t = 0;
					if (td[k].span) {
						t = td[k].span.content
					}
					else {
						t = td[k].p;
					}

					if (t == '-') t = '0.00';

					temp.push(t);
				}

				var name = td[0].p;
				curr[name] = temp;
			}

			output.push(curr);
		}



		var income = output[0];
		var balances = output[1]; 
		var cashflow = output[2]; 

		if (!income || !balances || !cashflow) {
			res.redirect('/?symbol=' + symbol + "&wacc=" + wacc);
			return
		}

		var cash_operating = cashflow["Cash from Operating Activities"];
		var capital_exenditures = cashflow["Capital Expenditures"];
		var dividends_paid = cashflow["Total Cash Dividends Paid"];

		var equity = toDec(balances["Total Equity"][0]);
		var profit_margin = toDec(income["Income After Tax"][0])/toDec(income["Total Revenue"][0]);
		var shares_outstanding = toDec(balances["Total Common Shares Outstanding"][0]);

		var FCF = []

		for (var i = 0; i < 4; i++) {
			FCF.push(toDec(cash_operating[i]) + toDec(capital_exenditures[i]) + toDec(dividends_paid[i]));
		}

		// Get the rest of the financial data from yahoo.
		var yahoo_url = 'http://finance.yahoo.com/d/quotes.csv?s=' + symbol + '&f=abl1ghjkj1y';

		request(yahoo_url, function(error, response, body) {

			if (error) {
				res.redirect('/?symbol=' + symbol + "&wacc=" + wacc);
				return;
			}

			//ask, bid, price, low, high, 52w low, 52w high, market cap, dividend yield
			var y = body.split(',');

			var ask = y[0];
			var bid = y[1];
			var price = y[2];
			var low = y[3];
			var high = y[4];
			var year_low = y[5];
			var year_high = y[6];
			var market_cap = y[7];
			var dividend_yield = y[8];

			var prices = {};
			var colors = {};

			prices['Ask'] = toDec(ask);
			prices['Bid'] = toDec(bid);
			prices['Price'] = toDec(price);
			prices['Day Low'] = toDec(low);
			prices['Day High'] = toDec(high);
			prices['Year Low'] = toDec(year_low);
			prices['Year High'] = toDec(year_high);
			prices['1:1 Value'] = getCurrentValue(getIV(wacc, FCF), equity, shares_outstanding);
			prices['2:1 Value'] = getCurrentValue(getIV(wacc, FCF), equity, shares_outstanding, 2, 1);
			prices['3:1 Value'] = getCurrentValue(getIV(wacc, FCF), equity, shares_outstanding, 3, 1);
			prices['1:2 Value'] = getCurrentValue(getIV(wacc, FCF), equity, shares_outstanding, 1, 2);
			prices['1:3 Value'] = getCurrentValue(getIV(wacc, FCF), equity, shares_outstanding, 1, 3);
			prices['Intrinsic'] = toDec((getIV(wacc, FCF) / shares_outstanding).toFixed(2));
			prices['Equity'] = toDec((equity / shares_outstanding).toFixed(2));

			colors['Ask'] = '#fa002e'; // red
			colors['Bid'] = '#00C73F'; // green
			colors['Price'] = '#15a3bc'; // blue
			colors['Day Low'] = '#94147D'; // violet / fuscia
			colors['Day High'] = '#8215bc'; // fuscia / violet
			colors['Year Low'] = '#751062'; // violet
			colors['Year High'] = '#bd1550'; //fuscia
			colors['1:1 Value'] = '#eaf202'; // yellow
			colors['2:1 Value'] = '#99E000';
			colors['3:1 Value'] = '#bbd115';
			colors['1:2 Value'] = '#f8ca00';
			colors['1:3 Value'] = '#fd9b2b';
			colors['Intrinsic'] = '#8a9b0f'; //green
			colors['Equity'] = '#e97f02'; //orange

			//sort the prices.
			var graphdata = [];
			for (var k in prices) {
				var item = {label: k, value: prices[k], color: colors[k]};

				if (graphdata.length == 0) {
					graphdata.push(item);
					continue;
				}

				var index = 0;
				var found = false;
				for (; index < graphdata.length; index++) {
					if (prices[k] < graphdata[index].value) {
						found = true;
						break;
					}
				}

				if (found)
					graphdata.splice(index, 0, item);
				else
					graphdata.push(item);
			}

			// res.send(JSON.stringify(graphdata) + '<br /><br />' + JSON.stringify(prices));
			request('http://thatswacc.com/alltickers.php?term='+symbol, function(name_err, name_res, name) {
				res.render('index.ejs', {
					income: income,
					balances: balances, 
					cashflow: cashflow, 
					FCF: FCF, 
					PV: getPV(wacc, FCF).toMoney(),
					HV: getHV(wacc, FCF).toMoney(), 
					IV: getIV(wacc, FCF).toMoney(), 
					profit_margin: profit_margin,
					equity: equity.toMoney(),
					iv_equity: (getIV(wacc, FCF) + equity).toMoney(),
					symbol: symbol,
					name: JSON.parse(name)[0] ? JSON.parse(name)[0].label : symbol,
					wacc: wacc,
					ask: ask,
					bid: bid,
					price: price,
					low: low,
					high: high,
					year_low: year_low,
					year_high: year_high,
					market_cap: market_cap,
					dividend_yield: dividend_yield,
					shares_outstanding: shares_outstanding,
					one_to_one_value: getCurrentValue(getIV(wacc, FCF), equity, shares_outstanding),
					two_to_one_value: getCurrentValue(getIV(wacc, FCF), equity, shares_outstanding, 2, 1),
					three_to_one_value: getCurrentValue(getIV(wacc, FCF), equity, shares_outstanding, 3, 1),
					one_to_two_value: getCurrentValue(getIV(wacc, FCF), equity, shares_outstanding, 1, 2),
					one_to_three_value: getCurrentValue(getIV(wacc, FCF), equity, shares_outstanding, 1, 3),
					prices: graphdata
				});
			});
		});
	});
});

app.get('/wacc', function(req, res) {
	var uri = 'http://thatswacc.com/php/curl7.php?ticker=' + req.param('ticker');

	request(uri, function(error, response, body) {
		res.send(body);
	});
});

function toDec(string) {
	if (typeof string !== 'string')
		return string;

	return parseFloat(string.replace(/,/g, ""));
}

function getPV(wacc, FCF) {
	return (FCF[3] / Math.pow(1+wacc, 1)) + (FCF[2] / Math.pow(1+wacc, 2)) + (FCF[1] / Math.pow(1+wacc, 3));
}

function getHV(wacc, FCF) {
	var g = 0.03;
	if (wacc <= g)
		g = wacc * 0.1;

	return FCF[0] * (1 + g) / (wacc - g);
}

function getIV(wacc, FCF) {
	var pv = getPV(wacc, FCF);
	var hv = getHV(wacc, FCF);

	return pv + (hv / Math.pow(1+wacc, 3));
}

function getCurrentValue(intrinsicValue, equity, shareCount, ivWeight, equityWeight) {
	ivWeight = (typeof ivWeight === "undefined") ? 1 : ivWeight;
	equityWeight = (typeof equityWeight === "undefined") ? 1 : equityWeight;

	if (ivWeight < 1 || equityWeight < 1) {
		if (ivWeight < equityWeight) {
			equityWeight /= ivWeight;
			ivWeight = 1;
		}
		else {
			ivWeight /= equityWeight;
			equityWeight = 1;
		}
	}

	var totalWeight = 1/(ivWeight + equityWeight);

	return parseFloat((totalWeight * (ivWeight*intrinsicValue + equityWeight*equity) / shareCount).toFixed(2));
}

/* 
decimal_sep: character used as deciaml separtor, it defaults to '.' when omitted
thousands_sep: char used as thousands separator, it defaults to ',' when omitted
*/
Number.prototype.toMoney = function(decimals, decimal_sep, thousands_sep)
{ 
   var n = this,
   c = isNaN(decimals) ? 2 : Math.abs(decimals), //if decimal is zero we must take it, it means user does not want to show any decimal
   d = decimal_sep || '.', //if no decimal separator is passed we use the dot as default decimal separator (we MUST use a decimal separator)

   /*
   according to [http://stackoverflow.com/questions/411352/how-best-to-determine-if-an-argument-is-not-sent-to-the-javascript-function]
   the fastest way to check for not defined parameter is to use typeof value === 'undefined' 
   rather than doing value === undefined.
   */   
   t = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep, //if you don't want to use a thousands separator you can pass empty string as thousands_sep value

   sign = (n < 0) ? '-' : '',

   //extracting the absolute value of the integer part of the number and converting to string
   i = parseInt(n = Math.abs(n).toFixed(c)) + '', 

   j = ((j = i.length) > 3) ? j % 3 : 0; 
   return sign + (j ? i.substr(0, j) + t : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : ''); 
}
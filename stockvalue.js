String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
};

String.prototype.replaceAll = function(token, newToken, ignoreCase) {
    var str, i = -1, _token;
    if((str = this.toString()) && typeof token === "string") {
        _token = ignoreCase === true? token.toLowerCase() : undefined;
        while((i = (
            _token !== undefined? 
                str.toLowerCase().indexOf(
                            _token, 
                            i >= 0? i + newToken.length : 0
                ) : str.indexOf(
                            token,
                            i >= 0? i + newToken.length : 0
                )
        )) !== -1 ) {
            str = str.substring(0, i)
                    .concat(newToken)
                    .concat(str.substring(i + token.length));
        }
    }
return str;
};

var htmlTemplate = "http://www.google.com/finance?start={0}&num=30&q=[" + encodeURIComponent("((exchange == \"NYSEARCA\") | (exchange == \"NYSEAMEX\") | (exchange == \"NYSE\") | (exchange == \"NASDAQ\")) & (pe_ratio >= 0.1) & (earnings_per_share >= 1) & (last_price >= 0.1) & (beta >= -1.0) & (average_volume >= 500000)") + "]&restype=company&output=json&noIL=1&ei=tbGGUPnFL5XWlgPXbg";

var http = require('http');

function getStocksPage(start, onResult) {
	//console.log(htmlTemplate.format(start));

	http.get(htmlTemplate.format(start), function(res) {
		var output = '';

		res.on('data', function(chunk) {
			output += chunk;
		});

		res.on('end', function() {
			output = output.replaceAll('\\x22', "\\\"");
			output = output.replaceAll('\\x26', "&");
			output = output.replaceAll('\\x3E', '>');
			output = output.replaceAll('\\x27', "'");
			output = output.replaceAll('\\x2F', "/");
			onResult(JSON.parse(output));
			//console.log(output);
		});
	})
}

function buildStockArray(onFinished) {
	var start = 0;
	var stocks = [];

	var onResult = function(currentPage) {
		stocks = stocks.concat(currentPage.searchresults);

		if (start < currentPage.num_company_results) {
			start += 30;
			getStocksPage(start, onResult);
		}
		else {
			onFinished(stocks);
		}
	}

	getStocksPage(start, onResult);
}

buildStockArray(function(stocks) {
	var valuations = []

	for (key in stocks) {
		var stock = stocks[key]
		
		var p = stock.columns[2].value;
		var v = (stock.columns[0].value * stock.columns[1].value).toFixed(2);
		var vp = (((v - p) / p) * 100).toFixed(4);
		var b = stock.columns[3].value;
		var bvp = ((vp * b)*100).toFixed(4);

		valuations.push({
			ticker: stock.ticker,
			price: p,
			value: v,
			vtop: vp,
			beta: b,
			betavp: bvp 
		})
	}

	valuations.sort(function(a,b) { return (Math.abs(a.betavp) - Math.abs(b.betavp)) });

	for (key in valuations) {
		var stock = valuations[key];

		console.log("{0} :: {1} / {2} = {3}% => x{4} -> {5}".format(stock.ticker, stock.price, stock.value, stock.vtop, stock.beta, stock.betavp));
	}
})
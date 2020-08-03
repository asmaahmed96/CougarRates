// main.js

//console.log("Start at " + (new Date().toLocaleTimeString()));



function addRatingCol(secNum, secTable) {

	const headerHTML = `<th scope="col" class="gh-table-heading" align="left">Rating</th>`;
	secTable.children[0].children[0].insertAdjacentHTML("beforeend", headerHTML);

	const cellHTML = `
		<td id="MTG_RATING$${secNum}" align="left" style="width:80px !important; vertical-align:middle;" class="gsfield">
			<div class="rating-loader"></div>
		</td>`

	secTable.children[1].children[0].insertAdjacentHTML("beforeend", cellHTML);
}

function fillRatingCol(secNum, reviewData) {
	
	const ratingCell = document.getElementById("MTG_RATING$" + secNum);

	ratingCell.children[0].remove();

	const cellHTML = `
		<td align="left" style="width:80px !important; vertical-align:middle; padding-bottom:0px; padding-top:0px" class="gsfield">
			<div style="display:table-cell !important;">
				<div style="float:left; line-height:22px !important; font-weight:bold; font-size:24px !important;">${reviewData.ratingScore}</div>
				<div style="font-size:12px !important;">${reviewData.showDenom ? "&nbsp;&hairsp;/&thinsp;5" : ""}</div>
				<a class=ui-link href="${reviewData.url}" target="_blank" style="margin-top:6px !important; float:left">${reviewData.ratingCount}</a>
			</div>
		</td>`;

	ratingCell.insertAdjacentHTML("afterbegin", cellHTML);
}

function getRatings(curSec) {
	let secNum = Number(curSec.id.substr(23));

	addRatingCol(secNum, curSec);

	profName = document.getElementById("MTG_INSTR$" + secNum).innerHTML;

	splitName = profName.split(',', 1)[0].split(' ');

	let fName = splitName[0];
	let lName = splitName[splitName.length - 1];		

	if (!profCache[profName]) {
		profCache[profName] = fetchRatings(fName, lName);
	}

	profCache[profName].then(function(result) {
		fillRatingCol(secNum, result);
	});
}


async function fetchRatings(fName, lName) {
	let reviewData = {
		"ratingScore": "N/A",
		"ratingCount": "Not Found",
		"showDenom": false,
		"url": ""
	}

	return new Promise((resolve, reject) => {
		if (fName + lName == "") {
			resolve(reviewData);
			return;
		}

		chrome.runtime.sendMessage({contentScriptQuery: "getRatings", fName: fName, lName: lName}, function(response) {
			if (response) {
				let parser = new DOMParser();
				let doc = parser.parseFromString(response.html, "text/html");

				reviewData.ratingScore = doc.getElementsByClassName("RatingValue__Numerator-qw8sqy-2 gxuTRq")[0].innerHTML;
				if (!isNaN(reviewData.ratingScore)) {
					reviewData.ratingScore = Number(reviewData.ratingScore).toFixed(2);
					reviewData.showDenom = true;
				}


				reviewData.ratingCount = 
					doc.getElementsByClassName("RatingValue__NumRatings-qw8sqy-0 jvzMox")[0]
					.children[0].children[0].innerHTML.split('<', 1)[0];

				if (isNaN(reviewData.ratingCount)) {
					reviewData.ratingCount = "No Reviews";
				} else {
					reviewData.ratingCount = reviewData.ratingCount + ` Review${reviewData.ratingCount == "1" ? "&nbsp;" : "s"}`;
				}

				reviewData.url = response.url;
			}

			resolve(reviewData);
		});
	});
}

let profCache = {};

let pageContainer = document.getElementById("win0divPAGECONTAINER");

if (pageContainer) {
	const submitObserver = new MutationObserver(function(mutations) {
		profCache = {};
	}).observe(pageContainer, {childList: true});
}

const nodeObserver = new MutationObserver(function(mutations) {
	for (mutation of mutations) {
		for (node of mutation.addedNodes) {
			if (node.id && node.id.startsWith("SSR_CLSRCH_MTG1$scroll$")) {
				getRatings(node);
			}
		}
	}
}).observe(document.body, {subtree: true, childList: true});
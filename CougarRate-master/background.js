chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.contentScriptQuery == "getRatings") {

			const baseUrl = "https://www.ratemyprofessors.com";

			let searchUrl = "/search.jsp?queryoption=HEADER&queryBy=teacherName&schoolName=California+State+University+San+Marcos&schoolID=155&query=";
			searchUrl += encodeURIComponent(request.fName) + '+' + encodeURIComponent(request.lName);

			fetch(baseUrl + searchUrl, {mode: 'cors'}).then(function(response) {

				if (response.status != 200) {
					console.error(`Fetch1 failed with code ${response.status}`);
					sendResponse(null);
					return;
				}

				response.text().then(function(data) {
					let parser = new DOMParser();
					let doc = parser.parseFromString(data, "text/html");

					let result = doc.getElementsByClassName("listing PROFESSOR")[0];
					if (!result) {
						sendResponse(null);
						return;
					}

					let profUrl = result.children[0].getAttribute("href")

					fetch(baseUrl + profUrl, {mode: 'cors'})
					.then(function(response) {
						if (response.status != 200) {
							console.error(`Fetch2 failed with code ${response.status}`);
							sendResponse(null);
							return;
						}

						response.text().then(data => sendResponse({
							html: data,
							url: baseUrl + profUrl
						}));
						return;
					});
				});
			});

			return true;
		}
	}
);

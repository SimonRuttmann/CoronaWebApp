async function getOverview() {
    var response = await fetch('/data/overview');
    if (response.status != 200) return false;

    var result = await response.text();
    console.log(result);
}

getOverview();
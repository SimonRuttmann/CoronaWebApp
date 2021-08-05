const labels = [
    'Januar 2020',
    'Februar 2020',
    'März 2020',
    'April 2020',
    'Mai 2020',
    'Juni 2020',
    'Juli 2020',
    'August 2020',
    'September 2020',
    'Oktober 2020',
    'November 2020',
    'Dezember 2020',
    'Januar 2021',
    'Februar 2021',
    'März 2021',
    'April 2021',
    'Mai 2021',
    'Juni 2021',
    'Juli 2021',
    'August 2021',
    'September 2021',
    'Oktober 2021',
    'November 2021',
    'Dezember 2021'
];

const data = {
    labels: labels,
    datasets: [{
        label: 'COVID-19',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: [0, 10, 5, 2, 20, 30, 45, 100, 80, 60, 70, 40],
    }]
};

const config = {
    type: 'bar',
    data,
    options: {
        layout: {
            padding: 10
        }
    }
};

Chart.defaults.color = 'rgb(255, 255, 255)';
Chart.defaults.borderColor = 'rgb(255, 255, 255, 0.1)';
Chart.defaults.backgroundColor = 'rgb(255, 255, 255)';

var myChart = new Chart(
    document.getElementById('myChart'),
    config
);

// localhost:6969/data/overview
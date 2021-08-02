const labels = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember'
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
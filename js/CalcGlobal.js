let barChart;
let datosCSV = [];

// Cargar y procesar el CSV al iniciar la página
document.addEventListener('DOMContentLoaded', function () {
  fetch('data/01_renewable-share-energy.csv')
    .then(response => response.text())
    .then(csvText => {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      const entityIdx = headers.indexOf('Entity');
      const codeIdx = headers.indexOf('Code');
      const yearIdx = headers.indexOf('Year');
      const percentIdx = headers.findIndex(h => h.includes('Renewables'));

      const paisesUnicos = new Set();
      const aniosUnicos = new Set();

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        const code = row[codeIdx]?.trim();
        const year = parseInt(row[yearIdx]);
        const percentage = parseFloat(row[percentIdx]);

        if (code && code.length === 3 && !isNaN(year) && !isNaN(percentage)) {
          const pais = row[entityIdx].trim();
          paisesUnicos.add(pais);
          aniosUnicos.add(year);
          datosCSV.push({
            pais: pais,
            year: year,
            porcentaje: percentage
          });
        }
      }

      // Llenar el menú desplegable de países
      const paisSelect = document.getElementById('pais');
      const anioSelect = document.getElementById('anio');
      
      const paisesOrdenados = Array.from(paisesUnicos).sort();
      paisesOrdenados.forEach(pais => {
        const option = document.createElement('option');
        option.value = pais;
        option.textContent = pais;
        paisSelect.appendChild(option);
      });

      // Llenar el menú desplegable de años
      const aniosOrdenados = Array.from(aniosUnicos).sort((a, b) => b - a); // Ordenar de más reciente a más antiguo
      aniosOrdenados.forEach(anio => {
        const option = document.createElement('option');
        option.value = anio;
        option.textContent = anio;
        anioSelect.appendChild(option);
      });

    })
    .catch(error => {
      console.error("Error al cargar o procesar el archivo CSV:", error);
      document.getElementById('resultado').innerHTML =
        `<div class="alert alert-danger">Error al cargar los datos. Por favor, intenta de nuevo más tarde.</div>`;
    });
});


// Event listener para el formulario
document.getElementById('formularioEnergia').addEventListener('submit', function (event) {
  event.preventDefault();

  const pais = document.getElementById('pais').value;
  const anio = parseInt(document.getElementById('anio').value);
  const consumoKwh = parseFloat(document.getElementById('consumoTotal').value);

  const dataPais = datosCSV.filter(d => d.pais.toLowerCase() === pais.toLowerCase());
  const dataAnio = dataPais.find(d => d.year === anio);

  const resultadoDiv = document.getElementById('resultado');
  const graficasDiv = document.getElementById('contenedorGraficas');
  const tituloBarras = document.getElementById('tituloBarras');

  if (!dataAnio) {
    resultadoDiv.innerHTML = `<div class="alert alert-danger">No se encontraron datos para <strong>${pais}</strong> en el año <strong>${anio}</strong>.</div>`;
    graficasDiv.style.display = "none";
    return;
  }

  const porcentaje = dataAnio.porcentaje;
  const consumoRenovable = (porcentaje / 100) * consumoKwh;

  resultadoDiv.innerHTML = `
    <div class="alert alert-success fade-container show">
      En <strong>${pais}</strong> en el año <strong>${anio}</strong>, el <strong>${porcentaje.toFixed(2)}%</strong> de la energía fue renovable.<br>
      Si consumiste <strong>${consumoKwh.toFixed(2)} kWh</strong>, entonces <strong>${consumoRenovable.toFixed(2)} kWh</strong> provinieron de fuentes limpias.
    </div>
  `;

  graficasDiv.style.display = "block";
  tituloBarras.textContent = `📊 Evolución de Energía Renovable en ${pais}`;

  const years = dataPais.map(d => d.year).sort((a,b) => a - b);
  const percentages = years.map(year => dataPais.find(d => d.year === year).porcentaje);

  if (barChart) {
    barChart.destroy();
  }

  const barCtx = document.getElementById('renewablesBarChart').getContext('2d');
  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [{
        label: "% energía renovable",
        data: percentages,
        backgroundColor: "rgba(76,175,80,0.7)",
        borderColor: "#4caf50",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "%" },
          ticks: { callback: value => value + "%" }
        },
        x: {
          title: { display: true, text: "Año" },
          ticks: { 
            autoSkip: true, 
            maxTicksLimit: 15 
          }
        }
      }
    }
  });
});
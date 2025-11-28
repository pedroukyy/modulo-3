exports.handler = async (event) => {
    const codigo = event.pathParameters ? event.pathParameters.codigo : "desconocido";
    
    // Capturamos si viene una fecha en la URL (ej: ?fecha=2023-11-23)
    const fechaFiltro = event.queryStringParameters ? event.queryStringParameters.fecha : null;

    console.log(`Consulta: Codigo=${codigo}, Fecha=${fechaFiltro}`);

    // BASE DE DATOS MOCK
    let historialCompleto = [
        { fecha: '2023-11-20', visitas: 45 },
        { fecha: '2023-11-21', visitas: 120 },
        { fecha: '2023-11-22', visitas: 85 },
        { fecha: '2023-11-23', visitas: 200 },
        { fecha: '2023-11-24', visitas: 150 },
        { fecha: '2023-11-25', visitas: 90 },
        { fecha: '2023-11-26', visitas: 300 },
    ];

    // LÓGICA DE FILTRADO (Requisito del Parcial)
    let historialFiltrado = historialCompleto;
    if (fechaFiltro) {
        historialFiltrado = historialCompleto.filter(dato => dato.fecha === fechaFiltro);
    }

    const respuestaData = {
        codigo: codigo,
        urlOriginal: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        totalVisitas: historialFiltrado.reduce((acc, curr) => acc + curr.visitas, 0),
        filtroAplicado: fechaFiltro ? "SI" : "NO",
        historial: historialFiltrado
    };

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS"
        },
        body: JSON.stringify(respuestaData),
    };
};
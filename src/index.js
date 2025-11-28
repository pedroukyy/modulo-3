const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    const codigo = event.pathParameters ? event.pathParameters.codigo : "desconocido";
    const tableName = process.env.TABLE_NAME;

    console.log(`Procesando link: ${codigo}`);

    try {
        // ------------------------------------------------------------------
        // 1. REGISTRAR VISITA EN EL HISTORIAL (Real Time)
        // ------------------------------------------------------------------
        const timestampAhora = new Date().toISOString(); // Ej: "2025-11-28T14:30:00.000Z"

        try {
            await docClient.send(new UpdateCommand({
                TableName: tableName,
                Key: { short_id: codigo },
                // Aquí está el truco:
                // 1. Sumamos 1 al contador total
                // 2. Agregamos la fecha actual a la lista 'historial'
                UpdateExpression: "SET visitas = if_not_exists(visitas, :start) + :inc, historial = list_append(if_not_exists(historial, :empty_list), :new_entry)",
                ExpressionAttributeValues: {
                    ":inc": 1,
                    ":start": 0,
                    ":empty_list": [],
                    ":new_entry": [timestampAhora] // Guardamos la fecha exacta
                }
            }));
            console.log("¡Visita e historial registrados!");
        } catch (err) {
            console.log("Error escribiendo historial (pero seguimos):", err.message);
        }

        // ------------------------------------------------------------------
        // 2. LEER DATOS
        // ------------------------------------------------------------------
        const command = new GetCommand({
            TableName: tableName,
            Key: { short_id: codigo }
        });

        const response = await docClient.send(command);
        const item = response.Item;

        if (!item) {
            return {
                statusCode: 404,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ mensaje: "Link no encontrado" })
            };
        }

        // Devolvemos todo el historial crudo al frontend para que él lo procese
        const respuestaData = {
            codigo: item.short_id,
            urlOriginal: item.long_url,
            totalVisitas: item.visitas || 0,
            historial: item.historial || [] 
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

    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Error interno" }),
        };
    }
};
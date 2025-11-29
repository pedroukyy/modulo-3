const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    const codigo = event.pathParameters ? event.pathParameters.codigo : "desconocido";
    
    const queryParams = event.queryStringParameters || {};
    const esVisitaReal = queryParams.es_visita === 'true';

    const tableName = process.env.TABLE_NAME;

    console.log(`Procesando link: ${codigo} | ¿Es Visita?: ${esVisitaReal}`);

    try {
        if (esVisitaReal) {
            const timestampAhora = new Date().toISOString(); 

            try {
                await docClient.send(new UpdateCommand({
                    TableName: tableName,
                    Key: { short_id: codigo },
                    UpdateExpression: "SET visitas = if_not_exists(visitas, :start) + :inc, historial = list_append(if_not_exists(historial, :empty_list), :new_entry)",
                    ExpressionAttributeValues: {
                        ":inc": 1,
                        ":start": 0,
                        ":empty_list": [],
                        ":new_entry": [timestampAhora] 
                    }
                }));
                console.log("¡Visita e historial registrados correctamente!");
            } catch (err) {
                console.log("Error escribiendo historial (pero seguimos):", err.message);
            }
        } else {
            console.log("Modo lectura: No se alteró el contador.");
        }

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
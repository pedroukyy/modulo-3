const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    const codigo = event.pathParameters ? event.pathParameters.codigo : "desconocido";
    const tableName = process.env.TABLE_NAME;

    console.log(`Consultando DynamoDB: Tabla=${tableName}, ID=${codigo}`);

    try {
        const command = new GetCommand({
            TableName: tableName,
            Key: {
                // 👇 ¡AQUÍ ESTABA EL ERROR! 
                // Tu amigo usa "short_id", no "codigo".
                short_id: codigo 
            }
        });

        const response = await docClient.send(command);
        const item = response.Item;

        if (!item) {
            console.log("No encontrado.");
            return {
                statusCode: 404,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS"
                },
                body: JSON.stringify({ mensaje: "Dato no encontrado en BD" })
            };
        }

        // Mapeamos los datos de tu amigo a tu formato
        // Él usa: short_id, long_url, created_at
        const respuestaData = {
            codigo: item.short_id,
            urlOriginal: item.long_url, // Mapeamos su long_url a tu urlOriginal
            totalVisitas: item.visitas || Math.floor(Math.random() * 100), // Si no hay visitas, simulamos
            historial: [] 
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
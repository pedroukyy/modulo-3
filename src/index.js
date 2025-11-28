const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    const codigo = event.pathParameters ? event.pathParameters.codigo : "desconocido";
    // Leemos el nombre de la tabla desde la variable de entorno que pusimos en Terraform
    const tableName = process.env.TABLE_NAME; 

    console.log(`Consultando DynamoDB: Tabla=${tableName}, Codigo=${codigo}`);

    try {
        const command = new GetCommand({
            TableName: tableName,
            Key: { codigo: codigo }
        });

        const response = await docClient.send(command);
        const item = response.Item;

        if (!item) {
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

        // Devolvemos el dato tal cual viene de la base de datos
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify(item),
        };

    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Error interno" }),
        };
    }
};
provider "aws" {
  region = "us-east-1"
}

# 1. EMPAQUETAR CÓDIGO (ZIP AUTOMÁTICO)
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "../src"
  output_path = "lambda_function.zip"
}

# 2. ROL DE SEGURIDAD (Permisos básicos)
resource "aws_iam_role" "iam_for_lambda" {
  name = "rol_parcial_modulo_3_pedro"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# 3. LA FUNCIÓN LAMBDA (¡AHORA CONECTADA A LA BD!)
resource "aws_lambda_function" "stats_lambda" {
  filename      = "lambda_function.zip"
  function_name = "parcial_modulo_3_stats_pedro"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  # 👇 AQUÍ ESTÁ EL CAMBIO IMPORTANTE: Enviamos el nombre de la tabla a la Lambda
  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.stats_table.name
    }
  }
}

# 4. API GATEWAY (La URL Pública)
resource "aws_apigatewayv2_api" "http_api" {
  name          = "parcial_modulo_3_api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

# 5. INTEGRACIÓN (Conectar API -> Lambda)
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.stats_lambda.invoke_arn
  payload_format_version = "2.0"
}

# 6. RUTA (GET /stats/{codigo})
resource "aws_apigatewayv2_route" "stats_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /stats/{codigo}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# 7. DESPLIEGUE AUTOMÁTICO
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# 8. PERMISO FINAL (Dejar pasar a la API)
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stats_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# 9. OUTPUT (Te dará la URL al terminar)
output "api_endpoint" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

# 10. BASE DE DATOS DYNAMODB
resource "aws_dynamodb_table" "stats_table" {
  name           = "parcial_modulo_3_tabla_pedro"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "codigo"

  attribute {
    name = "codigo"
    type = "S" # String
  }
}

# 11. PERMISO PARA QUE LA LAMBDA LEA LA TABLA
resource "aws_iam_role_policy" "lambda_policy" {
  name = "permiso_dynamodb_pedro"
  role = aws_iam_role.iam_for_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Effect   = "Allow"
        Resource = aws_dynamodb_table.stats_table.arn
      }
    ]
  })
}
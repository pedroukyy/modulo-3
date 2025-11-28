provider "aws" {
  region = "us-east-1"
}

# 1. EMPAQUETAR CÓDIGO (ZIP AUTOMÁTICO)
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "../src"
  output_path = "lambda_function.zip"
}

# 2. ROL DE SEGURIDAD
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

# ---------------------------------------------------------
# CONEXIÓN CON LA BASE DE DATOS DEL MÓDULO 1
# ---------------------------------------------------------

# 3. BUSCAR LA TABLA EXISTENTE (La de tu amigo)
data "aws_dynamodb_table" "friend_table" {
  name = "Tabla1" 
}

# 4. LA FUNCIÓN LAMBDA (Conectada a "Tabla1")
resource "aws_lambda_function" "stats_lambda" {
  filename      = "lambda_function.zip"
  function_name = "parcial_modulo_3_stats_pedro"
  role          = aws_iam_role.iam_for_lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = data.aws_dynamodb_table.friend_table.name
    }
  }
}

# 5. PERMISO PARA LEER Y ESCRIBIR (CORREGIDO ✅)
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
          "dynamodb:Query",
          "dynamodb:UpdateItem"  # 👈 ESTA ES LA LÍNEA QUE FALTABA
        ]
        Effect   = "Allow"
        Resource = data.aws_dynamodb_table.friend_table.arn
      }
    ]
  })
}

# ---------------------------------------------------------
# API GATEWAY
# ---------------------------------------------------------

# 6. API GATEWAY
resource "aws_apigatewayv2_api" "http_api" {
  name          = "parcial_modulo_3_api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

# 7. INTEGRACIÓN
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.stats_lambda.invoke_arn
  payload_format_version = "2.0"
}

# 8. RUTA
resource "aws_apigatewayv2_route" "stats_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /stats/{codigo}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# 9. STAGE
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# 10. PERMISOS API GATEWAY
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stats_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# 11. OUTPUT
output "api_endpoint" {
  value = aws_apigatewayv2_stage.default.invoke_url
}
#!/bin/bash

set -e

echo "🚀 开始完整部署流程..."

# 清理之前的构建
echo "📁 清理构建目录..."
rm -rf dist/
rm -rf .aws-sam/

# 构建
echo "📦 执行构建..."
npx prisma generate
npm run build:webpack

echo "✅ 构建完成！"
echo "📊 构建结果:"
echo "Bundle 大小: $(du -h dist/lambda.js | cut -f1)"
echo "总大小: $(du -sh dist/ | cut -f1)"
echo "文件列表:"
ls -la dist/

# 检查本地配置文件
if [ ! -f ".env" ]; then
    echo "❌ 未找到 .env 文件"
    echo ""
    echo "请执行以下步骤："
    echo "1. 复制配置模板: cp .env.example .env"
    echo "2. 编辑 .env 文件，填入真实的配置信息"
    echo "3. 重新运行部署脚本"
    exit 1
fi

# 加载本地配置
echo "📋 加载本地配置..."
source .env

# 验证必要的配置
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL 未配置"
    exit 1
fi

if [ -z "$ADMIN_PRIVATE_KEY" ]; then
    echo "❌ ADMIN_PRIVATE_KEY 未配置"
    exit 1
fi

if [ -z "$ADMIN_WALLET_ADDRESS" ]; then
    echo "❌ ADMIN_WALLET_ADDRESS 未配置"
    exit 1
fi

echo "✅ 配置验证通过："
echo "   数据库: $(echo $DATABASE_URL | sed 's/:.*@/:***@/')"
echo "   钱包地址: $ADMIN_WALLET_ADDRESS"

# SAM 部署
echo "🚀 开始 SAM 部署..."

# 验证模板
sam validate --template template.yaml

echo "🎯 使用 SAM 部署..."
sam deploy \
    --template-file template.yaml \
    --stack-name waste-classification-api \
    --capabilities CAPABILITY_IAM \
    --resolve-s3 \
    --parameter-overrides \
        CreateNATGateway="false" \
        DatabaseUrl="$DATABASE_URL" \
        AdminPrivateKey="$ADMIN_PRIVATE_KEY" \
        PinataApiKey="$PINATA_API_KEY" \
        PinataSecretApiKey="$PINATA_SECRET_API_KEY" \
        PinataJwt="$PINATA_JWT" \
        AdminWalletAddress="$ADMIN_WALLET_ADDRESS" \
        MastraApiUrl="$MASTRA_API_URL" \
        MastraTimeoutMs="$MASTRA_TIMEOUT_MS" \
        MastraRetryCount="$MASTRA_RETRY_COUNT"

echo "✨ 部署完成!"

# 获取部署信息
echo "📋 获取部署信息..."
STACK_NAME="waste-classification-api"

# API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

# Lambda Function ARN
LAMBDA_ARN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunction`].OutputValue' \
    --output text)

echo "🎉 === 部署成功 ==="
echo "🌐 API Gateway URL: $API_URL"
echo "⚡ Lambda Function ARN: $LAMBDA_ARN"
echo "🎨 GraphQL Playground: ${API_URL}api/graphql"
echo "📚 Swagger 文档: ${API_URL}api/docs"
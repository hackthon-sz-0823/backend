const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: './src/lambda.ts',
    target: 'node',
    mode: 'production',
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: true, // 移除 console
                        drop_debugger: true,
                        pure_funcs: ['console.log', 'console.info', 'console.debug'],
                    },
                    mangle: {
                        keep_fnames: true, // 保持函数名，Lambda 需要
                    },
                    format: {
                        comments: false, // 移除注释
                    },
                },
                extractComments: false,
            }),
        ],
        usedExports: true,
        sideEffects: false,
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        plugins: [
            new TsconfigPathsPlugin({
                configFile: './tsconfig.json'
            })
        ],
        alias: {
            // 用空模块替换缺失的可选依赖
            'class-transformer/storage': false,
            '@nestjs/websockets/socket-module': false,
            '@nestjs/microservices/microservices-module': false,
            '@nestjs/microservices': false,
            '@nestjs/websockets': false,
            'cache-manager': false,
            // GraphQL 相关的可选依赖
            '@as-integrations/fastify': false,
            '@apollo/subgraph': false,
            '@apollo/gateway': false,
            'ts-morph': false,
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                        configFile: 'tsconfig.build.json',
                    }
                },
                exclude: /node_modules/,
            },
        ],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'lambda.js',
        libraryTarget: 'commonjs2',
        clean: true,
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                // 复制 Prisma 相关文件
                {
                    from: path.resolve(__dirname, 'node_modules/.prisma'),
                    to: path.resolve(__dirname, 'dist/node_modules/.prisma'),
                    noErrorOnMissing: true,
                },
                {
                    from: path.resolve(__dirname, 'node_modules/@prisma/client'),
                    to: path.resolve(__dirname, 'dist/node_modules/@prisma/client'),
                    noErrorOnMissing: true,
                },
                {
                    from: path.resolve(__dirname, 'prisma/schema.prisma'),
                    to: path.resolve(__dirname, 'dist/prisma/schema.prisma'),
                    noErrorOnMissing: true,
                },
                // 复制简化版 package.json
                {
                    from: path.resolve(__dirname, 'package.json'),
                    to: path.resolve(__dirname, 'dist/package.json'),
                    transform(content) {
                        const pkg = JSON.parse(content.toString());
                        return JSON.stringify({
                            name: pkg.name,
                            version: pkg.version,
                            main: 'lambda.js',
                            dependencies: {
                                '@prisma/client': pkg.dependencies['@prisma/client'],
                                'aws-serverless-express': pkg.dependencies['aws-serverless-express'],
                            }
                        }, null, 2);
                    },
                },
            ],
        }),
        // 忽略可选依赖
        new webpack.IgnorePlugin({
            resourceRegExp: /@nestjs\/websockets/,
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /@nestjs\/microservices/,
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /cache-manager/,
        }),
        // 忽略其他不需要的依赖
        new webpack.IgnorePlugin({
            resourceRegExp: /^pg-native$/,
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /^@mapbox\/node-pre-gyp$/,
        }),
        // 忽略 GraphQL 相关的可选依赖
        new webpack.IgnorePlugin({
            resourceRegExp: /@as-integrations\/fastify/,
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /@apollo\/subgraph/,
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /@apollo\/gateway/,
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /ts-morph/,
        }),
        // 定义环境变量
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ],
    externals: [
        '@prisma/client',
    ],
    ignoreWarnings: [
        /Critical dependency: the request of a dependency is an expression/,
        /Module not found: Error: Can't resolve/,
        /Can't resolve '@nestjs\/websockets'/,
        /Can't resolve '@nestjs\/microservices'/,
        /Can't resolve '@as-integrations\/fastify'/,
        /Can't resolve '@apollo\/subgraph'/,
        /Can't resolve '@apollo\/gateway'/,
        /Can't resolve 'ts-morph'/,
    ],
};
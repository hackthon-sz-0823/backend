## 首次运行需执行以下命令

yarn install
npx prisma generate

## 运行项目

yarn run start:dev

## 将swaggerui 导入apifox文档

http://localhost:3001/docs-json


## graphql 接口
  ### 获取排行榜
```ql
  query {
    leaderboard(input: { limit: 10, offset: 0 }) {
      entries {
        rank
        walletAddress
        score
        lastUpdated
      }
      total
    }
  }
```

  ### 获取用户排名
```graphql
  query {
    userRanking(walletAddress: "用户钱包地址") {
      walletAddress
      score
      rank
    }
  }
```